import axios from "axios";
import { useState} from "react";
import { getDailyReport } from "../api/reportsApi";
import type { DailyReportResponse } from "../types/reports";
import "./ManagerDailyReportPage.css";


function getYesterdayDate(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, "0");
    const day = String(yesterday.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";

  return new Date(value).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(status: string): string {
  switch (status) {
    case "CREATED":
      return "Utworzona";
    case "IN_PROGRESS":
      return "W trakcie";
    case "WAITING":
      return "Oczekiwanie";
    case "COMPLETED":
      return "Zakończone";
    case "CANCELLED":
      return "Anulowane";
    case "PENDING":
      return "Do realizacji";
    default:
      return status;
  }
}

export function ManagerDailyReportPage() {
    const [date, setDate] = useState(getYesterdayDate());
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

        {report.routes.length === 0 ? (
          <p>Brak wyjazdów rozpoczętych w wybranym dniu.</p>
        ) : (
          <div className="daily-report-table-wrapper">
            <table className="daily-report-table">
              <thead>
                <tr>
                  <th scope="col">Karetka</th>
                  <th scope="col">Kierowca</th>
                  <th scope="col">Wyjazd</th>
                  <th scope="col">Powrót</th>
                  <th scope="col">Status</th>
                  <th scope="col">Kilometry</th>
                  <th scope="col">Paliwo [l]</th>
                  <th scope="col">Zlecenia</th>
                </tr>
              </thead>

              <tbody>
                {report.routes.map((route) => (
                  <tr key={route.routeId}>
                    <th scope="row">{route.registrationPlates}</th>
                    <td>{route.driverFullName}</td>
                    <td>{formatDateTime(route.startedAt)}</td>
                    <td>{formatDateTime(route.finishedAt)}</td>

                    <td>
                      <span
                        className={`daily-report-status daily-report-status--${route.status}`}
                      >
                        {formatStatus(route.status)}
                      </span>
                    </td>

                    <td>
                      {route.distanceKm?.toLocaleString("pl-PL") ?? "—"}
                    </td>

                    <td>
                      {route.estimatedFuelConsumedLiters?.toLocaleString(
                        "pl-PL",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      ) ?? "—"}
                    </td>

                    <td>
                      {route.transportOrders.length === 0 ? (
                        "Brak zleceń"
                      ) : (
                        <details>
                          <summary>
                            Pokaż zlecenia ({route.transportOrders.length})
                          </summary>

                          <ol>
                            {route.transportOrders.map((order) => (
                              <li key={order.id}>
                                <strong>{order.orderNumber}</strong>

                                <div>
                                  {order.pickupAddress ?? "Brak adresu"}
                                  {" → "}
                                  {order.destinationAddress ?? "Brak adresu"}
                                </div>

                                <div>
                                  Status w trasie:{" "}
                                  {formatStatus(order.routeOrderStatus)}
                                </div>
                              </li>
                            ))}
                          </ol>
                        </details>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    )}
  </div>
);
}