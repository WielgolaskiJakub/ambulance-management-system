import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { createTransportOrderByManager } from "../api/transportOrdersApi";
import {
    transportOrderPriorityLabels,
    transportOrderTypeLabels,
    transportSourceLabels,
} from "../utils/transportOrderLabels"
import "./ManagerCreateTransportOrderPage.css"
import { useToast } from "../toast/UseToast";

const defaultPickupAddress = import.meta.env.VITE_DEFAULT_PICKUP_ADDRESS ?? "";

type PatientFormState = {
    patientFirstName: string;
    patientLastName: string;
    pickupDetails: string;
};

type FormState = {
    plannedDate: string;
    plannedDepartureTime: string;
    orderType: string;
    source: string;
    priority: string;
    pickupAddress: string;
    destinationAddress: string;
    description: string;
    patients: PatientFormState[];
};

const emptyPatient: PatientFormState = {
    patientFirstName: "",
    patientLastName: "",
    pickupDetails: "",
};

const initialFormState: FormState = {
    plannedDate: "",
    plannedDepartureTime: "",
    orderType: "HOSPITAL_TRANSFER",
    source: "HOSPITAL_EMERGENCY_DEPARTMENT",
    priority: "MEDIUM",
    pickupAddress: defaultPickupAddress,
    destinationAddress: "",
    description: "",
    patients: [{ ...emptyPatient }],
};

function hasText(value: string): boolean {
    return value.trim().length > 0;
}

export function ManagerCreateTransportOrderPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [form, setForm] = useState<FormState>(initialFormState);
    const [submitting, setSubmitting] = useState(false);
    const [orderErrorMessage, setOrderErrorMessage] = useState<string | null>(null);
    const [patientErrorMessage, setPatientErrorMessage] = useState<string | null>(null);

    function updateField(field: keyof FormState, value: string) {
        setForm((currentForm) => ({
            ...currentForm,
            [field]: value,
        }));
    }


    const patients = form.patients
        .filter((patient) =>
            hasText(patient.patientFirstName) ||
            hasText(patient.patientLastName) ||
            hasText(patient.pickupDetails)
        )
        .map((patient) => ({
            patientFirstName: patient.patientFirstName.trim(),
            patientLastName: patient.patientLastName.trim(),
            pickupDetails: hasText(patient.pickupDetails)
                ? patient.pickupDetails.trim()
                : null
        }));


    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!hasText(form.plannedDate)) {
            setOrderErrorMessage("Podaj datę realizacji zlecenia.");
            return;
        }

        if (!hasText(form.pickupAddress)) {
            setOrderErrorMessage("Podaj adres odbioru pacjenta.");
            return;
        }

        if (!hasText(form.destinationAddress)) {
            setOrderErrorMessage("Podaj adres docelowy");
            return;
        }

        for (let index = 0; index < form.patients.length; index++) {
            const patient = form.patients[index];

            const hasFirstName = hasText(patient.patientFirstName);
            const hasLastName = hasText(patient.patientLastName);
            const hasPickupDetails = hasText(patient.pickupDetails);

            const patientRowIsNotEmpty =
                hasFirstName ||
                hasLastName ||
                hasPickupDetails;

            if (!patientRowIsNotEmpty) {
                continue;
            }

            if (!hasFirstName || !hasLastName) {
                setPatientErrorMessage(
                    `Uzupełnij imię i nazwisko pacjenta nr ${index + 1}.`
                );
                return
            }
        }

        try {
            setSubmitting(true);
            setOrderErrorMessage(null);

            const createdOrder = await createTransportOrderByManager({
                plannedDate: form.plannedDate,
                plannedDepartureTime: hasText(form.plannedDepartureTime)
                    ? form.plannedDepartureTime
                    : null,
                orderType: form.orderType,
                source: form.source,
                priority: form.priority,
                pickupAddress: form.pickupAddress.trim(),
                destinationAddress: form.destinationAddress.trim(),
                description: hasText(form.description) ? form.description.trim() : null,
                patients,

            });

            showToast(
                createdOrder.orderNumber
                    ? `Utworzono zlecenie ${createdOrder.orderNumber}. Numer należy wpisać na papierowym zleceniu.`
                    : "Zlecenie zostało utworzone.",
                "success",
                10000
            );

            navigate(`/manager/dashboard?date=${createdOrder.plannedDate}&createdOrderId=${createdOrder.id}`);
        } catch (error) {
            if (axios.isAxiosError(error)) {

                if (error.response?.status === 400) {
                    setOrderErrorMessage("Nieprawidłowe dane zlecenia.");
                    return;
                }

                if (error.response?.status === 401) {
                    setOrderErrorMessage("Sesja wygasła. Zaloguj się ponownie.");
                    return;
                }

                if (error.response?.status === 403) {
                    setOrderErrorMessage("Brak uprawnień do utworzenia zlecenia.");
                    return;
                }

                setOrderErrorMessage("Nie udało się utworzyć zlecenia.");
                return;
            }

            setOrderErrorMessage("Nieznany błąd tworzenia zlecenia.");

        } finally {
            setSubmitting(false);
        }
    }

    function updatePatientField(
        patientIndex: number,
        field: keyof PatientFormState,
        value: string
    ) {
        setPatientErrorMessage(null);

        setForm((currentForm) => ({
            ...currentForm,
            patients: currentForm.patients.map((patient, index) =>
                index === patientIndex
                    ? {
                        ...patient,
                        [field]: value,
                    }
                    : patient
            ),
        }));
    }

    function addPatient() {
        const lastPatientIndex = form.patients.length - 1;
        const lastPatient = form.patients[lastPatientIndex];

        const hasFirstName = hasText(lastPatient.patientFirstName);
        const hasLastName = hasText(lastPatient.patientLastName);
        const hasPickupDetails = hasText(lastPatient.pickupDetails);

        const patientHasAnyData =
            hasFirstName ||
            hasLastName ||
            hasPickupDetails;

        if (!patientHasAnyData) {
            setPatientErrorMessage(
                `Najpierw uzupełnij dane pacjenta nr ${lastPatientIndex + 1}.`
            );
            return;
        }

        if (!hasFirstName || !hasLastName) {
            setPatientErrorMessage(
                `Uzupełnij imię i nazwisko pacjenta nr ${lastPatientIndex + 1}.`
            );
            return;
        }

        setPatientErrorMessage(null);

        setForm((currentForm) => ({
            ...currentForm,
            patients: [
                ...currentForm.patients,
                { ...emptyPatient },
            ],
        }));

    }

    function removePatient(patientIndex: number) {
        setForm((currentForm) => ({
            ...currentForm,
            patients:
                currentForm.patients.length === 1
                    ? [{ ...emptyPatient }]
                    : currentForm.patients.filter(
                        (_, index) => index !== patientIndex
                    ),
        }));
    }

    return (
        <main className="manager-create-transport-order-page">
            <section className="create-transport-order-card">
                <header className="create-transport-order-card__header">
                    <button
                        className="create-transport-order-card__back-button"
                        type="button"
                        onClick={() => navigate(-1)}
                    >
                        Powrót
                    </button>

                    <div>
                        <h1 className="create-transport-order-card__title">
                            Stwórz zlecenie transportu
                        </h1>

                    </div>
                </header>

                {orderErrorMessage && (
                    <p className="create-transport-order-card__message create-transport-order-card__message--error">
                        {orderErrorMessage}
                    </p>
                )}

                <form className="create-transport-order-form" onSubmit={handleSubmit}>
                    <div className="create-transport-order-form__grid">
                        <label className="create-transport-order-form__field">
                            <span>Data realizacji</span>
                            <input
                                value={form.plannedDate}
                                type="date"
                                lang="pl-PL"
                                onChange={(event) => updateField("plannedDate", event.target.value)}
                            />
                        </label>

                        <label className="create-transport-order-form__field">
                            <span>Godzina realizacji</span>
                            <input
                                value={form.plannedDepartureTime}
                                type="time"
                                lang="pl-PL"
                                onChange={(event) => updateField("plannedDepartureTime", event.target.value)}
                            />
                        </label>


                        <label className="create-transport-order-form__field">
                            <span>Numer zlecenia</span>
                            <p className="create-transport-order-form__generated-value">
                                Zostanie nadany automatycznie po utworzeniu.
                            </p>
                        </label>

                    </div>

                    <div className="create-transport-order-form__grid">
                        <label className="create-transport-order-form__field">
                            <span>Typ transportu</span>
                            <select
                                value={form.orderType}
                                onChange={(event) => updateField("orderType", event.target.value)}
                            >
                                {Object.entries(transportOrderTypeLabels).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="create-transport-order-form__field">
                            <span>Źródło</span>
                            <select
                                value={form.source}
                                onChange={(event) => updateField("source", event.target.value)}
                            >
                                {Object.entries(transportSourceLabels).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="create-transport-order-form__field">
                            <span>Priorytet</span>
                            <select
                                value={form.priority}
                                onChange={(event) => updateField("priority", event.target.value)}
                            >
                                {Object.entries(transportOrderPriorityLabels).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="create-transport-order-form__route-grid">
                        <label className="create-transport-order-form__field">
                            <span>Skąd</span>
                            <div className="create-transport-order-form__input-row">
                                <input
                                    value={form.pickupAddress}
                                    onChange={(event) => updateField("pickupAddress", event.target.value)}
                                    placeholder="np. Szpital Wołomin"
                                />
                                <button
                                    className="create-transport-order-form__clear-button"
                                    type="button"
                                    onClick={() => updateField("pickupAddress", "")}
                                >
                                    Wyczyść
                                </button>
                            </div>
                        </label>

                        <label className="create-transport-order-form__field">
                            <span>Dokąd</span>
                            <div className="create-transport-order-form__input-row">
                                <input
                                    value={form.destinationAddress}
                                    onChange={(event) => updateField("destinationAddress", event.target.value)}
                                    placeholder="np. Szpital Bródnowski / Wołomin Lipińska 12"
                                />
                                <button
                                    className="create-transport-order-form__clear-button"
                                    type="button"
                                    onClick={() => updateField("destinationAddress", "")}
                                >
                                    Wyczyść
                                </button>
                            </div>
                        </label>
                    </div>

                    <label className="create-transport-order-form__field">
                        <span>Opis</span>
                        <textarea
                            value={form.description}
                            onChange={(event) => updateField("description", event.target.value)}
                            placeholder="Dodatkowe informacje"
                            rows={3}
                        />
                    </label>

                    <section className="create-transport-order-form__section">
                        <h2>Dane pacjentów</h2>
                        <p>
                            Jeśli transport bez pacjenta - pozostaw puste.
                        </p>

                        {patientErrorMessage && (
                            <p className="create-transport-order-form__patient-error">
                                {patientErrorMessage}
                            </p>
                        )}

                        {form.patients.map((patient, index) => (
                            <div className="create-transport-order-form__patient"
                                key={index}
                            >
                                <div className="create-transport-order-form__patient-header">
                                    <h3>Pacjent {index + 1}</h3>

                                    <button
                                        className="create-transport-order-form__patient-remove-button"
                                        type="button"
                                        onClick={() => removePatient(index)}
                                    >
                                        Usuń
                                    </button>
                                </div>

                                <div className="create-transport-order-form__grid">
                                    <label className="create-transport-order-form__field">
                                        <span>Imię</span>

                                        <input
                                            value={patient.patientFirstName}
                                            onChange={(event) =>
                                                updatePatientField(index,
                                                    "patientFirstName",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Imię pacjenta"
                                        />
                                    </label>

                                    <label className="create-transport-order-form__field">
                                        <span>Nazwisko</span>

                                        <input
                                            value={patient.patientLastName}
                                            onChange={(event) =>
                                                updatePatientField(index,
                                                    "patientLastName",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Nazwisko pacjenta"
                                        />
                                    </label>

                                    <label className="create-transport-order-form__field">
                                        <span>Dodatkowe informacje</span>

                                        <input
                                            value={patient.pickupDetails}
                                            onChange={(event) =>
                                                updatePatientField(index,
                                                    "pickupDetails",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Opcjonalnie"
                                        />
                                    </label>
                                </div>
                            </div>
                        ))}
                        <button
                            className="create-transport-order-form__add-patient-button"
                            type="button"
                            onClick={addPatient}>
                            + Dodaj kolejnego pacjenta
                        </button>
                    </section>
                    <div className="create-transport-order-form__actions">
                        <button
                            className="create-transport-order-form__submit-button"
                            type="submit"
                            disabled={submitting}
                        >
                            {submitting ? "Tworzenie..." : "Utwórz zlecenie"}
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );

}