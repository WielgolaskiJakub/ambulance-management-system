import { useState } from "react";
import type { RouteResponse, RouteTransportOrderReference } from "../../types/route";
import { formatDateTime } from "../../utils/dateTimeFormat";
import { getRouteStatusLabel } from "../../utils/routeLabels";

type RouteHistorySectionProps = {
    routes: RouteResponse[];
}

function formatTransportOrders(
    orders: RouteTransportOrderReference[]
): string {
    if (orders.length === 0) {
        return "Brak zleceń";
    }

    return orders.map((order) => order.orderNumber).join(", ");
}

export function RouteHistorySection({
    routes,
}: RouteHistorySectionProps) {
    const [showCompletedRoutes, setShowCompletedRoutes] = useState(false);

    const completedRoutes = routes.filter(
        (route) => route.status === "COMPLETED"
    );

    return (
        <>
            <div className="my-routes-history-toggle">
                <button
                    className="my-routes-history-toggle__button"
                    type="button"
                    onClick={() => setShowCompletedRoutes((currentValue) => !currentValue)}
                >
                    {showCompletedRoutes
                        ? "Ukryj zakończone trasy"
                        : `Pokaż zakończone trasy (${completedRoutes.length})`}
                </button>
            </div>

            {showCompletedRoutes && (
                <section className="my-routes-history">
                    <header className="my-routes-history__header">
                        <h2 className="my-routes-history__title">Historia tras</h2>
                        <p className="my-routes-history__subtitle">
                            Zakończone trasy przypisane do Twojej załogi.
                        </p>
                    </header>

                    {completedRoutes.length === 0 ? (
                        <p className="my-routes-page__message">
                            Brak zakończonych tras.
                        </p>
                    ) : (
                        <div className="my-routes-history__list">
                            {completedRoutes.map((route) => (
                                <article className="my-route-history-card" key={route.id}>
                                    <div>
                                        <h3 className="my-route-history-card__title">
                                            Trasa #{route.id}
                                        </h3>

                                        <p className="my-route-history-card__row">
                                            <strong>Zlecenia:</strong>{" "}
                                            {formatTransportOrders(route.transportOrders)}
                                        </p>

                                        <p className="my-route-history-card__row">
                                            <strong>Start:</strong> {route.startAddress}
                                        </p>

                                        <p className="my-route-history-card__row">
                                            <strong>Cel:</strong> {route.actualDestinationAddress}
                                        </p>

                                        <p className="my-route-history-card__row">
                                            <strong>Rozpoczęto:</strong>{" "}
                                            {formatDateTime(route.startedAt)}
                                        </p>

                                        <p className="my-route-history-card__row">
                                            <strong>Zakończono:</strong>{" "}
                                            {formatDateTime(route.finishedAt)}
                                        </p>

                                        <p className="my-route-history-card__row">
                                            <strong>Dystans:</strong>{" "}
                                            {route.distanceKm !== null
                                                ? `${route.distanceKm} km`
                                                : "Brak danych"}
                                        </p>
                                    </div>

                                    <span className="my-route-history-card__status">
                                        {getRouteStatusLabel(route.status)}
                                    </span>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            )}
        </>
    )
}