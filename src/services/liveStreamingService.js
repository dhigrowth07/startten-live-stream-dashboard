import apiClient from "./apiClient";

export const getAdminLiveModeDashboard = async () => {
  const { data } = await apiClient.get("/admin/live-streaming/live-mode/dashboard");
  return data;
};

export const getAdminLiveModeContestDetails = async (contestId) => {
  const { data } = await apiClient.get(`/admin/live-streaming/live-mode/contest/${contestId}`);
  return data;
};

export const getAdminV4LiveModeContestDetails = async (contestId) => {
  const { data } = await apiClient.get(`/admin/live-streaming/live-mode/v4/contest/${contestId}`);
  return data;
};
