import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import type { TransportOrderResponse } from "../../types/transportOrder";
import {
  getTransportOrdersQueue,
  cancelTransportOrder,
  type TransportOrderStatus,
} from "../../api/transportOrdersApi";
import {
  getTransportOrderTypeLabel,
  getTransportPriorityLabel,
  getTransportSourceLabel,
  getTransportStatusLabel,
  getTransportCancelOptions,
} from "../../utils/transportOrderLabels";
import "../dashboard/TransportWorkPlan.css";
import { ManagerAmbulanceDashboard } from "./ManagerAmbulanceDashboard";



function parseOptionalNumber(value: string | null): number | null {
  if (value === null || value.trim().length === 0) {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) ? parsedValue : null;
}


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

const NO_PLANNED_DATE_GROUP_KEY = "__NO_PLANNED_DATE__";

function getApiErrorCode(error: unknown): string | null {
  if (!axios.isAxiosError(error)) {
    return null;
  }

  return (error.response?.data as ApiErrorResponse | undefined)?.code ?? null;
}

function formatLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function parseIsoDateToLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getTodayIsoDate(): string {
  return formatLocalIsoDate(new Date());
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
    return "Zlecenia bez daty";
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

  return "W ciągu dnia";
}

function getOrderAdditionalInfo(order: TransportOrderResponse): string {
  if (hasText(order.description)) {
    return order.description;
  }

  return "—";
}

function getSortTime(order: TransportOrderResponse): string {
  return getExactPlannedDepartureTime(order) ?? "99:99";
}

function compareTransportOrdersByPlan(
  firstOrder: TransportOrderResponse,
  secondOrder: TransportOrderResponse
): number {
  const firstDate = firstOrder.plannedDate ?? "9999-12-31";
  const secondDate = secondOrder.plannedDate ?? "9999-12-31";

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
    const groupKey = order.plannedDate ?? NO_PLANNED_DATE_GROUP_KEY;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        plannedDate:
          groupKey === NO_PLANNED_DATE_GROUP_KEY ? null : order.plannedDate,
        orders: [],
      });
    }

    groups.get(groupKey)?.orders.push(order);
  });

  return [...groups.values()];
}

function isActiveTransportOrder(order: TransportOrderResponse): boolean {
  return (
    order.status === "WAITING_FOR_PICKUP" ||
    order.status === "IN_PROGRESS" ||
    order.status === "NEW"
  );
}

function isOverdueTransportOrder(
  order: TransportOrderResponse,
  todayIsoDate: string
): boolean {
  if (!hasText(order.plannedDate)) {
    return false;
  }
  return order.plannedDate < todayIsoDate && isActiveTransportOrder(order);
}

type ManagerOrdersViewMode = "ACTIVE" | "COMPLETED" | "CANCELLED" | "ALL";

const managerOrdersViewModeLabels: Record<ManagerOrdersViewMode, string> = {
  ACTIVE: "Aktywne",
  COMPLETED: "Zrealizowane",
  CANCELLED: "Anulowane",
  ALL: "Wszystkie",
};

const managerOrdersViewModeStatuses: Record<
  ManagerOrdersViewMode,
  TransportOrderStatus[]
> = {
  ACTIVE: ["NEW", "WAITING_FOR_PICKUP", "IN_PROGRESS"],
  COMPLETED: ["COMPLETED"],
  CANCELLED: ["CANCELLED"],
  ALL: ["NEW", "WAITING_FOR_PICKUP", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
};


export function ManagerTransportOrdersSchedule() {

  const [searchParams, setSearchParams] = useSearchParams();
  const createdOrderId = parseOptionalNumber(searchParams.get("createdOrderId"));
  const dateFromUrl = searchParams.get("date");

  const [orders, setOrders] = useState<TransportOrderResponse[]>([]);
  const [selectedPlannedDate, setSelectedPlannedDate] = useState<string | null>(
    () => dateFromUrl ?? formatLocalIsoDate(new Date())
  );


  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(
    () => createdOrderId !== null
      ? `Zlecenie #${createdOrderId} zostało utworzone i dodane do harmonogramu.`
      : null);


  const [orderToCancel, setOrderToCancel] = useState<TransportOrderResponse | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("CANCELLED_BY_WARD");
  const [cancelDescription, setCancelDescription] = useState("");
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);

  const [viewMode, setViewMode] = useState<ManagerOrdersViewMode>("ACTIVE");

  function updateSelectedPlannedDate(nextDate: string | null) {
    setSelectedPlannedDate(nextDate);
    setSuccess(null);

    const nextParams = new URLSearchParams(searchParams);

    if (nextDate === null) {
      nextParams.delete("date");
    } else {
      nextParams.set("date", nextDate);
    }

    nextParams.delete("createdOrderId");
    setSearchParams(nextParams);
  }

  function openCancelModal(order: TransportOrderResponse) {
    setOrderToCancel(order);
    setCancelReason("CANCELLED_BY_WARD");
    setCancelDescription("");
    setErrorMessage(null);
    setSuccess(null);
  }

  function closeCancelModal() {
    if (cancellingOrderId !== null) {
      return;
    }
    setOrderToCancel(null);
    setCancelReason("CANCELLED_BY_WARD");
    setCancelDescription("");
  }

  function changeSelectedDateByDays(days: number) {
    const baseDate =
      selectedPlannedDate !== null
        ? parseIsoDateToLocalDate(selectedPlannedDate)
        : new Date();

    updateSelectedPlannedDate(formatLocalIsoDate(addDays(baseDate, days)));
  }

  function changeViewMode(nextViewMode: ManagerOrdersViewMode) {
    setViewMode(nextViewMode);
    setSuccess(null);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("createdOrderId");
    setSearchParams(nextParams);
  }

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        setErrorMessage(null);

        const ordersData = await getTransportOrdersQueue(
          managerOrdersViewModeStatuses[viewMode]
        );

        setOrders(ordersData);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const errorCode = getApiErrorCode(error);

          if (error.response?.status === 401) {
            setErrorMessage("Sesja wygasła. Zaloguj się ponownie.");
            return;
          }

          if (error.response?.status === 403) {
            setErrorMessage("Brak uprawnień do harmonogramu kierownika.");
            return;
          }

          if (errorCode) {
            setErrorMessage(`Nie udało się pobrać zleceń. Kod: ${errorCode}`);
            return;
          }

          setErrorMessage("Nie udało się pobrać zleceń.");
          return;
        }

        setErrorMessage("Nieznany błąd pobierania zleceń.");
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [viewMode]);

  if (loading) {
    return <p className="orders-list__message">Ładowanie harmonogramu...</p>;
  }

  if (errorMessage) {
    return <p className="orders-list__message">{errorMessage}</p>;
  }

  const todayIsoDate = getTodayIsoDate();


  const visibleOrders = selectedPlannedDate === null
    ? orders
    : viewMode === "ACTIVE" && selectedPlannedDate === todayIsoDate
      ? orders.filter(
        (order) =>
          order.plannedDate === todayIsoDate
          || isOverdueTransportOrder(order, todayIsoDate)
      )
      : orders.filter((order) => order.plannedDate === selectedPlannedDate);

  const ordersByDate = groupOrdersByPlannedDate(visibleOrders);

  async function handleCancelTransportOrder() {
    if (orderToCancel === null) {
      return;
    }

    try {
      setCancellingOrderId(orderToCancel.id);
      setErrorMessage(null);
      setSuccess(null);

      await cancelTransportOrder(orderToCancel.id, {
        cancelReason,
        cancelDescription:
          cancelDescription.trim().length > 0 ? cancelDescription.trim() : null,
      });

      setOrders((currentOrders) =>
        currentOrders.filter((order) => order.id !== orderToCancel.id)
      );

      setSuccess(`Zlecenie #${orderToCancel.id} zostało anulowane.`);
      setOrderToCancel(null);
      setCancelReason("CANCELLED_BY_WARD");
      setCancelDescription("");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          setErrorMessage("Nieprawidłowe dane anulowania zlecenia.");
          return;
        }

        if (error.response?.status === 403) {
          setErrorMessage("Brak uprawnień do anulowania zlecenia.");
          return;
        }

        if (error.response?.status === 404) {
          setErrorMessage("Nie znaleziono zlecenia.");
          return;
        }
      }

      setErrorMessage("Nie udało się anulować zlecenia.");
    } finally {
      setCancellingOrderId(null);
    }
  }

  return (
    <div className="orders-dashboard-list">
      <section className="orders-subsection">
        <div className="transport-plan-toolbar">
          <div className="transport-plan-filters">
            <button
              className="transport-plan-filters__button"
              type="button"
              onClick={() => changeSelectedDateByDays(-1)}
            >
              ← Poprzedni dzień
            </button>

            <label className="transport-plan-filters__field">
              <span>Data harmonogramu</span>
              <input
                type="date"
                value={selectedPlannedDate ?? ""}
                onChange={(event) =>
                  updateSelectedPlannedDate(
                    event.target.value.length > 0 ? event.target.value : null
                  )
                }
              />
            </label>

            <button
              className="transport-plan-filters__button"
              type="button"
              onClick={() => changeSelectedDateByDays(1)}
            >
              Następny dzień →
            </button>

            <button
              className="transport-plan-filters__button"
              type="button"
              onClick={() => updateSelectedPlannedDate(getTodayIsoDate())}
            >
              Dzisiaj
            </button>

            <button
              className="transport-plan-filters__button transport-plan-filters__button--secondary"
              type="button"
              onClick={() => updateSelectedPlannedDate(null)}
            >
              Pokaż wszystko
            </button>
          </div>

          <div className="manager-orders-view-tabs">
            {(Object.keys(managerOrdersViewModeLabels) as ManagerOrdersViewMode[]).map(
              (mode) => (
                <button
                  key={mode}
                  className={
                    viewMode === mode
                      ? "manager-orders-view-tabs__button manager-orders-view-tabs__button--active"
                      : "manager-orders-view-tabs__button"
                  }
                  type="button"
                  onClick={() => changeViewMode(mode)}
                >
                  {managerOrdersViewModeLabels[mode]}
                </button>
              )
            )}
          </div>
        </div>

          <ManagerAmbulanceDashboard/>

        {success && (
          <p className="orders-list__message orders-list__message--success">
            {success}
          </p>
        )}

        {visibleOrders.length === 0 ? (
          <p className="orders-list__message">Brak zleceń w harmonogramie.</p>
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
                      Harmonogram zleceń transportu.
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
                        <th>Odbiór</th>
                        <th>Cel</th>
                        <th>Uwagi</th>
                        <th>Status</th>
                        <th>Akcje</th>
                      </tr>
                    </thead>

                    <tbody>
                      {dateGroup.orders.map((order) => {
                        const canModifyOrder =
                          order.status !== "COMPLETED" && order.status !== "CANCELLED";

                        const rowClassName = [
                          "transport-plan__row",
                          order.priority === "URGENT"
                            ? "transport-plan__row--urgent"
                            : "",
                          order.status === "WAITING_FOR_PICKUP"
                            ? "transport-plan__row--waiting"
                            : "",
                          order.id === createdOrderId ? "transport-plan__row--highlighted" : "",
                          isOverdueTransportOrder(order, todayIsoDate)
                            ? "transport-plan__row--overdue"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ");

                        return (
                          <tr className={rowClassName} key={order.id}>
                            <td className="transport-plan__time-cell">
                              <strong>{getPlannedDepartureTimeLabel(order)}</strong>
                              {!hasExactPlannedDepartureTime(order) && (
                                <span>bez konkretnej godziny</span>
                              )}

                              {isOverdueTransportOrder(order, todayIsoDate) && (
                                <span>Zaległe</span>
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
                                  to={`/transport-orders/${order.id}/details`}
                                >
                                  Podgląd
                                </Link>

                                {canModifyOrder && (
                                  <Link
                                    className="transport-plan__details-link"
                                    to={`/manager/transport-orders/${order.id}/edit`}
                                  >
                                    Edytuj
                                  </Link>
                                )}

                                {canModifyOrder && (
                                  <button
                                    className="transport-plan__cancel-button"
                                    type="button"
                                    onClick={() => openCancelModal(order)}
                                    disabled={cancellingOrderId === order.id}
                                  >
                                    {cancellingOrderId === order.id ? "Anulowanie..." : "Anuluj"}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
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
      {orderToCancel && (
        <div className="manager-cancel-modal-backdrop">
          <section className="manager-cancel-modal">
            <header className="manager-cancel-modal__header">
              <h2>Anuluj zlecenie</h2>
              <p>
                Zlecenie #{orderToCancel.id} — {orderToCancel.pickupAddress ?? "Brak odbioru"} →{" "}
                {orderToCancel.destinationAddress ?? "Brak celu"}
              </p>
            </header>

            <label className="manager-cancel-modal__field">
              <span>Powód anulowania</span>
              <select
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                disabled={cancellingOrderId !== null}
              >
                {getTransportCancelOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="manager-cancel-modal__field">
              <span>Dodatkowy opis</span>
              <textarea
                value={cancelDescription}
                onChange={(event) => setCancelDescription(event.target.value)}
                placeholder="Opcjonalny komentarz do anulowania"
                rows={3}
                disabled={cancellingOrderId !== null}
              />
            </label>

            <div className="manager-cancel-modal__actions">
              <button
                className="manager-cancel-modal__button manager-cancel-modal__button--secondary"
                type="button"
                onClick={closeCancelModal}
                disabled={cancellingOrderId !== null}
              >
                Wróć
              </button>

              <button
                className="manager-cancel-modal__button manager-cancel-modal__button--danger"
                type="button"
                onClick={handleCancelTransportOrder}
                disabled={cancellingOrderId !== null}
              >
                {cancellingOrderId !== null ? "Anulowanie..." : "Potwierdź anulowanie"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}