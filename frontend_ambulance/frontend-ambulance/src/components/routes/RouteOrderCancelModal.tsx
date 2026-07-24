import type { RouteTransportOrderReference } from "../../types/route";
import { getTransportCancelOptions } from "../../utils/transportOrderLabels";

type RouteOrderCancelModalProps = {
    transportOrder: RouteTransportOrderReference;
    cancelReason: string;
    cancelDescription: string;
    isSubmitting: boolean;
    onCancelReasonChange: (value: string) => void;
    onCancelDescriptionChange: (value: string) => void;
    onBack: () => void;
    onConfirm: () => void;
};

export function RouteOrderCancelModal({
    transportOrder,
    cancelReason,
    cancelDescription,
    isSubmitting,
    onCancelReasonChange,
    onCancelDescriptionChange,
    onBack,
    onConfirm,
}: RouteOrderCancelModalProps) {

    return (
        <div className="my-routes-modal-backdrop">
            <section
                className="my-routes-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="cancel-route-order-title"
            >
                <h2 id="cancel-route-order-title">Anuluj zlecenie</h2>

                <p className="my-routes-modal__description">
                    Zlecenie {transportOrder.orderNumber}:{" "}
                    {transportOrder.pickupAddress ?? "Brak miejsca odbioru"} →{" "}
                    {transportOrder.destinationAddress ?? "Brak celu"}
                </p>

                <label className="my-routes-modal__field">
                    <span>Powód anulowania</span>
                    <select
                        value={cancelReason}
                        onChange={(event) => onCancelReasonChange(event.target.value)}
                        disabled={isSubmitting}
                    >
                        {getTransportCancelOptions().map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="my-routes-modal__field">
                    <span>Dodatkowy opis</span>
                    <textarea
                        value={cancelDescription}
                        onChange={(event) => onCancelDescriptionChange(event.target.value)}
                        placeholder="Opcjonalne szczegóły anulowania"
                        rows={3}
                        disabled={isSubmitting}
                    />
                </label>

                <div className="my-routes-modal__actions">
                    <button
                        type="button"
                        className="my-routes-modal__cancel-button"
                        onClick={onBack}
                        disabled={isSubmitting}
                    >
                        Wróć
                    </button>

                    <button
                        type="button"
                        className="my-routes-modal__danger-button"
                        onClick={onConfirm}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Anulowanie..." : "Potwierdź anulowanie"}
                    </button>
                </div>
            </section>
        </div>
    );
}