import { useEffect, useState } from "react";
import { formatDateTime } from "../utils/dateTimeFormat";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { getTransportOrderCrewPreview } from "../api/transportOrdersApi";
import type { TransportOrderCrewPreviewResponse } from "../types/transportOrder";
import {
    getTransportOrderTypeLabel,
    getTransportPriorityLabel,
    getTransportSourceLabel,
    getTransportStatusLabel,
} from "../utils/transportOrderLabels";
import { getUserRoleLabel } from "../utils/userRoleLabels";
import { getMyDashboard } from "../api/dashboardApi";
import { createRouteFromOrder } from "../api/routesApi";


function hasText(value: string | null | undefined): value is string {
    return value !== null && value !== undefined && value.trim().length > 0;
}


export function TransportOrderCrewPreviewPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState<TransportOrderCrewPreviewResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [shiftId, setShiftId] = useState<number | null>(null);
    const [loggedUserRole, setLoggedUserRole] = useState<string | null>(null);
    const [accepting, setAccepting] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        async function loadPreview() {
            const parsedOrderId = Number(orderId);

            if (!orderId || Number.isNaN(parsedOrderId)) {
                setErrorMessage("Nieprawidłowy identyfikator zlecenia transportowego.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setErrorMessage(null);

                const [orderData, dashboardData] = await Promise.all([
                    getTransportOrderCrewPreview(Number(orderId)),
                    getMyDashboard(),
                ]);

                setOrder(orderData);
                setShiftId(dashboardData.shiftId);
                setLoggedUserRole(dashboardData.loggedUserRole);
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    if (error.response?.status === 401) {
                        setErrorMessage("Sesja wygasła. Zaloguj się ponownie");
                        return;
                    }

                    if (error.response?.status === 403) {
                        setErrorMessage("Brak dostępu do podglądu zlecenia");
                        return;
                    }
                    if (error.response?.status === 404) {
                        setErrorMessage("Nie znaleziono zlecenia");
                        return;
                    }
                    if (error.response?.status === 400) {
                        setErrorMessage("To zlecenie nie jest dostępne w kolejce nowych zleceń");
                        return;
                    }

                    setErrorMessage(
                        `Błąd pobierania podglądu: ${error.response?.status ?? "Brak odpowiedzi"}`
                    );
                    return;
                }

                setErrorMessage("Nieznany błąd pobierania podglądów");
            } finally {
                setLoading(false)
            }
        }
        loadPreview();
    }, [orderId]);
    {
        successMessage && (
            <p className="transport-order-preview-page__message">
                {successMessage}
            </p>
        )
    }
    async function handleAcceptOrder() {
        if (!order) {
            return;
        }

        if (shiftId === null) {
            setErrorMessage("Nie znaleziono aktywnej zmiany.");
            return;
        }

        try {
            setAccepting(true);
            setErrorMessage(null);
            setSuccessMessage(null);

            await createRouteFromOrder(order.id, {
                shiftId,
                notes: null,
            });

            setSuccessMessage("Zlecenie zostało przyjęte.");
            navigate("/routes/me");
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
            setAccepting(false);
        }
    }

    if (loading) {
        return (
            <main className="transport-order-preview-page">
                <p className="transpor-order-preview-page__message">
                    Ładowanie podglądu zlecenia...
                </p>
            </main>
        );
    }

    if (errorMessage) {
        return (
            <main className="transpor-order-preview-page">
                <button
                    className="transport-order-preview__back-button"
                    type="button"
                    onClick={() => navigate(-1)}
                >
                    Wróć
                </button>

                <p className="transport-order-preview-page__message">{errorMessage}</p>
            </main>
        );
    }

    if (!order) {
        return (
            <main className="transport-order-preview-page" >
                <p className="transport-order-preview-page__message">
                    Brak danych zlecenia.
                </p>
            </main>
        );
    }

    return (
        <main className="transport-order-preview-page">
            <article className="transport-order-preview">
                <header className="transport-order-preview__header">
                    <div className="transport-order-preview__title-group">
                        <button
                            className="transport-order-preview__back-button"
                            type="button"
                            onClick={() => navigate(-1)}
                        >
                            Wróć
                        </button>

                        <h1 className="transport-order-preview__title">
                            {order.orderNumber ?? `Zlecenie #${order.id}`}
                        </h1>

                        <p className="transport-order-preview__subtitle">
                            {getTransportOrderTypeLabel(order.orderType)} •{" "}
                            {getTransportSourceLabel(order.source)}
                        </p>
                    </div>

                    <span className="transport-order-preview__priority">
                        {getTransportPriorityLabel(order.priority)}
                    </span>
                </header>
                <section className="transport-order-preview__section">
                    <h2 className="transport-order-preview__section-title">
                        Informacje
                    </h2>
                    <div className="transport-order-preview__rows">
                        <p className="transport-order-preview__row">
                            <strong>Status:</strong> {getTransportStatusLabel(order.status)}
                        </p>

                        <p className="transport-order-preview__row">
                            <strong>Utworzone przez:</strong> {order.createdByFullName} —{" "}
                            {getUserRoleLabel(order.createdByRole)}
                        </p>

                        <p className="transport-order-preview__row">
                            <strong>Utworzono:</strong> {formatDateTime(order.createdAt)}
                        </p>
                    </div>
                </section>
                <section className="transport-order-preview__section">
                    <h2 className="transport-order-preview__section-title">Przejazd</h2>

                    <div className="transport-order-preview__rows">
                        <p className="transport-order-preview__row">
                            <strong>Skąd:</strong>{" "}
                            {hasText(order.pickupAddress) ? order.pickupAddress : "Brak adresu"}
                        </p>

                        <p className="transport-order-preview__row">
                            <strong>Dokąd:</strong>{" "}
                            {hasText(order.destinationAddress)
                                ? order.destinationAddress
                                : "Brak adresu"}
                        </p>
                    </div>
                </section>
                {hasText(order.description) && (
                    <section className="transport-order-preview__section">
                        <h2 className="transport-order-preview__section-title">Opis</h2>

                        <p className="transport-order-preview__description">
                            {order.description.trim()}
                        </p>
                    </section>
                )}

                <section className="transport-order-preview__section">
                    <h2 className="transport-order-preview__section-title">Pacjenci</h2>

                    {order.patients.length === 0 ? (
                        <p className="transport-order-preview__row">
                            Brak przypisanych danych pacjenta.
                        </p>
                    ) : (
                        <div className="transport-order-preview__patients">
                            {order.patients.map((patient) => (
                                <div
                                    className="transport-order-preview__patient-card"
                                    key={patient.id}
                                >
                                    {patient.anonymized ? (
                                        <p className="transport-order-preview__row">
                                            Dane pacjenta zostały zanonimizowane.
                                        </p>
                                    ) : (
                                        <>
                                            <p className="transport-order-preview__row">
                                                <strong>Pacjent:</strong>{" "}
                                                {patient.patientFirstName ?? "Brak imienia"}{" "}
                                                {patient.patientLastName ?? "Brak nazwiska"}
                                            </p>

                                            {hasText(patient.pickupDetails) && (
                                                <p className="transport-order-preview__row">
                                                    <strong>Szczegóły odbioru:</strong>{" "}
                                                    {patient.pickupDetails}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>
                <div className="transport-order-preview__actions">
                    {loggedUserRole === "DRIVER" && (
                        <button
                            className="transport-order-preview__primary-button"
                            type="button"
                            disabled={accepting}
                            onClick={handleAcceptOrder}
                        >
                            {accepting
                                ? "Przyjmowanie..."
                                : order.status === "WAITING_FOR_PICKUP"
                                    ? "Odbierz pacjenta"
                                    : "Przyjmij zlecenie"}
                        </button>
                    )}
                </div>
            </article>
        </main>
    );
}