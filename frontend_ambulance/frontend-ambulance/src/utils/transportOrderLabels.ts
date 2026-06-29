export const transportSourceLabels: Record<string, string> = {
  WARD: "Oddział",
  HOSPITAL_EMERGENCY_DEPARTMENT: "SOR",
  NIGHT_MEDICAL_ASSISTANCE: "NPL",
  PRIMARY_HEALTH_CARE: "POZ",
  SPECIALIST_CLINIC: "Przychodnia specjalistyczna",
  MANAGEMENT: "Dyrekcja",
};

export const transportStatusLabels: Record<string, string> = {
    NEW: "Nowe",
    IN_PROGRESS: "W trakcie",
    WAITING_FOR_PICKUP: "Oczekuje na odbiór",
    COMPLETED: "Zakończone",
    CANCELED: "Anulowane",
};

export const transportCancelLabels: Record<string, string> = {
    CANCELLED_BY_WARD: "Anulowane przez oddział",
    CANCELLED_BY_DOCTOR: "Anulowane przez lekarza",
    PATIENT_USED_OWN_TRANSPORT: "Pacjent skorzystał z własnego transportu",
    PATIENT_TAKEN_BY_INTERNAL_TRANSPORT: "Pacjent zabrany przez transport zewnętrzny",
    PATIENT_REFUSED_TRANSPORT: "Pacjent odmówił transportu",
    PATIENT_NOT_READY: "Pacjent nie był gotowy do transportu",
    PATIENT_NOT_FOUND: "Nie znaleziono pacjenta",
    WRONG_ORDER_DATA: "Nieprawidłowa data zlecenia",
    DUPLICATE_ORDER: "Zduplikowane zlecenie",
    OTHER: "Inny powód",
};

export const transportOrderTypeLabels: Record<string, string> = {
    CONSULTATION: "Konsultacja",
    DIAGNOSTIC_TEST: "Badanie diagnostyczne",
    HOSPITAL_TRANSFER: "Transport międzyszpitalny",
    DISCHARGE_HOME: "Transport do domu",
    RETURN_TRANSPORT: "Transport powrotny",
    MEDICAL_DOCUMENTATION: "Transport dokumentacji medycznej",
    DOCTOR_TRANSPORT: "Transport lekarza",
    PHARMACY_SUPPLY: "Transport leków",
    TECHNICAL_TRANSPORT: "Transport techniczny",
    OTHER: "Inny transport",
};

export const transportOrderPriorityLabels: Record<string, string> = {
    LOW: "Niski",
    MEDIUM: "Średni",
    HIGH: "Wysoki",
    URGENT: "Pilny",
};

export function getTransportSourceLabel(source: string): string {
  return transportSourceLabels[source] ?? source;
}

export function getTransportPriorityLabel(priority: string): string {
  return transportOrderPriorityLabels[priority] ?? priority;
}

export function getTransportStatusLabel(status: string): string {
  return transportStatusLabels[status] ?? status;
}

export function getTransportOrderTypeLabel(orderType: string): string {
  return transportOrderTypeLabels[orderType] ?? orderType;
}