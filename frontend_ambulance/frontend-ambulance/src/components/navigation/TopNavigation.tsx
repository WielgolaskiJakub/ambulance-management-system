import { NavLink, useNavigate } from "react-router-dom";
import "./TopNavigation.css"

export function TopNavigation() {
  const navigate = useNavigate();

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

        <NavLink className="top-navigation__link" to="/shifts/create">
          Utwórz zmianę
        </NavLink>
      </nav>

      <button
        className="top-navigation__logout-button"
        type="button"
        onClick={handleLogout}
      >
        Wyloguj
      </button>
    </header>
  );
}