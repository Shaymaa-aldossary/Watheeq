import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      // If user is logged in, redirect to appropriate dashboard
      if (user?.role === 'admin') {
        navigate("/admin", { replace: true });
      } else {
        navigate("/user", { replace: true });
      }
    } else {
      // If user is not logged in, redirect to login page
      navigate("/login", { replace: true });
    }
  }, [navigate, isAuthenticated, user]);

  return null;
}
