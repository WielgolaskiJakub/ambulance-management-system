import { useEffect, useState } from "react";
import { getAmbulancesForRecovery } from "../../api/recoveryApi";
import type { AmbulanceResponse } from "../../types/ambulance";
import { RestoreAmbulanceStateForm } from "./RestoreAmbulanceStateForm";
import "./RestoreAmbulanceState.css";

export function RestoreAmbulanceStateSection() {

    const [ambulances, setAmbulances] = useState<AmbulanceResponse[]>([]);
    const [selectedId, setSelectedId] = useState("")
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");


    useEffect(() => {
        let active = true;

        async function loadAmbulances() {
            try {
                const data = await getAmbulancesForRecovery();
                if (active) setAmbulances(data);
            } catch {
                if (active) setErrorMessage("Nie udało się pobrać listy karetek.");
            } finally {
                if (active) setLoading(false);
            }
        }

        void loadAmbulances();
        return () => {
            active = false;
        };
    }, []);


    const selectedAmbulance = ambulances.find(
        (ambulance) => String(ambulance.id) === selectedId
    );


    return (
        <section className="recovery-ambulance">
            <h2>Aktualizacja stanu karetki</h2>

            {loading && <p>Ładowanie karetek...</p>}
            {errorMessage && <p role="alert">{errorMessage}</p>}

            {!loading && !errorMessage && ambulances.length === 0 &&(
                <p>Brak karetek do wyboru.</p>
            )}

            {ambulances.length > 0 && (
                <label>
                    Karetka
                    <select
                        value={selectedId}
                        onChange={(event) => setSelectedId(event.currentTarget.value)}
                    >
                        <option value="">Wybierz rejestrację</option>
                        {ambulances.map((ambulance) => (
                            <option key={ambulance.id} value={ambulance.id}>
                                {ambulance.registrationPlates}
                            </option>
                        ))}
                    </select>
                </label>
            )}

            {selectedAmbulance && (
                <RestoreAmbulanceStateForm
                    key={selectedAmbulance.id}
                    ambulance={selectedAmbulance}
                />
            )}
        </section>
    );
}