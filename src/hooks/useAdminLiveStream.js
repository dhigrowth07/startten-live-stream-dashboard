import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../config/envConfig";
import { getAdminLiveModeContestDetails, getAdminLiveModeDashboard, getAdminV4LiveModeContestDetails } from "../services/liveStreamingService";
import { showErrorToast } from "../utils/toast";

const ADMIN_NAMESPACE = "/admin/live-mode";

const SOCKET_EVENTS = {
  ADMIN_JOIN: "admin:live-mode:join",
  ADMIN_LEAVE: "admin:live-mode:leave",
  ADMIN_GET_STATE: "admin:live-mode:getState",
  ADMIN_UPDATE: "admin:live-mode:update",
  ADMIN_V4_JOIN: "admin-live-mode-v4:join",
  ADMIN_V4_LEAVE: "admin-live-mode-v4:leave",
  ADMIN_V4_GET_STATE: "admin-live-mode-v4:getState",
  ADMIN_V4_UPDATE: "admin:live-mode:v4:update",
  CONTEST_UPDATED: "live-streaming:contestUpdated",
  WINNER_ANNOUNCED: "live-streaming:winnerAnnounced",
  COUNTDOWN_UPDATE: "live-streaming:countdownUpdate",
  POOL_UPDATE: "live-streaming:poolUpdate",
  PARTICIPANT_UPDATE: "live-streaming:participantUpdate",
};

const SOCKET_RECONNECT_DELAY = 3000;

/**
 * @returns {{
 *  loading: boolean;
 *  loadingContestDetails: boolean;
 *  error: string | null;
 *  dashboardData: Record<string, any> | null;
 *  dashboardDataV4: Record<string, any> | null;
 *  contestDetails: Record<string, any> | null;
 *  contestDetailsV4: Record<string, any> | null;
 *  activeContestId: string | null;
 *  activeContestIdV4: string | null;
 *  refreshDashboard: () => Promise<void>;
 *  refreshContest: (contestId: string) => Promise<void>;
 *  refreshContestV4: (contestId: string) => Promise<void>;
 * }}
 */
export const useAdminLiveStream = () => {
  const [dashboardData, setDashboardData] = useState(/** @type {Record<string, any> | null} */(null));
  const [dashboardDataV4, setDashboardDataV4] = useState(/** @type {Record<string, any> | null} */(null));
  const [contestDetails, setContestDetails] = useState(/** @type {Record<string, any> | null} */(null));
  const [contestDetailsV4, setContestDetailsV4] = useState(/** @type {Record<string, any> | null} */(null));
  const [loading, setLoading] = useState(true);
  const [loadingContestDetails, setLoadingContestDetails] = useState(false);
  const [error, setError] = useState(/** @type {string | null} */(null));
  const socketRef = useRef(/** @type {import('socket.io-client').Socket | null} */(null));
  const reconnectTimeoutRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */(null));
  const activeContestRef = useRef(/** @type {string | null} */(null));
  const activeContestRefV4 = useRef(/** @type {string | null} */(null));

  const activeContestId = useMemo(() => {
    if (!dashboardData?.activeContests?.length) return null;

    const now = new Date().getTime();

    // 1. Check if there is a recently resolved/ended contest (DECIDED or CLOSED_NO_WINNER).
    //    Window is 90s from lockTime — wider than the dashboard's 60s from first-observed-DECIDED
    //    (which can be up to 15s later than lockTime). This prevents details from clearing early.
    const recentlyEnded = dashboardData.activeContests.find((contest) => {
      if (contest?.status === "DECIDED" || contest?.status === "CLOSED_NO_WINNER" || contest?.phase === "ENDED") {
        const decisionTime = contest.lockTime || contest.endTime;
        if (decisionTime) {
          const decisionMs = new Date(decisionTime).getTime();
          const elapsed = now - decisionMs;
          // 90 seconds: 60s display window + up to 30s backend processing delay buffer
          return elapsed > 0 && elapsed < 90 * 1000;
        }
      }
      return false;
    });

    if (recentlyEnded) {
      console.log("🏆 [HOOK DEBUG] Prioritizing recently ended contest details:", recentlyEnded.id);
      return recentlyEnded.id;
    }

    // 2. Otherwise, find ACTIVE contest first, then LOCKED
    const activeOrLocked = dashboardData.activeContests.find((contest) => contest?.status === "ACTIVE" || contest?.status === "LOCKED");
    if (activeOrLocked) return activeOrLocked.id;

    // 3. Fallback
    const ended = dashboardData.activeContests.find((contest) => contest?.status === "DECIDED" || contest?.status === "CLOSED_NO_WINNER");
    if (ended) return ended.id;

    return dashboardData.activeContests[0]?.id || null;
  }, [dashboardData]);

  const activeContestIdV4 = useMemo(() => {
    if (!dashboardDataV4?.activeContestsV4?.length) return null;

    const now = new Date().getTime();

    // 1. Check recently ended V4 contests (ENDED or CLOSED_NO_WINNER)
    const recentlyEnded = dashboardDataV4.activeContestsV4.find((contest) => {
      if (contest?.status === "ENDED" || contest?.status === "CLOSED_NO_WINNER" || contest?.phase === "ENDED") {
        const decisionTime = contest.countdownEndTime || contest.endTime;
        if (decisionTime) {
          const decisionMs = new Date(decisionTime).getTime();
          const elapsed = now - decisionMs;
          return elapsed > 0 && elapsed < 90 * 1000;
        }
      }
      return false;
    });

    if (recentlyEnded) {
      console.log("🏆 [HOOK DEBUG] Prioritizing recently ended V4 contest details:", recentlyEnded.id);
      return recentlyEnded.id;
    }

    // 2. Find PREDICTION, COUNTDOWN, or SHOWCASE phase V4 contest
    const activeOrLocked = dashboardDataV4.activeContestsV4.find(
      (contest) =>
        contest?.status === "PREDICTION" ||
        contest?.status === "COUNTDOWN" ||
        contest?.status === "SHOWCASE"
    );
    if (activeOrLocked) return activeOrLocked.id;

    // 3. Fallback
    const ended = dashboardDataV4.activeContestsV4.find((contest) => contest?.status === "ENDED" || contest?.status === "CLOSED_NO_WINNER");
    if (ended) return ended.id;

    return dashboardDataV4.activeContestsV4[0]?.id || null;
  }, [dashboardDataV4]);

  const loadDashboard = useCallback(async () => {
    try {
      const response = await getAdminLiveModeDashboard();
      // Backend returns: { success, data: { dashboard } }
      let dashboardData = null;
      if (response?.success && response?.data?.dashboard) {
        dashboardData = response.data.dashboard;
      } else if (response?.data?.dashboard) {
        dashboardData = response.data.dashboard;
      } else if (response?.dashboard) {
        dashboardData = response.dashboard;
      } else if (response?.data) {
        dashboardData = response.data;
      } else {
        dashboardData = response;
      }
      setDashboardData(dashboardData);
      setDashboardDataV4(dashboardData);
    } catch (err) {
      const message = err?.message || "Unable to load live dashboard data";
      setError(message);
      showErrorToast(message);
    }
  }, []);

  const loadContestDetails = useCallback(async (contestId) => {
    if (!contestId) {
      setContestDetails(null);
      setLoadingContestDetails(false);
      return;
    }
    try {
      setLoadingContestDetails(true);
      const response = await getAdminLiveModeContestDetails(contestId);
      // Backend returns: { success, data: { details } }
      let contestDetailsData = null;
      if (response?.success && response?.data?.details) {
        contestDetailsData = response.data.details;
      } else if (response?.data?.details) {
        contestDetailsData = response.data.details;
      } else if (response?.details) {
        contestDetailsData = response.details;
      } else if (response?.data) {
        contestDetailsData = response.data;
      } else {
        contestDetailsData = response;
      }
      setContestDetails(contestDetailsData);
    } catch (err) {
      const message = err?.message || "Unable to load contest details";
      setError(message);
      showErrorToast(message);
    } finally {
      setLoadingContestDetails(false);
    }
  }, []);

  const loadContestDetailsV4 = useCallback(async (contestId) => {
    if (!contestId) {
      setContestDetailsV4(null);
      return;
    }
    try {
      const response = await getAdminV4LiveModeContestDetails(contestId);
      let contestDetailsData = null;
      if (response?.success && response?.data?.details) {
        contestDetailsData = response.data.details;
      } else if (response?.data?.details) {
        contestDetailsData = response.data.details;
      } else if (response?.details) {
        contestDetailsData = response.details;
      } else if (response?.data) {
        contestDetailsData = response.data;
      } else {
        contestDetailsData = response;
      }
      setContestDetailsV4(contestDetailsData);
    } catch (err) {
      console.error("Unable to load V4 contest details:", err);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await loadDashboard();
      setLoading(false);
    };

    initialize();

    return () => {
      setDashboardData(null);
      setDashboardDataV4(null);
      setContestDetails(null);
      setContestDetailsV4(null);
    };
  }, [loadDashboard]);

  useEffect(() => {
    if (!activeContestId) {
      setContestDetails(null);
      return;
    }
    loadContestDetails(activeContestId);
  }, [activeContestId, loadContestDetails]);

  useEffect(() => {
    if (!activeContestIdV4) {
      setContestDetailsV4(null);
      return;
    }
    loadContestDetailsV4(activeContestIdV4);
  }, [activeContestIdV4, loadContestDetailsV4]);

  useEffect(() => {
    activeContestRef.current = activeContestId;
  }, [activeContestId]);

  useEffect(() => {
    activeContestRefV4.current = activeContestIdV4;
  }, [activeContestIdV4]);

  // Auto-sync contest details with dashboard data (Fallback for missing/delayed socket events)
  useEffect(() => {
    if (!activeContestId || !dashboardData?.activeContests) return;

    const activeContestInDashboard = dashboardData.activeContests.find((c) => c.id === activeContestId);
    if (!activeContestInDashboard) return;

    const dashboardEntries = activeContestInDashboard.totalEntries || 0;
    const currentDetailsEntries = contestDetails?.statistics?.totalEntries || 0;

    // Re-fetch if entries count increased
    if (dashboardEntries > currentDetailsEntries && !loadingContestDetails) {
      console.log("🔄 [HOOK] Entry count increased, re-fetching contest details");
      loadContestDetails(activeContestId);
      return;
    }

    // Critical: Re-fetch when contest transitions to DECIDED but winner is not yet in details.
    // The isWinner flag is set inside the same DB transaction as the DECIDED status update,
    // so the first fetch (triggered by status change) may arrive before the DB commit.
    // We retry once after a short delay to pick up the winner entry.
    const isDecided = activeContestInDashboard.status === "DECIDED" || activeContestInDashboard.status === "CLOSED_NO_WINNER";
    const detailsAreForThisContest = contestDetails?.contest?.id === activeContestId;
    const hasWinnerInDetails = detailsAreForThisContest && contestDetails?.entries?.some((e) => e.isWinner);

    if (isDecided && detailsAreForThisContest && !hasWinnerInDetails && !loadingContestDetails) {
      console.log("🏆 [HOOK] Contest DECIDED but no winner in details yet. Retrying in 2s...");
      const retryTimeout = setTimeout(() => {
        loadContestDetails(activeContestId);
      }, 2000); // 2-second delay to allow DB transaction to fully commit
      return () => clearTimeout(retryTimeout);
    }
  }, [dashboardData, activeContestId, contestDetails, loadingContestDetails, loadContestDetails]);

  const cleanupSocket = useCallback(() => {
    if (socketRef.current) {
      try {
        // Suppress errors during cleanup (common in React StrictMode)
        const socket = socketRef.current;
        socket.removeAllListeners(); // Remove all listeners to prevent error logs
        socket.emit(SOCKET_EVENTS.ADMIN_LEAVE);
        socket.emit(SOCKET_EVENTS.ADMIN_V4_LEAVE);
        socket.disconnect();
      } catch {
        // Silently ignore cleanup errors (common during React StrictMode double-mounting)
      }
      socketRef.current = null;
    }
  }, []);

  const connectSocket = useCallback(() => {
    if (!SOCKET_URL || socketRef.current) {
      if (!SOCKET_URL) {
        console.warn("⚠️ SOCKET_URL is empty, skipping socket connection. Ensure VITE_PUBLIC_API_URL is set in your .env file (SOCKET_URL is automatically derived from it)");
      }
      return;
    }

    // Validate SOCKET_URL format
    try {
      new URL(SOCKET_URL);
    } catch {
      console.warn("Invalid SOCKET_URL, skipping socket connection:", SOCKET_URL);
      return;
    }

    const socketNamespace = `${SOCKET_URL}${ADMIN_NAMESPACE}`;
    console.log("🔌 Attempting to connect to socket:", socketNamespace);

    const socket = io(socketNamespace, {
      transports: ["websocket", "polling"], // Add polling as fallback
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: SOCKET_RECONNECT_DELAY,
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    socket.on("connect", () => {
      socket.emit(SOCKET_EVENTS.ADMIN_JOIN);
      socket.emit(SOCKET_EVENTS.ADMIN_GET_STATE);

      // EMIT THESE TO SUBSCRIBE TO V4 REAL-TIME DATA:
      socket.emit(SOCKET_EVENTS.ADMIN_V4_JOIN);
      socket.emit(SOCKET_EVENTS.ADMIN_V4_GET_STATE);

      setError(null); // Clear any previous errors
    });

    const scheduleReconnect = () => {
      if (reconnectTimeoutRef.current) {
        return;
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;
        cleanupSocket();
        connectSocket();
      }, SOCKET_RECONNECT_DELAY);
    };

    socket.on("connect_error", (err) => {
      // Suppress connection errors - they're handled by Socket.IO's automatic reconnection
      // These errors are common during React StrictMode double-mounting in development
      // Only log if it's a persistent connection issue (not during initial mount/unmount)
      if (socketRef.current?.connected === false && socketRef.current?.disconnected === true) {
        // Only log if socket was previously connected and now disconnected
        console.debug("Socket connection error (non-critical):", err?.message || "Connection failed");
      }
      // Don't set error state for socket failures - they're not critical
      // Socket.IO handles reconnection automatically
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      // Only reconnect if it wasn't a manual disconnect
      if (reason === "io server disconnect" || reason === "transport close") {
        scheduleReconnect();
      }
    });

    const handleDashboardPayload = (payload) => {
      if (!payload) return;
      // Socket may send: { dashboard } or { data: { dashboard } } or just the dashboard object
      let dashboardData = null;
      if (payload?.dashboard) {
        dashboardData = payload.dashboard;
      } else if (payload?.data?.dashboard) {
        dashboardData = payload.data.dashboard;
      } else if (payload?.data) {
        dashboardData = payload.data;
      } else {
        dashboardData = payload;
      }
      setDashboardData(dashboardData);
    };

    socket.on(SOCKET_EVENTS.ADMIN_GET_STATE, handleDashboardPayload);
    socket.on(SOCKET_EVENTS.ADMIN_UPDATE, handleDashboardPayload);

    const handleV4DashboardPayload = (payload) => {
      if (!payload) return;
      let v4Data = payload.data || payload.dashboard || payload;
      setDashboardDataV4(v4Data);
    };

    socket.on(SOCKET_EVENTS.ADMIN_V4_GET_STATE, handleV4DashboardPayload);
    socket.on(SOCKET_EVENTS.ADMIN_V4_UPDATE, handleV4DashboardPayload);

    const handleContestRelatedUpdate = async (payload) => {
      const isV4 = payload?.version === "v4" || payload?.contest?.contestType === "V4";
      await loadDashboard();
      if (isV4) {
        console.log("⚡ [SOCKET] Real-time V4 Contest Update received:", payload?.contest?.id);
        const currentV4Id = activeContestRefV4.current;
        if (payload?.contest?.id && payload.contest.id === currentV4Id) {
          await loadContestDetailsV4(currentV4Id);
        }
      } else {
        const updatedContest = payload?.contest;
        const currentContestId = activeContestRef.current;
        if (updatedContest?.id && updatedContest.id === currentContestId) {
          await loadContestDetails(currentContestId);
        }
      }
    };

    socket.on(SOCKET_EVENTS.CONTEST_UPDATED, (payload) => {
      handleContestRelatedUpdate(payload);
    });

    socket.on(SOCKET_EVENTS.POOL_UPDATE, async (payload) => {
      await loadDashboard();
    });

    socket.on(SOCKET_EVENTS.PARTICIPANT_UPDATE, async (payload) => {
      const currentContestId = activeContestRef.current;
      const currentV4Id = activeContestRefV4.current;
      await loadDashboard();
      if (currentContestId) {
        await loadContestDetails(currentContestId);
      }
      if (currentV4Id) {
        await loadContestDetailsV4(currentV4Id);
      }
    });

    socket.on(SOCKET_EVENTS.COUNTDOWN_UPDATE, async (payload) => {
      const currentContestId = activeContestRef.current;
      const currentV4Id = activeContestRefV4.current;
      if (currentContestId) {
        await loadContestDetails(currentContestId);
      }
      if (currentV4Id) {
        await loadContestDetailsV4(currentV4Id);
      }
    });

    socket.on(SOCKET_EVENTS.WINNER_ANNOUNCED, async (payload) => {
      const currentContestId = activeContestRef.current;
      const currentV4Id = activeContestRefV4.current;
      await loadDashboard();
      if (currentContestId) {
        await loadContestDetails(currentContestId);
      }
      if (currentV4Id) {
        await loadContestDetailsV4(currentV4Id);
      }
    });

    socketRef.current = socket;
  }, [cleanupSocket, loadContestDetails, loadContestDetailsV4, loadDashboard]);

  useEffect(() => {
    connectSocket();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      cleanupSocket();
    };
  }, [connectSocket, cleanupSocket]);

  return {
    loading,
    loadingContestDetails,
    error,
    dashboardData,
    dashboardDataV4,
    contestDetails,
    contestDetailsV4,
    activeContestId,
    activeContestIdV4,
    refreshDashboard: loadDashboard,
    refreshContest: loadContestDetails,
    refreshContestV4: loadContestDetailsV4,
  };
};

export default useAdminLiveStream;
