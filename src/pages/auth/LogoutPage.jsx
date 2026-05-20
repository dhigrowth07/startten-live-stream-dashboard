import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectAuthStatus, resetAuthState } from "../../redux/auth/authSlice";
import { persistor } from "../../redux/store";
import { setAuthToken } from "../../services/apiClient";

const LogoutPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const status = useSelector(selectAuthStatus);

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Trigger logout API call
        // @ts-ignore - dispatching thunk
        await dispatch(logout()).unwrap();
      } catch (error) {
        // Even if logout API fails, we should clear local state
        console.warn("Logout API call failed, clearing local state anyway:", error);
        // Manually reset auth state if API call failed
        dispatch(resetAuthState());
      } finally {
        // Explicitly clear the token from apiClient
        setAuthToken(null);

        // Purge persisted state to clear all stored auth data (including token)
        await persistor.purge();

        // Navigate to login page
        navigate("/", { replace: true });
      }
    };

    performLogout();
  }, [dispatch, navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900 mx-auto mb-4"></div>
        <p className="text-lg">{status === "loading" ? "Logging out..." : "Redirecting to login..."}</p>
      </div>
    </div>
  );
};

export default LogoutPage;
