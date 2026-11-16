import { Navigate, Outlet, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react"

type UserRole = "ADMIN" | "MANAGER" | "DRIVER" | "SANITARY";

type JwtPayload = {
  sub: string;
  userId: number;
  role: UserRole;
  exp: number;
  iat: number;
}

type ProtectedRouteProps = {
  allowedRoles?: UserRole[];
};

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const [isExpired, setIsExpired] = useState(false);
  const token = localStorage.getItem("token");

  let decodedToken: JwtPayload | null = null;

  if (token) {
    try {
      decodedToken = jwtDecode<JwtPayload>(token);
    } catch {
      decodedToken = null;
    }
  }

  const tokenExpiresAt = decodedToken ? decodedToken.exp * 1000 : null;

  useEffect(() => {
    if (tokenExpiresAt === null) {
      return;
    }

    const delay = Math.max(0, tokenExpiresAt - Date.now());

    const timeoutId = window.setTimeout(() => {
      setIsExpired(true);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [tokenExpiresAt]);

  if (!token || !decodedToken || isExpired) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const mustChangePassword = localStorage.getItem("mustChangePassword") === "true";

  if(mustChangePassword){
    return <Navigate to="/change-temporary-password" replace />
  }

  if (allowedRoles && !allowedRoles.includes(decodedToken.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}