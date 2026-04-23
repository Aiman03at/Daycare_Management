import { Navigate } from "react-router-dom";
import { getToken } from "../auth/session";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = getToken();

  if (!token) return <Navigate to="/login" />;

  return children;
}
