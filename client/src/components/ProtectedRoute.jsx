import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div
        className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center"
        style={{ fontFamily: "'Courier New', Consolas, Monaco, monospace" }}
      >
        <div className="text-center">
          <div className="mb-4">
            <div className="w-12 h-12 text-green-400 mx-auto mb-4 animate-spin border-2 border-green-400 border-t-transparent rounded-full"></div>
          </div>
          <div className="text-lg mb-2">CHECKING_AUTHENTICATION...</div>
          <div className="text-green-400/60 text-sm">
            Verifying user credentials
          </div>
        </div>
      </div>
    );
  }

  // Redirect to home page if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Render protected content if authenticated
  return children;
};

export default ProtectedRoute;
