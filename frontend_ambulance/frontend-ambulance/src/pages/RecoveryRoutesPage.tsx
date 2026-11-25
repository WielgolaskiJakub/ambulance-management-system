import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRoutesForRecovery } from "../api/recoveryApi";
import type { RecoveryRouteSummaryResponse } from "../types/route";
import "./RecoveryRoutesPage.css";
import { RestoreAmbulanceStateSection } from "../components/recovery/RestoreAmbulanceStateSection";

export function RecoveryRoutesPage() {
    const [routes, setRoutes] = useState<RecoveryRouteSummaryResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        async function loadRoutes() {
            try {
                const data = await getRoutesForRecovery();
                if (active) setRoutes(data);
            } catch {
                if (active) setErrorMessage("Nie udało się pobrać listy tras.");
            } finally {
                if (active) setLoading(false);
            }
        }

        void loadRoutes();

        return () => {
            active = false;
        };
    }, []);

    return (
        <main className="recovery-routes-page">
            <h1>Rozliczenie tras po awarii</h1>

        <RestoreAmbulanceStateSection />
            {loading ? (
                <p role="status">Ładowanie tras…</p>
            ) : errorMessage ? (
                <p role="alert">{errorMessage}</p>
            ) : routes.length === 0 ? (
                <p>Brak tras w trakcie realizacji.</p>
            ) : (
                <ul className="recovery-routes-page__list">
                    {routes.map((route) => (
                        <li key={route.routeId} className="recovery-routes-page__card">
                            <div className="recovery-routes-page__details">
                                <strong>{route.registrationPlates}</strong>
                                <span>{route.driverFullName}</span>
                                <span>
                                    Wyjazd{" "}
                                    <time dateTime={route.startedAt}>
                                        {new Date(route.startedAt).toLocaleString("pl-PL", {
                                            dateStyle: "short",
                                            timeStyle: "short",
                                        })}
                                    </time>
                                </span>
                            </div>

                            <Link
                                className="recovery-routes-page__link"
                                to={`/recovery/routes/${route.routeId}`}
                            >
                                Rozlicz trasę
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}