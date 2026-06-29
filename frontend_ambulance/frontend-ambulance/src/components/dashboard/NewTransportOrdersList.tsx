import { useEffect, useState } from "react";
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

function hasText(value: string | null | undefined): value is string {
  return value !== null && value !== undefined && value.trim().length > 0;
}

export function NewTransportOrdersList() {
  const [orders, setOrders] = useState<TransportOrderResponse[]>([]);
  const [shiftId, setShiftId] = useState<number | null>(null);
  const [loggedUserRole, setLoggedUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [acceptingOrderId, setAcceptingOrderId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setErrorMessage(null);

        const [ordersData, dashboardData] = await Promise.all([
          getAvailableTransportOrdersForCrew(),
          getMyDashboard(),
        ]);

        setOrders(ordersData);
        setShiftId(dashboardData.shiftId);
        setLoggedUserRole(dashboardData.loggedUserRole);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          setErrorMessage(
            `Błąd pobierania nowych zleceń: ${error.response?.status ?? "brak odpowiedzi"
            }`
          );
          return;
        }

        setErrorMessage("Nieznany błąd pobierania nowych zleceń.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
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

      setOrders((currentOrders) =>
        currentOrders.filter((order) => order.id !== orderId)
      );

      setSuccessMessage("Zlecenie zostało przyjęte.");
    } catch (error) {
      if (axios.isAxiosError(error)) {
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

        setErrorMessage(
          `Błąd przyjmowania zlecenia: ${error.response?.status ?? "brak odpowiedzi"
          }`
        );
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

  if (orders.length === 0) {
    return <p className="orders-list__message">Brak nowych zleceń.</p>;
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
              <article className="order-card" key={order.id}>
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
                    <strong>Status:</strong> {getTransportStatusLabel(order.status)}
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
                      <strong>Utworzone przez:</strong> {order.createdByFullName} —{" "}
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