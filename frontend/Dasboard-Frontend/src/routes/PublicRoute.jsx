import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { redirectPathFromState } from "./authRedirect";

export default function PublicRoute({ children }) {
  const { isAuthenticated, isAuthReady } = useAuth();
  const location = useLocation();

  if (!isAuthReady) return null;
  if (isAuthenticated) {
    return <Navigate to={redirectPathFromState(location.state)} replace />;
  }

  return children;
}
