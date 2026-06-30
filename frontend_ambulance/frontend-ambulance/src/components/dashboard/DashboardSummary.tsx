import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { getShiftStatusLabel } from "../../utils/dashboardLabels";
import { getMyDashboard } from "../../api/dashboardApi";
import type { AmbulanceDashboardResponse } from "../../types/dashboard";
import { getUserRoleLabel } from "../../utils/userRoleLabels";
import { formatDate } from "../../utils/dateTimeFormat";
import { finishShift } from "../../api/shiftsApi";

type ApiErrorResponse = {
    code?: string;
    message?: string;
};

function getApiErrorCode(error: unknown): string | null {
    if (!axios.isAxiosError(error)) {
        return null;
    }

    return (error.response?.data as ApiErrorResponse | undefined)?.code ?? null;
}

export function DashboardSummary() {
    const [dashboard, setDashboard] = useState<AmbulanceDashboardResponse | null>(
        null
    );
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [finishingShift, setFinishingShift] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        async function loadDashboard() {
            try {
                setLoading(true);
                setErrorMessage(null);
                setSuccessMessage(null);

                const data = await getMyDashboard();
                setDashboard(data);
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    const errorCode = getApiErrorCode(error);

                    if (errorCode === "SHIFT_NOT_ACTIVE") {
                        setErrorMessage("NO_ACTIVE_SHIFT");
                        return;
                    }

                    if (error.response?.status === 401) {
                        setErrorMessage("Sesja wygasła. Zaloguj się ponownie.");
                        return;
                    }

                    if (error.response?.status === 403) {
                        setErrorMessage("Brak uprawnień do wyświetlenia danych.");
                        return;
                    }

                    setErrorMessage("Nie udało się pobrać danych dashboardu.");
                    return;
                }

                setErrorMessage("Nieznany błąd podczas pobierania dashboardu.");
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();
    }, []);

    async function handleFinishShift() {
        if (!dashboard) {
            return;
        }

        const confirmed = window.confirm(
            "Czy na pewno chcesz zakończyć zmianę? Karetka zostanie oznaczona jako dostępna."
        );

        if (!confirmed) {
            return;
        }

        try {
            setFinishingShift(true);
            setErrorMessage(null);
            setSuccessMessage(null);

            await finishShift(dashboard.shiftId);

            setDashboard(null);
            setSuccessMessage("Zmiana została zakończona.");
            setErrorMessage("NO_ACTIVE_SHIFT");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const errorCode = getApiErrorCode(error);

                if (errorCode === "SHIFT_HAS_ACTIVE_ROUTES") {
                    navigate("/routes/me", {
                        state: {
                            warningMessage:
                                "Nie można zakończyć zmiany, ponieważ masz niezakończone trasy.",
                        }
                    });
                    return;
                }

                if (errorCode === "SHIFT_NOT_ACTIVE") {
                    setErrorMessage("Ta zmiana nie jest już aktywna.");
                    return;
                }

                if (errorCode === "SHIFT_ACCESS_DENIED") {
                    setErrorMessage("Nie masz dostępu do tej zmiany.");
                    return;
                }

                if (error.response?.status === 401) {
                    setErrorMessage("Sesja wygasła. Zaloguj się ponownie.");
                    return;
                }

                if (error.response?.status === 403) {
                    setErrorMessage("Brak uprawnień do zakończenia zmiany.");
                    return;
                }

                setErrorMessage("Nie udało się zakończyć zmiany.");
                return;
            }

            setErrorMessage("Nieznany błąd zakończenia zmiany.");
        } finally {
            setFinishingShift(false);
        }
    }

    if (loading) {
        return (
            <section className="dashboard-summary dashboard-summary-loading">
                <p className="dashboard-summary__message">Ładowanie danych...</p>
            </section>
        );
    }

    if (errorMessage === "NO_ACTIVE_SHIFT") {
        return (
            <section className="dashboard-summary dashboard-summary-empty">
                {successMessage && (
                    <p className="dashboard-summary__success-message">{successMessage}</p>
                )}

                <p className="dashboard-summary__message">Nie masz aktywnej zmiany.</p>

                <p className="dashboard-summary__message">
                    Utwórz zmianę, żeby korzystać z dashboardu, zleceń i tras.
                </p>

                <Link className="dashboard-summary__action-link" to="/shifts/create">
                    Utwórz zmianę
                </Link>
            </section>
        );
    }

    if (errorMessage) {
        return (
            <section className="dashboard-summary dashboard-summary-error">
                <p className="dashboard-summary__message">{errorMessage}</p>
            </section>
        );
    }

    if (!dashboard) {
        return (
            <section className="dashboard-summary dashboard-summary-empty">
                <p className="dashboard-summary__message">
                    Brak danych do wyświetlenia.
                </p>
            </section>
        );
    }

    return (
        <section className="dashboard-summary">
            <div className="dashboard-summary__header">
                <div className="dashboard-summary__user">
                    <h2 className="dashboard-summary__title">
                        {dashboard.loggedUserFullName}
                    </h2>

                    <p className="dashboard-summary__subtitle">
                        {getUserRoleLabel(dashboard.loggedUserRole)}
                    </p>
                </div>

                <div className="dashboard-summary__date">
                    {formatDate(dashboard.currentDate)}
                </div>
            </div>

            <div className="dashboard-summary__grid">
                <div className="dashboard-summary__card">
                    <span className="dashboard-summary__label">Zmiana</span>
                    <strong className="dashboard-summary__value">
                        {getShiftStatusLabel(dashboard.shiftStatus)}
                    </strong>
                    <span className="dashboard-summary__hint">
                        {dashboard.shiftTimeLabel ?? "Brak godzin"}
                    </span>
                </div>

                <div className="dashboard-summary__card">
                    <span className="dashboard-summary__label">Karetka</span>
                    <strong className="dashboard-summary__value">
                        {dashboard.registrationPlates}
                    </strong>
                    <span className="dashboard-summary__hint">
                        {dashboard.carBrand} {dashboard.model}
                    </span>
                </div>

                <div className="dashboard-summary__card">
                    <span className="dashboard-summary__label">Przebieg</span>
                    <strong className="dashboard-summary__value">
                        {dashboard.mileage} km
                    </strong>
                </div>

                <div className="dashboard-summary__card">
                    <span className="dashboard-summary__label">Szacowane paliwo</span>
                    <strong className="dashboard-summary__value">
                        {dashboard.estimatedFuelLitersDisplay !== null
                            ? `${dashboard.estimatedFuelLitersDisplay} l`
                            : "Brak danych"}
                    </strong>

                    {dashboard.tankCapacityLiters !== null && (
                        <span className="dashboard-summary__hint">
                            Zbiornik: {dashboard.tankCapacityLiters} l
                        </span>
                    )}
                </div>
            </div>

            {successMessage && (
                <p className="dashboard-summary__success-message">{successMessage}</p>
            )}

            <div className="dashboard-summary__actions">
                <button
                    className="dashboard-summary__finish-button"
                    type="button"
                    disabled={finishingShift}
                    onClick={handleFinishShift}
                >
                    {finishingShift ? "Kończenie zmiany..." : "Zakończ zmianę"}
                </button>
            </div>
        </section>
    );
}