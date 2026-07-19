import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { 
    ToastContext,
    type ToastType,
} from "./ToastContext";
import "./Toast.css";

type ToastState = {
    id: number;
    message:string;
    type: ToastType;
    durationMs: number;
};

type ToastProviderProps = {
    children: ReactNode;
};

export function ToastProvider({children}: ToastProviderProps){
    const [toast, setToast] = useState<ToastState | null>(null);

    const hideToast = useCallback(() =>{
        setToast(null);
    }, []);

    const showToast = useCallback(
        (
            message: string,
            type: ToastType = "info",
            durationMs = 3500
        ) => {
            setToast({
                id: Date.now(),
                message,
                type,
                durationMs
            });
        },
    []
    );

    useEffect(() => {
        if(!toast){
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setToast(null);
        }, toast.durationMs);

        return () => {
            window.clearTimeout(timeoutId);
        }; 
    }, [toast]);

    const contextValue = useMemo(
        () => ({
            showToast,
            hideToast,
        }),
        [showToast, hideToast]
    );


    return (
        <ToastContext.Provider value={contextValue}>
            {children}

            {toast && (
                <div
                    key={toast.id}
                    className={`global-toast global-toast--${toast.type}`}
                    role={toast.type === "error" ? "alert" : "status"}
                    aria-live="polite"
                >
                    <span className="global-toast__message">
                        {toast.message}
                    </span>

                    <button
                        className="global-toast__close-button"
                        type="button"
                        onClick={hideToast}
                        aria-label="Zamknij komunikat"
                    >
                        ×
                    </button>
                </div>
            )}
        </ToastContext.Provider>
    );
}