import type { RouteMemberRole } from "../types/routeMember";

export const routeMemberRoleLabels: Record<RouteMemberRole, string> = {
    DRIVER: "Kierowca",
    SANITARY_WORKER: "Sanitariusz",
    PARAMEDIC: "Ratownik",
    NURSE: "Pielęgniarka",
    DOCTOR: "Lekarz",
    OTHER: "Inny",
};