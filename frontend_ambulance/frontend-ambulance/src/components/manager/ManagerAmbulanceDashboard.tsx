import { useState, useEffect } from "react";
import type { ManagerAmbulanceDashboardResponse } from "../../types/dashboard";
import { getDashboardByManager } from "../../api/dashboardApi";
import { formatTime } from "../../utils/dateTimeFormat";
import { routeMemberRoleLabels } from "../../utils/routeMemberLabels";
import "./ManagerAmbulanceDashboard.css"



export function ManagerAmbulanceDashboard() {
    const [dashboard, setDashboard] = useState<ManagerAmbulanceDashboardResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false)

    useEffect(() => {
        async function loadDashboard() {
            try {
                setLoading(true);
                setErrorMessage(null);

                const data = await getDashboardByManager();
                setDashboard(data);
            } catch {
                setErrorMessage("Nie udało się pobrać podglądu karetek.")
            } finally {
                setLoading(false);
            }
        }
        loadDashboard();
    }, []);

    if (loading) {
        return (
            <section className="dashboard-ambulance-manager dashboard-ambulance-manager--compact dashboard-ambulance-manager-loading">
                <p className="dashboard-ambulance-manager__message">Ładowanie danych...</p>
            </section>
        );
    }

    if (errorMessage) {
        return (
            <section className="dashboard-ambulance-manager dashboard-ambulance-manager-error">
                <p className="dashboard-ambulance-manager__message">{errorMessage}</p>
            </section>
        );
    }

    if (dashboard.length === 0) {
        return (
            <section className="dashboard-ambulance-manager dashboard-ambulance-manager-empty">
                <p className="dashboard-ambulance-manager__message">
                    Brak danych do wyświetlenia.
                </p>
            </section>
        );
    }

    function getAmbulanceStatusLabel(
        ambulance: ManagerAmbulanceDashboardResponse
    ): string {
        if (ambulance.currentRouteStatus === null) {
            return "WOLNA";
        }
        if (ambulance.currentRouteStatus === "CREATED") {
            return "PRZYJĘTE ZLECENIE";
        }
        if (ambulance.currentRouteStatus === "WAITING") {
            return "OCZEKUJE W TRASIE";
        }
        return "W TRASIE"

    }

    const busyAmbulanceCount = dashboard.filter(
        (ambulance) => ambulance.currentRouteStatus !== null
    ).length;

    const availableAmbulancesCount = dashboard.length - busyAmbulanceCount;

    return (

        <section className="manager-ambulance-dashboard">
            <button
                className="manager-ambulance-dashboard__toggle"
                type="button"
                onClick={() => setIsExpanded((currentValue) => !currentValue)}
                aria-expanded={isExpanded}
            >
                <span className="manager-ambulance-dashboard__toggle-title">
                    {isExpanded ? "▾" : "▸"} Podgląd karetek:
                </span>

                <span className="manager-ambulance-dashboard__summary">
                    {busyAmbulanceCount} w trasie · {availableAmbulancesCount} wolne
                </span>
            </button>

            {isExpanded && (
                <div className="manager-ambulance-dashboard__content">
                    <h2>Aktualny status karetek</h2>

                    <div className="manager-ambulance-dashboard__grid">
                        {dashboard.map((ambulance) => (
                            <article key={ambulance.shiftId}
                                className={
                                    ambulance.currentRouteStatus === null
                                        ? "manager-ambulance-card manager-ambulance-card--available"
                                        : ambulance.currentRouteStatus === "CREATED"
                                            ? "manager-ambulance-card manager-ambulance-card--accepted"
                                            : "manager-ambulance-card manager-ambulance-card--busy"
                                }
                            >
                                <header className="manager-ambulance-card__header">
                                    <div>
                                        <h3>{ambulance.registrationPlates}</h3>
                                        <p className="manager-ambulance-card__vehicle">
                                            {ambulance.carBrand} {ambulance.model}
                                        </p>
                                    </div>

                                    <span
                                        className={
                                            ambulance.currentRouteStatus === null
                                                ? "manager-ambulance-card__status manager-ambulance-card__status--available"
                                                : ambulance.currentRouteStatus === "CREATED"
                                                    ? "manager-ambulance-card__status manager-ambulance-card__status--accepted"
                                                    : "manager-ambulance-card__status manager-ambulance-card__status--busy"
                                        }
                                    >
                                        {getAmbulanceStatusLabel(ambulance)}
                                    </span>
                                </header>

                                <div className="manager-ambulance-card__crew">
                                    <p><span>Kierowca</span>{ambulance.driverFullName}</p>

                                    {ambulance.crewMembers.map((member) => (
                                        <p key={`${member.role}-${member.fullName}`}>
                                            <span>{routeMemberRoleLabels[member.role]}</span>
                                            {member.fullName}
                                        </p>
                                    ))}
                                </div>

                                {ambulance.currentRouteStatus !== null && (
                                    <div className="manager-ambulance-card__operation">


                                        {ambulance.routeAcceptedAt !== null && (
                                            <p>
                                                Zlecenie przyjęte o: {formatTime(ambulance.routeAcceptedAt)}
                                            </p>
                                        )}

                                        {ambulance.currentTransportOrders.length > 0 && (
                                            <p>
                                                {ambulance.currentRouteStatus === "CREATED"
                                                    ? "Przyjęte zlecenia: "
                                                    : "Realizowane zlecenia: "}

                                                {ambulance.currentTransportOrders
                                                    .map((order) =>
                                                        order.orderNumber !== null
                                                            ? `#${order.orderNumber}`
                                                            : `Zlecenie #${order.id}`
                                                    )
                                                    .join(", ")}
                                            </p>
                                        )}

                                        {ambulance.currentRouteStatus !== null &&
                                            ambulance.routeStartedAt !== null &&
                                            ambulance.routeStartAddress !== null &&
                                            ambulance.routeDestinationAddress !== null && (
                                                <>
                                                    <p>Od: {formatTime(ambulance.routeStartedAt)}</p>
                                                    <p>
                                                        {ambulance.routeStartAddress} →{" "}
                                                        {ambulance.routeDestinationAddress}
                                                    </p>
                                                </>
                                            )}

                                    </div>
                                )}

                            </article>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}