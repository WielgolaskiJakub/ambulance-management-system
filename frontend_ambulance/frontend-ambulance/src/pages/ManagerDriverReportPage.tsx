import axios from "axios";
import { useEffect, useState } from "react";
import { getAllUsers } from "../api/userApi";
import { getDriverReport } from "../api/reportsApi";
import type { UserResponse } from "../types/user";
import type { DriverReportResponse } from "../types/reports";
import { RouteReportTable } from "../components/reports/RouteReportTable";
import "./ManagerDailyReportPage.css";

export function ManagerDriverReportPage() {
  const [drivers, setDrivers] = useState<UserResponse[]>([]);
  const [driverId, setDriverId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [report, setReport] = useState<DriverReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadDrivers() {
      try {
        const users = await getAllUsers();

        setDrivers(
          users
            .filter((user) => user.userRole === "DRIVER")
            .sort((a, b) =>
              `${a.lastName} ${a.firstName}`.localeCompare(
                `${b.lastName} ${b.firstName}`,
                "pl"
              )
            )
        );
      } catch {
        setLoadError("Nie udało się pobrać listy kierowców.");
      } finally {
        setLoading(false);
      }
    }

    loadDrivers();
  }, []);

  async function handleGenerateReport() {
    if (generating) return;

    setErrorMessage(null);
    setReport(null);

    if (!driverId) {
      setErrorMessage("Wybierz kierowcę.");
      return;
    }

    if (!dateFrom || !dateTo) {
      setErrorMessage("Wybierz datę początkową i końcową.");
      return;
    }

    if (dateFrom > dateTo) {
      setErrorMessage(
        "Data początkowa nie może być późniejsza niż data końcowa."
      );
      return;
    }

    try {
      setGenerating(true);

      const reportData = await getDriverReport({
        driverId: Number(driverId),
        dateFrom,
        dateTo,
      });

      setReport(reportData);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          `Błąd pobierania raportu: ${
            error.response?.status ?? "brak odpowiedzi"
          }`
        );
      } else {
        setErrorMessage("Nieznany błąd podczas pobierania raportu.");
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="daily-report-page">
      <h1>Raport kierowcy</h1>

      {loading ? (
        <p>Ładowanie kierowców...</p>
      ) : loadError ? (
        <p className="daily-report-error" role="alert">
          {loadError}
        </p>
      ) : (
        <>
          <div className="daily-report-filters">
            <label>
              Kierowca
              <select
                value={driverId}
                disabled={generating || drivers.length === 0}
                onChange={(event) => setDriverId(event.target.value)}
              >
                <option value="">Wybierz kierowcę</option>

                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.lastName} {driver.firstName}
                    {!driver.active ? " (nieaktywny)" : ""}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Data od
              <input
                type="date"
                value={dateFrom}
                disabled={generating}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </label>

            <label>
              Data do
              <input
                type="date"
                value={dateTo}
                disabled={generating}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </label>

            <button
              type="button"
              disabled={generating || drivers.length === 0}
              onClick={handleGenerateReport}
            >
              {generating ? "Generowanie..." : "Generuj raport"}
            </button>
          </div>

          {drivers.length === 0 && <p>Brak kierowców do wyboru.</p>}
        </>
      )}

      {errorMessage && (
        <p className="daily-report-error" role="alert">
          {errorMessage}
        </p>
      )}

      {report && (
        <section className="daily-report-results">
          <h2>{report.driverFullName}</h2>
          <p>
            Okres: {report.dateFrom} — {report.dateTo}
          </p>

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