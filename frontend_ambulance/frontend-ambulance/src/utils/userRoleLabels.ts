export const userRoleLabels: Record<string, string> = {
    DRIVER: "Kierowca",
    SANITARY: "Sanitariusz",
    MANAGER: "Kierownik",
    ADMIN: "Administrator",
};

export function getUserRoleLabel(role: string): string {
    return userRoleLabels[role] ?? role;
}