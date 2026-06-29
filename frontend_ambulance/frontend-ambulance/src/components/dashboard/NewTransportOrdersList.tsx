import { useEffect, useState } from "react";
import axios from "axios";
import { getNewTransportOrdersForCrew } from "../../api/transportOrdersApi";
import type { TransportOrderResponse } from "../../types/transportOrder";
import{getTransportOrderTypeLabel,
getTransportPriorityLabel,
getTransportSourceLabel,
getTransportStatusLabel,
} from "../../utils/transportOrderLabels";
import {getUserRoleLabel} from "../../utils/userRoleLabels";

export function NewTransportOrdersList() {
  const [orders, setOrders] = useState<TransportOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadNewOrders() {
      try {
        setLoading(true);
        setErrorMessage(null);

        const data = await getNewTransportOrdersForCrew();
        setOrders(data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 403) {
            setErrorMessage(
              "Brak dostępu do nowych zleceń. Ten widok jest dla DRIVER/SANITARY."
            );
            return;
          }

          if (error.response?.status === 401) {
            setErrorMessage("Sesja wygasła albo brakuje tokena. Zaloguj się ponownie.");
            return;
          }

          setErrorMessage(
            `Błąd pobierania zleceń: ${error.response?.status ?? "brak odpowiedzi"}`
          );
          return;
        }

        setErrorMessage("Nieznany błąd pobierania zleceń.");
      } finally {
        setLoading(false);
      }
    }

    loadNewOrders();
  }, []);

  if (loading) {
    return <p>Ładowanie nowych zleceń...</p>;
  }

  if (errorMessage) {
    return <p>{errorMessage}</p>;
  }

  if (orders.length === 0) {
    return <p>Brak nowych zleceń transportu.</p>;
  }

 return (
  <div className="orders-list">
    {orders.map((order) => (
      <article className="order-card" key={order.id}>
        <div className="order-card-header">
          <h3>{order.orderNumber ?? "Bez numeru zlecenia"}</h3>
          <span className="order-priority">{getTransportPriorityLabel(order.priority)}</span>
        </div>

        <div className="order-card-body">
          <p>
            <strong>Typ:</strong> {getTransportOrderTypeLabel(order.orderType)}
          </p>

          <p>
            <strong>Źródło:</strong> {getTransportSourceLabel(order.source)}
          </p>

          <p>
            <strong>Status:</strong> {getTransportStatusLabel(order.status)}
          </p>

          <p>
            <strong>Utworzone przez:</strong> {order.createdByFullName} - {getUserRoleLabel(order.createdByRole)}
          </p>

          {order.createdAt && (
            <p>
              <strong>Utworzono:</strong>{" "}
              {new Date(order.createdAt).toLocaleString()}
            </p>
          )}

          {order.description && (
            <p>
              <strong>Opis:</strong> {order.description}
            </p>
          )}
        </div>
      </article>
    ))}
  </div>
);
}