import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { getMyDashboard } from "../../api/dashboardApi";
import { createRouteFromOrder } from "../../api/routesApi";
import { getAvailableTransportOrdersForCrew } from "../../api/transportOrdersApi";
import type { TransportOrderResponse } from "../../types/transportOrder";
import {
  getTransportOrderTypeLabel,
  getTransportPriorityLabel,
  getTransportSourceLabel,
  getTransportStatusLabel,
} from "../../utils/transportOrderLabels";
import { getUserRoleLabel } from "../../utils/userRoleLabels";
import {
  isNewOrderSoundEnabled,
  playNewOrderSound,
  startCriticalOrderAlarm,
  stopCriticalOrderAlarm,
} from "../../utils/newOrderSound";

function hasText(value: string | null | undefined): value is string {
  return value !== null && value !== undefined && value.trim().length > 0;
}

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

const NIGHT_ALARM_START_HOUR = 22;
const NIGHT_ALARM_END_HOUR = 6;

function isNightAlarmTime(date = new Date()): boolean {
  const hour = date.getHours();

  return hour >= NIGHT_ALARM_START_HOUR || hour < NIGHT_ALARM_END_HOUR;
}

function shouldUseCriticalAlarm(order: TransportOrderResponse): boolean {
  return order.priority === "URGENT" || isNightAlarmTime();
}

function formatCriticalOrderName(order: TransportOrderResponse): string {
  return order.orderNumber ?? `Zlecenie #${order.id}`;
}

export function NewTransportOrdersList() {
  const [orders, setOrders] = useState<TransportOrderResponse[]>([]);
  const [shiftId, setShiftId] = useState<number | null>(null);
  const [loggedUserRole, setLoggedUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [acceptingOrderId, setAcceptingOrderId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [criticalAlarmOrders, setCriticalAlarmOrders] = useState<
    TransportOrderResponse[]
  >([]);

  const knownOrderIdsRef = useRef<Set<number> | null>(null);
  const acknowledgedCriticalOrderIdsRef = useRef<Set<number>>(new Set());

  function syncCriticalAlarm(nextOrders: TransportOrderResponse[]) {
    const currentOrderIds = new Set(nextOrders.map((order) => order.id));

    acknowledgedCriticalOrderIdsRef.current.forEach((orderId) => {
      if (!currentOrderIds.has(orderId)) {
        acknowledgedCriticalOrderIdsRef.current.delete(orderId);
      }
    });

    const unacknowledgedCriticalOrders = nextOrders.filter(
      (order) =>
        shouldUseCriticalAlarm(order) &&
        !acknowledgedCriticalOrderIdsRef.current.has(order.id)
    );

    setCriticalAlarmOrders(unacknowledgedCriticalOrders);

    if (
      unacknowledgedCriticalOrders.length > 0 &&
      isNewOrderSoundEnabled()
    ) {
      startCriticalOrderAlarm();
      return;
    }

    stopCriticalOrderAlarm();
  }

  function handleConfirmCriticalAlarm() {
    criticalAlarmOrders.forEach((order) => {
      acknowledgedCriticalOrderIdsRef.current.add(order.id);
    });

    stopCriticalOrderAlarm();
    setCriticalAlarmOrders([]);
    setSuccessMessage("Alarm pilnych zleceń został potwierdzony.");
  }

  useEffect(() => {
    async function loadData(showLoader = false) {
      try {
        if (showLoader) {
          setLoading(true);
        }

        setErrorMessage(null);

        const [ordersData, dashboardData] = await Promise.all([
          getAvailableTransportOrdersForCrew(),
          getMyDashboard(),
        ]);

        const previousOrderIds = knownOrderIdsRef.current;

        const newIncomingOrders =
          previousOrderIds === null
            ? []
            : ordersData.filter((order) => !previousOrderIds.has(order.id));

        const hasNewCriticalOrder = newIncomingOrders.some((order) =>
          shouldUseCriticalAlarm(order)
        );

        const hasAnyUnacknowledgedCriticalOrder = ordersData.some(
          (order) =>
            shouldUseCriticalAlarm(order) &&
            !acknowledgedCriticalOrderIdsRef.current.has(order.id)
        );

        knownOrderIdsRef.current = new Set(
          ordersData.map((order) => order.id)
        );

        setOrders(ordersData);
        setShiftId(dashboardData.shiftId);
        setLoggedUserRole(dashboardData.loggedUserRole);

        syncCriticalAlarm(ordersData);

        if (
          newIncomingOrders.length > 0 &&
          !hasNewCriticalOrder &&
          !hasAnyUnacknowledgedCriticalOrder
        ) {
          playNewOrderSound();
        }
      } catch (error) {
        stopCriticalOrderAlarm();
        setCriticalAlarmOrders([]);

        if (axios.isAxiosError(error)) {
          const errorCode = getApiErrorCode(error);

          if (errorCode === "SHIFT_NOT_ACTIVE") {
            setErrorMessage(
              "Najpierw utwórz aktywną zmianę, żeby obsługiwać zlecenia."
            );
            return;
          }

          if (error.response?.status === 401) {
            setErrorMessage("Sesja wygasła. Zaloguj się ponownie.");
            return;
          }

          if (error.response?.status === 403) {
            setErrorMessage("Brak uprawnień do pobrania zleceń.");
            return;
          }

          setErrorMessage("Nie udało się pobrać zleceń.");
          return;
        }

        setErrorMessage("Nieznany błąd pobierania nowych zleceń.");
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    }

    loadData(true);

    const intervalId = window.setInterval(() => {
      loadData(false);
    }, 30_000);

    return () => {
      window.clearInterval(intervalId);
      stopCriticalOrderAlarm();
    };
  }, []);

  async function handleAcceptOrder(orderId: number) {
    if (shiftId === null) {
      setErrorMessage("Nie znaleziono aktywnej zmiany.");
      return;
    }

    try {
      setAcceptingOrderId(orderId);
      setErrorMessage(null);
      setSuccessMessage(null);

      await createRouteFromOrder(orderId, {
        shiftId,
        notes: null,
      });

      const updatedOrders = orders.filter((order) => order.id !== orderId);

      setOrders(updatedOrders);
      syncCriticalAlarm(updatedOrders);

      setSuccessMessage("Zlecenie zostało przyjęte.");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorCode = getApiErrorCode(error);

        if (errorCode === "SHIFT_NOT_ACTIVE") {
          setErrorMessage("Najpierw utwórz aktywną zmianę.");
          return;
        }

        if (errorCode === "TRANSPORT_ORDER_ALREADY_ASSIGNED_TO_ACTIVE_ROUTE") {
          setErrorMessage("To zlecenie jest już przypisane do aktywnej trasy.");
          return;
        }

        if (errorCode === "TRANSPORT_ORDER_NOT_AVAILABLE") {
          setErrorMessage("To zlecenie nie jest już dostępne do przyjęcia.");
          return;
        }

        if (error.response?.status === 400) {
          setErrorMessage("Nie można teraz przyjąć tego zlecenia.");
          return;
        }

        if (error.response?.status === 401) {
          setErrorMessage("Sesja wygasła. Zaloguj się ponownie.");
          return;
        }

        if (error.response?.status === 403) {
          setErrorMessage("Brak uprawnień do przyjęcia zlecenia.");
          return;
        }

        if (error.response?.status === 404) {
          setErrorMessage("Nie znaleziono zlecenia albo zmiany.");
          return;
        }

        setErrorMessage("Nie udało się przyjąć zlecenia.");
        return;
      }

      setErrorMessage("Nieznany błąd przyjmowania zlecenia.");
    } finally {
      setAcceptingOrderId(null);
    }
  }

  if (loading) {
    return <p className="orders-list__message">Ładowanie nowych zleceń...</p>;
  }

  if (errorMessage) {
    return <p className="orders-list__message">{errorMessage}</p>;
  }

  const canAcceptOrders = loggedUserRole === "DRIVER";

  const waitingForPickupOrders = orders.filter(
    (order) => order.status === "WAITING_FOR_PICKUP"
  );

  const newOrders = orders.filter((order) => order.status === "NEW");

  function renderOrdersSection(
    title: string,
    subtitle: string,
    sectionOrders: TransportOrderResponse[],
    emptyMessage: string
  ) {
    return (
      <section className="orders-subsection">
        <header className="orders-subsection__header">
          <h2 className="orders-subsection__title">{title}</h2>

          {hasText(subtitle) && (
            <p className="orders-subsection__subtitle">{subtitle}</p>
          )}
        </header>

        {sectionOrders.length === 0 ? (
          <p className="orders-list__message">{emptyMessage}</p>
        ) : (
          <div className="orders-list">
            {sectionOrders.map((order) => (
              <article
                className={`order-card ${
                  order.priority === "URGENT" ? "order-card--urgent" : ""
                }`}
                key={order.id}
              >
                <header className="order-card__header">
                  <div className="order-card__title-group">
                    <h2 className="order-card__title">
                      {order.orderNumber ?? `Zlecenie #${order.id}`}
                    </h2>

                    <p className="order-card__subtitle">
                      {getTransportOrderTypeLabel(order.orderType)} •{" "}
                      {getTransportSourceLabel(order.source)}
                    </p>
                  </div>

                  <span className="order-card__badge">
                    {getTransportPriorityLabel(order.priority)}
                  </span>
                </header>

                <div className="order-card__body">
                  <p className="order-card__row">
                    <strong>Status:</strong>{" "}
                    {getTransportStatusLabel(order.status)}
                  </p>

                  {hasText(order.pickupAddress) && (
                    <p className="order-card__row">
                      <strong>Skąd:</strong> {order.pickupAddress}
                    </p>
                  )}

                  {hasText(order.destinationAddress) && (
                    <p className="order-card__row">
                      <strong>Dokąd:</strong> {order.destinationAddress}
                    </p>
                  )}

                  {hasText(order.description) && (
                    <p className="order-card__row">
                      <strong>Opis:</strong> {order.description}
                    </p>
                  )}

                  {hasText(order.createdByFullName) && (
                    <p className="order-card__row">
                      <strong>Utworzone przez:</strong>{" "}
                      {order.createdByFullName} —{" "}
                      {getUserRoleLabel(order.createdByRole)}
                    </p>
                  )}
                </div>

                <div className="order-card__actions">
                  <Link
                    className="order-card__details-link"
                    to={`/transport-orders/${order.id}/preview`}
                  >
                    Podgląd
                  </Link>

                  {canAcceptOrders && (
                    <button
                      className="order-card__accept-button"
                      type="button"
                      disabled={acceptingOrderId === order.id}
                      onClick={() => handleAcceptOrder(order.id)}
                    >
                      {acceptingOrderId === order.id
                        ? "Przyjmowanie..."
                        : order.status === "WAITING_FOR_PICKUP"
                          ? "Odbierz pacjenta"
                          : "Przyjmij zlecenie"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="orders-dashboard-list">
      {criticalAlarmOrders.length > 0 && (
        <section className="orders-list__critical-alarm">
          <div>
            <strong>Alarm pilnego zlecenia</strong>

            <p>
              Wykryto zlecenie pilne albo nowe zlecenie w godzinach nocnych
              22:00–06:00. Alarm będzie działał do ręcznego potwierdzenia.
            </p>

            <p>
              Zlecenia:{" "}
              {criticalAlarmOrders
                .map((order) => formatCriticalOrderName(order))
                .join(", ")}
            </p>
          </div>

          <button
            className="orders-list__critical-confirm-button"
            type="button"
            onClick={handleConfirmCriticalAlarm}
          >
            Potwierdzam
          </button>
        </section>
      )}

      {successMessage && (
        <p className="orders-list__feedback">{successMessage}</p>
      )}

      <div className="orders-overview">
        <article className="orders-overview-card">
          <span className="orders-overview-card__label">Do odbioru</span>
          <strong className="orders-overview-card__value">
            {waitingForPickupOrders.length}
          </strong>
        </article>

        <article className="orders-overview-card">
          <span className="orders-overview-card__label">Nowe zlecenia</span>
          <strong className="orders-overview-card__value">
            {newOrders.length}
          </strong>
        </article>
      </div>

      {waitingForPickupOrders.length > 0 &&
        renderOrdersSection(
          "Pacjenci do odbioru",
          "Pacjenci oczekujący na kolejny przejazd.",
          waitingForPickupOrders,
          "Brak pacjentów oczekujących na odbiór."
        )}

      {renderOrdersSection(
        "Nowe zlecenia",
        "",
        newOrders,
        "Brak nowych zleceń."
      )}
    </div>
  );
}