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
import { useToast } from "../toast/UseToast";
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
    orderType: string;
    source: string;
    priority: string;
    pickupAddress: string;
    destinationAddress: string;
    description: string;
    patients: PatientFormState[];
};

const emptyPatient: PatientFormState = {
    id: null,
    patientFirstName: "",
    patientLastName: "",
    pickupDetails: "",
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
        )
        .map((patient) => ({
            id: patient.id,
            patientFirstName: patient.patientFirstName.trim(),
            patientLastName: patient.patientLastName.trim(),
            pickupDetails: toNullableText(patient.pickupDetails),
        }));

    return {
        plannedDate: toNullableText(form.plannedDate),
        plannedDepartureTime: toNullableText(form.plannedDepartureTime),
        orderType: form.orderType,
        source: form.source,
        priority: form.priority,
        pickupAddress: form.pickupAddress.trim(),
        destinationAddress: form.destinationAddress.trim(),
        description: toNullableText(form.description),
        patients,
    };
}

export function ManagerEditTransportOrderPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [form, setForm] = useState<FormState | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [orderErrorMessage, setOrderErrorMessage] = useState<string | null>(null);
    const [patientErrorMessage, setPatientErrorMessage] = useState<string | null>(null);
    const [orderNumber, setOrderNumber] = useState<string | null>(null);

    const parsedOrderId = Number(orderId);

    useEffect(() => {
        async function loadOrder() {
            if (!Number.isInteger(parsedOrderId)) {
                setOrderErrorMessage("Nieprawidłowe ID zlecenia.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setOrderErrorMessage(null);

                const order = await getTransportOrderDetails(parsedOrderId);
                setForm(toFormState(order));
                setOrderNumber(order.orderNumber);
            } catch {
                setOrderErrorMessage("Nie udało się pobrać zlecenia.");
            } finally {
                setLoading(false);
            }
        }

        void loadOrder();
    }, [parsedOrderId]);

    function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
        setOrderErrorMessage(null);

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
        setPatientErrorMessage(null);

        setForm((previousForm) => {
            if (previousForm === null) {
                return previousForm;
            }

            return {
                ...previousForm,
                patients: previousForm.patients.map((patient, patientIndex) =>
                    patientIndex === index
                        ? {
                            ...patient,
                            [field]: value,
                        }
                        : patient
                ),
            };
        });
    }

    function addPatient() {
        if (form === null) {
            return;
        }

        if (form.patients.length > 0) {
            const lastPatientIndex = form.patients.length - 1;
            const lastPatient = form.patients[lastPatientIndex];
            const hasFirstName = hasText(lastPatient.patientFirstName);
            const hasLastName = hasText(lastPatient.patientLastName);
            const hasPickupDetails = hasText(lastPatient.pickupDetails);
            const patientHasAnyData = hasFirstName || hasLastName || hasPickupDetails;

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
        }

        setPatientErrorMessage(null);

        setForm((previousForm) => {
            if (previousForm === null) {
                return previousForm;
            }

            return {
                ...previousForm,
                patients: [...previousForm.patients, { ...emptyPatient }],
            };
        });
    }

    function removePatient(index: number) {
        setPatientErrorMessage(null);

        setForm((previousForm) => {
            if (previousForm === null) {
                return previousForm;
            }

            return {
                ...previousForm,
                patients: previousForm.patients.filter(
                    (_, patientIndex) => patientIndex !== index
                ),
            };
        });
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (form === null || !Number.isInteger(parsedOrderId)) {
            return;
        }

        setOrderErrorMessage(null);
        setPatientErrorMessage(null);

        const invalidPatientIndex = form.patients.findIndex((patient) => {
            const hasFirstName = hasText(patient.patientFirstName);
            const hasLastName = hasText(patient.patientLastName);
            const hasPickupDetails = hasText(patient.pickupDetails);
            const patientHasAnyData =
                patient.id !== null || hasFirstName || hasLastName || hasPickupDetails;

            return patientHasAnyData && (!hasFirstName || !hasLastName);
        });

        if (invalidPatientIndex !== -1) {
            setPatientErrorMessage(
                `Uzupełnij imię i nazwisko pacjenta nr ${invalidPatientIndex + 1}.`
            );
            return;
        }

        if (!hasText(form.pickupAddress)) {
            setOrderErrorMessage("Podaj miejsce odbioru.");
            return;
        }

        if (!hasText(form.destinationAddress)) {
            setOrderErrorMessage("Podaj miejsce docelowe.");
            return;
        }

        try {
            setSaving(true);

            const updatedOrder = await updateTransportOrderByManager(
                parsedOrderId,
                toRequest(form)
            );

            showToast(
                `Zlecenie ${updatedOrder.orderNumber} zostało zaktualizowane.`,
                "success"
            );

            navigate(
                form.plannedDate
                    ? `/manager/dashboard?date=${form.plannedDate}`
                    : "/manager/dashboard"
            );
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    setOrderErrorMessage("Sprawdź dane formularza.");
                    return;
                }

                if (error.response?.status === 403) {
                    setOrderErrorMessage("Brak uprawnień do edycji zlecenia.");
                    return;
                }

                if (error.response?.status === 404) {
                    setOrderErrorMessage("Nie znaleziono zlecenia.");
                    return;
                }

                if (error.response?.status === 409) {
                    setOrderErrorMessage(
                        "Nie można zapisać zmian. Sprawdź, czy numer zlecenia nie jest już używany."
                    );
                    return;
                }
            }

            setOrderErrorMessage("Nie udało się zapisać zmian.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <main className="manager-edit-order-page">
                <section className="manager-edit-order-card manager-edit-order-card--state">
                    <p className="manager-edit-order-card__state-text">Ładowanie zlecenia...</p>
                </section>
            </main>
        );
    }

    if (form === null) {
        return (
            <main className="manager-edit-order-page">
                <section className="manager-edit-order-card manager-edit-order-card--state">
                    <p className="manager-edit-order-card__message manager-edit-order-card__message--error">
                        {orderErrorMessage ?? "Nie znaleziono zlecenia."}
                    </p>
                    <button
                        className="manager-edit-order-card__back-button"
                        type="button"
                        onClick={() => navigate("/manager/dashboard")}
                    >
                        Powrót do harmonogramu
                    </button>
                </section>
            </main>
        );
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
                            Popraw dane transportu, termin realizacji i dane pacjentów.
                        </p>
                    </div>
                </header>

                {orderErrorMessage && (
                    <p className="manager-edit-order-card__message manager-edit-order-card__message--error">
                        {orderErrorMessage}
                    </p>
                )}

                <form className="manager-edit-order-form" onSubmit={handleSubmit}>
                    <section className="manager-edit-order-form__panel">
                        <h2 className="manager-edit-order-form__panel-title">Termin i numer</h2>

                        <div className="manager-edit-order-form__grid manager-edit-order-form__grid--three">
                            <label className="manager-edit-order-form__field">
                                <span>Data realizacji</span>
                                <input
                                    type="date"
                                    lang="pl-PL"
                                    value={form.plannedDate}
                                    onChange={(event) =>
                                        updateField("plannedDate", event.target.value)
                                    }
                                />
                            </label>

                            <label className="manager-edit-order-form__field">
                                <span>Godzina realizacji</span>
                                <input
                                    type="time"
                                    lang="pl-PL"
                                    value={form.plannedDepartureTime}
                                    onChange={(event) =>
                                        updateField("plannedDepartureTime", event.target.value)
                                    }
                                />
                            </label>

                            <label className="manager-edit-order-form__field">
                                <div className="manager-edit-order-form__field manager-edit-order-form__number">
                                    <span>Numer zlecenia</span>
                                    <strong>{orderNumber ?? "—"}</strong>
                                </div>
                            </label>
                        </div>
                    </section>

                    <section className="manager-edit-order-form__panel">
                        <h2 className="manager-edit-order-form__panel-title">Parametry transportu</h2>

                        <div className="manager-edit-order-form__grid manager-edit-order-form__grid--three">
                            <label className="manager-edit-order-form__field">
                                <span>Typ transportu</span>
                                <select
                                    value={form.orderType}
                                    onChange={(event) =>
                                        updateField("orderType", event.target.value)
                                    }
                                >
                                    {Object.entries(transportOrderTypeLabels).map(
                                        ([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        )
                                    )}
                                </select>
                            </label>

                            <label className="manager-edit-order-form__field">
                                <span>Źródło</span>
                                <select
                                    value={form.source}
                                    onChange={(event) =>
                                        updateField("source", event.target.value)
                                    }
                                >
                                    {Object.entries(transportSourceLabels).map(
                                        ([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        )
                                    )}
                                </select>
                            </label>

                            <label className="manager-edit-order-form__field">
                                <span>Priorytet</span>
                                <select
                                    value={form.priority}
                                    onChange={(event) =>
                                        updateField("priority", event.target.value)
                                    }
                                >
                                    {Object.entries(transportOrderPriorityLabels).map(
                                        ([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        )
                                    )}
                                </select>
                            </label>
                        </div>
                    </section>

                    <section className="manager-edit-order-form__panel">
                        <h2 className="manager-edit-order-form__panel-title">Trasa i opis</h2>

                        <div className="manager-edit-order-form__grid manager-edit-order-form__grid--two">
                            <label className="manager-edit-order-form__field">
                                <span>Skąd</span>
                                <input
                                    value={form.pickupAddress}
                                    onChange={(event) =>
                                        updateField("pickupAddress", event.target.value)
                                    }
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
                        </div>

                        <label className="manager-edit-order-form__field">
                            <span>Opis</span>
                            <textarea
                                value={form.description}
                                onChange={(event) =>
                                    updateField("description", event.target.value)
                                }
                                placeholder="Dodatkowe informacje"
                                rows={3}
                            />
                        </label>
                    </section>

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
                                + Dodaj pacjenta
                            </button>
                        </div>

                        {patientErrorMessage && (
                            <p className="manager-edit-order-form__patient-error">
                                {patientErrorMessage}
                            </p>
                        )}

                        {form.patients.length === 0 ? (
                            <div className="manager-edit-order-form__empty-state">
                                <strong>Brak pacjentów przypisanych do zlecenia.</strong>
                                <span>
                                    Zlecenie może pozostać bez pacjenta albo możesz dodać go przyciskiem powyżej.
                                </span>
                            </div>
                        ) : (
                            <div className="manager-edit-order-form__patients-list">
                                {form.patients.map((patient, index) => (
                                    <article
                                        className="manager-edit-order-form__patient-card"
                                        key={patient.id ?? `new-${index}`}
                                    >
                                        <header className="manager-edit-order-form__patient-header">
                                            <div>
                                                <h3>Pacjent nr {index + 1}</h3>
                                                <span>
                                                    {patient.id === null
                                                        ? "Nowy pacjent"
                                                        : "Pacjent zapisany w zleceniu"}
                                                </span>
                                            </div>

                                            <button
                                                className="manager-edit-order-form__danger-button"
                                                type="button"
                                                onClick={() => removePatient(index)}
                                            >
                                                Usuń pacjenta
                                            </button>
                                        </header>

                                        <div className="manager-edit-order-form__grid manager-edit-order-form__grid--patient">
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
                                        </div>
                                    </article>
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
