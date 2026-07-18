export type UserRole =
    | "DRIVER"
    | "SANITARY"
    | "MANAGER"
    | "ADMIN"
    | "DOCTOR";


export type UserResponse ={
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    userRole: UserRole;
    active: boolean;
    mustChangePassword: boolean;
    canWorkAsSanitary: boolean;
}