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
import { Link, useLocation } from "react-router-dom";
import {
  addRouteMemberToRoute,
  deleteRouteMemberFromRoute,
  getRouteMemberCandidates,
  getRouteMembersByRoute,
  type ExternalRouteMemberSource,
  type RouteMemberCreateRequest,
} from "../api/routeMemberApi";

import type {
  RouteMemberResponse,
  RouteMemberRole,
} from "../types/routeMember";

import {
  routeMemberRoleLabels,
  routeMemberSourceLabels,
} from "../utils/routeMemberLabels";

import type { CrewMemberOptionResponse } from "../api/crewMemberApi";

type FinishRouteModalState = {
  routeId: number;
  finishOdometerLastThree: string;
  orderActionByTransportOrderId: Record<number, RouteOrderFinishAction>
}

type MyRoutesLocationState = {
  warningMessage?: string
};

type AddRouteMemberMode = "SYSTEM_USER" | "EXTERNAL";

type AddRouteMemberFormState = {
  mode: AddRouteMemberMode;
  userId: string;
  memberName: string;
  memberRole: RouteMemberRole;
  memberSource: ExternalRouteMemberSource;
};

const initialAddRouteMemberForm: AddRouteMemberFormState = {
  mode: "SYSTEM_USER",
  userId: "",
  memberName: "",
  memberRole: "SANITARY_WORKER",
  memberSource: "SOR_STAFF",
};

const externalRouteMemberSources: ExternalRouteMemberSource[] = [
  "SOR_STAFF",
  "HOSPITAL_STAFF",
  "NPL_DOCTOR",
  "NPL_NURSE",
  "OTHER",
];

const manualRouteMemberRoles: RouteMemberRole[] = [
  "SANITARY_WORKER",
  "PARAMEDIC",
  "NURSE",
  "DOCTOR",
  "OTHER",
];

function formatTransportOrderIds(ids: number[]): string {
  if (ids.length === 0) {
    return "Brak zleceń";
  }

  return ids.map((id) => `#${id}`).join(", ");
}

export function MyRoutesPage() {
  const location = useLocation();

  const [routes, setRoutes] = useState<RouteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingRouteId, setStartingRouteId] = useState<number | null>(null);
  const [finishingRouteId, setFinishingRouteId] = useState<number | null>(null);
  const [waitingRouteId, setWaitingRouteId] = useState<number | null>(null);
  const [resumingRouteId, setResumingRouteId] = useState<number | null>(null);
  const [showCompletedRoutes, setShowCompletedRoutes] = useState(false);
  const [routeMemberCandidatesByRouteId, setRouteMemberCandidatesByRouteId] =
    useState<Record<number, CrewMemberOptionResponse[]>>({});

  const [routeMembersByRouteId, setRouteMembersByRouteId] = useState<
    Record<number, RouteMemberResponse[]>
  >({});

  const [addMemberFormByRouteId, setAddMemberFormByRouteId] = useState<
    Record<number, AddRouteMemberFormState>
  >({});

  const [addingMemberRouteId, setAddingMemberRouteId] = useState<number | null>(null);

  const [warningMessage, setWarningMessage] = useState<string | null>(() => {
    const state = location.state as MyRoutesLocationState | null;
    return state?.warningMessage ?? null;
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [expandedAddMemberRouteId, setExpandedAddMemberRouteId] = useState<number | null>(null);

  const [finishModal, setFinishModal] = useState<FinishRouteModalState | null>(null);

  function toggleAddMemberForm(routeId: number) {
    setExpandedAddMemberRouteId((previousRouteId) =>
      previousRouteId === routeId ? null : routeId
    );
  }

  async function refreshRouteMemberCandidates(routeId: number) {
    const candidates = await getRouteMemberCandidates(routeId);

    setRouteMemberCandidatesByRouteId((currentCandidates) => ({
      ...currentCandidates,
      [routeId]: candidates,
    }));
  }

  useEffect(() => {
    async function loadRoutes() {
      try {
        setLoading(true);
        setErrorMessage(null);

        const routesData = await getMyRoutes();

        setRoutes(routesData);

        const [routeMembersEntries, candidateEntries] = await Promise.all([
          Promise.all(
            routesData.map(async (route) => {
              const members = await getRouteMembersByRoute(route.id);
              return [route.id, members] as const;
            })
          ),
          Promise.all(
            routesData.map(async (route) => {
              const candidates = await getRouteMemberCandidates(route.id);
              return [route.id, candidates] as const;
            })
          ),
        ]);

        setRouteMembersByRouteId(Object.fromEntries(routeMembersEntries));
        setRouteMemberCandidatesByRouteId(Object.fromEntries(candidateEntries));
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

      setExpandedAddMemberRouteId(null);
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

  function getAddMemberForm(routeId: number): AddRouteMemberFormState {
    return addMemberFormByRouteId[routeId] ?? initialAddRouteMemberForm;
  }

  function updateAddMemberForm(
    routeId: number,
    partialForm: Partial<AddRouteMemberFormState>
  ) {
    setAddMemberFormByRouteId((currentForms) => ({
      ...currentForms,
      [routeId]: {
        ...getAddMemberForm(routeId),
        ...partialForm,
      },
    }));
  }

  async function handleAddRouteMember(routeId: number) {
    const form = getAddMemberForm(routeId);

    let request: RouteMemberCreateRequest;

    if (form.mode === "SYSTEM_USER") {
      const userId = Number(form.userId);

      if (!userId || Number.isNaN(userId)) {
        setErrorMessage("Wybierz użytkownika systemu.");
        return;
      }

      request = {
        userId,
        memberRole: "SANITARY_WORKER",
        memberSource: "SUPPORT_SHIFT_TEAM",
      };
    } else {
      const memberName = form.memberName.trim();

      if (!memberName) {
        setErrorMessage("Podaj imię i nazwisko członka załogi.");
        return;
      }

      request = {
        memberName,
        memberRole: form.memberRole,
        memberSource: form.memberSource,
      };
    }

    try {
      setAddingMemberRouteId(routeId);
      setErrorMessage(null);
      setSuccessMessage(null);

      const createdMember = await addRouteMemberToRoute(routeId, request);

      setRouteMembersByRouteId((currentMembers) => ({
        ...currentMembers,
        [routeId]: [...(currentMembers[routeId] ?? []), createdMember],
      }));

      await refreshRouteMemberCandidates(routeId);

      setAddMemberFormByRouteId((currentForms) => ({
        ...currentForms,
        [routeId]: initialAddRouteMemberForm,
      }));

      setExpandedAddMemberRouteId(null);

      setSuccessMessage("Członek załogi został dodany do trasy.");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          setErrorMessage("Nieprawidłowe dane członka załogi.");
          return;
        }

        if (error.response?.status === 401) {
          setErrorMessage("Sesja wygasła. Zaloguj się ponownie.");
          return;
        }

        if (error.response?.status === 403) {
          setErrorMessage("Brak uprawnień do dodania członka załogi.");
          return;
        }

        if (error.response?.status === 404) {
          setErrorMessage("Nie znaleziono trasy albo użytkownika.");
          return;
        }

        setErrorMessage(
          `Błąd dodawania członka załogi: ${error.response?.status ?? "brak odpowiedzi"
          }`
        );
        return;
      }

      setErrorMessage("Nieznany błąd dodawania członka załogi.");
    } finally {
      setAddingMemberRouteId(null);
    }
  }

  async function handleDeleteRouteMember(routeId: number, memberId: number) {
    const confirmed = window.confirm(
      "Usunąć tę osobę tylko z tej trasy? Nie usunie to użytkownika ze zmiany."
    );

    if (!confirmed) {
      return;
    }

    try {
      setErrorMessage(null);
      setSuccessMessage(null);

      await deleteRouteMemberFromRoute(routeId, memberId);

      setRouteMembersByRouteId((previous) => ({
        ...previous,
        [routeId]: (previous[routeId] ?? []).filter(
          (member) => member.id !== memberId
        ),
      }));

      await refreshRouteMemberCandidates(routeId);

      setSuccessMessage("Członek trasy został usunięty.");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          `Bład usuwania członka trasy ${error.response?.status ?? "Brak odpowiedzi"
          }`
        );
        return;
      }

      setErrorMessage("Nieznany błąd usuwania członka trasy.")
    }
  }

  function openFinishRouteModal(route: RouteResponse) {
    const orderActionByTransportOrderId = Object.fromEntries(
      route.transportOrderIds.map((transportOrderId) => [
        transportOrderId,
        "COMPLETE" as RouteOrderFinishAction,
      ])
    ) as Record<number, RouteOrderFinishAction>;

    setFinishModal({
      routeId: route.id,
      finishOdometerLastThree: "",
      orderActionByTransportOrderId,
    });
  }

  function updateFinishOrderAction(
    transportOrderId: number,
    action: RouteOrderFinishAction
  ) {
    setFinishModal((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        orderActionByTransportOrderId: {
          ...previous.orderActionByTransportOrderId,
          [transportOrderId]: action,
        },
      };
    });
  }

  async function handleConfirmFinishRoute() {
    if (!finishModal) {
      return;
    }

    if (!/^\d{1,3}$/.test(finishModal.finishOdometerLastThree)) {
      setErrorMessage("Podaj od 1 do 3 ostatnich cyfr licznika.");
      return;
    }

    const finishOdometerLastThree = Number(finishModal.finishOdometerLastThree);

    try {
      setFinishingRouteId(finishModal.routeId);
      setErrorMessage(null);
      setSuccessMessage(null);

      const updatedRoute = await finishRoute(finishModal.routeId, {
        finishOdometerLastThree,
        notes: null,
        orders: Object.entries(finishModal.orderActionByTransportOrderId).map(
          ([transportOrderId, action]) => ({
            transportOrderId: Number(transportOrderId),
            action,
          })
        ),
      });

      setRoutes((currentRoutes) =>
        currentRoutes.map((route) =>
          route.id === updatedRoute.id ? updatedRoute : route
        )
      );

      setFinishModal(null);
      setSuccessMessage("Trasa została zakończona.");
    } catch (error) {
      if (axios.isAxiosError(error)) {
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
      {warningMessage && (
        <section className="my-routes-page__warning-box">
          <div>
            <strong>Nie można jeszcze zakończyć zmiany</strong>
            <p>{warningMessage}</p>
          </div>

          <Link className="my-routes-page__warning-link" to="/dashboard">
            Wróć do dashboardu
          </Link>

          <button
            className="my-routes-page__warning-close"
            type="button"
            onClick={() => setWarningMessage(null)}
          >
            Zamknij
          </button>
        </section>
      )}

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

              {(routeMembersByRouteId[route.id] ?? []).map((member) => {
                const canDelete = !(
                  member.role === "DRIVER" && member.source === "SHIFT_TEAM"
                );

                return (
                  <div className="my-route-card__crew-item" key={member.id}>
                    <strong className="my-route-card__crew-role">
                      {routeMemberRoleLabels[member.role]}
                    </strong>

                    <span className="my-route-card__crew-name">
                      {member.fullName}
                    </span>

                    <div className="my-route-card__crew-actions">
                      <small className="my-route-card__crew-source">
                        {routeMemberSourceLabels[member.source]}
                      </small>

                      {canDelete && (
                        <button
                          type="button"
                          className="my-route-card__crew-delete-button"
                          onClick={() => handleDeleteRouteMember(route.id, member.id)}
                        >
                          Usuń
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}

              <section className="my-route-card__add-member">
                <button
                  type="button"
                  className="my-route-card__toggle-add-member-button"
                  onClick={() => toggleAddMemberForm(route.id)}
                >
                  {expandedAddMemberRouteId === route.id
                    ? "Ukryj dodawanie członka"
                    : "+ Dodaj członka trasy"}
                </button>

                {expandedAddMemberRouteId === route.id && (
                  <div className="my-route-card__add-member-panel">
                    <div className="my-route-card__add-member-mode">
                      <button
                        className={
                          getAddMemberForm(route.id).mode === "SYSTEM_USER"
                            ? "my-route-card__mode-button my-route-card__mode-button--active"
                            : "my-route-card__mode-button"
                        }
                        type="button"
                        onClick={() =>
                          updateAddMemberForm(route.id, {
                            mode: "SYSTEM_USER",
                            memberName: "",
                            memberRole: "SANITARY_WORKER",
                          })
                        }
                      >
                        Transport
                      </button>

                      <button
                        className={
                          getAddMemberForm(route.id).mode === "EXTERNAL"
                            ? "my-route-card__mode-button my-route-card__mode-button--active"
                            : "my-route-card__mode-button"
                        }
                        type="button"
                        onClick={() =>
                          updateAddMemberForm(route.id, {
                            mode: "EXTERNAL",
                            userId: "",
                            memberRole: "PARAMEDIC",
                            memberSource: "SOR_STAFF",
                          })
                        }
                      >
                        Szpital
                      </button>
                    </div>

                    <div className="my-route-card__add-member-form">
                      {getAddMemberForm(route.id).mode === "SYSTEM_USER" ? (
                        <select
                          className="my-route-card__add-member-input"
                          value={getAddMemberForm(route.id).userId}
                          onChange={(event) =>
                            updateAddMemberForm(route.id, {
                              userId: event.target.value,
                            })
                          }
                        >
                          <option value="">Wybierz użytkownika</option>
                          {(routeMemberCandidatesByRouteId[route.id] ?? []).map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.firstName} {member.lastName}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="my-route-card__add-member-input"
                          placeholder="Imię i nazwisko, np. Andrzej Kowalski"
                          value={getAddMemberForm(route.id).memberName}
                          onChange={(event) =>
                            updateAddMemberForm(route.id, {
                              memberName: event.target.value,
                            })
                          }
                        />
                      )}

                      {getAddMemberForm(route.id).mode === "EXTERNAL" && (
                        <select
                          className="my-route-card__add-member-input"
                          value={getAddMemberForm(route.id).memberRole}
                          onChange={(event) =>
                            updateAddMemberForm(route.id, {
                              memberRole: event.target.value as RouteMemberRole,
                            })
                          }
                        >
                          {manualRouteMemberRoles.map((role) => (
                            <option key={role} value={role}>
                              {routeMemberRoleLabels[role]}
                            </option>
                          ))}
                        </select>
                      )}

                      {getAddMemberForm(route.id).mode === "EXTERNAL" && (
                        <select
                          className="my-route-card__add-member-input"
                          value={getAddMemberForm(route.id).memberSource}
                          onChange={(event) =>
                            updateAddMemberForm(route.id, {
                              memberSource: event.target.value as ExternalRouteMemberSource,
                            })
                          }
                        >
                          {externalRouteMemberSources.map((source) => (
                            <option key={source} value={source}>
                              {routeMemberSourceLabels[source]}
                            </option>
                          ))}
                        </select>
                      )}

                      <button
                        className="my-route-card__secondary-button"
                        type="button"
                        disabled={addingMemberRouteId === route.id}
                        onClick={() => handleAddRouteMember(route.id)}
                      >
                        {addingMemberRouteId === route.id
                          ? "Dodawanie..."
                          : "Dodaj członka"}
                      </button>
                    </div>
                  </div>
                )}
              </section>

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

                    <button
                      className="my-route-card__secondary-button"
                      type="button"
                      disabled={finishingRouteId === route.id}
                      onClick={() => openFinishRouteModal(route)}
                    >
                      {finishingRouteId === route.id ? "Kończenie..." : "Zakończ trasę"}
                    </button>

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
      {finishModal && (
        <div className="my-routes-modal-backdrop">
          <div className="my-routes-modal" role="dialog" aria-modal="true">
            <h2>Zakończenie trasy #{finishModal.routeId}</h2>

            <label className="my-routes-modal__field">
              <span>Ostatnie 3 cyfry licznika</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={3}
                value={finishModal.finishOdometerLastThree}
                onChange={(event) =>
                  setFinishModal((previous) =>
                    previous
                      ? {
                        ...previous,
                        finishOdometerLastThree: event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 3),
                      }
                      : previous
                  )
                }
              />
            </label>

            <div className="my-routes-modal__orders">
              <h3>Status zleceń po zakończeniu trasy</h3>

              {Object.entries(finishModal.orderActionByTransportOrderId).map(
                ([transportOrderId, action]) => (
                  <label
                    className="my-routes-modal__order-row"
                    key={transportOrderId}
                  >
                    <span>Zlecenie #{transportOrderId}</span>

                    <select
                      value={action}
                      onChange={(event) =>
                        updateFinishOrderAction(
                          Number(transportOrderId),
                          event.target.value as RouteOrderFinishAction
                        )
                      }
                    >
                      <option value="COMPLETE">Zlecenie zakończone</option>
                      <option value="WAITING_FOR_PICKUP">
                        Oczekuje na odbiór
                      </option>
                    </select>
                  </label>
                )
              )}
            </div>

            <div className="my-routes-modal__actions">
              <button
                type="button"
                className="my-routes-modal__cancel-button"
                onClick={() => setFinishModal(null)}
              >
                Anuluj
              </button>

              <button
                type="button"
                className="my-routes-modal__confirm-button"
                onClick={handleConfirmFinishRoute}
              >
                Zakończ trasę
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}