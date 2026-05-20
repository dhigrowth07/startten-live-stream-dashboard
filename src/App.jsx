import React, { Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useSelector } from "react-redux";
import routes from "./routes.jsx";
import "./App.css";
import ProtectedRoute from "./routes/ProtectedRoute";
import { Toaster } from "react-hot-toast";
import { selectAccessToken } from "./redux/auth/authSlice";
import { setAuthToken } from "./services/apiClient";

const Loader = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900" />
  </div>
);

function App() {
  const accessToken = useSelector(selectAccessToken);

  useEffect(() => {
    setAuthToken(accessToken);
  }, [accessToken]);

  return (
    <Router>
      <Suspense fallback={<Loader />}>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#1f2937",
              color: "#f9fafb",
              borderRadius: "0.5rem",
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#1f2937",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#1f2937",
              },
            },
          }}
        />
        <Routes>
          {routes.map((route, index) => (
            <Route key={index} path={route.path} element={route.protected ? <ProtectedRoute>{route.element}</ProtectedRoute> : route.element} />
          ))}
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
