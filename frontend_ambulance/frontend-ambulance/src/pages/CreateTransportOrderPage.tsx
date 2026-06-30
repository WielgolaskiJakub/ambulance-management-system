import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { createTransportOrderByUser } from "../api/transportOrdersApi";
import {
    transportOrderPriorityLabels,
    transportOrderTypeLabels,
    transportSourceLabels,
} from "../utils/transportOrderLabels"
import "./CreateTransportOrderPage.css"

const defaultPickupAddress = import.meta.env.VITE_DEFAULT_PICKUP_ADDRESS ?? "";

type FormState = {
    orderType: string;
    source: string;
    priority: string;
    pickupAddress: string;
    destinationAddress: string;
    description: string;
    patientFirstName: string;
    patientLastName: string;
    pickupDetails: string;
};

const initialFormState: FormState = {
    orderType: "HOSPITAL_TRANSFER",
    source: "HOSPITAL_EMERGENCY_DEPARTMENT",
    priority: "MEDIUM",
    pickupAddress: defaultPickupAddress,
    destinationAddress: "",
    description: "",
    patientFirstName: "",
    patientLastName: "",
    pickupDetails: "",
};

type ApiErrorResponse = {
    code?: string;
    message?: string;
};

function getApiErrorCode(error: unknown): string | null {
    if (!axios.isAxiosError(error)) {
        return null;
    }
    return (error.response?.data as ApiErrorResponse | undefined)?.code ?? null;
}

function hasText(value: string): boolean {
    return value.trim().length > 0;
}

export function CreateTransportOrderPage() {
    const navigate = useNavigate();

    const [form, setForm] = useState<FormState>(initialFormState);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    function updateField(field: keyof FormState, value: string) {
        setForm((currentForm) => ({
            ...currentForm,
            [field]: value,
        }));
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!hasText(form.pickupAddress)) {
            setErrorMessage("Podaj adres odbioru pacjenta.");
            return;
        }

        if (!hasText(form.destinationAddress)) {
            setErrorMessage("Podaj adres docelowy");
        }

        const hasPatientFirstName = hasText(form.patientFirstName);
        const hasPatientLastName = hasText(form.patientLastName);

        if (hasPatientFirstName !== hasPatientLastName) {
            setErrorMessage("Podaj imię i nazwisko pacjenta albo zostaw oba pola puste.");
            return;
        }

        try {
            setSubmitting(true);
            setErrorMessage(null);

            const createdOrder = await createTransportOrderByUser({
                orderType: form.orderType,
                source: form.source,
                priority: form.priority,
                pickupAddress: form.pickupAddress.trim(),
                destinationAddress: form.destinationAddress.trim(),
                description: hasText(form.description) ? form.description.trim() : null,
                patients:
                    hasPatientFirstName && hasPatientLastName
                        ? [
                            {
                                patientFirstName: form.patientFirstName.trim(),
                                patientLastName: form.patientLastName.trim(),
                                pickupDetails: hasText(form.pickupDetails)
                                    ? form.pickupDetails.trim()
                                    : null
                            },
                        ]
                        : [],
            });

            navigate(`/transport-orders/${createdOrder.id}/preview`, { replace: true });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const errorCode = getApiErrorCode(error);

                if (errorCode === "SHIFT_NOT_ACTIVE") {
                    setErrorMessage("Najpierw utwórz aktywną zmianę.");
                    return;
                }

                if (error.response?.status === 400) {
                    setErrorMessage("Nieprawidłowe dane zlecenia.");
                    return;
                }

                if (error.response?.status === 401) {
                    setErrorMessage("Sesja wygasła. Zaloguj się ponownie.");
                    return;
                }

                if (error.response?.status === 403) {
                    setErrorMessage("Brak uprawnień do utworzenia zlecenia.");
                    return;
                }

                setErrorMessage("Nie udało się utworzyć zlecenia.");
                return;
            }

            setErrorMessage("Nieznany błąd tworzenia zlecenia.");

        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="create-transport-order-page">
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

                {errorMessage && (
                    <p className="create-transport-order-card__message create-transport-order-card__message--error">
                        {errorMessage}
                    </p>
                )}

                <form className="create-transport-order-form" onSubmit={handleSubmit}>
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

                    <label className="create-transport-order-form__field">
                        <span>Skąd</span>
                        <input className="create-transport-order-form__input-with-button"
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
                    </label>

                    <label className="create-transport-order-form__field">
                        <span>Dokąd</span>
                        <input className="create-transport-order-form__input-with-button"
                            value={form.destinationAddress}
                            onChange={(event) =>
                                updateField("destinationAddress", event.target.value)
                            }
                            placeholder="np. Szpital Bródnowski / Wołomin Lipińska 12"
                        />

                        <button
                            className="create-transport-order-form__clear-button"
                            type="button"
                            onClick={() => updateField("pickupAddress", "")}
                        >
                            Wyczyść
                        </button>
                    </label>

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
                        <h2>Dane pacjenta</h2>
                        <p>
                            Jeśli transport bez pacjenta - pozostaw puste.
                        </p>

                        <div className="create-transport-order-form__grid">
                            <label className="create-transport-order-form__field">
                                <span>Imię</span>
                                <input
                                    value={form.patientFirstName}
                                    onChange={(event) =>
                                        updateField("patientFirstName", event.target.value)
                                    }
                                    placeholder="Imię pacjenta"
                                />
                            </label>

                            <label className="create-transport-order-form__field">
                                <span>Nazwisko</span>
                                <input
                                    value={form.patientLastName}
                                    onChange={(event) =>
                                        updateField("patientLastName", event.target.value)
                                    }
                                    placeholder="Nazwisko pacjenta"
                                />
                            </label>
                        </div>

                        <label className="create-transport-order-form__field">
                            <span>Dodatkowe informacje</span>
                            <input
                                value={form.pickupDetails}
                                onChange={(event) => updateField("pickupDetails", event.target.value)}
                            />
                        </label>
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