package pl.jakub.ambulancemanagement.transport_orders.model;

public enum TransportCancelReason {
    CANCELLED_BY_WARD,
    CANCELLED_BY_DOCTOR,
    PATIENT_USED_OWN_TRANSPORT,
    PATIENT_TAKEN_BY_INTERNAL_TRANSPORT,
    PATIENT_REFUSED_TRANSPORT,
    PATIENT_NOT_READY,
    PATIENT_NOT_FOUND,
    WRONG_ORDER_DATA,
    DUPLICATE_ORDER,
    OTHER
}
