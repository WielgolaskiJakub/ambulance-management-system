export type UserRole = "DRIVER" | "SANITARY" | "MANAGER" | "ADMIN";

type JwTPayload = {
    sub: string;
    userId: number;
    role: UserRole;
    iat: number;
    exp: number;
};

export function getToken(): string | null {
    return localStorage.getItem("token");
}

export function getTokenPayload(): JwTPayload | null {
    const token = getToken();

    if(!token) {
        return null;
    }

    try {
        const payloadBase64 = token.split(".")[1];

        if(!payloadBase64) {
            return null;
        }

        const decodedPayload = atob(payloadBase64);
        return JSON.parse(decodedPayload) as JwTPayload;
    } catch {
        return null;
    }
}

export function getCurrentUserRole(): UserRole | null {
    return getTokenPayload()?.role ?? null;
}