import { useEffect, useState } from "react";
import axios from "axios";
import { getMyDashboard } from "../api/dashboardApi";
import { createRefueling, getMyRefuelings } from "../api/refuelingsApi";
import type { AmbulanceDashboardResponse } from "../types/dashboard";
import type { RefuelingResponse } from "../types/refueling";
import { formatDateTime } from "../utils/dateTimeFormat";

const refuelingStatusLabels: Record<string, string> = {
  REPORTED: "Zgłoszone",
  VERIFIED: "Zweryfikowane",
};

type ApiErrorResponse = {
  code?: string;
  message?: string;
};

type FormState = {
  liters: string;
  mileageAtRefueling: string;
  notes: string;
};

function getApiErrorCode(error: unknown): string | null {
  if (!axios.isAxiosError(error)) {
    return null;
  }

  return (error.response?.data as ApiErrorResponse | undefined)?.code ?? null;
}

function getRefuelingStatusLabel(status: string): string {
  return refuelingStatusLabels[status] ?? status;
}

function formatMoney(value: number | null): string {
  if (value === null) {
    return "Brak danych";
  }

  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(value);
}

export function RefuelingsPage() {
  const [dashboard, setDashboard] = useState<AmbulanceDashboardResponse | null>(
    null
  );
  const [refuelings, setRefuelings] = useState<RefuelingResponse[]>([]);
  const [form, setForm] = useState<FormState>({
    liters: "",
    mileageAtRefueling: "",
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        const [dashboardData, refuelingsData] = await Promise.all([
          getMyDashboard(),
          getMyRefuelings(),
        ]);

        setDashboard(dashboardData);
        setRefuelings(refuelingsData);
        setForm((currentForm) => ({
          ...currentForm,
          mileageAtRefueling:
            currentForm.mileageAtRefueling || String(dashboardData.mileage),
        }));
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const errorCode = getApiErrorCode(error);

          if (errorCode === "SHIFT_NOT_ACTIVE") {
            setErrorMessage("Najpierw utwórz aktywną zmianę, żeby dodać tankowanie.");
            return;
          }

          if (error.response?.status === 401) {
            setErrorMessage("Sesja wygasła. Zaloguj się ponownie.");
            return;
          }

          if (error.response?.status === 403) {
            setErrorMessage("Brak uprawnień do tankowań.");
            return;
          }

          setErrorMessage("Nie udało się pobrać tankowań.");
          return;
        }

        setErrorMessage("Nieznany błąd pobierania tankowań.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function updateField(field: keyof FormState, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!dashboard) {
      setErrorMessage("Nie znaleziono aktywnej zmiany.");
      return;
    }

    const liters = Number(form.liters.replace(",", "."));
    const mileageAtRefueling = Number(form.mileageAtRefueling);

    if (Number.isNaN(liters) || liters <= 0) {
      setErrorMessage("Podaj poprawną liczbę litrów.");
      return;
    }

    if (Number.isNaN(mileageAtRefueling) || mileageAtRefueling <= 0) {
      setErrorMessage("Podaj poprawny przebieg przy tankowaniu.");
      return;
    }

    if (mileageAtRefueling < dashboard.mileage) {
      setErrorMessage(
        `Przebieg przy tankowaniu nie może być mniejszy niż aktualny przebieg karetki (${dashboard.mileage} km).`
      );
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const createdRefueling = await createRefueling({
        ambulanceId: dashboard.ambulanceId,
        shiftId: dashboard.shiftId,
        liters,
        mileageAtRefueling,
        notes: form.notes.trim().length > 0 ? form.notes.trim() : null,
      });

      setRefuelings((currentRefuelings) => [
        createdRefueling,
        ...currentRefuelings,
      ]);
      setForm({
        liters: "",
        mileageAtRefueling: String(mileageAtRefueling),
        notes: "",
      });
      setSuccessMessage("Tankowanie zostało zgłoszone.");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorCode = getApiErrorCode(error);

        if (errorCode === "SHIFT_NOT_ACTIVE") {
          setErrorMessage("Najpierw utwórz aktywną zmianę.");
          return;
        }

        if (errorCode === "REFUELING_DRIVER_DOES_NOT_MATCH_SHIFT") {
          setErrorMessage("Nie możesz dodać tankowania do cudzej zmiany.");
          return;
        }

        if (errorCode === "REFUELING_AMBULANCE_DOES_NOT_MATCH_SHIFT") {
          setErrorMessage("Wybrana karetka nie pasuje do aktywnej zmiany.");
          return;
        }

        if (errorCode === "INVALID_REFUELING_MILEAGE") {
          setErrorMessage("Przebieg tankowania jest nieprawidłowy.");
          return;
        }

        if (error.response?.status === 400) {
          setErrorMessage("Nieprawidłowe dane tankowania.");
          return;
        }

        if (error.response?.status === 401) {
          setErrorMessage("Sesja wygasła. Zaloguj się ponownie.");
          return;
        }

        if (error.response?.status === 403) {
          setErrorMessage("Brak uprawnień do dodania tankowania.");
          return;
        }

        if (error.response?.status === 404) {
          setErrorMessage("Nie znaleziono zmiany albo karetki.");
          return;
        }

        setErrorMessage("Nie udało się dodać tankowania.");
        return;
      }

      setErrorMessage("Nieznany błąd dodawania tankowania.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="refuelings-page">
        <p className="refuelings-page__message">Ładowanie tankowań...</p>
      </main>
    );
  }

  if (errorMessage && !dashboard) {
    return (
      <main className="refuelings-page">
        <p className="refuelings-page__message refuelings-page__message--error">
          {errorMessage}
        </p>
      </main>
    );
  }

  return (
    <main className="refuelings-page">
      <header className="refuelings-page__header">
        <div>
          <h1 className="refuelings-page__title">Tankowanie</h1>
          <p className="refuelings-page__subtitle">
            Zgłoś tankowanie wykonane podczas aktywnej zmiany.
          </p>
        </div>
      </header>

      {dashboard && (
        <section className="refuelings-summary">
          <article className="refuelings-summary__card">
            <span>Karetka</span>
            <strong>{dashboard.registrationPlates}</strong>
            <p>
              {dashboard.carBrand} {dashboard.model}
            </p>
          </article>

          <article className="refuelings-summary__card">
            <span>Aktualny przebieg</span>
            <strong>{dashboard.mileage} km</strong>
          </article>

          <article className="refuelings-summary__card">
            <span>Szacowane paliwo</span>
            <strong>
              {dashboard.estimatedFuelLitersDisplay !== null
                ? `${dashboard.estimatedFuelLitersDisplay} l`
                : "Brak danych"}
            </strong>
          </article>
        </section>
      )}

      <section className="refuelings-card">
        <header className="refuelings-card__header">
          <h2>Nowe tankowanie</h2>
          <p>Podaj ilość paliwa i przebieg z licznika.</p>
        </header>

        {errorMessage && (
          <p className="refuelings-page__message refuelings-page__message--error">
            {errorMessage}
          </p>
        )}

        {successMessage && (
          <p className="refuelings-page__message refuelings-page__message--success">
            {successMessage}
          </p>
        )}

        <form className="refuelings-form" onSubmit={handleSubmit}>
          <label className="refuelings-form__field">
            <span>Litry</span>
            <input
              inputMode="decimal"
              value={form.liters}
              onChange={(event) => updateField("liters", event.target.value)}
              placeholder="np. 45,20"
            />
          </label>

          <label className="refuelings-form__field">
            <span>Przebieg przy tankowaniu</span>
            <input
              inputMode="numeric"
              value={form.mileageAtRefueling}
              onChange={(event) =>
                updateField(
                  "mileageAtRefueling",
                  event.target.value.replace(/\D/g, "")
                )
              }
              placeholder="np. 245800"
            />
          </label>

          <label className="refuelings-form__field refuelings-form__field--full">
            <span>Notatka</span>
            <textarea
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="Opcjonalnie, np. stacja, uwagi do paragonu"
              rows={3}
            />
          </label>

          <div className="refuelings-form__actions">
            <button
              className="refuelings-form__submit-button"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Zapisywanie..." : "Zgłoś tankowanie"}
            </button>
          </div>
        </form>
      </section>

      <section className="refuelings-history">
        <header className="refuelings-history__header">
          <h2>Moje tankowania</h2>
          <span>{refuelings.length}</span>
        </header>

        {refuelings.length === 0 ? (
          <p className="refuelings-page__message">Brak zgłoszonych tankowań.</p>
        ) : (
          <div className="refuelings-history__list">
            {refuelings.map((refueling) => (
              <article className="refueling-card" key={refueling.id}>
                <header className="refueling-card__header">
                  <div>
                    <h3>Tankowanie #{refueling.id}</h3>
                    <p>{formatDateTime(refueling.refuelingAt ?? refueling.createdAt)}</p>
                  </div>

                  <span className="refueling-card__status">
                    {getRefuelingStatusLabel(refueling.status)}
                  </span>
                </header>

                <div className="refueling-card__grid">
                  <p>
                    <strong>Litry:</strong> {refueling.liters} l
                  </p>
                  <p>
                    <strong>Przebieg:</strong> {refueling.mileageAtRefueling} km
                  </p>
                  <p>
                    <strong>Koszt:</strong> {formatMoney(refueling.totalCost)}
                  </p>
                  <p>
                    <strong>Faktura:</strong> {refueling.invoiceNumber ?? "Brak"}
                  </p>
                </div>

                {refueling.notes && (
                  <p className="refueling-card__notes">
                    <strong>Notatka:</strong> {refueling.notes}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
