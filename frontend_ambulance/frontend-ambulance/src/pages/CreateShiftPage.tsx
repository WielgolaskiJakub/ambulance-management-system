import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getAvailableAmbulances } from "../api/ambulancesApi";
import { createShift } from "../api/shiftsApi";
import {
    getAvailableSanitaryMembers,
    type CrewMemberOptionResponse,
} from "../api/crewMemberApi";
import type { AmbulanceShortResponse } from "../types/ambulance";
import type { ShiftType } from "../types/shift";
import { shiftTypeLabels } from "../utils/shiftLabels";
import { formatDateTime } from "../utils/dateTimeFormat";
import "./CreateShiftPage.css";

type FormState = {
    ambulanceId: string;
    shiftType: ShiftType;
    startTime: string;
    endTime: string;
    defaultMemberUserId: string;
    defaultMemberStartTime: string;
    defaultMemberEndTime: string;
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

function isStandardWindow(now = new Date()): boolean {
    const hour = now.getHours();
    const minute = now.getMinutes();

    return hour < 17 || (hour === 17 && minute === 0);
}

function getAvailableShiftTypes(): ShiftType[] {
    if (isStandardWindow()) {
        return ["DAY_12H", "FULL_24H", "OTHER"]
    }

    return ["NIGHT_12H", "OTHER"];
}

function getTodayDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
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

function getDefaultSanitaryTimes(
    shiftType: ShiftType,
    shiftDate: string
): {
    defaultMemberStartTime: string;
    defaultMemberEndTime: string;
} | null {
    if (shiftType === "NIGHT_12H" || shiftType === "OTHER") {
        return null;
    }

    const [year, month, day] = shiftDate.split("-").map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    // Niedziela: standardowo nie ma sanitariusza.
    if (dayOfWeek === 0) {
        return null;
    }

    // Sobota: jeden sanitariusz 08:00–14:00.
    if (dayOfWeek === 6) {
        return {
            defaultMemberStartTime: getDateTime(shiftDate, "08:00"),
            defaultMemberEndTime: getDateTime(shiftDate, "14:00"),
        };
    }

    // Poniedziałek–piątek: standardowy dzienny skład.
    return {
        defaultMemberStartTime: getDateTime(shiftDate, "07:00"),
        defaultMemberEndTime: getDateTime(shiftDate, "19:00"),
    };
}

const today = getTodayDate();

const initialShiftType: ShiftType = isStandardWindow()
    ? "FULL_24H"
    : "NIGHT_12H";

const initialShiftTimes = calculateShiftTimes(initialShiftType, today);

const initialDefaultMemberTimes = getDefaultSanitaryTimes(
    initialShiftType,
    today
);

const initialFormState: FormState = {
    ambulanceId: "",
    shiftType: initialShiftType,
    startTime: initialShiftTimes.startTime,
    endTime: initialShiftTimes.endTime,
    defaultMemberUserId: "",
    defaultMemberStartTime: initialDefaultMemberTimes?.defaultMemberStartTime ?? "",
    defaultMemberEndTime: initialDefaultMemberTimes?.defaultMemberEndTime ?? "",
};

export function CreateShiftPage() {
    const navigate = useNavigate();

    const [ambulances, setAmbulances] = useState<AmbulanceShortResponse[]>([]);
    const [crewMembers, setCrewMembers] = useState<CrewMemberOptionResponse[]>([]);
    const [form, setForm] = useState<FormState>(initialFormState);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [isExceptionalSanitaryEnabled, setIsExceptionalSanitaryEnabled] = useState(false);

    const selectedAmbulance = useMemo(
        () =>
            ambulances.find(
                (ambulance) => ambulance.id === Number(form.ambulanceId)
            ) ?? null,
        [ambulances, form.ambulanceId]
    );

    useEffect(() => {
        async function loadInitialData() {
            try {
                setLoading(true);
                setErrorMessage(null);

                const [ambulancesData, crewMembersData] = await Promise.all([
                    getAvailableAmbulances(),
                    getAvailableSanitaryMembers(),
                ]);

                setAmbulances(ambulancesData);
                setCrewMembers(crewMembersData);

                if (ambulancesData.length > 0) {
                    setForm((currentForm) => ({
                        ...currentForm,
                        ambulanceId: String(ambulancesData[0].id),
                    }));
                }
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    if (error.response?.status === 401) {
                        setErrorMessage("Sesja wygasła. Zaloguj się ponownie.");
                        return;
                    }

                    if (error.response?.status === 403) {
                        setErrorMessage("Brak uprawnień do pobrania danych formularza.");
                        return;
                    }

                    setErrorMessage(
                        `Błąd pobierania danych formularza: ${error.response?.status ?? "brak odpowiedzi"
                        }`
                    );
                    return;
                }

                setErrorMessage("Nieznany błąd pobierania danych formularza.");
            } finally {
                setLoading(false);
            }
        }

        loadInitialData();
    }, []);

    function updateShiftType(shiftType: ShiftType) {
        setIsExceptionalSanitaryEnabled(false);
        if (shiftType === "OTHER") {
            setForm((currentForm) => ({
                ...currentForm,
                shiftType,
                defaultMemberUserId: "",
                defaultMemberStartTime: "",
                defaultMemberEndTime: "",
            }));
            return;
        }

        const calculatedTimes = calculateShiftTimes(shiftType, getTodayDate());
        const defaultMemberTimes = getDefaultSanitaryTimes(
            shiftType,
            getTodayDate()
        );

        setForm((currentForm) => ({
            ...currentForm,
            shiftType,
            startTime: calculatedTimes.startTime,
            endTime: calculatedTimes.endTime,
            defaultMemberUserId: defaultMemberTimes ? currentForm.defaultMemberUserId : "",
            defaultMemberStartTime: defaultMemberTimes?.defaultMemberStartTime ?? "",
            defaultMemberEndTime: defaultMemberTimes?.defaultMemberEndTime ?? "",
        }));
    }

    function toggleExceptionalSanitary(enabled: boolean) {
        setIsExceptionalSanitaryEnabled(enabled);

        setForm((currentForm) => ({
            ...currentForm,
            defaultMemberUserId: enabled
                ? currentForm.defaultMemberUserId
                : "",
            defaultMemberStartTime: enabled
                ? currentForm.startTime
                : "",
            defaultMemberEndTime: enabled
                ? currentForm.endTime
                : "",
        }));
    }

    function validateDefaultMemberTimes(): boolean {
        if (!form.defaultMemberUserId) {
            return true;
        }

        if (!form.defaultMemberStartTime || !form.defaultMemberEndTime) {
            setErrorMessage("Podaj godziny pracy członka załogi.");
            return false;
        }

        if (new Date(form.defaultMemberEndTime) <= new Date(form.defaultMemberStartTime)) {
            setErrorMessage("Koniec pracy członka załogi musi być późniejszy niż start.");
            return false;
        }

        if (new Date(form.defaultMemberStartTime) < new Date(form.startTime)) {
            setErrorMessage("Członek załogi nie może zaczynać przed początkiem zmiany.");
            return false;
        }

        return true;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const ambulanceId = Number(form.ambulanceId);

        if (!ambulanceId || Number.isNaN(ambulanceId)) {
            setErrorMessage("Wybierz karetkę.");
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

        if (!validateDefaultMemberTimes()) {
            return;
        }

        try {
            setSubmitting(true);
            setErrorMessage(null);

            await createShift({
                ambulanceId,
                shiftType: form.shiftType,
                startTime: form.startTime,
                endTime: form.endTime,
                defaultMember: form.defaultMemberUserId
                    ? {
                        userId: Number(form.defaultMemberUserId),
                        startTime: form.defaultMemberStartTime,
                        endTime: form.defaultMemberEndTime,
                    }
                    : null,
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
                if (errorCode === "SHIFT_END_TIME_IN_PAST") {
                    setErrorMessage(
                        "Nie możesz utworzyć zmiany, która już się zakończyła."
                    );
                    return;
                }
                if (errorCode === "SHIFT_DEFAULT_MEMBER_TIME_CONFLICT") {
                    setErrorMessage(
                        "Wybrany sanitariusz jest już przypisany do innej aktywnej zmiany w tych godzinach."
                    );
                    return;
                }
                if (errorCode === "SHIFT_TYPE_NOT_AVAILABLE_AT_CURRENT_TIME") {
                    setErrorMessage(
                        "O tej godzinie wybierz zmianę nocną albo nietypowy dyżur."
                    );
                    return;
                }
                if (errorCode === "SHIFT_DEFAULT_MEMBER_START_BEFORE_SHIFT") {
                    setErrorMessage(
                        "Sanitariusz nie może zaczynać przed rozpoczęciem tej zmiany."
                    );
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
                <p className="create-shift-page__message">
                    Ładowanie dostępnych karetek...
                </p>
            </main>
        );
    }
    const availableShiftTypes = getAvailableShiftTypes();

    const regularSanitaryTimes = getDefaultSanitaryTimes(
        form.shiftType,
        getTodayDate()
    );

    const hasRegularSanitary = regularSanitaryTimes !== null;

    const shouldShowSanitarySection = hasRegularSanitary || isExceptionalSanitaryEnabled;

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
                                    {availableShiftTypes.map((shiftType) => (
                                        <option key={shiftType} value={shiftType}>
                                            {shiftTypeLabels[shiftType]}
                                        </option>
                                    ))}
                                </select>
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
                                                defaultMemberStartTime: event.target.value,
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
                                                defaultMemberEndTime: event.target.value,
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

                        {!hasRegularSanitary && (
                            <section className="create-shift-exception">
                                <div>
                                    <strong>Sanitariusz poza standardową obsadą</strong>
                                    <p>
                                        {form.shiftType === "NIGHT_12H"
                                            ? "Nocna zmiana standardowo odbywa się bez sanitariusza."
                                            : "Dla tej zmiany sanitariusz nie jest standardowo zaplanowany."}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className={
                                        isExceptionalSanitaryEnabled
                                            ? "create-shift-exception__button create-shift-exception__button--active"
                                            : "create-shift-exception__button"
                                    }
                                    onClick={() =>
                                        toggleExceptionalSanitary(!isExceptionalSanitaryEnabled)
                                    }
                                >
                                    {isExceptionalSanitaryEnabled
                                        ? "Usuń sanitariusza"
                                        : "Dodaj sanitariusza"}
                                </button>
                            </section>
                        )}

                        {shouldShowSanitarySection && (
                            <>
                                <label className="create-shift-form__field">
                                    <span>Członek załogi</span>
                                    <select
                                        value={form.defaultMemberUserId}
                                        onChange={(event) =>
                                            setForm((currentForm) => ({
                                                ...currentForm,
                                                defaultMemberUserId: event.target.value,
                                            }))
                                        }
                                    >
                                        <option value="">Brak / dyżur bez sanitariusza</option>

                                        {crewMembers.map((member) => (
                                            <option key={member.id} value={member.id}>
                                                {member.firstName} {member.lastName}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                {form.defaultMemberUserId && (
                                    <div className="create-shift-form__grid">
                                        <label className="create-shift-form__field">
                                            <span>Start członka załogi</span>
                                            <input
                                                type="datetime-local"
                                                value={form.defaultMemberStartTime}
                                                onChange={(event) =>
                                                    setForm((currentForm) => ({
                                                        ...currentForm,
                                                        defaultMemberStartTime: event.target.value,
                                                    }))
                                                }
                                            />
                                        </label>

                                        <label className="create-shift-form__field">
                                            <span>Koniec członka załogi</span>
                                            <input
                                                type="datetime-local"
                                                value={form.defaultMemberEndTime}
                                                onChange={(event) =>
                                                    setForm((currentForm) => ({
                                                        ...currentForm,
                                                        defaultMemberEndTime: event.target.value,
                                                    }))
                                                }
                                            />
                                        </label>
                                    </div>
                                )}
                            </>
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