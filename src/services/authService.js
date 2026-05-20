import apiClient from "./apiClient";

const ADMIN_LOGIN_ENDPOINT = "/admin/live-streaming/login";
const LOGOUT_ENDPOINT = "/users/logout";

export const adminLogin = async (credentials) => {
  const { data } = await apiClient.post(ADMIN_LOGIN_ENDPOINT, credentials);
  return data;
};

export const logout = async () => {
  const { data } = await apiClient.post(LOGOUT_ENDPOINT);
  return data;
};
