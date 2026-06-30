import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getAvailableAmbulances } from "../api/ambulancesApi";
import { createShift } from "../api/shiftsApi";
import type { AmbulanceShortResponse } from "../types/ambulance";
import type { ShiftType } from "../types/shift";
import { shiftTypeLabels } from "../utils/shiftLabels";
import "./CreateShiftPage.css";
import { formatDateTime } from "../utils/dateTimeFormat";

type FormState = {
    ambulanceId: string;
    shiftType: ShiftType;
    shiftDate: string;
    startTime: string;
    endTime: string;
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

function getTodayDate(): string {
    return new Date().toISOString().slice(0, 10);
}

function getDateTime(date: string, time: string): string {
    return `${date}T${time}`;
}

function getNextDayDate(date: string): string {
    const [year, month, day] = date.split("-").map(Number);

    const nextDate = new Date(Date.UTC(year, month - 1, day + 1));

    return nextDate.toISOString().slice(0, 10);
}

function calculateShiftTimes(shiftType: ShiftType, shiftDate: string) {
    if (shiftType === "DAY_12H") {
        return {
            startTime: getDateTime(shiftDate, "07:00"),
            endTime: getDateTime(shiftDate, "19:00"),
        };
    }

    if (shiftType === "NIGHT_12H") {
        return {
            startTime: getDateTime(shiftDate, "19:00"),
            endTime: getDateTime(getNextDayDate(shiftDate), "07:00"),
        };
    }

    if (shiftType === "FULL_24H") {
        return {
            startTime: getDateTime(shiftDate, "07:00"),
            endTime: getDateTime(getNextDayDate(shiftDate), "07:00"),
        };
    }

    return {
        startTime: getDateTime(shiftDate, "07:00"),
        endTime: getDateTime(shiftDate, "19:00"),
    };
}

const today = getTodayDate();

const initialFormState: FormState = {
    ambulanceId: "",
    shiftType: "FULL_24H",
    shiftDate: today,
    startTime: getDateTime(today, "07:00"),
    endTime: getDateTime(getNextDayDate(today), "07:00"),
};

export function CreateShiftPage() {
    const navigate = useNavigate();

    const [ambulances, setAmbulances] = useState<AmbulanceShortResponse[]>([]);
    const [form, setForm] = useState<FormState>(initialFormState);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const selectedAmbulance = useMemo(
        () =>
            ambulances.find(
                (ambulance) => ambulance.id === Number(form.ambulanceId)
            ) ?? null,
        [ambulances, form.ambulanceId]
    );

    useEffect(() => {
        async function loadAmbulances() {
            try {
                setLoading(true);
                setErrorMessage(null);

                const data = await getAvailableAmbulances();
                setAmbulances(data);

                if (data.length > 0) {
                    setForm((currentForm) => ({
                        ...currentForm,
                        ambulanceId: String(data[0].id),
                    }));
                }
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    if (error.response?.status === 401) {
                        setErrorMessage("Sesja wygasła. Zaloguj się ponownie.");
                        return;
                    }

                    if (error.response?.status === 403) {
                        setErrorMessage("Brak uprawnień do pobrania karetek.");
                        return;
                    }

                    setErrorMessage(
                        `Błąd pobierania karetek: ${error.response?.status ?? "brak odpowiedzi"
                        }`
                    );
                    return;
                }

                setErrorMessage("Nieznany błąd pobierania karetek.");
            } finally {
                setLoading(false);
            }
        }

        loadAmbulances();
    }, []);

    function updateShiftType(shiftType: ShiftType) {
        if (shiftType === "OTHER") {
            setForm((currentForm) => ({
                ...currentForm,
                shiftType,
            }));
            return;
        }

        const calculatedTimes = calculateShiftTimes(shiftType, form.shiftDate);

        setForm((currentForm) => ({
            ...currentForm,
            shiftType,
            startTime: calculatedTimes.startTime,
            endTime: calculatedTimes.endTime,
        }));
    }

    function updateShiftDate(shiftDate: string) {
        if (form.shiftType === "OTHER") {
            setForm((currentForm) => ({
                ...currentForm,
                shiftDate,
            }));
            return;
        }

        const calculatedTimes = calculateShiftTimes(form.shiftType, shiftDate);

        setForm((currentForm) => ({
            ...currentForm,
            shiftDate,
            startTime: calculatedTimes.startTime,
            endTime: calculatedTimes.endTime,
        }));
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const ambulanceId = Number(form.ambulanceId);

        if (!ambulanceId || Number.isNaN(ambulanceId)) {
            setErrorMessage("Wybierz karetkę.");
            return;
        }

        if (!form.shiftDate) {
            setErrorMessage("Wybierz datę zmiany.");
            return;
        }

        if (!form.startTime || !form.endTime) {
            setErrorMessage("Podaj czas rozpoczęcia i zakończenia zmiany.");
            return;
        }

        if (new Date(form.endTime) <= new Date(form.startTime)) {
            setErrorMessage("Czas zakończenia musi być późniejszy niż czas rozpoczęcia.");
            return;
        }

        try {
            setSubmitting(true);
            setErrorMessage(null);

            await createShift({
                ambulanceId,
                shiftType: form.shiftType,
                shiftDate: form.shiftDate,
                startTime: form.startTime,
                endTime: form.endTime,
            });

            navigate("/dashboard", { replace: true });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const errorCode = getApiErrorCode(error);

                if (errorCode === "DRIVER_ALREADY_HAS_ACTIVE_SHIFT") {
                    setErrorMessage("Masz już aktywną zmianę. Nie możesz rozpocząć kolejnej.");
                    return;
                }

                if (
                    errorCode === "AMBULANCE_ALREADY_IN_ACTIVE_SHIFT" ||
                    errorCode === "AMBULANCE_NOT_AVAILABLE"
                ) {
                    setErrorMessage("Wybrana karetka jest już zajęta albo niedostępna.");
                    return;
                }

                if (errorCode === "AMBULANCE_NOT_ACTIVE") {
                    setErrorMessage("Wybrana karetka jest nieaktywna.");
                    return;
                }

                if (errorCode === "INVALID_SHIFT_TIME") {
                    setErrorMessage("Czas zakończenia musi być późniejszy niż czas rozpoczęcia.");
                    return;
                }

                if (errorCode === "SHIFT_DATE_REQUIRED") {
                    setErrorMessage("Wybierz datę zmiany.");
                    return;
                }

                if (errorCode === "SHIFT_TIME_REQUIRED") {
                    setErrorMessage("Podaj godzinę rozpoczęcia i zakończenia zmiany.");
                    return;
                }

                if (error.response?.status === 401) {
                    setErrorMessage("Sesja wygasła. Zaloguj się ponownie.");
                    return;
                }

                if (error.response?.status === 403) {
                    setErrorMessage("Brak uprawnień do utworzenia zmiany.");
                    return;
                }

                if (error.response?.status === 404) {
                    setErrorMessage("Nie znaleziono wybranej karetki.");
                    return;
                }

                setErrorMessage("Nie udało się utworzyć zmiany.");
                return;
            }

            setErrorMessage("Nieznany błąd tworzenia zmiany.");

        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <main className="create-shift-page">
                <p className="create-shift-page__message">Ładowanie dostępnych karetek...</p>
            </main>
        );
    }

    return (
        <main className="create-shift-page">
            <section className="create-shift-card">
                <header className="create-shift-card__header">
                    <button
                        className="create-shift-card__back-button"
                        type="button"
                        onClick={() => navigate("/dashboard")}
                    >
                        Wróć
                    </button>

                    <div>
                        <h1 className="create-shift-card__title">Utwórz zmianę</h1>
                        <p className="create-shift-card__subtitle">
                            Wybierz karetkę i rozpocznij aktywną zmianę.
                        </p>
                    </div>
                </header>

                {errorMessage && (
                    <p className="create-shift-page__message create-shift-page__message--error">
                        {errorMessage}
                    </p>
                )}

                {ambulances.length === 0 ? (
                    <p className="create-shift-page__message">
                        Brak dostępnych karetek. Wszystkie są zajęte albo niedostępne.
                    </p>
                ) : (
                    <form className="create-shift-form" onSubmit={handleSubmit}>
                        <label className="create-shift-form__field">
                            <span>Karetka</span>
                            <select
                                value={form.ambulanceId}
                                onChange={(event) =>
                                    setForm((currentForm) => ({
                                        ...currentForm,
                                        ambulanceId: event.target.value,
                                    }))
                                }
                            >
                                {ambulances.map((ambulance) => (
                                    <option key={ambulance.id} value={ambulance.id}>
                                        {ambulance.registrationPlates} — {ambulance.carBrand}{" "}
                                        {ambulance.model} — {ambulance.mileage} km
                                    </option>
                                ))}
                            </select>
                        </label>

                        {selectedAmbulance && (
                            <article className="create-shift-ambulance-preview">
                                <p>
                                    <strong>Wybrana karetka:</strong>{" "}
                                    {selectedAmbulance.registrationPlates}
                                </p>
                                <p>
                                    <strong>Pojazd:</strong> {selectedAmbulance.carBrand}{" "}
                                    {selectedAmbulance.model}
                                </p>
                                <p>
                                    <strong>Przebieg:</strong> {selectedAmbulance.mileage} km
                                </p>
                            </article>
                        )}

                        <div className="create-shift-form__grid">
                            <label className="create-shift-form__field">
                                <span>Typ zmiany</span>
                                <select
                                    value={form.shiftType}
                                    onChange={(event) =>
                                        updateShiftType(event.target.value as ShiftType)
                                    }
                                >
                                    {Object.entries(shiftTypeLabels).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="create-shift-form__field">
                                <span>Data zmiany</span>
                                <input
                                    type="date"
                                    value={form.shiftDate}
                                    onChange={(event) => updateShiftDate(event.target.value)}
                                />
                            </label>
                        </div>

                        {form.shiftType === "OTHER" ? (
                            <div className="create-shift-form__grid">
                                <label className="create-shift-form__field">
                                    <span>Start</span>
                                    <input
                                        type="datetime-local"
                                        value={form.startTime}
                                        onChange={(event) =>
                                            setForm((currentForm) => ({
                                                ...currentForm,
                                                startTime: event.target.value,
                                            }))
                                        }
                                    />
                                </label>

                                <label className="create-shift-form__field">
                                    <span>Koniec</span>
                                    <input
                                        type="datetime-local"
                                        value={form.endTime}
                                        onChange={(event) =>
                                            setForm((currentForm) => ({
                                                ...currentForm,
                                                endTime: event.target.value,
                                            }))
                                        }
                                    />
                                </label>
                            </div>
                        ) : (
                            <article className="create-shift-time-preview">
                                <p>
                                    <strong>Start:</strong> {formatDateTime(form.startTime)}
                                </p>
                                <p>
                                    <strong>Koniec:</strong> {formatDateTime(form.endTime)}
                                </p>
                            </article>
                        )}

                        <div className="create-shift-form__actions">
                            <button
                                className="create-shift-form__submit-button"
                                type="submit"
                                disabled={submitting}
                            >
                                {submitting ? "Tworzenie..." : "Rozpocznij zmianę"}
                            </button>
                        </div>
                    </form>
                )}
            </section>
        </main>
    );
}