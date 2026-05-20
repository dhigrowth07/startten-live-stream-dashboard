import React from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { selectAuthState } from "../redux/auth/authSlice";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, status } = useSelector(selectAuthState);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen text-white bg-gray-900">
        <span className="animate-pulse">Checking permissions…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
