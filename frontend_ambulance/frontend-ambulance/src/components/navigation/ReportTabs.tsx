import { NavLink } from "react-router-dom";
import "./ReportTabs.css";

export function ReportTabs() {
  return (
    <nav className="report-tabs"
     aria-label="Rodzaje raportów">
      <NavLink to="/manager/reports" end>
        Raport karetek
      </NavLink>


      <NavLink to="/manager/reports/daily">
        Raport dzienny
      </NavLink>
    </nav>
  );
}