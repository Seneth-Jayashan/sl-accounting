import { type ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoadingPage from "../components/LoadingPage"; // Ensure you have this component
import AccessDeniedModal from "../components/modals/AccessDenied"; // Check your file path

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[]; // e.g. ["admin", "student"]
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // 1. LOADING: Wait for AuthContext to check the token
  if (loading) {
    return <LoadingPage />;
  }
  console.log("ProtectedRoute: User is", user);

  // 2. AUTH CHECK: If not logged in, go to Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }


  // 3. ROLE CHECK: Logged in, but wrong role?
  if (allowedRoles && !allowedRoles.includes(user.role ?? "")) {
    // Return the Modal Component directly.
    // We force isOpen={true} because if code reaches here, access is definitely denied.
    return (
      <AccessDeniedModal 
        isOpen={true} 
        onClose={() => navigate("/login", { replace: true })} // Send to safe zone on close
        title="Restricted Area"
        message={`You need to be a ${allowedRoles.join(" or ")} to view this page.`}
      />
    );
  }

  // 4. SUCCESS: Render the protected page
  return <>{children}</>;
};

export default ProtectedRoute;