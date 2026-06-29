import { Outlet } from "react-router-dom";
import { TopNavigation } from "../components/navigation/TopNavigation";

export function MainLayout() {
  return (
    <div className="main-layout">
      <TopNavigation />

      <div className="main-layout__content">
        <Outlet />
      </div>
    </div>
  );
}