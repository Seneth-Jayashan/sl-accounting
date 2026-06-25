import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoadingPage from "../components/LoadingPage";

interface GuestRouteProps {
  children: ReactNode;
}

const GuestRoute: React.FC<GuestRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // 1. LOADING: Wait for AuthContext to check the token
  if (loading) {
    return <LoadingPage />;
  }

  // 2. AUTH CHECK: If logged in, redirect appropriately
  if (user) {
    return <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/student/dashboard"} replace />;
  }

  // 3. SUCCESS: Render the guest page
  return <>{children}</>;
};

export default GuestRoute;
