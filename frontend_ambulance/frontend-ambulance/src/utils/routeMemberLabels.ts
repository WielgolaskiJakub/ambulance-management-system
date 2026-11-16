import type {
     RouteMemberRole,
     RouteMemberSource,

 } from "../types/routeMember";

export const routeMemberRoleLabels: Record<RouteMemberRole, string> = {
    DRIVER: "Kierowca",
    SANITARY_WORKER: "Sanitariusz",
    PARAMEDIC: "Ratownik Medyczny",
    NURSE: "Pielęgniarka",
    DOCTOR: "Lekarz",
    OTHER: "Inny",
};

export const routeMemberSourceLabels:
Record<RouteMemberSource,string> = {
    SHIFT_TEAM: "Załoga zmiany",
    SUPPORT_SHIFT_TEAM: "Wsparcie z innej załogi",
    SOR_STAFF: "SOR",
    NPL: "NPL",
    POZ: "POZ",
    HOSPITAL_STAFF: "Oddział",
    OTHER: "Inny"
}