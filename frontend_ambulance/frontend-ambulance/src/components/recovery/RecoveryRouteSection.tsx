import { useEffect, useState } from "react";
import { getRouteForRecovery } from "../../api/recoveryApi";
import type { RouteResponse } from "../../types/route";
import { FinishRouteAfterOutageForm } from "./FinishRouteAfterOutageForm";

type RecoveryRouteSectionProps = {
  routeId: number;
};

export function RecoveryRouteSection({ routeId }: RecoveryRouteSectionProps) {
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadRoute() {
      try {
        const data = await getRouteForRecovery(routeId);
        if (active) setRoute(data);
      } catch {
        if (active) setErrorMessage("Nie udało się pobrać trasy do rozliczenia.");
      }
    }

    void loadRoute();

    return () => {
      active = false;
    };
  }, [routeId]);

  if (errorMessage) return <p role="alert">{errorMessage}</p>;
  if (!route || route.id !== routeId) return <p>Ładowanie trasy…</p>;

  if (route.status !== "IN_PROGRESS") {
    return <p>Po awarii można rozliczyć trasę ze statusem „W trakcie”.</p>;
  }

  return <FinishRouteAfterOutageForm route={route} />;
}