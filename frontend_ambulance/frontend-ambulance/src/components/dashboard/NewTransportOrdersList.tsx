import { Fragment, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import {
  isNewOrderSoundEnabled,
  playNewOrderSound,
  startCriticalOrderAlarm,
  stopCriticalOrderAlarm,
} from "../../utils/newOrderSound";
import "./TransportWorkPlan.css";

function hasText(value: string | null | undefined): value is string {
  return value !== null && value !== undefined && value.trim().length > 0;
}

type ApiErrorResponse = {
  code?: string;
  message?: string;
};

type TransportOrdersByDate = {
  plannedDate: string | null;
  orders: TransportOrderResponse[];
};

function getApiErrorCode(error: unknown): string | null {
  if (!axios.isAxiosError(error)) {
    return null;
  }

  return (error.response?.data as ApiErrorResponse | undefined)?.code ?? null;
}

const NIGHT_ALARM_START_HOUR = 22;
const NIGHT_ALARM_END_HOUR = 6;
const ACKNOWLEDGED_CRITICAL_ORDER_IDS_STORAGE_KEY =
  "ambulance:acknowledged-critical-order-ids";
const NO_PLANNED_DATE_GROUP_KEY = "__NO_PLANNED_DATE__";

function isDateInNightAlarmTime(date: Date): boolean {
  const hour = date.getHours();

  return hour >= NIGHT_ALARM_START_HOUR || hour < NIGHT_ALARM_END_HOUR;
}

function wasOrderCreatedAtNight(order: TransportOrderResponse): boolean {
  if (!hasText(order.createdAt)) {
    return false;
  }

  const createdAtDate = new Date(order.createdAt);

  if (Number.isNaN(createdAtDate.getTime())) {
    return false;
  }

  return isDateInNightAlarmTime(createdAtDate);
}

function shouldUseCriticalAlarm(order: TransportOrderResponse): boolean {
  return (
    order.status === "NEW" &&
    (order.priority === "URGENT" || wasOrderCreatedAtNight(order))
  );
}

function formatCriticalOrderName(order: TransportOrderResponse): string {
  return order.orderNumber ?? `Zlecenie #${order.id}`;
}

function getCriticalAlarmMessage(order: TransportOrderResponse): string {
  const urgent = order.priority === "URGENT";
  const night = wasOrderCreatedAtNight(order);

  if (urgent && night) {
    return "Zlecenie pilne zostało utworzone w godzinach nocnych 22:00–06:00. Alarm działa do ręcznego potwierdzenia.";
  }

  if (urgent) {
    return "Zlecenie ma priorytet pilny. Alarm działa do ręcznego potwierdzenia.";
  }

  return "Nowe zlecenie zostało utworzone w godzinach nocnych 22:00–06:00. Alarm działa do ręcznego potwierdzenia.";
}

function formatLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayIsoDate(): string {
  return formatLocalIsoDate(new Date());
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function formatPlanDate(plannedDate: string | null | undefined): string {
  if (!hasText(plannedDate)) {
    return "Bez daty";
  }

  const [year, month, day] = plannedDate.split("-");

  if (!year || !month || !day) {
    return plannedDate;
  }

  return `${day}.${month}.${year}`;
}

function getDateGroupTitle(plannedDate: string | null): string {
  if (!hasText(plannedDate)) {
    return "Zlecenia bieżące i dodatkowe";
  }

  const today = new Date();
  const todayIsoDate = formatLocalIsoDate(today);
  const tomorrowIsoDate = formatLocalIsoDate(addDays(today, 1));
  const formattedDate = formatPlanDate(plannedDate);

  if (plannedDate === todayIsoDate) {
    return `Plan na dziś — ${formattedDate}`;
  }

  if (plannedDate === tomorrowIsoDate) {
    return `Plan na jutro — ${formattedDate}`;
  }

  return `Plan na ${formattedDate}`;
}

function getEffectivePlannedDate(order: TransportOrderResponse): string | null {
  if (order.status === "WAITING_FOR_PICKUP") {
    return getTodayIsoDate();
  }

  return order.plannedDate;
}

function getExactPlannedDepartureTime(
  order: TransportOrderResponse
): string | null {
  const plannedDepartureTime = order.plannedDepartureTime;

  if (!hasText(plannedDepartureTime)) {
    return null;
  }

  if (plannedDepartureTime === "00:00" || plannedDepartureTime === "00:00:00") {
    return null;
  }

  return plannedDepartureTime.slice(0, 5);
}

function hasExactPlannedDepartureTime(order: TransportOrderResponse): boolean {
  return getExactPlannedDepartureTime(order) !== null;
}

function getPlannedDepartureTimeLabel(order: TransportOrderResponse): string {
  const exactPlannedDepartureTime = getExactPlannedDepartureTime(order);

  if (exactPlannedDepartureTime !== null) {
    return exactPlannedDepartureTime;
  }

  if (order.status === "WAITING_FOR_PICKUP") {
    return "Do odbioru";
  }

  return "W ciągu dnia";
}

function getOrderAdditionalInfo(order: TransportOrderResponse): string {
  if (hasText(order.description)) {
    return order.description;
  }

  return "—";
}

function getSortTime(order: TransportOrderResponse): string {
  if (order.status === "WAITING_FOR_PICKUP") {
    return "00:00";
  }

  return getExactPlannedDepartureTime(order) ?? "99:99";
}

function compareTransportOrdersByPlan(
  firstOrder: TransportOrderResponse,
  secondOrder: TransportOrderResponse
): number {
  const firstDate = getEffectivePlannedDate(firstOrder) ?? "9999-12-31";
  const secondDate = getEffectivePlannedDate(secondOrder) ?? "9999-12-31";

  if (firstDate !== secondDate) {
    return firstDate.localeCompare(secondDate);
  }

  const firstTime = getSortTime(firstOrder);
  const secondTime = getSortTime(secondOrder);

  if (firstTime !== secondTime) {
    return firstTime.localeCompare(secondTime);
  }

  if (firstOrder.priority !== secondOrder.priority) {
    if (firstOrder.priority === "URGENT") {
      return -1;
    }

    if (secondOrder.priority === "URGENT") {
      return 1;
    }
  }

  return (firstOrder.createdAt ?? "").localeCompare(secondOrder.createdAt ?? "");
}

function groupOrdersByPlannedDate(
  orders: TransportOrderResponse[]
): TransportOrdersByDate[] {
  const sortedOrders = [...orders].sort(compareTransportOrdersByPlan);
  const groups = new Map<string, TransportOrdersByDate>();

  sortedOrders.forEach((order) => {
    const effectivePlannedDate = getEffectivePlannedDate(order);
    const groupKey = effectivePlannedDate ?? NO_PLANNED_DATE_GROUP_KEY;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        plannedDate:
          groupKey === NO_PLANNED_DATE_GROUP_KEY ? null : effectivePlannedDate,
        orders: [],
      });
    }

    groups.get(groupKey)?.orders.push(order);
  });

  return [...groups.values()];
}

function readAcknowledgedCriticalOrderIds(): Set<number> {
  try {
    const rawValue = window.localStorage.getItem(
      ACKNOWLEDGED_CRITICAL_ORDER_IDS_STORAGE_KEY
    );

    if (!rawValue) {
      return new Set();
    }

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return new Set();
    }

    return new Set(
      parsedValue.filter(
        (value): value is number =>
          typeof value === "number" && Number.isInteger(value)
      )
    );
  } catch {
    return new Set();
  }
}

function saveAcknowledgedCriticalOrderIds(orderIds: Set<number>) {
  try {
    window.localStorage.setItem(
      ACKNOWLEDGED_CRITICAL_ORDER_IDS_STORAGE_KEY,
      JSON.stringify([...orderIds])
    );
  } catch {
    // Brak dostępu do localStorage nie powinien rozwalać dashboardu.
  }
}

export function NewTransportOrdersList() {
  const navigate = useNavigate();
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
  const acknowledgedCriticalOrderIdsRef = useRef<Set<number>>(
    readAcknowledgedCriticalOrderIds()
  );

  function syncCriticalAlarm(nextOrders: TransportOrderResponse[]) {
    const currentOrderIds = new Set(nextOrders.map((order) => order.id));
    let acknowledgedIdsChanged = false;

    acknowledgedCriticalOrderIdsRef.current.forEach((orderId) => {
      if (!currentOrderIds.has(orderId)) {
        acknowledgedCriticalOrderIdsRef.current.delete(orderId);
        acknowledgedIdsChanged = true;
      }
    });

    if (acknowledgedIdsChanged) {
      saveAcknowledgedCriticalOrderIds(acknowledgedCriticalOrderIdsRef.current);
    }

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

  function handleConfirmCriticalAlarm(order: TransportOrderResponse) {
    acknowledgedCriticalOrderIdsRef.current.add(order.id);
    saveAcknowledgedCriticalOrderIds(acknowledgedCriticalOrderIdsRef.current);
    syncCriticalAlarm(orders);
    setSuccessMessage(
      `Alarm dla ${formatCriticalOrderName(order)} został potwierdzony.`
    );
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
      navigate("/routes/me");
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

  function renderTransportPlanSection(
    sectionOrders: TransportOrderResponse[],
    emptyMessage: string
  ) {
    const ordersByDate = groupOrdersByPlannedDate(sectionOrders);

    return (
      <section className="orders-subsection">
        {sectionOrders.length === 0 ? (
          <p className="orders-list__message">{emptyMessage}</p>
        ) : (
          <div className="transport-work-plan">
            {ordersByDate.map((dateGroup) => (
              <article
                className="transport-plan-date-group"
                key={dateGroup.plannedDate ?? NO_PLANNED_DATE_GROUP_KEY}
              >
                <header className="transport-plan-date-group__header">
                  <div>
                    <h3 className="transport-plan-date-group__title">
                      {getDateGroupTitle(dateGroup.plannedDate)}
                    </h3>
                    <p className="transport-plan-date-group__subtitle">
                      Harmonogram przewozów.
                    </p>
                  </div>

                  <strong className="transport-plan-date-group__count">
                    {dateGroup.orders.length}
                  </strong>
                </header>

                <div className="transport-plan-table-wrapper">
                  <table className="transport-plan-table">
                    <thead>
                      <tr>
                        <th>Godzina</th>
                        <th>Zlecenie</th>
                        <th>Oddział / miejsce odbioru</th>
                        <th>Miejsce docelowe</th>
                        <th>Pacjent / uwagi</th>
                        <th>Status</th>
                        <th>Akcje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dateGroup.orders.map((order) => {
                        const hasCriticalAlarm = shouldUseCriticalAlarm(order);
                        const isCriticalAlarmAcknowledged =
                          hasCriticalAlarm && !criticalAlarmOrderIds.has(order.id);
                        const shouldShowCriticalAlarm = criticalAlarmOrderIds.has(
                          order.id
                        );
                        const rowClassName = [
                          "transport-plan__row",
                          order.priority === "URGENT"
                            ? "transport-plan__row--urgent"
                            : "",
                          order.status === "WAITING_FOR_PICKUP"
                            ? "transport-plan__row--waiting"
                            : "",
                          hasCriticalAlarm && isCriticalAlarmAcknowledged
                            ? "transport-plan__row--critical-confirmed"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ");

                        return (
                          <Fragment key={order.id}>
                            <tr className={rowClassName}>
                              <td className="transport-plan__time-cell">
                                <strong>{getPlannedDepartureTimeLabel(order)}</strong>
                                {!hasExactPlannedDepartureTime(order) && (
                                  <span>bez konkretnej godziny</span>
                                )}
                              </td>
                              <td>
                                <strong className="transport-plan__order-title">
                                  {order.orderNumber ?? `Zlecenie #${order.id}`}
                                </strong>
                                <span className="transport-plan__order-meta">
                                  {getTransportOrderTypeLabel(order.orderType)} •{" "}
                                  {getTransportSourceLabel(order.source)}
                                </span>
                                <span className="transport-plan__priority-label">
                                  {getTransportPriorityLabel(order.priority)}
                                </span>
                              </td>
                              <td>{order.pickupAddress ?? "—"}</td>
                              <td>{order.destinationAddress ?? "—"}</td>
                              <td>{getOrderAdditionalInfo(order)}</td>
                              <td>
                                <span className="transport-plan__status-label">
                                  {getTransportStatusLabel(order.status)}
                                </span>
                              </td>
                              <td>
                                <div className="transport-plan__actions">
                                  <Link
                                    className="transport-plan__details-link"
                                    to={`/transport-orders/${order.id}/preview`}
                                  >
                                    Podgląd
                                  </Link>

                                  {canAcceptOrders && (
                                    <button
                                      className="transport-plan__accept-button"
                                      type="button"
                                      disabled={acceptingOrderId === order.id}
                                      onClick={() => handleAcceptOrder(order.id)}
                                    >
                                      {acceptingOrderId === order.id
                                        ? "Przyjmowanie..."
                                        : order.status === "WAITING_FOR_PICKUP"
                                          ? "Odbierz"
                                          : "Przyjmij"}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {shouldShowCriticalAlarm && (
                              <tr className="transport-plan__critical-row">
                                <td colSpan={7}>
                                  <section
                                    className="orders-list__critical-alarm"
                                    role="alert"
                                  >
                                    <div>
                                      <strong>Alarm zlecenia</strong>
                                      <p>{getCriticalAlarmMessage(order)}</p>
                                    </div>

                                    <button
                                      className="orders-list__critical-confirm-button"
                                      type="button"
                                      onClick={() =>
                                        handleConfirmCriticalAlarm(order)
                                      }
                                    >
                                      Potwierdzam alarm
                                    </button>
                                  </section>
                                </td>
                              </tr>
                            )}

                            {hasCriticalAlarm && isCriticalAlarmAcknowledged && (
                              <tr className="transport-plan__confirmed-row">
                                <td colSpan={7}>
                                  <p className="orders-list__feedback">
                                    <strong>Alarm:</strong> potwierdzony
                                  </p>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    );
  }

  if (loading) {
    return <p className="orders-list__message">Ładowanie planu pracy...</p>;
  }

  if (errorMessage) {
    return <p className="orders-list__message">{errorMessage}</p>;
  }

  const canAcceptOrders = loggedUserRole === "DRIVER";
  const criticalAlarmOrderIds = new Set(
    criticalAlarmOrders.map((order) => order.id)
  );

  const workPlanOrders = orders.filter(
    (order) => order.status === "NEW" || order.status === "WAITING_FOR_PICKUP"
  );

  return (
    <div className="orders-dashboard-list">
      {successMessage && (
        <p className="orders-list__feedback">{successMessage}</p>
      )}

      {renderTransportPlanSection(
        workPlanOrders,
        "Brak zaplanowanych zleceń."
      )}
    </div>
  );
}
