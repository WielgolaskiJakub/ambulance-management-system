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
    email: string | null;
    userRole: UserRole;
    active: boolean;
    mustChangePassword: boolean;
    canWorkAsSanitary: boolean;
}

export type UserCreateResponse = {
    user: UserResponse;
    temporaryPassword: string;
}

export type UserTemporaryPasswordResetResponse = {
    username: string;
    temporaryPassword: string;
}