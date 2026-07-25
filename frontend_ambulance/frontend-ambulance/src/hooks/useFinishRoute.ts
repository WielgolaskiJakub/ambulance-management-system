import { useState, type Dispatch, type SetStateAction } from "react";
import axios from "axios";
import { finishRoute } from "../api/routesApi";
import type { RouteResponse } from "../types/route";

type FinishRouteModalState = {
    routeId: number;
    finishOdometerLastThree: string;
};

type UseFinishRouteParams = {
    setRoutes: Dispatch<SetStateAction<RouteResponse[]>>;
    setErrorMessage: Dispatch<SetStateAction<string | null>>;
    setSuccessMessage: Dispatch<SetStateAction<string | null>>;
};

export function useFinishRoute({
    setRoutes,
    setErrorMessage,
    setSuccessMessage,
}: UseFinishRouteParams) {
    const [finishModal, setFinishModal] = useState<FinishRouteModalState | null>(null);
    const [finishingRouteId, setFinishingRouteId] = useState<number | null>(null);

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
        }finally{
            setFinishingRouteId(null);
        }
    }
    return{
        finishModal,
        finishingRouteId,
        openFinishRouteModal,
        updateFinishOdometerLastThree,
        closeFinishRouteModal,
        handleConfirmFinishRoute,
    };
}