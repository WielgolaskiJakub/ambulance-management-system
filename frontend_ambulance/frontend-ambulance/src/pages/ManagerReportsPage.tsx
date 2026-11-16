import axios from "axios";
import { useEffect, useState } from "react";
import { getReport } from "../api/reportsApi";
import type { AmbulanceReportSummaryResponse } from "../types/reports";
import { getAllAmbulances } from "../api/ambulancesApi";
import type {AmbulanceResponse} from "../types/ambulance";
import "./ManagerReportsPage.css";

export function ManagerReportsPage() {


 const [loading, setLoading] = useState(true);
 const [errorMessage, setErrorMessage] = useState<string | null>(null);
 const [report, setReport] = useState<AmbulanceReportSummaryResponse | null>(null);
 const [ambulances, setAmbulances] = useState<AmbulanceResponse[]>([]);
 const [selectedAmbulanceIds, setSelectedAmbulanceIds] = useState<number[]>([]);
 const [dateFrom, setDateFrom] = useState<string>("");
 const [dateTo, setDateTo] = useState<string>("");
 const [generating, setGenerating] = useState(false);




 useEffect(() => {
    async function loadAmbulances() {
        try {
            setLoading(true);
            setErrorMessage(null);

            const ambulancesData = await getAllAmbulances();
            setAmbulances(ambulancesData);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(
                    `Błąd pobierania danych o karetkach: ${error.response?.status ?? "brak odpowiedzi"}`
                );
                return;
            }
            setErrorMessage("Nieznany błąd podczas pobierania danych o karetkach.");
        } finally {
            setLoading(false);
        }
    }

    loadAmbulances();
  }, []);

  function toggleAmbulance(ambulanceId: number) {
    setSelectedAmbulanceIds((currentIds) =>
      currentIds.includes(ambulanceId)
        ? currentIds.filter((id) => id !== ambulanceId)
        : [...currentIds, ambulanceId]
    );
  }


  async function handleGenerateReport() {
    if(generating) return;

    setErrorMessage(null);
    setReport(null);

    if(selectedAmbulanceIds.length === 0) {
        setErrorMessage("Proszę wybrać przynajmniej jedną karetkę.");
        return;
    }

    if(!dateFrom || !dateTo) {
        setErrorMessage("Proszę wybrać date początkowa i końcowa.");
        return;
    }

    if(dateFrom > dateTo) {
        setErrorMessage("Data początkowa nie może być późniejsza niż data końcowa.");
        return;
    }
    try{
        setGenerating(true);
        
        const reportData = await getReport({
            ambulanceIds: selectedAmbulanceIds,
            dateFrom,
            dateTo,
        });
        setReport(reportData);
    }catch(error) {
        if (axios.isAxiosError(error)) {
            setErrorMessage(
                `Błąd generowania raportu: ${error.response?.status ?? "brak odpowiedzi"}`
            );
            return;
        }
        setErrorMessage("Nieznany błąd podczas generowania raportu.");
    } finally {
        setGenerating(false);
    }
  }

  if (loading) {
    return <div>Ładowanie danych...</div>;
  }

return (
  <div className="manager-reports-page">
    <header className="manager-reports-page__header">
      <h1>Raporty karetek</h1>
      <p>Kilometry i zużycie paliwa według normy za wybrany okres.</p>
    </header>

    <section className="report-filters">
      <fieldset className="report-filters__fieldset" disabled={generating}>
        <legend>Wybierz karetki</legend>

        <div className="report-filters__ambulances">
          {ambulances.map((ambulance) => (
            <label
              key={ambulance.id}
              className={`report-filters__ambulance ${
                selectedAmbulanceIds.includes(ambulance.id)
                  ? "report-filters__ambulance--selected"
                  : ""
              }`}
            >
              <input
                type="checkbox"
                checked={selectedAmbulanceIds.includes(ambulance.id)}
                onChange={() => toggleAmbulance(ambulance.id)}
              />
              <span>{ambulance.registrationPlates}</span>
            </label>
          ))}
        </div>

        {ambulances.length === 0 && <p>Brak karetek do wyboru.</p>}
      </fieldset>

      <div className="report-filters__bottom">
        <label className="report-filters__date">
          Data od
          <input
            type="date"
            value={dateFrom}
            disabled={generating}
            onChange={(event) => setDateFrom(event.target.value)}
          />
        </label>

        <label className="report-filters__date">
          Data do
          <input
            type="date"
            value={dateTo}
            disabled={generating}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </label>

        <button
          className="report-filters__submit"
          type="button"
          onClick={handleGenerateReport}
          disabled={generating || ambulances.length === 0}
        >
          {generating ? "Generowanie..." : "Generuj raport"}
        </button>
      </div>

      {errorMessage && (
        <p className="manager-reports-page__error" role="alert">
          {errorMessage}
        </p>
      )}
    </section>

    {report && (
      <section className="report-results">
        <div className="report-results__heading">
          <h2>Zestawienie karetek</h2>
          <span>Liczba pojazdów: {report.ambulances.length}</span>
        </div>

        <div className="report-results__table-wrapper">
          <table className="report-results__table">
            <thead>
              <tr>
                <th scope="col">Rejestracja</th>
                <th scope="col">Zakończone trasy</th>
                <th scope="col">Kilometry</th>
                <th scope="col">Paliwo według normy [l]</th>
              </tr>
            </thead>

            <tbody>
              {report.ambulances.map((item) => (
                <tr key={item.ambulanceId}>
                  <th scope="row">{item.registrationPlates}</th>
                  <td>{item.completedRoutesCount}</td>
                  <td>{item.totalDistanceKm.toLocaleString("pl-PL")}</td>
                  <td>
                    {item.totalEstimatedFuelConsumptionLiters.toLocaleString(
                      "pl-PL",
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )}
                  </td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr>
                <th scope="row">Razem</th>
                <td>{report.allCompletedRoutesCount}</td>
                <td>{report.allTotalDistanceKm.toLocaleString("pl-PL")}</td>
                <td>
                  {report.allTotalEstimatedFuelConsumptionLiters.toLocaleString(
                    "pl-PL",
                    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    )}
  </div>
);
}