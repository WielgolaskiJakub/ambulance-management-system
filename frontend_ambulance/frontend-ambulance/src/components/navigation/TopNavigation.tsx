import { NavLink, useNavigate } from "react-router-dom";
import "./TopNavigation.css";
import { useState } from "react";
import {
  disableNewOrderSound,
  enableNewOrderSound,
  isNewOrderSoundEnabled,
} from "../../utils/newOrderSound";
import { getCurrentUserRole } from "../../utils/auth";
import { KeyRound, LogOut, UserRound } from "lucide-react";

export function TopNavigation() {
  const navigate = useNavigate();
  const userRole = getCurrentUserRole();

  const [soundEnabled, setSoundEnabled] = useState(isNewOrderSoundEnabled());
  const [soundError, setSoundError] = useState<string | null>(null);

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const isCrewUser = userRole === "DRIVER" || userRole === "SANITARY";
  const isManagerUser = userRole === "MANAGER" || userRole === "ADMIN";

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
    setAccountMenuOpen(false);
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <header className="top-navigation">
      <div className="top-navigation__brand">System transportu</div>

      <nav className="top-navigation__links">
        {isCrewUser && (
          <>
            <NavLink className="top-navigation__link" to="/dashboard">
              Harmonogram
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
          </>
        )}

        {isManagerUser && (
            <>
          <NavLink className="top-navigation__link" to="/manager/dashboard">
            Harmonogram
          </NavLink>
       
          <NavLink
            className="top-navigation__link"
            to="/manager/transport-orders/create"
          >
            Utwórz zlecenie
          </NavLink>

           <NavLink className="top-navigation__link" to="/manager/users">
            Pracownicy
          </NavLink>

           <NavLink className="top-navigation__link" to="/manager/ambulances">
            Pojazdy
          </NavLink>
          </>
        )}
      </nav>

      <div className="top-navigation__actions">
        <button
          className={`top-navigation__sound-button ${
            soundEnabled ? "top-navigation__sound-button--enabled" : ""
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

          <div className="top-navigation__account-menu">
            <button
            className="top-navigation__account-button"
            type="button"
            onClick={() => setAccountMenuOpen((current) => !current)}
            aria-label="Menu konta"
            aria-expanded={accountMenuOpen}
            title="Menu konta"
            >
              <UserRound size={20} aria-hidden="true"/>
            </button>

            {accountMenuOpen && (
              <div className="top-navigation__account-dropdown">
                <NavLink
                className="top-navigation__account-action"
                to="/change-password"
                onClick={() => setAccountMenuOpen(false)}
                >
                  <KeyRound size={17} aria-hidden="true"/>
                  Zmień hasło
                </NavLink>

                <button
                className="top-navigation__account-action"
                type="button"
                onClick={handleLogout}
                >
                  <LogOut size={17} aria-hidden="true"/>
                  Wyloguj
                </button>
                </div>
            )}
          </div>
      </div>

      {soundError && (
        <span className="top-navigation__sound-error">{soundError}</span>
      )}
    </header>
  );
}
