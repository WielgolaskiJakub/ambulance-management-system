import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CircleChevronDown,
  GripVertical,
  LockKeyhole,
  MapPin,
} from "lucide-react";

import type {
  RouteResponse,
  RouteTransportOrderReference,
} from "../../types/route";
import type { TransportOrderResponse } from "../../types/transportOrder";

type RouteOrdersSectionProps = {
    route: RouteResponse;
    isExpanded: boolean;
    availableTransportOrders: TransportOrderResponse[];
    selectedTransportOrderId: string;
    isAddingTransportOrder: boolean;
    isReordering: boolean;
    cancellingTransportOrderId: number | null;
    onToggle: () => void;
    onSelectedTransportOrderChange:(orderId:string) => void;
    onAddTransportOrder: () => void;
    onReorder: (event: DragEndEvent) => void;
    onCancelTransportOrder: ( order: RouteTransportOrderReference) => void;
};

function getRouteOrderStatusLabel(
  routeOrderStatus: RouteTransportOrderReference["routeOrderStatus"],
  transportOrderStatus: string
): string {
  if (routeOrderStatus === "PENDING") {
    return "Do realizacji";
  }

  if (routeOrderStatus === "CANCELLED") {
    return "Anulowane";
  }

  return transportOrderStatus === "WAITING_FOR_PICKUP"
    ? "Oczekuje na odbiór"
    : "Zrealizowane";
};

type SortableRouteOrderProps = {
  order: RouteTransportOrderReference;
  index: number;
  canReorder: boolean;
  isReordering: boolean;
  canCancel: boolean;
  isCancelling: boolean;
  onCancel: () => void;
};

function SortableRouteOrder({
  order,
  index,
  canReorder,
  isReordering,
  canCancel,
  isCancelling,
  onCancel,
}: SortableRouteOrderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: order.id,
    disabled: !canReorder || isReordering,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "my-route-card__order-item",
        canReorder
          ? "my-route-card__order-item--draggable"
          : "my-route-card__order-item--locked",
        isDragging ? "my-route-card__order-item--dragging" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="my-route-card__order-actions">
        {canCancel && (
          <button
            type="button"
            className="my-route-card__order-cancel-button"
            disabled={isCancelling}
            onClick={onCancel}
          >
            {isCancelling ? "Anulowanie..." : "Anuluj"}
          </button>
        )}
      </div>

      <div className="my-route-card__order-details">
        <div className="my-route-card__order-heading">
          <span className="my-route-card__order-position">{index + 1}</span>
          <span className="my-route-card__order-number">{order.orderNumber}</span>
          <span
            className={`my-route-card__order-status my-route-card__order-status--${order.routeOrderStatus.toLowerCase()}`}
          >
            {getRouteOrderStatusLabel(
              order.routeOrderStatus,
              order.transportOrderStatus
            )}
          </span>
        </div>

        <span className="my-route-card__order-route">
          <MapPin size={15} aria-hidden="true" />
          {order.pickupAddress ?? "Brak miejsca odbioru"} <span aria-hidden="true">→</span>{" "}
          {order.destinationAddress ?? "Brak celu"}
        </span>
      </div>

      <button
        type="button"
        className="my-route-card__drag-handle"
        disabled={!canReorder || isReordering}
        aria-label={
          canReorder
            ? `Przeciągnij zlecenie ${order.orderNumber}`
            : `Zlecenie ${order.orderNumber} ma zablokowaną pozycję`
        }
        {...attributes}
        {...listeners}
      >
        {canReorder ? <GripVertical size={24} /> : <LockKeyhole size={20} />}
      </button>
    </div>
  );
}


export function RouteOrdersSection({
  route,
  isExpanded,
  availableTransportOrders,
  selectedTransportOrderId,
  isAddingTransportOrder,
  isReordering,
  cancellingTransportOrderId,
  onToggle,
  onSelectedTransportOrderChange,
  onAddTransportOrder,
  onReorder,
  onCancelTransportOrder,
}: RouteOrdersSectionProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  return(
     <section className="my-route-card__collapsible-section">
      <button
        type="button"
        className="my-route-card__collapsible-toggle"
        aria-expanded={isExpanded}
        onClick={onToggle}
      >
        <span className="my-route-card__collapsible-label">
          <strong>Kolejka zleceń</strong>
          <small>{route.transportOrders.length} w kolejce</small>
        </span>

        <CircleChevronDown
          size={22}
          aria-hidden="true"
          className={
            isExpanded
              ? "my-route-card__collapsible-chevron my-route-card__collapsible-chevron--expanded"
              : "my-route-card__collapsible-chevron"
          }
        />
      </button>

      {isExpanded && (
        <div className="my-route-card__collapsible-content">
          <section className="my-route-card__orders">
            <div className="my-route-card__section-heading">
              <p>Przeciągaj wyłącznie pozycje oznaczone jako „Do realizacji”.</p>
            </div>

            <DndContext sensors={sensors} onDragEnd={onReorder}>
              <SortableContext
                items={route.transportOrders.map((order) => order.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="my-route-card__orders-list">
                  {route.transportOrders.map((order, index) => {
                    const canReorder = order.routeOrderStatus === "PENDING";
                    const canCancel =
                      (route.status === "CREATED" ||
                        route.status === "IN_PROGRESS") &&
                      order.routeOrderStatus === "PENDING";

                    return (
                      <SortableRouteOrder
                        key={order.id}
                        order={order}
                        index={index}
                        canReorder={canReorder}
                        isReordering={isReordering}
                        canCancel={canCancel}
                        isCancelling={
                          cancellingTransportOrderId === order.id
                        }
                        onCancel={() => onCancelTransportOrder(order)}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>

            <div className="my-route-card__add-order">
              <select
                className="my-route-card__add-member-input"
                value={selectedTransportOrderId}
                onChange={(event) =>
                  onSelectedTransportOrderChange(event.target.value)
                }
              >
                <option value="">Wybierz dostępne zlecenie</option>
                {availableTransportOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.orderNumber} = {order.pickupAddress} →{" "}
                    {order.destinationAddress}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="my-route-card__secondary-button"
                disabled={isAddingTransportOrder}
                onClick={onAddTransportOrder}
              >
                {isAddingTransportOrder
                  ? "Dodawanie..."
                  : "+ Dodaj zlecenie"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
  