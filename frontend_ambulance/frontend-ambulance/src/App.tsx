import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { TransportOrderCrewPreviewPage } from "./pages/TransportOrderCrewPreviewPage";
import { MainLayout } from "./layouts/MainLayout";
import { MyRoutesPage } from "./pages/MyRoutesPage";
import { CreateTransportOrderPage } from "./pages/CreateTransportOrderPage";
import { MyTransportOrdersPage } from "./pages/MyTransportOrdersPage";
import { TransportOrderDetailsPage } from "./pages/TransportOrderDetailsPage";
import { CreateShiftPage } from "./pages/CreateShiftPage";
import { RefuelingsPage } from "./pages/RefuelingsPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/shifts/create" element={<CreateShiftPage />} />
        <Route path="/transport-orders/create" element={<CreateTransportOrderPage />} />
        <Route path="/transport-orders/me" element={<MyTransportOrdersPage />} />
        <Route
          path="/transport-orders/:orderId/details"
          element={<TransportOrderDetailsPage />}
        />
        <Route
          path="/transport-orders/:orderId/preview"
          element={<TransportOrderCrewPreviewPage />}
        />
        <Route path="/routes/me" element={<MyRoutesPage />} />
        <Route path="/refuelings" element={<RefuelingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
