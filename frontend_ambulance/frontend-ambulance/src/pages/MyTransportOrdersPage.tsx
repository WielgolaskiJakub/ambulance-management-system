import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { getMyTransportOrders } from "../api/transportOrdersApi";
import type { TransportOrderResponse } from "../types/transportOrder";
import { formatDateTime } from "../utils/dateTimeFormat";
import {
    getTransportOrderTypeLabel,
    getTransportPriorityLabel,
    getTransportSourceLabel,
    getTransportStatusLabel,
} from "../utils/transportOrderLabels";
import { getUserRoleLabel } from "../utils/userRoleLabels";
import "./MyTransportOrdersPage.css";

function hasText(value: string | null | undefined): value is string {
    return value !== null && value !== undefined && value.trim().length > 0;
}

function isCancelledStatus(status: string): boolean {
    return status === "CANCELLED" || status === "CANCELED";
}

function isActiveOrder(order: TransportOrderResponse): boolean {
    return (
        order.status === "NEW" ||
        order.status === "IN_PROGRESS" ||
        order.status === "WAITING_FOR_PICKUP"
    );
}

function isCompletedOrder(order: TransportOrderResponse): boolean {
    return order.status === "COMPLETED";
}

function isCancelledOrder(order: TransportOrderResponse): boolean {
    return isCancelledStatus(order.status)
}

export function MyTransportOrdersPage() {
    const [orders, setOrders] = useState<TransportOrderResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showCompletedOrders, setShowCompletedOrders] = useState(false);
    const [showCancelledOrders, setShowCancelledOrders] = useState(false);

    useEffect(() => {
        async function loadMyOrders() {
            try {
                setLoading(true);
                setErrorMessage(null);

                const data = await getMyTransportOrders();
                setOrders(data);
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    if (error.response?.status === 401) {
                        setErrorMessage("Sesja wygasła. Zaloguj się ponownie.");
                        return;
                    }
                    if (error.response?.status === 403) {
                        setErrorMessage("Brak uprawnień do pobrania zleceń.");
                        return;
                    }

                    setErrorMessage(
                        `Błąd pobierania zleceń: ${error.response?.status ?? "brak odpowiedzi"
                        }`
                    );
                    return;
                }

                setErrorMessage("Nieznany błąd pobierania zleceń");
            } finally {
                setLoading(false);
            }
        }
        loadMyOrders();
    }, []);

    const activeOrders = orders.filter(isActiveOrder);
    const completedOrders = orders.filter(isCompletedOrder);
    const cancelledOrders = orders.filter(isCancelledOrder);


    function renderOrderCard(order: TransportOrderResponse) {
        return (
            <article className="my-transport-order-card" key={order.id}>
                <header className="my-transport-order-card__header">
                    <div>
                        <h2 className="my-transport-order-card__title">
                            {order.orderNumber ?? `Zlecenie #${order.id}`}
                        </h2>

                        <p className="my-transport-order-card__subtitle">
                            {getTransportOrderTypeLabel(order.orderType)} •{" "}
                            {getTransportSourceLabel(order.source)}
                        </p>
                    </div>

                    <div className="my-transport-order-card__badges">
                        <span className="my-transport-order-card__status">
                            {getTransportStatusLabel(order.status)}
                        </span>

                        <span className="my-transport-order-card__priority">
                            {getTransportPriorityLabel(order.priority)}
                        </span>
                    </div>
                </header>

                <div className="my-transport-order-card__body">
                    {hasText(order.pickupAddress) && (
                        <p className="my-transport-order-card__row">
                            <strong>Skąd:</strong> {order.pickupAddress}
                        </p>
                    )}

                    {hasText(order.destinationAddress) && (
                        <p className="my-transport-order-card__row">
                            <strong>Dokąd:</strong> {order.destinationAddress}
                        </p>
                    )}

                    {hasText(order.description) && (
                        <p className="my-transport-order-card__row">
                            <strong>Opis:</strong> {order.description}
                        </p>
                    )}

                    <p className="my-transport-order-card__row">
                        <strong>Utworzono:</strong> {formatDateTime(order.createdAt)}
                    </p>

                    {hasText(order.createdByFullName) && (
                        <p className="my-transport-order-card__row">
                            <strong>Utworzone przez:</strong> {order.createdByFullName} —{" "}
                            {getUserRoleLabel(order.createdByRole)}
                        </p>
                    )}

                    {order.completedAt && (
                        <p className="my-transport-order-card__row">
                            <strong>Zakończono:</strong> {formatDateTime(order.completedAt)}
                        </p>
                    )}

                    {order.cancelledAt && (
                        <p className="my-transport-order-card__row">
                            <strong>Anulowano:</strong> {formatDateTime(order.cancelledAt)}
                        </p>
                    )}

                    {hasText(order.cancelDescription) && (
                        <p className="my-transport-order-card__row">
                            <strong>Powód anulowania:</strong> {order.cancelDescription}
                        </p>
                    )}
                </div>

                <div className="my-transport-order-card__actions">
                    <Link
                        className="my-transport-order-card__details-link"
                        to={`/transport-orders/${order.id}/details`}
                    >
                        Szczegóły
                    </Link>
                </div>
            </article>
        );
    }

    function renderOrdersSection(
        title: string,
        subtitle: string,
        sectionOrders: TransportOrderResponse[],
        emptyMessage: string
    ) {
        return (
            <section className="my-transport-orders-section">
                <header className="my-transport-orders-section__header">
                    <div>
                        <h2 className="my-transport-orders-section__title">{title}</h2>
                        <p className="my-transport-orders-section__subtitle">{subtitle}</p>
                    </div>

                    <span className="my-transport-orders-section__counter">
                        {sectionOrders.length}
                    </span>
                </header>

                {sectionOrders.length === 0 ? (
                    <p className="my-transport-orders-page__message">{emptyMessage}</p>
                ) : (
                    <div className="my-transport-orders-list">
                        {sectionOrders.map(renderOrderCard)}
                    </div>
                )}
            </section>
        );
    }
    if (loading) {
        return (
            <main className="my-transport-orders-page">
                <p className="my-transport-orders-page__message">
                    Ładowanie Twoich zleceń...
                </p>
            </main>
        );
    }

    if (errorMessage) {
        return (
            <main className="my-transport-orders-page">
                <p className="my-transport-orders-page__message my-transport-orders-page__message--error">
                    {errorMessage}
                </p>
            </main>
        );
    }
    return (
        <main className="my-transport-orders-page">
            <header className="my-transport-orders-page__header">
                <div>
                    <h1 className="my-transport-orders-page__title">Moje zlecenia</h1>
                    <p className="my-transport-orders-page__subtitle">
                        Zlecenia utworzone przez Ciebie albo przypisane do Twoich tras.
                    </p>
                </div>
            </header>

            <section className="my-transport-orders-overview">
                <article className="my-transport-orders-overview-card">
                    <span>Aktywne</span>
                    <strong>{activeOrders.length}</strong>
                </article>

                <article className="my-transport-orders-overview-card">
                    <span>Zakończone</span>
                    <strong>{completedOrders.length}</strong>
                </article>

                <article className="my-transport-orders-overview-card">
                    <span>Anulowane</span>
                    <strong>{cancelledOrders.length}</strong>
                </article>
            </section>

            {renderOrdersSection(
                "Aktywne zlecenia",
                "Zlecenia nowe, w trakcie obsługi albo oczekujące na odbiór pacjenta.",
                activeOrders,
                "Nie masz aktywnych zleceń."
            )}

            <div className="my-transport-orders-toggle">
                <button
                    className="my-transport-orders-toggle__button"
                    type="button"
                    onClick={() => setShowCompletedOrders((currentValue) => !currentValue)}
                >
                    {showCompletedOrders
                        ? "Ukryj zakończone zlecenia"
                        : `Pokaż zakończone zlecenia (${completedOrders.length})`}
                </button>
            </div>

            {showCompletedOrders &&
                renderOrdersSection(
                    "Zakończone zlecenia",
                    "Historia zakończonych transportów.",
                    completedOrders,
                    "Brak zakończonych zleceń."
                )}

            <div className="my-transport-orders-toggle">
                <button
                    className="my-transport-orders-toggle__button"
                    type="button"
                    onClick={() => setShowCancelledOrders((currentValue) => !currentValue)}
                >
                    {showCancelledOrders
                        ? "Ukryj anulowane zlecenia"
                        : `Pokaż anulowane zlecenia (${cancelledOrders.length})`}
                </button>
            </div>

            {showCancelledOrders &&
                renderOrdersSection(
                    "Anulowane zlecenia",
                    "Zlecenia, które zostały anulowane.",
                    cancelledOrders,
                    "Brak anulowanych zleceń."
                )}
        </main>
    );
}