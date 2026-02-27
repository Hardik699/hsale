import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check authentication status synchronously
    const auth = localStorage.getItem("isAuthenticated");
    if (!auth) {
      // Redirect to login if not authenticated
      navigate("/", { replace: true });
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
    }
  }, [navigate]);

  // Show nothing while checking auth, render children only if authenticated
  if (isAuthenticated === null) {
    return null; // Loading state
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
