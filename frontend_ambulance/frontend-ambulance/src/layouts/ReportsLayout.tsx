import { Outlet } from "react-router-dom";
import { ReportTabs } from "../components/navigation/ReportTabs";
import "./ReportsLayout.css";

export function ReportsLayout() {
  return (
    <div className="reports-layout">
      <div className="reports-layout__navigation">
        <ReportTabs />
      </div>

      <div className="reports-layout__content">
        <Outlet />
      </div>
    </div>
  );
}