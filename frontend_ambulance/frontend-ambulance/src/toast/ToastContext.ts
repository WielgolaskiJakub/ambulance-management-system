import { createContext } from "react";

export type ToastType = "success" | "error" | "info";

export type ToastContextValue = {
    showToast: (
        message: string,
        type?: ToastType,
        durationMs?: number
    ) => void;
    hideToast: () => void
};


export const ToastContext = createContext<ToastContextValue| null>(null);