import { MapPin, Route } from "lucide-react";
import type { RouteResponse, RouteTransportOrderReference } from "../../types/route";
import type { RouteOrderFinishAction } from "../../api/routesApi";
import { getRouteStatusLabel } from "../../utils/routeLabels";

type RouteCardOverviewProps = {
    route: RouteResponse;
    startingRouteId: number | null;
    finishingRouteId: number | null;
    waitingRouteId: number | null;
    resumingRouteId: number | null;
    resolvingTransportOrderId: number | null;
    onStartRoute: (routeId: number) => void;
    onResolveTransportOrder: (
        routeId: number,
        transportOrder: RouteTransportOrderReference,
        action: RouteOrderFinishAction
    ) => void;
    onMarkRouteAsWaiting: (routeId: number) => void;
    onOpenFinishRouteModal: (route: RouteResponse) => void;
    onResumeRoute: (routeId: number) => void;
};

export function RouteCardOverview({
    route,
    startingRouteId,
    finishingRouteId,
    waitingRouteId,
    resumingRouteId,
    resolvingTransportOrderId,
    onStartRoute,
    onResolveTransportOrder,
    onMarkRouteAsWaiting,
    onOpenFinishRouteModal,
    onResumeRoute,
}: RouteCardOverviewProps) {
    const completedTransportOrders = route.transportOrders.filter(
        (order) => order.routeOrderStatus === "COMPLETED"
    );

    const currentStartAddress = completedTransportOrders.at(-1)?.destinationAddress ?? route.startAddress;

    const nextTransportOrder = route.transportOrders.find(
        (order) => order.routeOrderStatus === "PENDING"
    );

    const canFinishRoute =
        route.transportOrders.length > 0 &&
        route.transportOrders.every(
            (order) => order.routeOrderStatus !== "PENDING"
        );

    return (
        <>
            <header className="my-route-card__header">
                <div className="my-route-card__title-group">
                    <span className="my-route-card__eyebrow">Aktywna trasa</span>

                    <h2 className="my-route-card__title">
                        <Route size={22} aria-hidden="true" /> Trasa #{route.id}
                    </h2>

                    <p className="my-route-card__subtitle">
                        {route.transportOrders.length}{" "}
                        {route.transportOrders.length === 1 ? "zlecenie" : "zlecenia"} w
                        kolejce
                    </p>
                </div>

                <span
                    className={`my-route-card__status my-route-card__status--${route.status.toLowerCase()}`}
                >
                    {getRouteStatusLabel(route.status)}
                </span>
            </header>

            <div className="my-route-card__body">
                <section className="my-route-card__next-stop">
                    <div className="my-route-card__next-stop-label">Następny kurs</div>

                    <strong>
                        <MapPin size={18} aria-hidden="true" />
                        {nextTransportOrder
                            ? `${currentStartAddress} → ${nextTransportOrder.destinationAddress}`
                            : "Brak zleceń do realizacji"}
                    </strong>
                </section>

                {route.status === "IN_PROGRESS" && nextTransportOrder && (
                    <div className="my-route-card__resolve-actions">
                        <button
                            type="button"
                            className="my-route-card__return-order-button"
                            disabled={resolvingTransportOrderId === nextTransportOrder.id}
                            onClick={() =>
                                onResolveTransportOrder(
                                    route.id,
                                    nextTransportOrder,
                                    "WAITING_FOR_PICKUP"
                                )
                            }
                        >
                            Pacjent pozostawiony w poradnii
                        </button>

                        <button
                            type="button"
                            className="my-route-card__complete-order-button"
                            disabled={resolvingTransportOrderId === nextTransportOrder.id}
                            onClick={() =>
                                onResolveTransportOrder(
                                    route.id,
                                    nextTransportOrder,
                                    "COMPLETE"
                                )
                            }
                        >
                            {resolvingTransportOrderId === nextTransportOrder.id
                                ? "Zapisywanie..."
                                : "Pacjent przekazany"}
                        </button>
                    </div>
                )}

                {route.notes && (
                    <p className="my-route-card__row">
                        <strong>Notatki:</strong> {route.notes}
                    </p>
                )}
            </div>

            <div className="my-route-card__actions">
                {route.status === "CREATED" && (
                    <button
                        className="my-route-card__primary-button"
                        type="button"
                        disabled={startingRouteId === route.id}
                        onClick={() => onStartRoute(route.id)}
                    >
                        {startingRouteId === route.id
                            ? "Rozpoczynanie..."
                            : "Start trasy"}
                    </button>
                )}

                {route.status === "IN_PROGRESS" && (
                    <>
                        <button
                            className="my-route-card__secondary-button"
                            type="button"
                            disabled={waitingRouteId === route.id}
                            onClick={() => onMarkRouteAsWaiting(route.id)}
                        >
                            {waitingRouteId === route.id ? "Zapisywanie..." : "Konsultacja"}
                        </button>

                        {canFinishRoute && (
                            <button
                                className="my-route-card__secondary-button"
                                type="button"
                                disabled={finishingRouteId === route.id}
                                onClick={() => onOpenFinishRouteModal(route)}
                            >
                                {finishingRouteId === route.id
                                    ? "Kończenie..."
                                    : "Zakończ trasę"}
                            </button>
                        )}
                    </>
                )}

                {route.status === "WAITING" && (
                    <button
                        className="my-route-card__primary-button"
                        type="button"
                        disabled={resumingRouteId === route.id}
                        onClick={() => onResumeRoute(route.id)}
                    >
                        {resumingRouteId === route.id
                            ? "Wznawianie..."
                            : "Wznów trasę"}
                    </button>
                )}
            </div>
        </>
    );
}