import type {
    RouteResponse,
    RecoveryOrderResultRequest
} from "../../types/route";
import {
    useState,
    type SyntheticEvent
} from "react";
import { finishRouteAfterOutage } from "../../api/recoveryApi";
import { RecoveryRouteSection } from "./RecoveryRouteSection";
import "./FinishRouteAfterOutageForm.css";

type OrderAction = RecoveryOrderResultRequest["action"];

const cancelReasonLabels = {
    CANCELLED_BY_WARD: "Odwołane przez oddział",
    CANCELLED_BY_DOCTOR: "Odwołane przez lekarza",
    PATIENT_USED_OWN_TRANSPORT: "Pacjent skorzystał z własnego transportu",
    PATIENT_TAKEN_BY_EXTERNAL_TRANSPORT: "Pacjenta zabrał inny transport",
    PATIENT_REFUSED_TRANSPORT: "Pacjent odmówił transportu",
    PATIENT_NOT_READY: "Pacjent niegotowy do transportu",
    PATIENT_NOT_FOUND: "Nie zastano pacjenta",
    WRONG_ORDER_DATA: "Błędne dane zlecenia",
    DUPLICATE_ORDER: "Powielone zlecenie",
    OTHER: "Inny powód",
};

type FinishRouteAfterOutageFormProps = {
    route: RouteResponse;
};

export function FinishRouteAfterOutageForm({
    route,
}: FinishRouteAfterOutageFormProps) {

    const [actionsByOrderId, setActionsByOrderId] = useState<Partial<Record<number, OrderAction>>>({});
    const [cancelReasonsByOrderId, setCancelReasonsByOrderId] = useState<Partial<Record<number, string>>>({});
    const [cancelDescriptionsByOrderId, setCancelDescriptionsByOrderId] =
        useState<Partial<Record<number, string>>>({});
    const [finishedAt, setFinishedAt] = useState("");
    const [finishOdometerKm, setFinishOdometerKm] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const pendingOrders = route.transportOrders.filter(
        (order) => order.routeOrderStatus === "PENDING"
    );

    function buildOrderResults(): RecoveryOrderResultRequest[] {
        const results: RecoveryOrderResultRequest[] = [];

        for (const order of pendingOrders) {
            const action = actionsByOrderId[order.id];

            if (!action) {
                throw new Error(`Wybierz wynik zlecenia ${order.orderNumber}.`);
            }

            if (action === "CANCEL") {
                const cancelReason = cancelReasonsByOrderId[order.id];

                if (!cancelReason) {
                    throw new Error(
                        `Wybierz powód anulowania zlecenia ${order.orderNumber}.`
                    );
                }

                const description = cancelDescriptionsByOrderId[order.id]?.trim();

                results.push({
                    transportOrderId: order.id,
                    action,
                    cancelReason,
                    ...(description ? { cancelDescription: description } : {}),
                });
            } else {
                results.push({
                    transportOrderId: order.id,
                    action,
                });
            }
        }

        return results;
    }
    async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();

        if (isSubmitting || isFinished) return;

        setErrorMessage(null);
        setIsSubmitting(true);

        try {
            const orderResults = buildOrderResults();

            await finishRouteAfterOutage(route.id, {
                finishedAt,
                finishOdometerKm: Number(finishOdometerKm),
                orderResults,
            });

            setIsFinished(true);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Nie udało się zakończyć trasy."
            );
        } finally {
            setIsSubmitting(false);
        }
    }


    return (

        <form className="recovery-route-form" onSubmit={handleSubmit}>
            <h2>Rozliczenie trasy po awarii</h2>
            <h3>Zlecenia do rozliczenia</h3>

            {pendingOrders.length === 0 ? (

                <p>Wszystkie zlecenia na tej trasie są już rozliczone.</p>
            ) : (
                <ul>
                    {pendingOrders.map((order) => (
                        <li key={order.id}>
                            <div className="recovery-route-form__order-heading">
                                <strong>Zlecenie {order.orderNumber}</strong>
                                <span>
                                    {order.pickupAddress ?? "Brak miejsca odbioru"}
                                    {" → "}
                                    {order.destinationAddress ?? "Brak celu"}
                                </span>
                            </div>
                            <label>
                                Wynik zlecenia {order.orderNumber}
                                <select
                                    required
                                    value={actionsByOrderId[order.id] ?? ""}
                                    onChange={(event) => {
                                        const action = event.currentTarget.value;

                                        if (
                                            action === "COMPLETE" ||
                                            action === "WAITING_FOR_PICKUP" ||
                                            action === "CANCEL"
                                        ) {
                                            setActionsByOrderId((previous) => ({
                                                ...previous,
                                                [order.id]: action,
                                            }));
                                        }
                                    }}
                                >
                                    <option value="" disabled>Wybierz wynik</option>
                                    <option value="COMPLETE">Zrealizowane</option>
                                    <option value="WAITING_FOR_PICKUP">Oczekuje na odbiór</option>
                                    <option value="CANCEL">Anulowane</option>
                                </select>
                            </label>
                            {actionsByOrderId[order.id] === "CANCEL" && (
                                <label>
                                    Powód anulowania zlecenia {order.orderNumber}
                                    <select
                                        required
                                        value={cancelReasonsByOrderId[order.id] ?? ""}
                                        onChange={(event) => {
                                            const reason = event.currentTarget.value;
                                            setCancelReasonsByOrderId((previous) => ({
                                                ...previous,
                                                [order.id]: reason,
                                            }));
                                        }}
                                    >
                                        <option value="" disabled>Wybierz powód</option>
                                        {Object.entries(cancelReasonLabels).map(([code, label]) => (
                                            <option key={code} value={code}>{label}</option>
                                        ))}
                                    </select>
                                </label>
                            )}
                            {actionsByOrderId[order.id] === "CANCEL" && (
                                <label>
                                    Dodatkowe uwagi do zlecenia {order.orderNumber} (opcjonalnie)
                                    <textarea
                                        rows={2}
                                        value={cancelDescriptionsByOrderId[order.id] ?? ""}
                                        onChange={(event) => {
                                            const description = event.currentTarget.value;
                                            setCancelDescriptionsByOrderId((previous) => ({
                                                ...previous,
                                                [order.id]: description,
                                            }));
                                        }}
                                    />
                                </label>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            <fieldset>
                <legend>Powrót z trasy</legend>

                <label>
                    Data i godzina powrotu
                    <input
                        type="datetime-local"
                        required
                        value={finishedAt}
                        onChange={(event) => setFinishedAt(event.currentTarget.value)}
                    />
                </label>

                <label>
                    Stan licznika przy powrocie (km)
                    <input
                        type="number"
                        required
                        min={route.startOdometerKm ?? 0}
                        step={1}
                        value={finishOdometerKm}
                        onChange={(event) => setFinishOdometerKm(event.currentTarget.value)}
                    />
                </label>
            </fieldset>
            {errorMessage && <p role="alert">{errorMessage}</p>}

            <button type="submit" disabled={isSubmitting || isFinished}>
                {isSubmitting ? "Zapisywanie..." : "Zakończ trasę"}
            </button>

            {isFinished && <p role="status">Trasa została zakończona.</p>}

        </form>
    );
}