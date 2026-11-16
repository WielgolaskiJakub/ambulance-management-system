import type { RouteReportResponse } from "../../types/reports";
import {
  routeMemberRoleLabels,
  routeMemberSourceLabels,
} from "../../utils/routeMemberLabels";

type Props = {
  routes: RouteReportResponse[];
};

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

export function RouteReportTable({ routes }: Props) {
  if (routes.length === 0) {
    return <p>Brak wyjazdów rozpoczętych w wybranym okresie.</p>;
  }

  return (
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
            <th scope="col">Szczegóły</th>
          </tr>
        </thead>

        <tbody>
          {routes.map((route) => (
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
                <div className="daily-report-details">
                  {route.transportOrders.length === 0 ? (
                    <span>Brak zleceń</span>
                  ) : (
                    <details>
                      <summary>
                        Zlecenia ({route.transportOrders.length})
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

                  {route.routeMembers.length === 0 ? (
                    <span>Brak zapisanej załogi</span>
                  ) : (
                    <details>
                      <summary>
                        Załoga ({route.routeMembers.length})
                      </summary>

                      <ul className="daily-report-crew">
                        {route.routeMembers.map((member) => (
                          <li key={member.id}>
                            <strong>
                              {member.fullName || "Brak nazwiska"}
                            </strong>
                            <div>
                              {routeMemberRoleLabels[member.role]}
                            </div>
                            <div>
                              {routeMemberSourceLabels[member.source]}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}