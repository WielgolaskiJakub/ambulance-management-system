import axios from "axios";
import {
    useEffect,
    useState,
    type SyntheticEvent
} from "react";
import {
    createAmbulance,
    updateAmbulance,
    getAllAmbulances,
    deactivateAmbulanceById,
    markAmbulanceAvailable,
    markAmbulanceOutOfService,
    restoreAmbulanceById
} from "../api/ambulancesApi"
import type { AmbulanceResponse, AmbulanceStatus } from "../types/ambulance";
import "./ManagerAmbulancesPage.css";
import { getCurrentUserRole } from "../utils/auth";
import { useToast } from "../toast/UseToast";

type AddNewAmbulanceFormState = {
    carBrand: string;
    model: string;
    registrationPlates: string;
    mileage: string;
    summerFuelConsumptionNorm: string;
    winterFuelConsumptionNorm: string;
    tankCapacityLiters: string;
};

type VehicleEditFormState = {
    carBrand: string;
    model: string;
    registrationPlates: string;
    mileage: string;
    summerFuelConsumptionNorm: string;
    winterFuelConsumptionNorm: string;
    tankCapacityLiters: string;
}

const initialFormState: AddNewAmbulanceFormState = {
    carBrand: "",
    model: "",
    registrationPlates: "WWL",
    mileage: "",
    summerFuelConsumptionNorm: "",
    winterFuelConsumptionNorm: "",
    tankCapacityLiters: ""
};

function hasText(value: string): boolean {
    return value.trim().length > 0;
}

export function ManagerAmbulancesPage() {

    const currentUserRole = getCurrentUserRole();
    const {showToast} = useToast();

    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);

    const [ambulances, setAmbulances] = useState<AmbulanceResponse[]>([]);
    const [selectedAmbulance, setSelectedAmbulance] = useState<AmbulanceResponse | null>(null);
    const [form, setForm] = useState<AddNewAmbulanceFormState>(initialFormState);
    const [editedAmbulanceId, setEditedAmbulanceId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<VehicleEditFormState | null>(null);
    const [updating, setUpdating] = useState(false);
    const [editErrorMessage, setEditErrorMessage] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] =
        useState<AmbulanceStatus | "ALL">("ALL");

    const [changingAmbulanceId, setChangingAmbulanceId] = useState<number | null>(null);

    useEffect(() => {
        async function loadAmbulances() {
            try {
                setLoading(true);
                setErrorMessage(null);

                const ambulancesData = await getAllAmbulances();

                setAmbulances(ambulancesData);
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    setErrorMessage(
                        `Błąd pobierania pojazdów: ${error.response?.status ?? "brak odpowiedzi"
                        }`
                    );
                    return;
                }
                setErrorMessage("Nieznany błąd pobierania pojazdów.")
            } finally {
                setLoading(false);
            }
        }
        loadAmbulances();
    },
        []);

    if (loading) {
        return <p>Ładowanie pojazdów...</p>
    }

    if (errorMessage) {
        return <p>{errorMessage}</p>
    }

    async function handleAddAmbulance(
        event: SyntheticEvent<HTMLFormElement>
    ) {
        event.preventDefault();


        if (!hasText(form.carBrand)) {
            setFormErrorMessage("Podaj markę pojazdu.");
            return;
        }

        if (!hasText(form.model)) {
            setFormErrorMessage("Podaj model pojazdu.");
            return;
        }

        if (!hasText(form.registrationPlates)) {
            setFormErrorMessage("Podaj tablice rejestracyjne pojazdu.");
            return;
        }
        if (!hasText(form.mileage)) {
            setFormErrorMessage("Podaj przebieg pojazdu.");
            return;
        }
        if (!hasText(form.summerFuelConsumptionNorm)) {
            setFormErrorMessage("Podaj letnią norme spalania pojazdu.");
            return;
        }
        if (!hasText(form.winterFuelConsumptionNorm)) {
            setFormErrorMessage("Podaj zimową norme spalania pojazdu.");
            return;
        }
        if (!hasText(form.tankCapacityLiters)) {
            setFormErrorMessage("Podaj pojemność zbiornika paliwa pojazdu.");
            return;
        }

        try {
            setAdding(true);
            setFormErrorMessage(null);

            const createdVehicle = await createAmbulance({
                carBrand: form.carBrand.trim(),
                model: form.model.trim(),
                registrationPlates: form.registrationPlates.trim(),
                mileage: Number(form.mileage),
                summerFuelConsumptionNorm: Number(form.summerFuelConsumptionNorm),
                winterFuelConsumptionNorm: Number(form.winterFuelConsumptionNorm),
                tankCapacityLiters: Number(form.tankCapacityLiters)
            });

            setAmbulances((currentAmbulance) => [
                ...currentAmbulance,
                createdVehicle,
            ]);

            setForm(initialFormState);
            
            showToast(
                `Pojazd ${createdVehicle.carBrand} ${createdVehicle.model} o numerze ${createdVehicle.registrationPlates} został dodany.`,
                "success"
            );

        } catch (error) {
            if (axios.isAxiosError(error)) {
                setFormErrorMessage(
                    error.response?.data?.message ??
                    `Nie udało się dodać pojazdu. Kod ${error.response?.status ?? "brak odpowiedzi"
                    }`
                );
                return
            }
            setFormErrorMessage("Wystąpił nieznany błąd podczas dodawania pojazdu.")
        } finally {
            setAdding(false);
        }
    }

    function openEditForm(ambualnce: AmbulanceResponse) {
        setEditedAmbulanceId(ambualnce.id);

        setEditForm({
            carBrand: ambualnce.carBrand,
            model: ambualnce.model,
            registrationPlates: ambualnce.registrationPlates,
            mileage: String(ambualnce.mileage),
            summerFuelConsumptionNorm: String(ambualnce.summerFuelConsumptionNorm),
            winterFuelConsumptionNorm: String(ambualnce.winterFuelConsumptionNorm),
            tankCapacityLiters: String(ambualnce.tankCapacityLiters),
        });
        setEditErrorMessage(null);
    }

    function closeEditForm() {
        setEditedAmbulanceId(null);
        setEditForm(null);
        setEditErrorMessage(null);
    }

    function replaceAmbulance(updatedAmbulance: AmbulanceResponse) {
        setAmbulances((currentAmbulances) =>
            currentAmbulances.map((ambulance) =>
                ambulance.id === updatedAmbulance.id
                    ? updatedAmbulance
                    : ambulance
            )
        );

        setSelectedAmbulance((current) =>
            current?.id === updatedAmbulance.id
                ? updatedAmbulance
                : current
        );
    }

    async function handleUpdateAmbulance(
        event: SyntheticEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (editedAmbulanceId === null || editForm === null) {
            return;
        }
        if (!hasText(editForm.carBrand)) {
            setEditErrorMessage("Podaj markę pojazdu.");
            return;
        }

        if (!hasText(editForm.model)) {
            setEditErrorMessage("Podaj model pojazdu.");
            return;
        }

        if (!hasText(editForm.registrationPlates)) {
            setEditErrorMessage("Podaj tablice rejestracyjne pojazdu.");
            return;
        }
        if (!hasText(editForm.mileage)) {
            setEditErrorMessage("Podaj przebieg pojazdu.");
            return;
        }
        if (!hasText(editForm.summerFuelConsumptionNorm)) {
            setEditErrorMessage("Podaj letnią norme spalania pojazdu.");
            return;
        }
        if (!hasText(editForm.winterFuelConsumptionNorm)) {
            setEditErrorMessage("Podaj zimową norme spalania pojazdu.");
            return;
        }
        if (!hasText(editForm.tankCapacityLiters)) {
            setEditErrorMessage("Podaj pojemność zbiornika paliwa pojazdu.");
            return;
        }

        try {
            setUpdating(true);
            setEditErrorMessage(null);

            const updatedAmbulance = await updateAmbulance(
                editedAmbulanceId,
                {
                    carBrand: editForm.carBrand.trim(),
                    model: editForm.model.trim(),
                    registrationPlates: editForm.registrationPlates.trim(),
                    mileage: Number(editForm.mileage),
                    summerFuelConsumptionNorm: Number(editForm.summerFuelConsumptionNorm),
                    winterFuelConsumptionNorm: Number(editForm.winterFuelConsumptionNorm),
                    tankCapacityLiters: Number(editForm.tankCapacityLiters),
                }
            );

            setAmbulances((currentAmbulances) =>
                currentAmbulances.map((ambulance) =>
                    ambulance.id === updatedAmbulance.id ? updatedAmbulance : ambulance
                )
            );
            setSelectedAmbulance((currentAmbulance) =>
                currentAmbulance?.id === updatedAmbulance.id
                    ? updatedAmbulance
                    : currentAmbulance
            );

            showToast(
                `Pojazd ${updatedAmbulance.carBrand} ${updatedAmbulance.model} o numerze ${updatedAmbulance.registrationPlates} został zaaktualizowany.`,
                "success"
            );
            closeEditForm();

        } catch (error) {
            if (axios.isAxiosError(error)) {
                setEditErrorMessage(
                    error.response?.data?.message ??
                    `Nie dało się zaaktualizować pojazdu. 
                    Kod: ${error.response?.status ?? "brak odpowiedzi"
                    }`
                );
                return;
            }
            setEditErrorMessage("Wystąpił nieznany błąd podczas edycji.");
        } finally {
            setUpdating(false);
        }
    }

    async function handleMarkAsOutOfService(id: number) {
        try {
            setChangingAmbulanceId(id);
            setErrorMessage(null);

            const updatedAmbulance =
                await markAmbulanceOutOfService(id);

            replaceAmbulance(updatedAmbulance);
            showToast(
                "Pojazd został oznaczony jako niesprawny.",
                "success"
            )
        } catch (error) {
            if (axios.isAxiosError(error)) {
                showToast(
                    error.response?.data?.message ??
                    "Nie udało się zmienić statusu pojazdu.",
                    "error"
                );
                return;
            }

            showToast("Wystąpił nieznany błąd podczas zmiany statusu pojazdu.",
                "error"
            );
        } finally {
            setChangingAmbulanceId(null);
        }
    }

    async function handleMarkAsAvailable(id: number) {
        try {
        setChangingAmbulanceId(id);
        
            const updatedAmbulance =
                await markAmbulanceAvailable(id);

            replaceAmbulance(updatedAmbulance);
            showToast("Pojazd został oznaczony jako dostępny.",
                "success"
            );
        } catch (error) {
            if (axios.isAxiosError(error)) {
                showToast(
                    error.response?.data?.message ??
                    "Nie udało się zmienić statusu pojazdu.",
                    "error"
                );
                return;
            }

            showToast("Wystąpił nieznany błąd podczas przywracania statusu pojazdu.",
                "error"
            );
        } finally {
            setChangingAmbulanceId(null);
        }
    }

    async function handleDeactivateAmbulance(id: number) {
        const confirmed = window.confirm(
            "Czy na pewno chcesz wycofać ten pojazd z ewidencji? " +
            "Pojazd zostanie również oznaczony jako niesprawny. " +
            "Cofnąć tę operację może wyłącznie administrator."
        );

        if (!confirmed) {
            return;
        }

        try {
            setChangingAmbulanceId(id);

            await deactivateAmbulanceById(id);

            setAmbulances((currentAmbulances) =>
                currentAmbulances.map((ambulance) =>
                    ambulance.id === id
                        ? {
                            ...ambulance,
                            active: false,
                            status: "OUT_OF_SERVICE"
                        }
                        : ambulance
                )
            );

            setSelectedAmbulance((current) =>
                current?.id === id
                    ? {
                        ...current,
                        active: false,
                        status: "OUT_OF_SERVICE"
                    }
                    : current
            );
            showToast("Pojazd został wycofany z ewidencji.",
                "success"
            );
        } catch (error) {
            if (axios.isAxiosError(error)) {
                showToast(
                    error.response?.data?.message ??
                    "Nie udało się wycofać pojazdu z ewidencji.",
                    "error"
                );
                return;
            }

            showToast("Wystąpił nieznany błąd podczas wycofania pojazdu z ewidencji.",
                "error"
            );
        } finally {
            setChangingAmbulanceId(null);
        }
    }

    async function handleRestoreAmbulance(id: number) {
        const confirmed = window.confirm(
            "Czy na pewno chcesz przywrócić ten pojazd do ewidencji? " +
            "Pojazd zostanie przywrócony jako niesprawny i nie będzie dostępny " +
            "do przydzielenia, dopóki nie zmienisz jego statusu na dostępny."
        );

        if (!confirmed) {
            return;
        }

        try {
            setChangingAmbulanceId(id);
            
            const restoredAmbulance = await restoreAmbulanceById(id);

            replaceAmbulance(restoredAmbulance);

            showToast(
                "Pojazd został przywrócony do ewidencji jako niesprawny.",
                "success"
            );
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                showToast(
                    error.response?.data?.message ??
                    "Nie udało się przywrócić pojazdu do ewidencji.",
                    "error"
                );
                return;
            }

            showToast(
                "Wystąpił nieznany błąd podczas przywracania pojazdu.",
                "error"
            );
        } finally {
            setChangingAmbulanceId(null);
        }
    }

    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    const filteredVehicles = ambulances.filter((ambulance) => {
        const fullName = `${ambulance.carBrand} ${ambulance.model}`.toLowerCase();
        const registrationPlate = ambulance.registrationPlates.toLowerCase();

        const matchesSearch =
            fullName.includes(normalizedSearchTerm) ||
            registrationPlate.includes(normalizedSearchTerm)

        const matchesStatus =
            statusFilter === "ALL" || ambulance.status === statusFilter;

        return matchesSearch && matchesStatus;
    })

    return (

        <main className="ambulances-page">
            <div className="ambulances-page__header">
                <div>
                    <h1>Pojazdy</h1>
                    <p>Zarządzaj pojazdami i ich statusami.</p>
                </div>
            </div>

            <section className="ambulances-card">
                <h2>Dodaj pojazd</h2>

                <form className="ambulance-form"
                    onSubmit={handleAddAmbulance}>

                    <div className="ambulance-form__field">
                        <label htmlFor="ambulance-carBrand">Marka pojazdu</label>
                        <input
                            id="ambulance-carBrand"
                            type="text"
                            value={form.carBrand}
                            required
                            onChange={(event) =>
                                setForm((currentForm) => ({
                                    ...currentForm,
                                    carBrand: event.target.value,
                                }))
                            }
                        />
                    </div>

                    <div className="ambulance-form__field">
                        <label htmlFor="ambulance-model">Model pojazdu</label>
                        <input
                            id="ambulance-model"
                            type="text"
                            value={form.model}
                            required
                            onChange={(event) =>
                                setForm((currentForm) => ({
                                    ...currentForm,
                                    model: event.target.value,
                                }))
                            }
                        />
                    </div>

                    <div className="ambulance-form__field">
                        <label htmlFor="ambulance-registration-plates">Tablice rejestracyjne</label>
                        <input
                            id="ambulance-registration-plates"
                            type="text"
                            value={form.registrationPlates}
                            required
                            onChange={(event) =>
                                setForm((currentForm) => ({
                                    ...currentForm,
                                    registrationPlates: event.target.value,
                                }))
                            }
                        />
                    </div>

                    <div className="ambulance-form__field">
                        <label htmlFor="ambulance-mileage">Przebieg</label>
                        <input
                            id="ambulance-mileage"
                            type="number"
                            min="0"
                            step="1"
                            value={form.mileage}
                            required
                            onChange={(event) =>
                                setForm((currentForm) => ({
                                    ...currentForm,
                                    mileage: event.target.value,
                                }))
                            }
                        />
                    </div>

                    <div className="ambulance-form__field">
                        <label htmlFor="ambulance-summer-fuel-norm">Letnia norma spalania paliwa</label>
                        <input
                            id="ambulance-summer-fuel-norm"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={form.summerFuelConsumptionNorm}
                            required
                            onChange={(event) =>
                                setForm((currentForm) => ({
                                    ...currentForm,
                                    summerFuelConsumptionNorm: event.target.value,
                                }))
                            }
                        />
                    </div>

                    <div className="ambulance-form__field">
                        <label htmlFor="ambulance-winter-fuel-norm">Zimowa norma spalania paliwa</label>
                        <input
                            id="ambulance-winter-fuel-norm"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={form.winterFuelConsumptionNorm}
                            required
                            onChange={(event) =>
                                setForm((currentForm) => ({
                                    ...currentForm,
                                    winterFuelConsumptionNorm: event.target.value,
                                }))
                            }
                        />

                    </div>
                    <div className="ambulance-form__field">
                        <label htmlFor="ambulance-tank-capacity">Pojemność zbiornika paliwa</label>
                        <input
                            id="ambulance-tank-capacity"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={form.tankCapacityLiters}
                            required
                            onChange={(event) =>
                                setForm((currentForm) => ({
                                    ...currentForm,
                                    tankCapacityLiters: event.target.value,
                                }))
                            }
                        />
                    </div>

                    {formErrorMessage && (
                        <p className="ambulance-form__error"
                            role="alert">
                            {formErrorMessage}
                        </p>
                    )}
                    <button
                        className="ambulance-form__submit"
                        type="submit"
                        disabled={adding}>
                        {adding ? "Dodawanie..." : "Dodaj Pojazd"}
                    </button>
                </form>
            </section>

            <section className="ambulances-card">
                <div className="ambulances-toolbar">

                    <input
                        type="search"
                        placeholder="Szukaj po marce, modelu lub tablicach rejestracyjnych pojazdu"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)} />

                    <select
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(event.target.value as AmbulanceStatus | "ALL")
                        }>
                        <option value="ALL">Wszystkie statusy</option>
                        <option value="AVAILABLE">Dostępne</option>
                        <option value="IN_USE">Aktualnie używane</option>
                        <option value="OUT_OF_SERVICE">Wyłączone z użytkowania</option>
                    </select>
                </div>
                {filteredVehicles.length === 0 ? (
                    <p>Brak pojazdów</p>
                ) : (
                    <div className="ambulances-table-wrapper">
                        <table className="ambulances-table">
                            <thead>
                                <tr>
                                    <th>Marka i model pojazdu</th>
                                    <th>Tablice Rejestracyjne pojazdu</th>
                                    <th>Przebieg pojazdu</th>
                                    <th>Status operacyjny</th>
                                    <th>Status ewidencyjny</th>
                                    <th>Akcje</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredVehicles.map((ambulance) => (
                                    <tr key={ambulance.id}>
                                        <td>{ambulance.carBrand} {ambulance.model}</td>
                                        <td>{ambulance.registrationPlates}</td>
                                        <td>{ambulance.mileage.toLocaleString("pl-PL")} km</td>
                                        <td>{ambulance.status}</td>
                                        <td>{ambulance.active ? "W ewidencji" : "Wycofany z ewidencji"}</td>
                                        <td>
                                            <div className="ambulances-table__actions">
                                                <button
                                                    className="ambulances-table__details-button"
                                                    type="button"
                                                    onClick={() => setSelectedAmbulance(ambulance)}>
                                                    Szczegóły
                                                </button>

                                                <button
                                                    className="ambulances-table__edit-button"
                                                    type="button"
                                                    onClick={() => openEditForm(ambulance)}
                                                >
                                                    Edytuj
                                                </button>

                                                {ambulance.active &&
                                                    ambulance.status === "AVAILABLE" && (
                                                        <button
                                                            type="button"
                                                            className="ambulance-action-button ambulance-action-button--warning"
                                                            disabled={changingAmbulanceId === ambulance.id}
                                                            onClick={() => handleMarkAsOutOfService(ambulance.id)
                                                            }
                                                        >Oznacz jako niesprawną
                                                        </button>
                                                    )}

                                                {ambulance.active &&
                                                    ambulance.status === "OUT_OF_SERVICE" && (
                                                        <button
                                                            type="button"
                                                            className="ambulance-action-button ambulance-action-button--success"
                                                            disabled={changingAmbulanceId === ambulance.id}
                                                            onClick={() => handleMarkAsAvailable(
                                                                ambulance.id)
                                                            }>
                                                            Przywróć dostępność
                                                        </button>
                                                    )}

                                                {ambulance.active &&
                                                    ambulance.status !== "IN_USE" && (
                                                        <button
                                                            type="button"
                                                            className="ambulance-action-button ambulance-action-button--danger"
                                                            disabled={changingAmbulanceId === ambulance.id}
                                                            onClick={() => handleDeactivateAmbulance(ambulance.id)
                                                            }
                                                        >
                                                            Wycofaj z ewidencji
                                                        </button>
                                                    )}

                                                {currentUserRole === "ADMIN" && !ambulance.active && (
                                                    <button
                                                        type="button"
                                                        className="ambulance-action-button ambulance-action-button--success"
                                                        disabled={changingAmbulanceId === ambulance.id}
                                                        onClick={() => handleRestoreAmbulance(ambulance.id)}
                                                    >
                                                        Przywróć do ewidencji
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {selectedAmbulance && (
                <div className="ambulance-details-overlay">
                    <section
                        className="ambulance-details"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="ambulance-details-title"
                    >
                        <div className="ambulance-details__header">
                            <div>
                                <h2 id="ambulance-details-title">
                                    Szczegóły pojazdu
                                </h2>

                                <p>
                                    {selectedAmbulance.registrationPlates}
                                </p>
                            </div>

                            <button
                                className="ambulance-details__close"
                                type="button"
                                onClick={() => setSelectedAmbulance(null)}
                                aria-label="Zamknij">
                                ×
                            </button>
                        </div>

                        <div className="ambulance-details__grid">
                            <div>
                                <span>Marka i model</span>
                                <strong>
                                    {selectedAmbulance.carBrand} {selectedAmbulance.model}
                                </strong>
                            </div>

                            <div>
                                <span>Tablice rejestracyjne</span>
                                <strong>{selectedAmbulance.registrationPlates}</strong>
                            </div>

                            <div>
                                <span>Przebieg pojazdu</span>
                                <strong>{selectedAmbulance.mileage.toLocaleString("pl-PL")} km</strong>
                            </div>

                            <div>
                                <span>Letnia norma spalania paliwa</span>
                                <strong>{selectedAmbulance.summerFuelConsumptionNorm} L/100</strong>
                            </div>

                            <div>
                                <span>Zimowa norma spalania paliwa</span>
                                <strong>{selectedAmbulance.winterFuelConsumptionNorm} L/100</strong>
                            </div>

                            <div>
                                <span>Pojemność zbiornika paliwa</span>
                                <strong>{selectedAmbulance.tankCapacityLiters} L</strong>
                            </div>

                            <div>
                                <span>Status operacyjny</span>
                                <strong>{selectedAmbulance.status}</strong>
                            </div>

                            <div>
                                <span>Status ewidencyjny</span>
                                <strong className={
                                    selectedAmbulance.active
                                        ? "ambulance-details__status     ambulance-details__status--active"
                                        : "ambulance-details__status ambulance-details__status--inactive"
                                }
                                >
                                    {selectedAmbulance.active ? "W ewidencji" : "Wycofany z ewidencji"}
                                </strong>
                            </div>
                        </div>
                        <div className="ambulance-details__actions">
                            <button
                                className="ambulance-details__first-button"
                                type="button"
                                onClick={() => setSelectedAmbulance(null)}
                            >
                                Zamknij
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {editForm && editedAmbulanceId !== null && (
                <div className="ambulance-details-overlay">
                    <section className="ambulance-edit">
                        <div className="ambulance-details__header">
                            <div>
                                <h2>Edytuj pojazd</h2>
                                <p>Zmień dane i status pojazdu</p>
                            </div>

                            <button
                                className="ambulance-details__close"
                                type="button"
                                onClick={closeEditForm}
                                aria-label="Zamknij"
                            >
                                ×
                            </button>
                        </div>

                        <form
                            className="ambulance-edit-form"
                            onSubmit={handleUpdateAmbulance}>

                            <div className="ambulance-form__field">
                                <label htmlFor="edit-car-brand">Marka pojazdu</label>
                                <input
                                    id="edit-car-brand"
                                    type="text"
                                    value={editForm.carBrand}
                                    onChange={(event) =>
                                        setEditForm((currentAmbulance) =>
                                            currentAmbulance
                                                ? {
                                                    ...currentAmbulance,
                                                    carBrand: event.target.value,
                                                } : null
                                        )
                                    }
                                />
                            </div>

                            <div className="ambulance-form__field">
                                <label htmlFor="edit-model">Model pojazdu</label>
                                <input
                                    id="edit-model"
                                    type="text"
                                    value={editForm.model}
                                    onChange={(event) =>
                                        setEditForm((currentAmbulance) =>
                                            currentAmbulance
                                                ? {
                                                    ...currentAmbulance,
                                                    model: event.target.value,
                                                } : null
                                        )
                                    }
                                />
                            </div>

                            <div className="ambulance-form__field">
                                <label htmlFor="edit-registration-plates">Tablice rejestracyjne</label>
                                <input
                                    id="edit-registration-plates"
                                    type="text"
                                    value={editForm.registrationPlates}
                                    onChange={(event) =>
                                        setEditForm((currentAmbulance) =>
                                            currentAmbulance
                                                ? {
                                                    ...currentAmbulance,
                                                    registrationPlates: event.target.value,
                                                } : null
                                        )
                                    }
                                />
                            </div>

                            <div className="ambulance-form__field">
                                <label htmlFor="edit-mileage">Przebieg pojazdu</label>
                                <input
                                    id="edit-mileage"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={editForm.mileage}
                                    onChange={(event) =>
                                        setEditForm((currentAmbulance) =>
                                            currentAmbulance
                                                ? {
                                                    ...currentAmbulance,
                                                    mileage: event.target.value,
                                                } : null
                                        )
                                    }
                                />
                            </div>

                            <div className="ambulance-form__field">
                                <label htmlFor="edit-summer-norm-consumption">Letnia norma spalania paliwa</label>
                                <input
                                    id="edit-summer-norm-consumption"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={editForm.summerFuelConsumptionNorm}
                                    onChange={(event) =>
                                        setEditForm((currentAmbulance) =>
                                            currentAmbulance
                                                ? {
                                                    ...currentAmbulance,
                                                    summerFuelConsumptionNorm: event.target.value,
                                                } : null
                                        )
                                    }
                                />
                            </div>

                            <div className="ambulance-form__field">
                                <label htmlFor="edit-winter-norm-consumption">Zimowa norma spalania paliwa</label>
                                <input
                                    id="edit-winter-norm-consumption"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={editForm.winterFuelConsumptionNorm}
                                    onChange={(event) =>
                                        setEditForm((currentAmbulance) =>
                                            currentAmbulance
                                                ? {
                                                    ...currentAmbulance,
                                                    winterFuelConsumptionNorm: event.target.value,
                                                } : null
                                        )
                                    }
                                />
                            </div>

                            <div className="ambulance-form__field">
                                <label htmlFor="edit-tank-capacity">Pojemność zbiornika paliwa</label>
                                <input
                                    id="edit-tank-capacity"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={editForm.tankCapacityLiters}
                                    onChange={(event) =>
                                        setEditForm((currentAmbulance) =>
                                            currentAmbulance
                                                ? {
                                                    ...currentAmbulance,
                                                    tankCapacityLiters: event.target.value,
                                                } : null
                                        )
                                    }
                                />
                            </div>


                            {editErrorMessage && (
                                <p className="ambulance-form__error">
                                    {editErrorMessage}
                                </p>
                            )}

                            <div className="ambulance-edit__actions">
                                <button
                                    type="button"
                                    className="ambulance-details__secondary-button"
                                    onClick={closeEditForm}>
                                    Anuluj
                                </button>

                                <button
                                    type="submit"
                                    className="ambulance-form__submit"
                                    disabled={updating}
                                >
                                    {updating ? "Zapisywanie..." : "Zapisz zmiany"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </main>
    )

}
