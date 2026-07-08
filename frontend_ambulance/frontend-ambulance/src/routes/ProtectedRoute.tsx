import { Navigate, Outlet, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

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
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  let decodedToken: JwtPayload;
  try {
    decodedToken = jwtDecode<JwtPayload>(token);
  } catch (error) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (decodedToken.exp * 1000 < Date.now()) {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  return <Navigate to="/login" state={{ from: location }} replace />;
}

  if (allowedRoles && !allowedRoles.includes(decodedToken.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
}