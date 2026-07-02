import { NewTransportOrdersList } from "../components/dashboard/NewTransportOrdersList";
import { DashboardSummary } from "../components/dashboard/DashboardSummary";

export function DashboardPage() {
    return (
        <main className="dashboard-page">
            <DashboardSummary />
            <NewTransportOrdersList />
        </main>
    );
}
