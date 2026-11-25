import { useState, type SyntheticEvent } from "react";
import type { AmbulanceResponse } from "../../types/ambulance";
import { restoreAmbulanceState } from "../../api/recoveryApi";


type RestoreAmbulanceStateFormProps = {
    ambulance: AmbulanceResponse;
};

export function RestoreAmbulanceStateForm({
    ambulance,
}: RestoreAmbulanceStateFormProps) {

    const [mileage, setMileage] = useState("");
    const [estimatedFuelLiters, setEstimatedFuelLiters] = useState("");
    const [reason, setReason] = useState("");

    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    async function handleSubmit(event: SyntheticEvent<HTMLFormElement>){
        event.preventDefault();
        if(saveStatus !== "idle") 
            return;

        const trimmedReason = reason.trim();
        if(!trimmedReason){
            setErrorMessage("Wpisz powód aktualizacji.");
            return;
        }

        setErrorMessage(null);
        setSaveStatus("saving");

        try{
            await restoreAmbulanceState(ambulance.id, {
                mileage: Number(mileage),
                estimatedFuelLiters: Number(estimatedFuelLiters),
                reason: trimmedReason,
            });
            setSaveStatus("saved");
        } catch {
            setSaveStatus("idle");
            setErrorMessage("Nie udało się zapisać stanu karetki");
        }
    }


    return (
        <form onSubmit={handleSubmit}>
        <fieldset disabled={saveStatus !=="idle"}>
            <legend>Stan karetki {ambulance.registrationPlates} po awarii</legend>
            <div className="recovery-ambulance__fields">

            <label>
                Aktualny przebieg (km)
                <input
                    type="number"
                    min={ambulance.mileage}
                    step="1"
                    required
                    value={mileage}
                    onChange={(event) => setMileage(event.currentTarget.value)}
                />
            </label>

            <label>
                Szacowana ilość paliwa w baku (l)
                <input
                    type="number"
                    min="0"
                    max={ambulance.tankCapacityLiters}
                    step="0.01"
                    required
                    value={estimatedFuelLiters}
                    onChange={(event) => setEstimatedFuelLiters(event.currentTarget.value)}
                />
            </label>

            <label className="recovery-ambulance__reason">
                Powód aktualizacji
                <textarea
                    required
                    rows={2}
                    value={reason}
                    onChange={(event) => setReason(event.currentTarget.value)}
                />
            </label>

</div>
            <button type="submit">
                {saveStatus === "saving" ? "Zapisywanie..." : " Zapisz stan karetki"}
            </button>
        </fieldset>

        {errorMessage && <p role="alert">{errorMessage}</p>}

        {saveStatus === "saved" && (
            <p role="status">Zapisano stan karetki {ambulance.registrationPlates}.</p>
        )}
        </form>
    );
}