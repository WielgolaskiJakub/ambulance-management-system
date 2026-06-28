import { axiosClient } from "./axiosClient";

export type LoginRequest = {
    username: string;
    password: string;
};

export type LoginResponse = {
    token: string;
};

export async function login(request: LoginRequest): Promise<LoginResponse> {
    const response = await axiosClient.post<LoginResponse>(
        "/api/v1/auth/login", 
        request
    );
    return response.data;
}