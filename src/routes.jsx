import React from "react";
import LoginPage from "./pages/auth/LoginPage";
import LogoutPage from "./pages/auth/LogoutPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import LiveStreamDashboard from "./pages/dashboard/LiveStreamDashboard";

const routes = [
  { path: "/", element: <LoginPage />, protected: false },
  { path: "/logout", element: <LogoutPage />, protected: false },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <LiveStreamDashboard />
      </ProtectedRoute>
    ),
    protected: true,
  },
];

export default routes;
