import { useEffect, useState } from "react";
import axios from "axios";
import { getMyRoutes, startRoute } from "../api/routesApi";
import type { RouteResponse } from "../types/route";
import { getRouteStatusLabel } from "../utils/routeLabels";
import "./MyRoutesPage.css"

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Brak danych";
  }

  return new Date(value).toLocaleString();
}

function formatTransportOrderIds(ids: number[]): string {
  if (ids.length === 0) {
    return "Brak zleceń";
  }

  return ids.map((id) => `#${id}`).join(", ");
}

export function MyRoutesPage() {
  const [routes, setRoutes] = useState<RouteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingRouteId, setStartingRouteId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadRoutes() {
      try {
        setLoading(true);
        setErrorMessage(null);

        const data = await getMyRoutes();

        const activeRoutes = data.filter(
          (route) =>
            route.status === "CREATED" ||
            route.status === "IN_PROGRESS" ||
            route.status === "WAITING"
        );

        setRoutes(activeRoutes);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          setErrorMessage(
            `Błąd pobierania tras: ${
              error.response?.status ?? "brak odpowiedzi"
            }`
          );
          return;
        }

        setErrorMessage("Nieznany błąd pobierania tras.");
      } finally {
        setLoading(false);
      }
    }

    loadRoutes();
  }, []);

  async function handleStartRoute(routeId: number) {
    try {
      setStartingRouteId(routeId);
      setErrorMessage(null);
      setSuccessMessage(null);

      const updatedRoute = await startRoute(routeId);

      setRoutes((currentRoutes) =>
        currentRoutes.map((route) =>
          route.id === routeId ? updatedRoute : route
        )
      );

      setSuccessMessage("Trasa została rozpoczęta.");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          setErrorMessage("Nie można teraz rozpocząć tej trasy.");
          return;
        }

        if (error.response?.status === 401) {
          setErrorMessage("Sesja wygasła. Zaloguj się ponownie.");
          return;
        }

        if (error.response?.status === 403) {
          setErrorMessage("Brak uprawnień do rozpoczęcia trasy.");
          return;
        }

        if (error.response?.status === 404) {
          setErrorMessage("Nie znaleziono trasy.");
          return;
        }

        setErrorMessage(
          `Błąd rozpoczynania trasy: ${
            error.response?.status ?? "brak odpowiedzi"
          }`
        );
        return;
      }

      setErrorMessage("Nieznany błąd rozpoczynania trasy.");
    } finally {
      setStartingRouteId(null);
    }
  }

  if (loading) {
    return (
      <main className="my-routes-page">
        <p className="my-routes-page__message">Ładowanie tras...</p>
      </main>
    );
  }

  return (
    <main className="my-routes-page">
      <header className="my-routes-page__header">
        <h1 className="my-routes-page__title">Moje trasy</h1>
        <p className="my-routes-page__subtitle">
          Przyjęte i aktualnie realizowane trasy.
        </p>
      </header>

      {errorMessage && (
        <p className="my-routes-page__message my-routes-page__message--error">
          {errorMessage}
        </p>
      )}

      {successMessage && (
        <p className="my-routes-page__message my-routes-page__message--success">
          {successMessage}
        </p>
      )}

      {routes.length === 0 ? (
        <p className="my-routes-page__message">
          Nie masz aktualnie żadnych aktywnych tras.
        </p>
      ) : (
        <section className="my-routes-list">
          {routes.map((route) => (
            <article className="my-route-card" key={route.id}>
              <header className="my-route-card__header">
                <div>
                  <h2 className="my-route-card__title">
                    Trasa #{route.id}
                  </h2>

                  <p className="my-route-card__subtitle">
                    Zlecenia: {formatTransportOrderIds(route.transportOrderIds)}
                  </p>
                </div>

                <span className="my-route-card__status">
                  {getRouteStatusLabel(route.status)}
                </span>
              </header>

              <div className="my-route-card__body">
                <p className="my-route-card__row">
                  <strong>Start:</strong> {route.startAddress}
                </p>

                <p className="my-route-card__row">
                  <strong>Cel:</strong> {route.actualDestinationAddress}
                </p>

                <p className="my-route-card__row">
                  <strong>Rozpoczęto:</strong> {formatDateTime(route.startedAt)}
                </p>

                <p className="my-route-card__row">
                  <strong>Dystans:</strong>{" "}
                  {route.distanceKm !== null ? `${route.distanceKm} km` : "Brak danych"}
                </p>

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
                    onClick={() => handleStartRoute(route.id)}
                  >
                    {startingRouteId === route.id
                      ? "Rozpoczynanie..."
                      : "Start trasy"}
                  </button>
                )}

                {route.status === "IN_PROGRESS" && (
                  <button
                    className="my-route-card__secondary-button"
                    type="button"
                  >
                    Zakończ trasę
                  </button>
                )}

                {route.status === "WAITING" && (
                  <button
                    className="my-route-card__secondary-button"
                    type="button"
                  >
                    Wznów trasę
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}