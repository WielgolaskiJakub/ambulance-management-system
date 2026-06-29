import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { TransportOrderCrewPreviewPage } from "./pages/TransportOrderCrewPreviewPage";
import { MainLayout } from "./layouts/MainLayout";
import { MyRoutesPage } from "./pages/MyRoutesPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/transport-orders/:orderId/preview"
          element={<TransportOrderCrewPreviewPage />}
        />
     <Route path="/routes/me" element={<MyRoutesPage />} />
     
     
      </Route>
      

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;