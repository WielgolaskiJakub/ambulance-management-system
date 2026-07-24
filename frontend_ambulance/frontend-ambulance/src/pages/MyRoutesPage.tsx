import { useEffect, useState } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  MapPin,
  Route,
} from "lucide-react";
import axios from "axios";
import {
  resolveTransportOrder,
  addTransportOrderToRoute,
  reorderTransportOrders,
  finishRoute,
  getMyRoutes,
  startRoute,
  markRouteAsWaiting,
  resumeRoute,
  type RouteOrderFinishAction,
  cancelTransportOrderInRoute,
} from "../api/routesApi";

import type {
  RouteResponse,
  RouteTransportOrderReference
} from "../types/route";

import { getRouteStatusLabel } from "../utils/routeLabels";
import "./MyRoutesPage.css";
import { Link, useLocation } from "react-router-dom";
import {
  addRouteMemberToRoute,
  deleteRouteMemberFromRoute,
  getRouteMemberCandidates,
  getRouteMembersByRoute,
  type RouteMemberCreateRequest,
} from "../api/routeMemberApi";

import type {
  RouteMemberResponse,
} from "../types/routeMember";

import type { CrewMemberOptionResponse } from "../api/crewMemberApi";

import {
  getAvailableTransportOrdersForCrew,
} from "../api/transportOrdersApi";

import type { TransportOrderResponse } from "../types/transportOrder";
import { RouteOrdersSection } from "../components/routes/RouteOrdersSection";
import {
  RouteCrewSection,
  initialAddRouteMemberForm,
  isAnonymousMedicalSource,
  type AddRouteMemberFormState
} from "../components/routes/RouteCrewSection";

import { RouteFinishModal } from "../components/routes/RouteFinishModal";
import { RouteOrderCancelModal } from "../components/routes/RouteOrderCancelModal";
import { RouteHistorySection } from "../components/routes/RouteHistorySection";

type FinishRouteModalState = {
  routeId: number;
  finishOdometerLastThree: string;
}

type CancelRouteOrderModalState = {
  routeId: number,
  transportOrder: RouteTransportOrderReference;
};

type MyRoutesLocationState = {
  warningMessage?: string
};



export function MyRoutesPage() {
  const location = useLocation();

  const [routes, setRoutes] = useState<RouteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingRouteId, setStartingRouteId] = useState<number | null>(null);
  const [finishingRouteId, setFinishingRouteId] = useState<number | null>(null);
  const [waitingRouteId, setWaitingRouteId] = useState<number | null>(null);
  const [resumingRouteId, setResumingRouteId] = useState<number | null>(null);
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
  const [expandedOrderRouteId, setExpandedOrderRouteId] = useState<number | null>(null);
  const [expandedCrewRouteId, setExpandedCrewRouteId] = useState<number | null>(null);

  const [finishModal, setFinishModal] = useState<FinishRouteModalState | null>(null);

  const [availableTransportOrders, setAvailableTransportOrders] = useState<TransportOrderResponse[]>([]);
  const [selectedTransportOrderIdByRouteId, setSelectedTransportOrderIdByRouteId] = useState<Record<number, string>>({});
  const [addingTransportOrderRouteId, setAddingTransportOrderRouteId] = useState<number | null>(null);
  const [reorderingRouteId, setReorderingRouteId] = useState<number | null>(null);
  const [resolvingTransportOrderId, setResolvingTransportOrderId] = useState<number | null>(null);

  const [cancelRouteOrderModal, setCancelRouteOrderModal] = useState<CancelRouteOrderModalState | null>(null);
  const [cancelReason, setCancelReason] = useState("CANCELLED_BY_WARD");
  const [cancelDescription, setCancelDescription] = useState("");
  const [cancellingTransportOrderId, setCancellingTransportOrderId] = useState<number | null>(null);

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

        const [routesData, availableOrders] = await Promise.all([
          getMyRoutes(),
          getAvailableTransportOrdersForCrew(),
        ]);

        setRoutes(routesData);
        setAvailableTransportOrders(availableOrders);

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
    } else if (isAnonymousMedicalSource(form.memberSource)) {
      if (
        form.memberRole !== "DOCTOR" &&
        form.memberRole !== "NURSE"
      ) {
        setErrorMessage("Wybierz lekarza albo pielęgniarkę");
        return;
      }

      request = {
        memberRole: form.memberRole,
        memberSource: form.memberSource,
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

  async function handleAddTransportOrderToRoute(routeId: number) {
    const selectedOrderId = Number(selectedTransportOrderIdByRouteId[routeId]);

    if (!selectedOrderId) {
      setErrorMessage("Wybierz zlecenie do dodania.");
      return;
    }

    try {
      setAddingTransportOrderRouteId(routeId);
      setErrorMessage(null);
      setSuccessMessage(null);

      const updatedRoute = await addTransportOrderToRoute(routeId, selectedOrderId);

      setRoutes((currentRoutes) =>
        currentRoutes.map((route) =>
          route.id === routeId ? updatedRoute : route
        )
      );

      setAvailableTransportOrders((currentOrders) =>
        currentOrders.filter((order) => order.id !== selectedOrderId)
      );

      setSelectedTransportOrderIdByRouteId((currentValues) => ({
        ...currentValues,
        [routeId]: "",
      }));

      setSuccessMessage("Zlecenie zostało dodane do trasy.");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(`Nie udało się dodać zlecenia: ${error.response?.status ?? "brak odpowiedzi"
          }`
        );
        return;
      }
      setErrorMessage("Nieznany błąd dodawania zlecenia.");
    } finally {
      setAddingTransportOrderRouteId(null);
    }
  }

  async function handleTransportOrderDragEnd(
    route: RouteResponse,
    event: DragEndEvent
  ) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeOrder = route.transportOrders.find(
      (order) => order.id === active.id
    );


    const targetOrder = route.transportOrders.find(
      (order) => order.id === over.id
    );

    if (
      activeOrder?.routeOrderStatus !== "PENDING" ||
      targetOrder?.routeOrderStatus !== "PENDING"
    ) {
      return;
    }

    const activeIndex = route.transportOrders.findIndex(
      (order) => order.id === active.id
    );

    const targetIndex = route.transportOrders.findIndex(
      (order) => order.id === over.id
    );

    const reorderedOrders = [...route.transportOrders];
    const [movedOrder] = reorderedOrders.splice(activeIndex, 1);

    reorderedOrders.splice(targetIndex, 0, movedOrder)

    try {
      setReorderingRouteId(route.id);
      setErrorMessage(null);
      setSuccessMessage(null);

      const updatedRoute = await reorderTransportOrders(route.id, {
        transportOrderIds: reorderedOrders.map((order) => order.id),
      });

      setRoutes((currentRoutes) =>
        currentRoutes.map((currentRoute) =>
          currentRoute.id === route.id ? updatedRoute : currentRoute
        )
      );

      setSuccessMessage("Kolejność zleceń została zmieniona.")
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          `Nie udało się zmienić kolejności: ${error.response?.status ?? "brak odpowiedzi"}`
        );
        return
      }
      setErrorMessage("Nieznany błąd zmiany kolejności.");
    } finally {
      setReorderingRouteId(null);
    }
  }
  async function handleResolveTransportOrder(
    routeId: number,
    transportOrder: RouteTransportOrderReference,
    action: RouteOrderFinishAction
  ) {
    const confirmationMessage =
      action === "COMPLETE"
        ? `Potwierdzasz odwiezienie pacjenta ze zlecenia ${transportOrder.orderNumber}?`
        : `Potwierdzasz, że pacjent ze zlecenia ${transportOrder.orderNumber} został odwieziony i oczekuje na odbiór?`;

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    try {
      setResolvingTransportOrderId(transportOrder.id)
      setErrorMessage(null);
      setSuccessMessage(null);

      const updatedRoute = await resolveTransportOrder(
        routeId,
        transportOrder.id,
        action
      );

      setRoutes((currentRoutes) =>
        currentRoutes.map((route) =>
          route.id === routeId ? updatedRoute : route
        )
      );

      setSuccessMessage(
        action === "COMPLETE"
          ? `Zlecenie ${transportOrder.orderNumber} zostało zakończone.`
          : `Pacjent ze zlecenia ${transportOrder.orderNumber} oczekuje na odbiór.`
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          `Nie udało się rozliczyć zlecenia: ${error.response?.status ?? "brak odpowiedzi"
          }`
        );
        return;
      }
      setErrorMessage("Nieznany błąd rozliczania zlecenia.");
    } finally {
      setResolvingTransportOrderId(null);
    }
  }

  function openCancelRouteOrderModal(
    routeId: number,
    transportOrder: RouteTransportOrderReference
  ) {
    setCancelRouteOrderModal({ routeId, transportOrder });
    setCancelReason("CANCELLED_BY_WARD");
    setCancelDescription("");
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function closeCancelRouteOrderModal() {
    if (cancellingTransportOrderId !== null) {
      return;
    }

    setCancelRouteOrderModal(null);
    setCancelReason("CANCELLED_BY_WARD");
    setCancelDescription("");
  }

  async function handleCancelTransportOrderInRoute() {
    if (!cancelRouteOrderModal) {
      return;
    }

    const { routeId, transportOrder } = cancelRouteOrderModal;

    try {
      setCancellingTransportOrderId(transportOrder.id);
      setErrorMessage(null);
      setSuccessMessage(null);

      const updatedRoute = await cancelTransportOrderInRoute(
        routeId,
        transportOrder.id,
        {
          cancelReason,
          cancelDescription:
            cancelDescription.trim().length > 0
              ? cancelDescription.trim()
              : null,
        }
      );

      setRoutes((currentRoutes) =>
        currentRoutes.map((route) =>
          route.id === routeId ? updatedRoute : route
        )
      );

      setCancelRouteOrderModal(null);
      setCancelReason("CANCELLED_BY_WARD");
      setCancelDescription("");

      setSuccessMessage(
        `Zlecenie ${transportOrder.orderNumber} zostało anulowane.`
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          `Nie udało się anulować zlecenia: ${error.response?.status ?? "brak odpowiedzi"}`
        );
        return
      }
      setErrorMessage("Nieznany błąd anulowania zlecenia.");
    } finally {
      setCancellingTransportOrderId(null);
    }
  }

  function openFinishRouteModal(route: RouteResponse) {
    setFinishModal({
      routeId: route.id,
      finishOdometerLastThree: "",
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
        notes: null
      })

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
          {activeRoutes.map((route) => {

            const completedTransportOrders = route.transportOrders.filter(
              (order) => order.routeOrderStatus === "COMPLETED"
            );

            const currentStartAddress =
              completedTransportOrders.at(-1)?.destinationAddress ?? route.startAddress;

            const nextTransportOrder = route.transportOrders.find(
              (order) => order.routeOrderStatus === "PENDING"
            );

            const canFinishRoute = route.transportOrders.length > 0 &&
              route.transportOrders.every(
                (order) => order.routeOrderStatus !== "PENDING"
              );

            const routeMembers = routeMembersByRouteId[route.id] ?? [];
            const isOrdersExpanded = expandedOrderRouteId === route.id;
            const isCrewExpanded = expandedCrewRouteId === route.id;

            return (
              <article className={`my-route-card my-route-card--${route.status.toLowerCase()}`} key={route.id}>
                <header className="my-route-card__header">
                  <div className="my-route-card__title-group">
                    <span className="my-route-card__eyebrow">Aktywna trasa</span>
                    <h2 className="my-route-card__title"><Route size={22} aria-hidden="true" /> Trasa #{route.id}</h2>
                    <p className="my-route-card__subtitle">
                      {route.transportOrders.length} {route.transportOrders.length === 1 ? "zlecenie" : "zlecenia"} w kolejce
                    </p>
                  </div>

                  <span className={`my-route-card__status my-route-card__status--${route.status.toLowerCase()}`}>
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
                        onClick={() => handleResolveTransportOrder(
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
                        onClick={() => handleResolveTransportOrder(
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

                <RouteOrdersSection
                  route={route}
                  isExpanded={isOrdersExpanded}
                  availableTransportOrders={availableTransportOrders}
                  selectedTransportOrderId={selectedTransportOrderIdByRouteId[route.id] ?? ""}
                  isAddingTransportOrder={addingTransportOrderRouteId === route.id}
                  isReordering={reorderingRouteId === route.id}
                  cancellingTransportOrderId={cancellingTransportOrderId}
                  onToggle={() => setExpandedOrderRouteId((previousRouteId) =>
                    previousRouteId === route.id ? null : route.id
                  )
                  }
                  onSelectedTransportOrderChange={(orderId) =>
                    setSelectedTransportOrderIdByRouteId((currentValues) => ({
                      ...currentValues,
                      [route.id]: orderId,
                    }))
                  }
                  onAddTransportOrder={() => handleAddTransportOrderToRoute(route.id)}
                  onReorder={(event) => handleTransportOrderDragEnd(route, event)}
                  onCancelTransportOrder={(order) =>
                    openCancelRouteOrderModal(route.id, order)
                  }
                />

                <RouteCrewSection
                  route={route}
                  routeMembers={routeMembers}
                  candidates={routeMemberCandidatesByRouteId[route.id] ?? []}
                  form={getAddMemberForm(route.id)}
                  isExpanded={isCrewExpanded}
                  isAddFormExpanded={expandedAddMemberRouteId === route.id}
                  isAdding={addingMemberRouteId === route.id}
                  onToggle={() =>
                    setExpandedCrewRouteId((previousRouteId) =>
                      previousRouteId === route.id ? null : route.id
                    )
                  }
                  onToggleAddForm={() => toggleAddMemberForm(route.id)}
                  onFormChange={(partialForm) =>
                    updateAddMemberForm(route.id, partialForm)
                  }
                  onAddMember={() => handleAddRouteMember(route.id)}
                  onDeleteMember={(memberId) =>
                    handleDeleteRouteMember(route.id, memberId)
                  }
                />

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
                        {waitingRouteId === route.id ? "Zapisywanie..." : "Konsultacja"}
                      </button>

                      {canFinishRoute && (
                        <button
                          className="my-route-card__secondary-button"
                          type="button"
                          disabled={finishingRouteId === route.id}
                          onClick={() => openFinishRouteModal(route)}
                        >
                          {finishingRouteId === route.id ? "Kończenie..." : "Zakończ trasę"}
                        </button>
                      )}
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
            );
          })}
        </section>
      )}

      <RouteHistorySection routes={routes} />

      {finishModal && (
        <RouteFinishModal
          routeId={finishModal.routeId}
          finishOdometerLastThree={finishModal.finishOdometerLastThree}
          isSubmitting={finishingRouteId === finishModal.routeId}
          onOdometerChange={(value) =>
            setFinishModal((previous) =>
              previous
                ? {
                  ...previous,
                  finishOdometerLastThree: value,
                }
                : previous
            )
          }
          onCancel={() => setFinishModal(null)}
          onConfirm={handleConfirmFinishRoute}
        />
      )}

      {cancelRouteOrderModal && (
        <RouteOrderCancelModal
          transportOrder={cancelRouteOrderModal.transportOrder}
          cancelReason={cancelReason}
          cancelDescription={cancelDescription}
          isSubmitting={cancellingTransportOrderId !== null}
          onCancelReasonChange={setCancelReason}
          onCancelDescriptionChange={setCancelDescription}
          onBack={closeCancelRouteOrderModal}
          onConfirm={handleCancelTransportOrderInRoute}
        />
      )}
    </main>
  );
}