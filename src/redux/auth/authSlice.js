import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { showErrorToast, showSuccessToast } from "../../utils/toast";
import * as authService from "../../services/authService";
import { handleApiError } from "../../utils/APIErrorHandler";
import { setAuthToken } from "../../services/apiClient";

/**
 * @typedef {Object} AuthState
 * @property {Record<string, unknown> | null} user
 * @property {string | null} accessToken
 * @property {boolean} isAuthenticated
 * @property {'idle' | 'loading' | 'succeeded' | 'failed'} status
 * @property {string | null} error
 */

/** @type {AuthState} */
const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  status: "idle",
  error: null,
};

export const adminLogin = createAsyncThunk("auth/adminLogin", async (credentials, { rejectWithValue }) => {
  try {
    const response = await authService.adminLogin(credentials);

    if (!response?.success || !response?.token) {
      return rejectWithValue(response?.message || "Login failed");
    }

    return {
      user: response.user,
      token: response.token,
      message: response.message,
    };
  } catch (error) {
    const err = handleApiError(error);
    return rejectWithValue(err?.message || "Unable to login");
  }
});

export const logout = createAsyncThunk("auth/logout", async (_, { rejectWithValue }) => {
  try {
    const response = await authService.logout();
    return response;
  } catch (error) {
    const err = handleApiError(error);
    return rejectWithValue(err?.message || "Unable to logout");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetAuthState: () => {
      setAuthToken(null);
      return { ...initialState };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(adminLogin.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload?.user || null;
        const token = typeof action.payload?.token === "string" ? action.payload.token : null;
        state.accessToken = token;
        state.isAuthenticated = Boolean(token);
        state.error = null;
        setAuthToken(token);
        const successMessage = typeof action.payload?.message === "string" ? action.payload.message : "Login successful";
        showSuccessToast(successMessage);
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.status = "failed";
        const errorMessage = typeof action.payload === "string" ? action.payload : "Login failed";
        state.error = errorMessage;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        showErrorToast(errorMessage);
      })
      .addCase(logout.pending, (state) => {
        state.status = "loading";
      })
      .addCase(logout.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.error = null;
        setAuthToken(null);
        if (typeof action.payload?.message === "string") {
          showSuccessToast(action.payload.message);
        }
      })
      .addCase(logout.rejected, (state, action) => {
        state.status = "failed";
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        const errorMessage = typeof action.payload === "string" ? action.payload : "Logout failed";
        state.error = errorMessage;
        setAuthToken(null);
        showErrorToast(errorMessage);
      });
  },
});

export const { resetAuthState } = authSlice.actions;

export const selectAuthState = (state) => state.auth;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAccessToken = (state) => state.auth.accessToken;
export const selectAuthStatus = (state) => state.auth.status;

export default authSlice.reducer;
