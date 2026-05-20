import axios from "axios";
import { API_URL } from "../config/envConfig";

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token || null;
};

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      // Detect 403 authorization error for "Role user not authorized"
      if (
        status === 403 ||
        data?.code === 403 ||
        data?.error === "Role user not authorized" ||
        data?.message === "You do not have permission to perform this action"
      ) {
        console.warn("🚫 [API CLIENT] User unauthorized (403). Redirecting to auto-logout...");
        window.location.href = "/logout";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
