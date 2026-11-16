import axios from "axios";
import { useState} from "react";
import { getDailyReport } from "../api/reportsApi";
import type { DailyReportResponse } from "../types/reports";
import "./ManagerDailyReportPage.css";
import {RouteReportTable} from "../components/reports/RouteReportTable";


function getYesterdayDate(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, "0");
    const day = String(yesterday.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}



export function ManagerDailyReportPage() {
    const [date, setDate] = useState(getYesterdayDate);
    const [report, setReport] = useState<DailyReportResponse | null>(null);
    const [generating, setGenerating] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    async function handleGenerateReport() {
        if(generating) return;

        setErrorMessage(null);
        setReport(null);

        if(!date) {
            setErrorMessage("Proszę wybrać datę.");
            return;
        }

        try {
            setGenerating(true);
            const reportData = await getDailyReport(date);
            setReport(reportData);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(
                    `Błąd podczas generowania raportu: ${error.response?.status ?? "brak odpowiedzi"}`
                );
            } else {
                setErrorMessage("Wystąpił nieoczekiwany błąd podczas generowania raportu.");
            }
        } finally {
            setGenerating(false);
        }
    }

   return (
  <div className="daily-report-page">

    <h1>Raport dzienny</h1>

    <div className="daily-report-filters">
      <label>
        Dzień raportu
        <input
          type="date"
          value={date}
          disabled={generating}
          onChange={(event) => setDate(event.target.value)}
        />
      </label>

      <button
        type="button"
        disabled={generating}
        onClick={handleGenerateReport}
      >
        {generating ? "Generowanie..." : "Generuj raport"}
      </button>
    </div>

    {errorMessage && (
      <p className="daily-report-error" role="alert">
        {errorMessage}
      </p>
    )}

    {report && (
      <section className="daily-report-results">
        <h2>Raport za {report.date}</h2>

        <dl className="daily-report-summary">
          <div>
            <dt>Wszystkie wyjazdy</dt>
            <dd>{report.totalRoutesCount}</dd>
          </div>

          <div>
            <dt>Zakończone</dt>
            <dd>{report.completedRoutesCount}</dd>
          </div>

          <div>
            <dt>Nierozliczone</dt>
            <dd>{report.unsettledRoutesCount}</dd>
          </div>

          <div>
            <dt>Kilometry zakończonych tras</dt>
            <dd>{report.totalDistanceKm.toLocaleString("pl-PL")} km</dd>
          </div>

          <div>
            <dt>Paliwo według normy — zakończone trasy</dt>
            <dd>
              {report.totalEstimatedFuelConsumptionLiters.toLocaleString(
                "pl-PL",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}{" "}
              l
            </dd>
          </div>
        </dl>
            <RouteReportTable routes={report.routes} />

      </section>
    )}
  </div>
);
}