import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    getTransportOrderDetails,
    updateTransportOrderByManager,
} from "../api/transportOrdersApi";
import type {
    TransportOrderDetailsResponse,
    UpdateTransportOrderByManagerRequest,
    TransportOrderPatientDataUpdateRequest,
} from "../types/transportOrder";
import {
    transportOrderPriorityLabels,
    transportOrderTypeLabels,
    transportSourceLabels,
} from "../utils/transportOrderLabels";
import "./ManagerEditTransportOrderPage.css";



type PatientFormState = {
    id: number | null;
    patientFirstName: string;
    patientLastName: string;
    pickupDetails: string;
};

type FormState = {
    plannedDate: string;
    plannedDepartureTime: string;
    orderNumber: string;
    orderType: string;
    source: string;
    priority: string;
    pickupAddress: string;
    destinationAddress: string;
    description: string;
    patients: PatientFormState[];
};

function toNullableText(value: string): string | null {
    const trimmedValue = value.trim();
    return trimmedValue.length === 0 ? null : trimmedValue;
}

function hasText(value: string): boolean {
    return value.trim().length > 0;
}
function toFormState(order: TransportOrderDetailsResponse): FormState {
    return {
        plannedDate: order.plannedDate ?? "",
        plannedDepartureTime: order.plannedDepartureTime?.slice(0, 5) ?? "",
        orderNumber: order.orderNumber ?? "",
        orderType: order.orderType,
        source: order.source,
        priority: order.priority,
        pickupAddress: order.pickupAddress ?? "",
        destinationAddress: order.destinationAddress ?? "",
        description: order.description ?? "",
        patients: order.patients.map((patient) => ({
            id: patient.id,
            patientFirstName: patient.patientFirstName ?? "",
            patientLastName: patient.patientLastName ?? "",
            pickupDetails: patient.pickupDetails ?? "",
        })),
    };
}

function toRequest(form: FormState): UpdateTransportOrderByManagerRequest {
    const patients: TransportOrderPatientDataUpdateRequest[] = form.patients
        .filter(
            (patient) =>
                patient.id !== null ||
                hasText(patient.patientFirstName) ||
                hasText(patient.patientLastName) ||
                hasText(patient.pickupDetails)
        ).map(
            (patient) => ({
                id: patient.id,
                patientFirstName: patient.patientFirstName.trim(),
                patientLastName: patient.patientLastName.trim(),
                pickupDetails: toNullableText(patient.pickupDetails),
            }));

    return {
        plannedDate: toNullableText(form.plannedDate),
        plannedDepartureTime:
            toNullableText(form.plannedDepartureTime),
        orderNumber: toNullableText(form.orderNumber),
        orderType: form.orderType,
        source: form.source,
        priority: form.priority,
        pickupAddress: form.pickupAddress,
        destinationAddress: form.destinationAddress,
        description: toNullableText(form.description),
        patients,
    };
}

export function ManagerEditTransportOrderPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState<FormState | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const parsedOrderId = Number(orderId);

    useEffect(() => {
        async function loadOrder() {
            if (!Number.isInteger(parsedOrderId)) {
                setErrorMessage("Nieprawidłowe ID zlecenia.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setErrorMessage(null);

                const order = await getTransportOrderDetails(parsedOrderId);
                setForm(toFormState(order));
            } catch {
                setErrorMessage("Nie udało się pobrać zlecenia.");
            } finally {
                setLoading(false);
            }
        }

        loadOrder();
    }, [parsedOrderId]);

    function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
        setForm((previousForm) => {
            if (previousForm === null) {
                return previousForm;
            }

            return {
                ...previousForm,
                [field]: value,
            };
        });
    }

    function updatePatientField(
        index: number,
        field: keyof PatientFormState,
        value: string
    ) {
        setForm((previousForm) => {
            if (previousForm === null) {
                return previousForm;
            }

            const nextPatients = [...previousForm.patients];

            nextPatients[index] = {
                ...nextPatients[index],
                [field]: value,
            };

            return {
                ...previousForm,
                patients: nextPatients,
            };
        });
    }

    function addPatient() {
        setForm((previousForm) => {
            if (previousForm === null) {
                return previousForm;
            }

            return {
                ...previousForm,
                patients: [
                    ...previousForm.patients,
                    {
                        id: null,
                        patientFirstName: "",
                        patientLastName: "",
                        pickupDetails: "",
                    },
                ],
            };
        });
    }

    function removePatient(index: number) {
        setForm((previousForm) => {
            if (previousForm === null) {
                return previousForm;
            }

            return {
                ...previousForm,
                patients: previousForm.patients.filter((_, patientIndex) => patientIndex !== index),
            };
        });
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (form === null || !Number.isInteger(parsedOrderId)) {
            return;
        }
        const patientsToValidate = form.patients.filter(
            (patient) =>
                patient.id !== null ||
                hasText(patient.patientFirstName) ||
                hasText(patient.patientLastName) ||
                hasText(patient.pickupDetails)
        );

        const invalidPatient = patientsToValidate.find(
            (patient) =>
                !hasText(patient.patientFirstName) ||
                !hasText(patient.patientLastName)
        );

        if (invalidPatient) {
            setErrorMessage("Jeśli dodajesz pacjenta, podaj imię i nazwisko.");
            return;
        }

        if (!hasText(form.pickupAddress)) {
            setErrorMessage("Podaj miejsce odbioru.");
            return;
        }

        if (!hasText(form.destinationAddress)) {
            setErrorMessage("Podaj miejsce docelowe.");
            return;
        }
        try {
            setSaving(true);
            setErrorMessage(null);

            await updateTransportOrderByManager(parsedOrderId, toRequest(form));

            navigate("/manager/dashboard");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    setErrorMessage("Sprawdź dane formularza.");
                    return;
                }

                if (error.response?.status === 403) {
                    setErrorMessage("Brak uprawnień do edycji zlecenia.");
                    return;
                }

                if (error.response?.status === 404) {
                    setErrorMessage("Nie znaleziono zlecenia.");
                    return;
                }
            }

            setErrorMessage("Nie udało się zapisać zmian.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <p>Ładowanie zlecenia...</p>;
    }

    if (form === null) {
        return <p>{errorMessage ?? "Nie znaleziono zlecenia."}</p>;
    }

    return (
        <main className="manager-edit-order-page">
            <section className="manager-edit-order-card">
                <header className="manager-edit-order-card__header">
                    <button
                        className="manager-edit-order-card__back-button"
                        type="button"
                        onClick={() => navigate(-1)}
                    >
                        Powrót
                    </button>

                    <div>
                        <h1 className="manager-edit-order-card__title">Edytuj zlecenie</h1>
                        <p className="manager-edit-order-card__subtitle">
                            Popraw dane transportu, harmonogram i dane pacjentów.
                        </p>
                    </div>
                </header>

                {errorMessage && (
                    <p className="manager-edit-order-card__message manager-edit-order-card__message--error">
                        {errorMessage}
                    </p>
                )}

                <form className="manager-edit-order-form" onSubmit={handleSubmit}>
                    <div className="manager-edit-order-form__grid manager-edit-order-form__grid--three">
                        <label className="manager-edit-order-form__field">
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

                        <label className="manager-edit-order-form__field">
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

                        <label className="manager-edit-order-form__field">
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

                    <div className="manager-edit-order-form__grid">
                        <label className="manager-edit-order-form__field">
                            <span>Data realizacji</span>
                            <input
                                type="date"
                                value={form.plannedDate}
                                onChange={(event) => updateField("plannedDate", event.target.value)}
                            />
                        </label>

                        <label className="manager-edit-order-form__field">
                            <span>Godzina realizacji</span>
                            <input
                                type="time"
                                value={form.plannedDepartureTime}
                                onChange={(event) =>
                                    updateField("plannedDepartureTime", event.target.value)
                                }
                            />
                        </label>

                        <label className="manager-edit-order-form__field">
                            <span>Numer zlecenia</span>
                            <input
                                value={form.orderNumber}
                                onChange={(event) => updateField("orderNumber", event.target.value)}
                                placeholder="np. 123/2026"
                            />
                        </label>
                    </div>

                    <label className="manager-edit-order-form__field">
                        <span>Skąd</span>
                        <input
                            value={form.pickupAddress}
                            onChange={(event) => updateField("pickupAddress", event.target.value)}
                            placeholder="Miejsce odbioru pacjenta"
                        />
                    </label>

                    <label className="manager-edit-order-form__field">
                        <span>Dokąd</span>
                        <input
                            value={form.destinationAddress}
                            onChange={(event) =>
                                updateField("destinationAddress", event.target.value)
                            }
                            placeholder="Miejsce docelowe"
                        />
                    </label>

                    <label className="manager-edit-order-form__field">
                        <span>Opis</span>
                        <textarea
                            value={form.description}
                            onChange={(event) => updateField("description", event.target.value)}
                            placeholder="Dodatkowe informacje"
                            rows={3}
                        />
                    </label>

                    <section className="manager-edit-order-form__section">
                        <div className="manager-edit-order-form__section-header">
                            <div>
                                <h2>Pacjenci</h2>
                                <p>
                                    Dodaj, popraw albo usuń pacjentów przypisanych do tego zlecenia.
                                </p>
                            </div>

                            <button
                                className="manager-edit-order-form__secondary-button"
                                type="button"
                                onClick={addPatient}
                            >
                                Dodaj pacjenta
                            </button>
                        </div>

                        {form.patients.length === 0 ? (
                            <p className="manager-edit-order-form__empty-state">
                                Brak pacjentów przypisanych do zlecenia.
                            </p>
                        ) : (
                            <div className="manager-edit-order-form__patients-list">
                                {form.patients.map((patient, index) => (
                                    <div
                                        className="manager-edit-order-form__patient-row"
                                        key={patient.id ?? `new-${index}`}
                                    >
                                        <label className="manager-edit-order-form__field">
                                            <span>Imię</span>
                                            <input
                                                value={patient.patientFirstName}
                                                onChange={(event) =>
                                                    updatePatientField(
                                                        index,
                                                        "patientFirstName",
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Imię pacjenta"
                                            />
                                        </label>

                                        <label className="manager-edit-order-form__field">
                                            <span>Nazwisko</span>
                                            <input
                                                value={patient.patientLastName}
                                                onChange={(event) =>
                                                    updatePatientField(
                                                        index,
                                                        "patientLastName",
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Nazwisko pacjenta"
                                            />
                                        </label>

                                        <label className="manager-edit-order-form__field">
                                            <span>Szczegóły odbioru</span>
                                            <input
                                                value={patient.pickupDetails}
                                                onChange={(event) =>
                                                    updatePatientField(
                                                        index,
                                                        "pickupDetails",
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="np. sala, oddział, piętro"
                                            />
                                        </label>

                                        <button
                                            className="manager-edit-order-form__danger-button"
                                            type="button"
                                            onClick={() => removePatient(index)}
                                        >
                                            Usuń
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <div className="manager-edit-order-form__actions">
                        <button
                            className="manager-edit-order-form__cancel-button"
                            type="button"
                            onClick={() => navigate("/manager/dashboard")}
                        >
                            Anuluj
                        </button>

                        <button
                            className="manager-edit-order-form__submit-button"
                            type="submit"
                            disabled={saving}
                        >
                            {saving ? "Zapisywanie..." : "Zapisz zmiany"}
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
}