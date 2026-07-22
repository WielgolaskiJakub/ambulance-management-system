import { axiosClient } from "./axiosClient";
import type {
    UserResponse,
    UserRole,
    UserCreateResponse,
    UserTemporaryPasswordResetResponse,
} from "../types/user";

export type CreateUserRequest = {
    firstName: string;
    lastName: string;
    email: string | null;
    userRole: UserRole;
    canWorkAsSanitary: boolean;
};

export type UserAdminPatchRequest = {
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    email: string | null;
    userRole: UserRole | null;
    active: boolean | null;
    canWorkAsSanitary: boolean | null;
};

export type ChangeTemporaryPasswordRequest = {
    temporaryPassword: string;
    newPassword: string;
};

export async function createUser(
    request: CreateUserRequest
): Promise<UserCreateResponse> {
    const response = await axiosClient.post<UserCreateResponse>(
        "/api/v1/users",
        request
    );
    return response.data;
}

export async function getAllUsers(): Promise<UserResponse[]> {
    const response = await axiosClient.get<UserResponse[]>(
        "/api/v1/users"
    );
    return response.data
}

export async function getUserById(
    id: number
): Promise<UserResponse> {
    const response = await axiosClient.get<UserResponse>(
        `/api/v1/users/${id}`
    );
    return response.data;
}

export async function updateUserByPatchAdmin(
    id: number,
    request: UserAdminPatchRequest
): Promise<UserResponse> {
    const response = await axiosClient.patch<UserResponse>(
        `/api/v1/users/${id}`,
        request
    );
    return response.data;
}

export async function deleteUserById(
    id: number
): Promise<void> {
    await axiosClient.delete<void>(`/api/v1/users/${id}`);
}

export async function resetTemporaryPasswordByAdmin(
    id: number
): Promise<UserTemporaryPasswordResetResponse> {
    const response = await axiosClient.patch<UserTemporaryPasswordResetResponse>(
        `/api/v1/users/${id}/temporary-password/reset`
    );
    return response.data;
}

export async function changeTemporaryPassword(
    request: ChangeTemporaryPasswordRequest
): Promise<void> {
    await axiosClient.patch(
        "/api/v1/users/me/temporary-password",
        request
    );
}