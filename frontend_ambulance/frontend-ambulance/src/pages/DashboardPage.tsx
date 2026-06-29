import { NewTransportOrdersList } from "../components/dashboard/NewTransportOrdersList";
import { DashboardSummary } from "../components/dashboard/DashboardSummary";

export function DashboardPage() {
    return (
        <main className="dashboard-page">
            <section className="dashboard-summary">
                <DashboardSummary />
            </section>

            <section className="orders-section">
                <div className="orders-section__header">
                    <h1 className="orders-section__title">Nowe zlecenia transportu</h1>
                </div>
                <NewTransportOrdersList />
            </section>
        </main>
    );
}