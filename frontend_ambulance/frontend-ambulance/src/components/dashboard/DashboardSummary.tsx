import {useEffect, useState} from "react";
import axios from "axios";
import {getShiftStatusLabel} from "../../utils/dashboardLabels";
import { getMyDashboard } from "../../api/dashboardApi";
import type { AmbulanceDashboardResponse} from "../../types/dashboard";
import {getUserRoleLabel} from "../../utils/userRoleLabels";
import { formatDate } from "../../utils/dateTimeFormat";


export function DashboardSummary() {
    const [dashboard, setDashboard] = useState<AmbulanceDashboardResponse | null>(null);

    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        async function loadDashboard() {
            try {
                setLoading(true);
                setErrorMessage(null);

                const data = await getMyDashboard();
                setDashboard(data);
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    if(error.response?.status === 401) {
                        setErrorMessage("Sesja wygasła. Zaloguj się ponownie.");
                        return;
                    }
                    if(error.response?.status === 403) {
                        setErrorMessage("Brak uprawnień do wyświetlenia danych.");
                        return;
                    }
                     setErrorMessage(
            `Błąd pobierania dashboardu: ${error.response?.status ?? "brak odpowiedzi"}`
          );
          return;
        }
        setErrorMessage("Nieznany błąd podczas pobierania dashboardu.");
        } finally {
            setLoading(false);
        }
    }
    loadDashboard();
}, []);

if (loading) {
    return (
        <section className="dashboard-summary dashboard-summary-loading">
            <p className="dashboard-summary__message">Ładowanie danych...</p>
        </section>
    );
}
if(errorMessage) {
    return (
        <section className="dashboard-summary dashboard-summary-error">
            <p className="dashboard-summary__message">{errorMessage}</p>
        </section>
    ); 
}
    if(!dashboard){
        return (
            <section className="dashboard-summary dashboard-summary-empty">
                <p className="dashboard-summary__message">Brak danych do wyświetlenia.</p>
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
    </section>
  );
}
