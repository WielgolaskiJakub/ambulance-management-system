export const routeStatusLabels: Record<string, string> = {
    CREATED: "Przyjęta",
    IN_PROGRESS: "W trakcie",
    COMPLETED: "Zakończona",
    WAITING: "Oczekuje",
}

export function getRouteStatusLabel(status:string): string{
    return routeStatusLabels[status] ?? status;
}