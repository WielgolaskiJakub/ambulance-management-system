import { useState, type Dispatch, type SetStateAction } from "react";
import axios from "axios";
import {
    finishRoute,
    markRouteAsWaiting,
    resumeRoute,
    startRoute,
} from "../api/routesApi";
import type { RouteResponse } from "../types/route";

type FinishRouteModalState = {
    routeId: number;
    finishOdometerLastThree: string;
};

type StateSetter<T> = Dispatch<SetStateAction<T>>;

type UseRouteLifecycleParams = {
    setRoutes: StateSetter<RouteResponse[]>;
    setErrorMessage: StateSetter<string | null>;
    setSuccessMessage: StateSetter<string | null>;
    onRouteStarted: () => void;
};

export function useRouteLifecycle({
    setRoutes,
    setErrorMessage,
    setSuccessMessage,
    onRouteStarted
}: UseRouteLifecycleParams) {
    const [finishModal, setFinishModal] = useState<FinishRouteModalState | null>(null);
    const [finishingRouteId, setFinishingRouteId] = useState<number | null>(null);
    const [startingRouteId, setStartingRouteId] = useState<number | null>(null);
    const [waitingRouteId, setWaitingRouteId] = useState<number | null>(null);
    const [resumingRouteId, setResumingRouteId] = useState<number | null>(null);


    function replaceRoute(updatedRoute: RouteResponse) {
        setRoutes((currentRoutes) =>
            currentRoutes.map((route) =>
                route.id === updatedRoute.id ? updatedRoute : route
            )
        );
    }

    async function handleStartRoute(routeId: number) {
        try {
            setStartingRouteId(routeId);
            setErrorMessage(null);
            setSuccessMessage(null)

            const updatedRoute = await startRoute(routeId);

            replaceRoute(updatedRoute);
            onRouteStarted();
            setSuccessMessage("Trasa została rozpoczęta.")
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    setErrorMessage("Nie można teraz rozpocząć tej trasy.");
                    return;
                }

                if (error.response?.status === 401) {
                    setErrorMessage("Sesja wygasła. Zaloguj się ponownie.");
                    return;
                }

                if (error.response?.status === 403) {
                    setErrorMessage("Brak uprawnień do rozpoczęcia trasy.");
                    return;
                }

                if (error.response?.status === 404) {
                    setErrorMessage("Nie znaleziono trasy.");
                    return;
                }

                setErrorMessage(
                    `Błąd rozpoczynania trasy: ${error.response?.status ?? "brak odpowiedzi"
                    }`
                );
                return;
            }

            setErrorMessage("Nieznany błąd rozpoczynania trasy.");
        } finally {
            setStartingRouteId(null);
        }
    }

    async function handleMarkRouteAsWaiting(routeId: number) {
        try {
            setWaitingRouteId(routeId);
            setErrorMessage(null);
            setSuccessMessage(null);

            const updatedRoute = await markRouteAsWaiting(routeId);

            replaceRoute(updatedRoute);
            setSuccessMessage("Status załogi został ustawiony jako oczekiwanie.")
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    setErrorMessage("Nie można teraz oznaczyć statusu jako oczekiwanie.");
                    return;
                }

                if (error.response?.status === 401) {
                    setErrorMessage("Sesja wygasła. Zaloguj się ponownie.");
                    return;
                }

                if (error.response?.status === 403) {
                    setErrorMessage("Brak uprawnień do zmiany statusu trasy.");
                    return;
                }

                if (error.response?.status === 404) {
                    setErrorMessage("Nie znaleziono trasy.");
                    return;
                }

                setErrorMessage(
                    `Błąd oznaczania trasy jako oczekującej: ${error.response?.status ?? "brak odpowiedzi"
                    }`
                );
                return;
            }

            setErrorMessage("Nieznany błąd oznaczania statusu jako oczekiwanie.");
        } finally {
            setWaitingRouteId(null);
        }
    }

    async function handleResumeRoute(routeId: number) {
        try {
            setResumingRouteId(routeId);
            setErrorMessage(null);
            setSuccessMessage(null);

            const updatedRoute = await resumeRoute(routeId);

            replaceRoute(updatedRoute);
            setSuccessMessage("Trasa została wznowiona.")
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    setErrorMessage("Nie można teraz wznowić tej trasy.");
                    return;
                }

                if (error.response?.status === 401) {
                    setErrorMessage("Sesja wygasła. Zaloguj się ponownie.");
                    return;
                }

                if (error.response?.status === 403) {
                    setErrorMessage("Brak uprawnień do wznowienia trasy.");
                    return;
                }

                if (error.response?.status === 404) {
                    setErrorMessage("Nie znaleziono trasy.");
                    return;
                }

                setErrorMessage(
                    `Błąd wznawiania trasy: ${error.response?.status ?? "brak odpowiedzi"
                    }`
                );
                return;
            }

            setErrorMessage("Nieznany błąd wznawiania trasy.");
        } finally {
            setResumingRouteId(null);
        }
    }

    function openFinishRouteModal(route: RouteResponse) {
        setFinishModal({
            routeId: route.id,
            finishOdometerLastThree: "",
        });
    }

    function updateFinishOdometerLastThree(value: string) {
        setFinishModal((previous) =>
            previous
                ? {
                    ...previous,
                    finishOdometerLastThree: value,
                }
                : previous
        );
    }

    function closeFinishRouteModal() {
        setFinishModal(null);
    }

    async function handleConfirmFinishRoute() {
        if (!finishModal) {
            return;
        }
        if (!/^\d{1,3}$/.test(finishModal.finishOdometerLastThree)) {
            setErrorMessage("Podaj od 1 do 3 ostatnich cyfr licznika.");
            return;
        }

        const finishOdometerLastThree = Number(finishModal.finishOdometerLastThree);

        try {
            setFinishingRouteId(finishModal.routeId);
            setErrorMessage(null);
            setSuccessMessage(null);

            const updatedRoute = await finishRoute(finishModal.routeId, {
                finishOdometerLastThree,
                notes: null,
            });

            setRoutes((currentRoutes) =>
                currentRoutes.map((route) => route.id === updatedRoute.id ? updatedRoute : route
                )
            );
            setFinishModal(null);
            setSuccessMessage("Trasa została zakończona.");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(`Błąd kończenia trasy: ${error.response?.status ?? "brak odpowiedzi"}`
                );
                return;
            }

            setErrorMessage("Nieznany błąd kończenia trasy.")
        } finally {
            setFinishingRouteId(null);
        }
    }
    return {
        finishModal,
        finishingRouteId,
        openFinishRouteModal,
        updateFinishOdometerLastThree,
        closeFinishRouteModal,
        handleConfirmFinishRoute,
        startingRouteId,
        waitingRouteId,
        resumingRouteId,
        handleStartRoute,
        handleMarkRouteAsWaiting,
        handleResumeRoute,
    };
}