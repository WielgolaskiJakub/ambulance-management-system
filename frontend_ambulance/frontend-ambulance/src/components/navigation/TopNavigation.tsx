import { NavLink, useNavigate } from "react-router-dom";
import "./TopNavigation.css"
import { useState } from "react";
import {
  disableNewOrderSound,
  enableNewOrderSound,
  isNewOrderSoundEnabled,
} from "../../utils/newOrderSound";

export function TopNavigation() {
  const navigate = useNavigate();

  const [soundEnabled, setSoundEnabled] = useState(isNewOrderSoundEnabled());
  const [soundError, setSoundError] = useState<string | null>(null);

  async function handleToggleSound() {
    try {
      setSoundError(null);

      if (soundEnabled) {
        disableNewOrderSound();
        setSoundEnabled(false);
        return;
      }

      await enableNewOrderSound();
      setSoundEnabled(true);
    } catch {
      setSoundError("Nie udało się włączyć dźwięku.");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <header className="top-navigation">
      <div className="top-navigation__brand">System transportu</div>

      <nav className="top-navigation__links">
        <NavLink className="top-navigation__link" to="/dashboard">
          Dashboard
        </NavLink>

        <NavLink className="top-navigation__link" to="/routes/me">
          Moje trasy
        </NavLink>

        <NavLink className="top-navigation__link" to="/transport-orders/me">
          Moje zlecenia
        </NavLink>

        <NavLink className="top-navigation__link" to="/refuelings">
          Tankowanie
        </NavLink>

        <NavLink className="top-navigation__link" to="/transport-orders/create">
          Utwórz zlecenie
        </NavLink>

        <NavLink className="top-navigation__link" to="/shifts/create">
          Utwórz zmianę
        </NavLink>
      </nav>

      <div className="top-navigation__actions">
        <button
          className={`top-navigation__sound-button ${soundEnabled ? "top-navigation__sound-button--enabled" : ""
            }`}
          type="button"
          onClick={handleToggleSound}
          title={
            soundEnabled
              ? "Dźwięk nowych zleceń włączony"
              : "Dźwięk nowych zleceń wyłączony"
          }
          aria-label={
            soundEnabled
              ? "Wyłącz dźwięk nowych zleceń"
              : "Włącz dźwięk nowych zleceń"
          }
        >
          {soundEnabled ? "🔊" : "🔇"}
        </button>

        <button
          className="top-navigation__logout-button"
          type="button"
          onClick={handleLogout}
        >
          Wyloguj
        </button>
      </div>

      {soundError && (
        <span className="top-navigation__sound-error">{soundError}</span>
      )}
    </header>
  );
}