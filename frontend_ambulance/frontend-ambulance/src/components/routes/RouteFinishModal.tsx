type RouteFinishModalProps = {
    routeId: number;
    finishOdometerLastThree: string;
    isSubmitting: boolean;
    onOdometerChange: (value: string) => void;
    onCancel:() => void;
    onConfirm: () => void;
};

export function RouteFinishModal({
    routeId,
    finishOdometerLastThree,
    isSubmitting,
    onOdometerChange,
    onCancel,
    onConfirm
}:RouteFinishModalProps) {
    
    return (
    <div className="my-routes-modal-backdrop">
      <div className="my-routes-modal" role="dialog" aria-modal="true">
        <h2>Zakończenie trasy #{routeId}</h2>

        <label className="my-routes-modal__field">
          <span>Ostatnie 3 cyfry licznika</span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={3}
            value={finishOdometerLastThree}
            onChange={(event) =>
              onOdometerChange(
                event.target.value.replace(/\D/g, "").slice(0, 3)
              )
            }
          />
        </label>

        <div className="my-routes-modal__actions">
          <button
            type="button"
            className="my-routes-modal__cancel-button"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Anuluj
          </button>

          <button
            type="button"
            className="my-routes-modal__confirm-button"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Kończenie..." : "Zakończ trasę"}
          </button>
        </div>
      </div>
    </div>
  );
}