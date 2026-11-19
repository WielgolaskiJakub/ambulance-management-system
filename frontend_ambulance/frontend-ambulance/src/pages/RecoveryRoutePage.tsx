import { useParams } from "react-router-dom";
import { RecoveryRouteSection } from "../components/recovery/RecoveryRouteSection";

export function RecoveryRoutePage() {
  const { routeId } = useParams();
  const id = Number(routeId);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return <p role="alert">Nieprawidłowy numer trasy.</p>;
  }

  return (
    <main>
      <RecoveryRouteSection key={id} routeId={id} />
    </main>
  );
}