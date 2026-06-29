import { useEffect, useState } from "react";
import axios from "axios";
import { formatDateTime } from "../utils/dateTimeFormat";
import {
  finishRoute,
  getMyRoutes,
  startRoute,
  markRouteAsWaiting,
  resumeRoute,
  type RouteOrderFinishAction,
} from "../api/routesApi";
import type { RouteResponse } from "../types/route";
import { getRouteStatusLabel } from "../utils/routeLabels";
import "./MyRoutesPage.css";


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
  const [finishingRouteId, setFinishingRouteId] = useState<number | null>(null);
  const [waitingRouteId, setWaitingRouteId] = useState<number | null>(null);
  const [resumingRouteId, setResumingRouteId] = useState<number | null>(null);
  const [showCompletedRoutes, setShowCompletedRoutes] = useState(false);

  const [finishOdometerLastThreeByRouteId, setFinishOdometerLastThreeByRouteId] =
    useState<Record<number, string>>({});

  const [finishActionByRouteId, setFinishActionByRouteId] =
    useState<Record<number, RouteOrderFinishAction>>({});

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadRoutes() {
      try {
        setLoading(true);
        setErrorMessage(null);

        const data = await getMyRoutes();

        setRoutes(data);

      } catch (error) {
        if (axios.isAxiosError(error)) {
          setErrorMessage(
            `Błąd pobierania tras: ${error.response?.status ?? "brak odpowiedzi"
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
          `Błąd rozpoczynania trasy: ${error.response?.status ?? "brak odpowiedzi"
          }`
        );
        return;
      }

      setErrorMessage("Nieznany błąd rozpoczynania trasy.");
    } finally {
      setStartingRouteId(null);
    }
  }

  async function handleMarkRouteAsWaiting(routeId: number) {
    try {
      setWaitingRouteId(routeId);
      setErrorMessage(null);
      setSuccessMessage(null);

      const updatedRoute = await markRouteAsWaiting(routeId);

      setRoutes((currentRoutes) =>
        currentRoutes.map((route) =>
          route.id === routeId ? updatedRoute : route
        )
      );

      setSuccessMessage("Trasa została oznaczona jako oczekująca.");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          setErrorMessage("Nie można teraz oznaczyć tej trasy jako oczekującej.");
          return;
        }

        if (error.response?.status === 401) {
          setErrorMessage("Sesja wygasła. Zaloguj się ponownie.");
          return;
        }

        if (error.response?.status === 403) {
          setErrorMessage("Brak uprawnień do zmiany statusu trasy.");
          return;
        }

        if (error.response?.status === 404) {
          setErrorMessage("Nie znaleziono trasy.");
          return;
        }

        setErrorMessage(
          `Błąd oznaczania trasy jako oczekującej: ${error.response?.status ?? "brak odpowiedzi"
          }`
        );
        return;
      }

      setErrorMessage("Nieznany błąd oznaczania trasy jako oczekującej.");
    } finally {
      setWaitingRouteId(null);
    }
  }

  async function handleResumeRoute(routeId: number) {
    try {
      setResumingRouteId(routeId);
      setErrorMessage(null);
      setSuccessMessage(null);

      const updatedRoute = await resumeRoute(routeId);

      setRoutes((currentRoutes) =>
        currentRoutes.map((route) =>
          route.id === routeId ? updatedRoute : route
        )
      );

      setSuccessMessage("Trasa została wznowiona.");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          setErrorMessage("Nie można teraz wznowić tej trasy.");
          return;
        }

        if (error.response?.status === 401) {
          setErrorMessage("Sesja wygasła. Zaloguj się ponownie.");
          return;
        }

        if (error.response?.status === 403) {
          setErrorMessage("Brak uprawnień do wznowienia trasy.");
          return;
        }

        if (error.response?.status === 404) {
          setErrorMessage("Nie znaleziono trasy.");
          return;
        }

        setErrorMessage(
          `Błąd wznawiania trasy: ${error.response?.status ?? "brak odpowiedzi"
          }`
        );
        return;
      }

      setErrorMessage("Nieznany błąd wznawiania trasy.");
    } finally {
      setResumingRouteId(null);
    }
  }

  async function handleFinishRoute(route: RouteResponse) {
    const rawValue = finishOdometerLastThreeByRouteId[route.id];

    if (!rawValue || rawValue.trim().length === 0) {
      setErrorMessage("Podaj ostatnie 3 cyfry licznika.");
      return;
    }

    const finishOdometerLastThree = Number(rawValue);

    if (
      Number.isNaN(finishOdometerLastThree) ||
      finishOdometerLastThree < 0 ||
      finishOdometerLastThree > 999
    ) {
      setErrorMessage("Ostatnie 3 cyfry licznika muszą być w zakresie 0-999.");
      return;
    }

    if (route.transportOrderIds.length === 0) {
      setErrorMessage("Trasa nie ma przypisanych zleceń.");
      return;
    }

    try {
      setFinishingRouteId(route.id);
      setErrorMessage(null);
      setSuccessMessage(null);

      const updatedRoute = await finishRoute(route.id, {
        finishOdometerLastThree,
        notes: route.notes,
        orders: route.transportOrderIds.map((transportOrderId) => ({
          transportOrderId,
          action: finishActionByRouteId[route.id] ?? "WAITING_FOR_PICKUP",
        })),
      });

      setRoutes((currentRoutes) =>
        currentRoutes.map((currentRoute) =>
          currentRoute.id === route.id ? updatedRoute : currentRoute
        )
      );

      setSuccessMessage("Trasa została zakończona.");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          setErrorMessage("Nie można teraz zakończyć tej trasy.");
          return;
        }

        if (error.response?.status === 401) {
          setErrorMessage("Sesja wygasła. Zaloguj się ponownie.");
          return;
        }

        if (error.response?.status === 403) {
          setErrorMessage("Brak uprawnień do zakończenia trasy.");
          return;
        }

        if (error.response?.status === 404) {
          setErrorMessage("Nie znaleziono trasy.");
          return;
        }

        setErrorMessage(
          `Błąd kończenia trasy: ${error.response?.status ?? "brak odpowiedzi"
          }`
        );
        return;
      }

      setErrorMessage("Nieznany błąd kończenia trasy.");
    } finally {
      setFinishingRouteId(null);
    }
  }

  if (loading) {
    return (
      <main className="my-routes-page">
        <p className="my-routes-page__message">Ładowanie tras...</p>
      </main>
    );
  }
  const activeRoutes = routes.filter(
    (route) =>
      route.status === "CREATED" ||
      route.status === "IN_PROGRESS" ||
      route.status === "WAITING"
  );

  const completedRoutes = routes.filter(
    (route) => route.status === "COMPLETED"
  );
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

      {activeRoutes.length === 0 ? (
        <p className="my-routes-page__message">
          Nie masz aktualnie żadnych aktywnych tras.
        </p>
      ) : (
        <section className="my-routes-list">
          {activeRoutes.map((route) => (
            <article className="my-route-card" key={route.id}>
              <header className="my-route-card__header">
                <div>
                  <h2 className="my-route-card__title">Trasa #{route.id}</h2>

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
                  {route.distanceKm !== null
                    ? `${route.distanceKm} km`
                    : "Brak danych"}
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
                  <>
                    <button
                      className="my-route-card__secondary-button"
                      type="button"
                      disabled={waitingRouteId === route.id}
                      onClick={() => handleMarkRouteAsWaiting(route.id)}
                    >
                      {waitingRouteId === route.id ? "Zapisywanie..." : "Oczekiwanie"}
                    </button>

                    <div className="my-route-card__finish-form">
                      <label className="my-route-card__finish-label">
                        Ostatnie 3 cyfry licznika
                      </label>

                      <input
                        className="my-route-card__finish-input"
                        inputMode="numeric"
                        maxLength={3}
                        value={finishOdometerLastThreeByRouteId[route.id] ?? ""}
                        onChange={(event) =>
                          setFinishOdometerLastThreeByRouteId((currentValues) => ({
                            ...currentValues,
                            [route.id]: event.target.value.replace(/\D/g, "").slice(0, 3),
                          }))
                        }
                      />

                      <select
                        className="my-route-card__finish-select"
                        value={finishActionByRouteId[route.id] ?? "WAITING_FOR_PICKUP"}
                        onChange={(event) =>
                          setFinishActionByRouteId((currentValues) => ({
                            ...currentValues,
                            [route.id]: event.target.value as RouteOrderFinishAction,
                          }))
                        }
                      >
                        <option value="WAITING_FOR_PICKUP">Oczekuje na odbiór</option>
                        <option value="COMPLETE">Zlecenie zakończone</option>
                      </select>

                      <button
                        className="my-route-card__secondary-button"
                        type="button"
                        disabled={finishingRouteId === route.id}
                        onClick={() => handleFinishRoute(route)}
                      >
                        {finishingRouteId === route.id ? "Kończenie..." : "Zakończ trasę"}
                      </button>
                    </div>
                  </>
                )}

                {route.status === "WAITING" && (
                  <button
                    className="my-route-card__primary-button"
                    type="button"
                    disabled={resumingRouteId === route.id}
                    onClick={() => handleResumeRoute(route.id)}
                  >
                    {resumingRouteId === route.id ? "Wznawianie..." : "Wznów trasę"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
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
            <p className="my-routes-page__message">Brak zakończonych tras.</p>
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
                      {formatTransportOrderIds(route.transportOrderIds)}
                    </p>

                    <p className="my-route-history-card__row">
                      <strong>Start:</strong> {route.startAddress}
                    </p>

                    <p className="my-route-history-card__row">
                      <strong>Cel:</strong> {route.actualDestinationAddress}
                    </p>

                    <p className="my-route-history-card__row">
                      <strong>Rozpoczęto:</strong> {formatDateTime(route.startedAt)}
                    </p>

                    <p className="my-route-history-card__row">
                      <strong>Zakończono:</strong> {formatDateTime(route.finishedAt)}
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
    </main>
  );
}