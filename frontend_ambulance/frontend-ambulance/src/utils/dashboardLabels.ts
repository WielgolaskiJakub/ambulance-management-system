export const shiftStatusLabels: Record<string, string> = {
    ACTIVE: "Aktywna",
    FINISHED: "Zakończona",
    CANCELLED: "Anulowana",
    PLANNED: "Zaplanowana",
};

export function getShiftStatusLabel(status: string): string {
    return shiftStatusLabels[status]  ?? status;
}