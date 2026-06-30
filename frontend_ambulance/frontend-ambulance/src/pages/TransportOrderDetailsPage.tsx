import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { getTransportOrderDetails } from "../api/transportOrdersApi";
import type { TransportOrderDetailsResponse } from "../types/transportOrder";
import { formatDateTime } from "../utils/dateTimeFormat";
import {
  getTransportOrderTypeLabel,
  getTransportPriorityLabel,
  getTransportSourceLabel,
  getTransportStatusLabel,
} from "../utils/transportOrderLabels";
import "./TransportOrderDetailsPage.css";
import { getRouteStatusLabel } from "../utils/routeLabels";

function hasText(value: string | null | undefined): value is string {
  return value !== null && value !== undefined && value.trim().length > 0;
}

export function TransportOrderDetailsPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState<TransportOrderDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetails() {
      const parsedOrderId = Number(orderId);

      if (!orderId || Number.isNaN(parsedOrderId)) {
        setErrorMessage("Nieprawidłowy identyfikator zlecenia.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage(null);

        const data = await getTransportOrderDetails(parsedOrderId);
        setOrder(data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            setErrorMessage("Sesja wygasła. Zaloguj się ponownie.");
            return;
          }

          if (error.response?.status === 403) {
            setErrorMessage("Brak dostępu do szczegółów zlecenia.");
            return;
          }

          if (error.response?.status === 404) {
            setErrorMessage("Nie znaleziono zlecenia.");
            return;
          }

          setErrorMessage(
            `Błąd pobierania szczegółów: ${
              error.response?.status ?? "brak odpowiedzi"
            }`
          );
          return;
        }

        setErrorMessage("Nieznany błąd pobierania szczegółów.");
      } finally {
        setLoading(false);
      }
    }

    loadDetails();
  }, [orderId]);

  if (loading) {
    return (
      <main className="transport-order-details-page">
        <p className="transport-order-details-page__message">
          Ładowanie szczegółów zlecenia...
        </p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="transport-order-details-page">
        <button
          className="transport-order-details-page__back-button"
          type="button"
          onClick={() => navigate("/transport-orders/me")}
        >
          Wróć
        </button>

        <p className="transport-order-details-page__message transport-order-details-page__message--error">
          {errorMessage}
        </p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="transport-order-details-page">
        <p className="transport-order-details-page__message">
          Brak danych zlecenia.
        </p>
      </main>
    );
  }

  return (
    <main className="transport-order-details-page">
      <article className="transport-order-details-card">
        <header className="transport-order-details-card__header">
          <button
            className="transport-order-details-page__back-button"
            type="button"
            onClick={() => navigate("/transport-orders/me")}
          >
            Wróć
          </button>

          <div className="transport-order-details-card__title-group">
            <h1 className="transport-order-details-card__title">
              {order.orderNumber ?? `Zlecenie #${order.id}`}
            </h1>

            <p className="transport-order-details-card__subtitle">
              {getTransportOrderTypeLabel(order.orderType)} •{" "}
              {getTransportSourceLabel(order.source)}
            </p>
          </div>

          <div className="transport-order-details-card__badges">
            <span className="transport-order-details-card__status">
              {getTransportStatusLabel(order.status)}
            </span>

            <span className="transport-order-details-card__priority">
              {getTransportPriorityLabel(order.priority)}
            </span>
          </div>
        </header>

        <section className="transport-order-details-section">
          <h2>Informacje o zleceniu</h2>

          <div className="transport-order-details-section__rows">
            <p>
              <strong>Status:</strong> {getTransportStatusLabel(order.status)}
            </p>

            <p>
              <strong>Utworzono:</strong> {formatDateTime(order.createdAt)}
            </p>

            {order.completedAt && (
              <p>
                <strong>Zakończono:</strong> {formatDateTime(order.completedAt)}
              </p>
            )}

            {order.cancelledAt && (
              <p>
                <strong>Anulowano:</strong> {formatDateTime(order.cancelledAt)}
              </p>
            )}
          </div>
        </section>

        <section className="transport-order-details-section">
          <h2>Przejazd</h2>

          <div className="transport-order-details-section__rows">
            <p>
              <strong>Skąd:</strong>{" "}
              {hasText(order.pickupAddress) ? order.pickupAddress : "Brak adresu"}
            </p>

            <p>
              <strong>Dokąd:</strong>{" "}
              {hasText(order.destinationAddress)
                ? order.destinationAddress
                : "Brak adresu"}
            </p>

            {hasText(order.description) && (
              <p>
                <strong>Opis:</strong> {order.description}
              </p>
            )}
          </div>
        </section>

        <section className="transport-order-details-section">
          <h2>Pacjenci</h2>

          {order.patients.length === 0 ? (
            <p className="transport-order-details-section__empty">
              Brak przypisanych danych pacjenta.
            </p>
          ) : (
            <div className="transport-order-details-patients">
              {order.patients.map((patient) => (
                <article
                  className="transport-order-details-patient-card"
                  key={patient.id}
                >
                  {patient.anonymized ? (
                    <p>Dane pacjenta zostały zanonimizowane.</p>
                  ) : (
                    <>
                      <p>
                        <strong>Pacjent:</strong>{" "}
                        {patient.patientFirstName ?? "Brak imienia"}{" "}
                        {patient.patientLastName ?? "Brak nazwiska"}
                      </p>

                      {hasText(patient.pickupDetails) && (
                        <p>
                          <strong>Szczegóły odbioru:</strong>{" "}
                          {patient.pickupDetails}
                        </p>
                      )}
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="transport-order-details-section">
          <h2>Trasy powiązane ze zleceniem</h2>

          {order.routes.length === 0 ? (
            <p className="transport-order-details-section__empty">
              Brak powiązanych tras.
            </p>
          ) : (
            <div className="transport-order-details-routes">
              {order.routes.map((route) => (
                <article className="transport-order-details-route-card" key={route.id}>
                  <p>
                    <strong>Trasa #{route.id}</strong> — {getRouteStatusLabel(route.status)}
                  </p>

                  {hasText(route.startAddress) && (
                    <p>
                      <strong>Start:</strong> {route.startAddress}
                    </p>
                  )}

                  {hasText(route.actualDestinationAddress) && (
                    <p>
                      <strong>Cel:</strong> {route.actualDestinationAddress}
                    </p>
                  )}

                  {route.distanceKm !== null && (
                    <p>
                      <strong>Dystans:</strong> {route.distanceKm} km
                    </p>
                  )}

                  {route.startedAt && (
                    <p>
                      <strong>Start:</strong> {formatDateTime(route.startedAt)}
                    </p>
                  )}

                  {route.finishedAt && (
                    <p>
                      <strong>Koniec:</strong> {formatDateTime(route.finishedAt)}
                    </p>
                  )}

                  <Link
                    className="transport-order-details-route-card__link"
                    to="/routes/me"
                  >
                    Przejdź do moich tras
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </article>
    </main>
  );
}