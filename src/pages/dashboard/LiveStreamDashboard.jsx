import React, { useMemo, useState, useEffect, useRef } from "react";
import GlobalStatisticsStrip from "../../components/liveStream/GlobalStatisticsStrip";
import V5Monitor from "../../components/liveStream/V5Monitor";
import RecentWinnersTicker from "../../components/liveStream/RecentWinnersTicker";
import SystemHealthBox from "../../components/liveStream/SystemHealthBox";
import useAdminLiveStream from "../../hooks/useAdminLiveStream";
import V4Monitor from "../../components/liveStream/V4Monitor";

/** Duration the winner card is held on screen after the contest is decided (ms) */
const WINNER_DISPLAY_WINDOW_MS = 60 * 1000;

const formatSecondsToTimer = (seconds) => {
  if (typeof seconds !== "number" || Number.isNaN(seconds) || seconds <= 0) {
    return "00:00";
  }
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const formatTime = (value) => {
  if (!value) return "--:--:--";
  try {
    const date = new Date(value);
    return date.toLocaleTimeString("en-IN", { hour12: false });
  } catch {
    return "--:--:--";
  }
};

const buildHeatmap = (entries = []) => {
  return entries.reduce((acc, entry) => {
    const key = entry.formattedNumber || String(entry.numberPicked).padStart(3, "0");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
};

const buildLiveFeed = (entries = []) =>
  entries.slice(0, 20).map((entry) => {
    const userId = entry.user?.id ? String(entry.user.id).slice(-4).padStart(4, "0") : "----";
    const userName = [entry.user?.firstName, entry.user?.lastName].filter(Boolean).join(" ");
    return {
      time: formatTime(entry.purchasedAt),
      userId,
      userName: userName || (entry.user?.id ? `User${userId}` : "Anonymous"),
      number: entry.formattedNumber || String(entry.numberPicked).padStart(3, "0"),
    };
  });

const LiveStreamDashboard = () => {
  const {
    loading,
    loadingContestDetails,
    dashboardData: dashboardDataRaw,
    dashboardDataV4,
    contestDetails: contestDetailsRaw,
    contestDetailsV4,
    error: liveError,
    refreshDashboard,
  } = useAdminLiveStream();
  const [liveTimer, setLiveTimer] = useState("00:00");
  const [liveTimerV4, setLiveTimerV4] = useState("00:00");

  /**
   * decidedAtRef — when each contest was *first observed* as DECIDED.
   * Used for the 60-second display window (activeContest selector + refreshDashboard timeout).
   * @type {React.MutableRefObject<Record<string, number>>}
   */
  const decidedAtRef = useRef({});

  /**
   * winnerFoundAtRef — when winner data (isWinner=true entry) was *first confirmed* in details.
   * Used as the baseline for the 60-second countdown timer.
   * Timer is frozen at 01:00 until this is set, then counts down from 01:00 smoothly.
   * @type {React.MutableRefObject<Record<string, number>>}
   */
  const winnerFoundAtRef = useRef({});

  /**
   * Tracks the scheduled timeout ID for refreshing the dashboard, ensuring we only
   * have one scheduled refresh active at any time.
   */
  const refreshTimeoutRef = useRef(null);

  /**
   * Tracks the previous active contest ID to detect transitions and clean up timeouts.
   */
  const prevContestIdRef = useRef(null);

  /** @type {Record<string, any> | null} */
  const dashboardData = dashboardDataRaw;
  /** @type {Record<string, any> | null} */
  const contestDetails = contestDetailsRaw;



  const activeContest = useMemo(() => {
    if (!dashboardData?.activeContests?.length) return null;

    const now = Date.now();

    // 1. Check if there is a recently decided contest we should keep showing.
    //    We use decidedAtRef as the baseline (first time FE observed it as DECIDED),
    //    not lockTime, to guarantee a FULL 60s of winner display regardless of backend delay.
    const recentlyEnded = dashboardData.activeContests.find((contest) => {
      if (contest?.status === "DECIDED" || contest?.status === "CLOSED_NO_WINNER" || contest?.phase === "ENDED") {
        const firstObserved = decidedAtRef.current[contest.id];
        if (firstObserved) {
          const elapsed = now - firstObserved;
          return elapsed < WINNER_DISPLAY_WINDOW_MS;
        }
      }
      return false;
    });

    if (recentlyEnded) {
      return recentlyEnded;
    }

    // 2. Otherwise, find ACTIVE contest first, then LOCKED
    const active = dashboardData.activeContests.find((contest) => contest?.status === "ACTIVE" && contest?.phase !== "ENDED");
    if (active) return active;

    const locked = dashboardData.activeContests.find((contest) => contest?.status === "LOCKED" && contest?.phase !== "ENDED");
    if (locked) return locked;

    // 3. Fallback to ended/decided or first item
    const ended = dashboardData.activeContests.find(
      (contest) => contest?.status === "DECIDED" || contest?.status === "CLOSED_NO_WINNER" || contest?.phase === "ENDED"
    );
    if (ended) return ended;

    return dashboardData.activeContests[0];
  }, [dashboardData]);

  const activeContestV4 = useMemo(() => {
    if (!dashboardDataV4?.activeContestsV4?.length) return null;

    // Return the first active or locked V4 contest in progress
    const activeOrLocked = dashboardDataV4.activeContestsV4.find(
      (c) => c?.status === "ACTIVE" || c?.status === "LOCKED" || c?.phase === "PREDICTION" || c?.phase === "COUNTDOWN"
    );
    return activeOrLocked || dashboardDataV4.activeContestsV4[0];
  }, [dashboardDataV4]);

  /**
   * Unified Timing Effect:
   * Handles recording of first-observed resolved time, winner confirmation time,
   * fallback timeout if the winner never loads (within 10s), and precise, clean scheduling
   * of the dashboard refresh with full unmount and contest transition cleanups.
   */
  useEffect(() => {
    if (!activeContest) return;

    const contestId = activeContest.id;
    const isEndedPhase =
      activeContest.status === "DECIDED" ||
      activeContest.status === "CLOSED_NO_WINNER" ||
      activeContest.status === "ENDED" ||
      activeContest.status === "CANCELLED" ||
      activeContest.phase === "ENDED" ||
      activeContest.phase === "DECIDED" ||
      activeContest.phase === "CLOSED_NO_WINNER";

    if (!isEndedPhase) {
      // Clear timeout if we transition back to a non-decided state
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      return;
    }

    // 1. Record first observed time for the ended contest
    if (!decidedAtRef.current[contestId]) {
      decidedAtRef.current[contestId] = Date.now();
    }

    const firstObserved = decidedAtRef.current[contestId];
    const detailsMatch = contestDetails?.contest?.id === contestId;
    const hasWinner = detailsMatch && contestDetails?.entries?.some((e) => e.isWinner);

    // Helper function to schedule refresh safely
    const scheduleRefresh = (delayMs) => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      refreshTimeoutRef.current = setTimeout(() => {
        refreshDashboard();
        refreshTimeoutRef.current = null;
      }, delayMs);
    };

    // Determine if this contest should have a winner
    const minPurchases = activeContest.minPurchases || 120;
    const minPurchasesMet = activeContest.minimumPurchasesMet || (activeContest.totalEntries || 0) >= minPurchases;
    const shouldHaveWinner =
      (activeContest.status === "DECIDED" ||
        activeContest.status === "ENDED" ||
        activeContest.phase === "DECIDED" ||
        activeContest.phase === "ENDED" ||
        activeContest.status === "CLOSED_NO_WINNER" ||
        activeContest.phase === "CLOSED_NO_WINNER") &&
      minPurchasesMet;

    // If details have loaded and matched this contest
    if (detailsMatch) {
      const releaseTimer = shouldHaveWinner ? hasWinner : true;

      if (releaseTimer) {
        if (!winnerFoundAtRef.current[contestId]) {
          winnerFoundAtRef.current[contestId] = Date.now();
          scheduleRefresh(WINNER_DISPLAY_WINDOW_MS + 200);
        }
      } else {
        // Contest should have a winner, but details don't have it yet. Strictly hold at 01:00!
        // Fallback: If details fetch/winner population takes more than 10 seconds, start the countdown anyway
        const elapsedSinceDecided = Date.now() - firstObserved;
        if (elapsedSinceDecided > 10 * 1000) {
          if (!winnerFoundAtRef.current[contestId]) {
            winnerFoundAtRef.current[contestId] = Date.now();
            scheduleRefresh(WINNER_DISPLAY_WINDOW_MS + 200);
          }
        }
      }
    } else {
      // Details are still loading. Strictly hold the timer at 01:00!
      // Fallback: If details fetch takes more than 10 seconds, start the countdown anyway
      const elapsedSinceDecided = Date.now() - firstObserved;
      if (elapsedSinceDecided > 10 * 1000) {
        if (!winnerFoundAtRef.current[contestId]) {
          winnerFoundAtRef.current[contestId] = Date.now();
          scheduleRefresh(WINNER_DISPLAY_WINDOW_MS + 200);
        }
      }
    }
  }, [activeContest?.id, activeContest?.status, activeContest?.phase, contestDetails, refreshDashboard]);

  // Clean up refresh timeout when component completely unmounts
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, []);

  // When active contest transitions, immediately clear any previous scheduled timeout
  useEffect(() => {
    if (activeContest?.id && activeContest.id !== prevContestIdRef.current) {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      prevContestIdRef.current = activeContest.id;
    }
  }, [activeContest?.id]);

  const v5MonitorData = useMemo(() => {
    if (!activeContest) return null;

    const contest = activeContest;
    const details = contestDetails?.contest?.id === contest.id ? contestDetails : null;
    const entries = details?.entries || [];
    const now = Date.now();

    const isEndedPhase =
      contest.status === "DECIDED" ||
      contest.status === "CLOSED_NO_WINNER" ||
      contest.status === "ENDED" ||
      contest.status === "CANCELLED" ||
      contest.phase === "ENDED" ||
      contest.phase === "DECIDED" ||
      contest.phase === "CLOSED_NO_WINNER";

    // Diagnostic Debug Logs
    console.log("🔍 [DEBUG] LiveStreamDashboard v5MonitorData Details:", {
      activeContestId: contest.id,
      contestStatus: contest.status,
      contestPhase: contest.phase,
      isEndedPhase,
      detailsId: details?.contest?.id,
      entriesCount: entries.length,
      winnerFound: entries.some((e) => e.isWinner),
      winnerEntry: entries.find((e) => e.isWinner),
    });

    // Calculate prediction countdown (time until lock)
    let predictionCountdownSeconds = 0;
    if (isEndedPhase) {
      predictionCountdownSeconds = 0;
    } else if (contest.lockTime) {
      predictionCountdownSeconds = Math.max(0, Math.floor((new Date(contest.lockTime).getTime() - now) / 1000));
    } else if (contest.timeRemainingUntilLock != null) {
      predictionCountdownSeconds = contest.timeRemainingUntilLock;
    } else if (contest.startTime) {
      const lockTime = new Date(new Date(contest.startTime).getTime() + 9 * 60 * 1000);
      predictionCountdownSeconds = Math.max(0, Math.floor((lockTime.getTime() - now) / 1000));
    }

    // Calculate total timer / winner display countdown
    let totalTimerSeconds = 0;
    if (isEndedPhase) {
      const winnerFoundAt = winnerFoundAtRef.current[contest.id];
      if (winnerFoundAt) {
        // Winner confirmed: count down smoothly from 60 seconds starting from the exact moment the winner was found/confirmed!
        const elapsedSinceWinnerFound = now - winnerFoundAt;
        const remainingMs = WINNER_DISPLAY_WINDOW_MS - elapsedSinceWinnerFound;
        totalTimerSeconds = Math.max(0, Math.floor(remainingMs / 1000));
      } else {
        // Winner not yet confirmed: freeze at 01:00 while waiting for backend data
        totalTimerSeconds = 60;
      }
    } else if (contest.phase === "ACTIVE" || contest.status === "ACTIVE") {
      totalTimerSeconds = predictionCountdownSeconds + 60;
    } else if (contest.endTime) {
      totalTimerSeconds = Math.max(0, Math.floor((new Date(contest.endTime).getTime() - now) / 1000));
    } else if (contest.timeRemainingUntilEnd != null) {
      totalTimerSeconds = contest.timeRemainingUntilEnd;
    }

    const winnerEntry = entries.find((entry) => entry.isWinner);
    const heatmap = buildHeatmap(entries);
    const liveFeed = buildLiveFeed(entries);

    const totalRevenueFormatted = contest.totalRevenueFormatted || `₹${(contest.totalRevenue || 0).toLocaleString()}`;
    const prizeAmountFormatted = contest.prizeAmountFormatted || `₹${(contest.prizeAmount || 0).toLocaleString()}`;

    const minPurchases = contest.minPurchases || 120;
    const minPurchasesMet = contest.minimumPurchasesMet || (contest.totalEntries || 0) >= minPurchases;

    return {
      id: contest.id,
      timer: formatSecondsToTimer(totalTimerSeconds),
      phase: contest.phase || contest.status,
      predictionCountdown: formatSecondsToTimer(predictionCountdownSeconds),
      minPurchases: minPurchases,
      minPurchasesMet: minPurchasesMet,
      totalParticipants: contest.totalParticipants || 0,
      totalEntries: contest.totalEntries || 0,
      totalRevenue: contest.totalRevenue || 0,
      totalRevenueFormatted,
      prizeAmount: contest.prizeAmount || 0,
      prizeAmountFormatted,
      winner: winnerEntry
        ? `${winnerEntry.formattedNumber} • ${[winnerEntry.user?.firstName, winnerEntry.user?.lastName].filter(Boolean).join(" ") || (winnerEntry.user?.id ? `User${String(winnerEntry.user.id).slice(-4)}` : "Winner")
        }`
        : null,
      winningNumber: winnerEntry?.formattedNumber || null,
      heatmap,
      liveFeed,
    };
  }, [activeContest, contestDetails]);

  const v4MonitorData = useMemo(() => {
    if (!activeContestV4) return null;

    const details = contestDetailsV4?.contest?.id === activeContestV4.id ? contestDetailsV4 : null;
    const entries = details?.entries || [];
    const totalEntries = details?.statistics?.totalEntries ?? activeContestV4.totalEntries ?? 0;

    const now = Date.now();
    const isEndedV4 =
      activeContestV4.status === "ENDED" ||
      activeContestV4.status === "CLOSED_NO_WINNER" ||
      activeContestV4.phase === "ENDED";

    let totalTimerSecondsV4 = 0;
    if (isEndedV4) {
      totalTimerSecondsV4 = 0;
    } else if (activeContestV4.endTime) {
      totalTimerSecondsV4 = Math.max(0, Math.floor((new Date(activeContestV4.endTime).getTime() - now) / 1000));
    } else if (activeContestV4.timeRemainingUntilEnd != null) {
      totalTimerSecondsV4 = activeContestV4.timeRemainingUntilEnd;
    }

    const clientTimerV4 = formatSecondsToTimer(totalTimerSecondsV4);

    console.log("FULL JSON", activeContestV4)
    console.log("⚡ [V4 MONITOR] Active Contest ID:", activeContestV4.id,
      "| Status:", activeContestV4.phase || activeContestV4.status,
      "| Timer:", clientTimerV4,
      "| Prize Amount:", activeContestV4.prizeAmount || 0,
      "| Total Predictions in DB:", totalEntries);

    return {
      phase: activeContestV4.phase || activeContestV4.status,
      timer: clientTimerV4,
      hiddenNumber: activeContestV4.hiddenNumber || null,
      prizePool: parseFloat(activeContestV4.prizeAmount || 0),
      totalPredictions: totalEntries,
      lastPaymentTS: entries[0]?.purchasedAt
        ? new Date(entries[0].purchasedAt).toLocaleTimeString("en-IN", { hour12: false })
        : activeContestV4.updatedAt
          ? new Date(activeContestV4.updatedAt).toLocaleTimeString("en-IN", { hour12: false })
          : "--:--:--",
      winner: activeContestV4.winnerDetails ? activeContestV4.winnerDetails : null,
      liveFeed: entries.slice(0, 10).map((e) => {
        const entryTime = e.purchasedAt ? new Date(e.purchasedAt).toLocaleTimeString("en-IN", { hour12: false }) : "--:--:--";
        const userIdSuffix = e.userId ? String(e.userId).slice(-4).padStart(4, "0") : "----";
        return {
          time: entryTime,
          userId: userIdSuffix,
          prediction: e.numberChosen,
          status: "accepted",
          type: e.type
        };
      })
    };
  }, [activeContestV4, contestDetailsV4]);

  // Live timer countdown for GlobalStatisticsStrip
  useEffect(() => {
    if (!v5MonitorData?.timer) {
      setLiveTimer("00:00");
      return;
    }

    // Initialize timer from v5MonitorData
    setLiveTimer(v5MonitorData.timer);

    const interval = setInterval(() => {
      setLiveTimer((prev) => {
        const [min, sec] = prev.split(":").map(Number);
        let newSec = sec - 1;
        let newMin = min;
        if (newSec < 0) {
          newSec = 59;
          newMin = min - 1;
        }
        if (newMin < 0) {
          return "00:00";
        }
        return `${String(newMin).padStart(2, "0")}:${String(newSec).padStart(2, "0")}`;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [v5MonitorData?.timer]);

  // Live timer countdown for V4 GlobalStatisticsStrip
  useEffect(() => {
    if (!v4MonitorData?.timer) {
      setLiveTimerV4("00:00");
      return;
    }

    // Initialize timer from v4MonitorData
    setLiveTimerV4(v4MonitorData.timer);

    const interval = setInterval(() => {
      setLiveTimerV4((prev) => {
        if (!prev || !prev.includes(":")) return prev || "00:00";
        const [min, sec] = prev.split(":").map(Number);
        let newSec = sec - 1;
        let newMin = min;
        if (newSec < 0) {
          newSec = 59;
          newMin = min - 1;
        }
        if (newMin < 0) {
          return "00:00";
        }
        return `${String(newMin).padStart(2, "0")}:${String(newSec).padStart(2, "0")}`;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [v4MonitorData?.timer]);

  /** @type {{ label: string; value: string | number }[]} */
  const globalStatsItems = useMemo(() => {
    if (loading || !dashboardData) {
      return /** @type {{ label: string; value: string | number }[]} */ ([]);
    }

    const v4Pool = dashboardData.poolDataV4?.totalPool || 0;
    const v5Pool = dashboardData.poolData?.totalPool || 0;
    const totalRev = v4Pool + v5Pool;

    const items = [
      // General Health Info
      { label: "SYS STATUS", value: "🟢 ONLINE" },

      // V4 Live Stats
      { label: "V4 PHASE", value: activeContestV4?.phase || "PREDICTION" },
      { label: "V4 TIMER", value: liveTimerV4 || "00:00" },
      { label: "V4 PRIZE POOL", value: activeContestV4?.totalRevenueFormatted || `₹${(activeContestV4?.totalRevenue || 0).toLocaleString()}` },
      { label: "V4 ENTRIES", value: `${activeContestV4?.totalEntries || 0} (Today: ${dashboardData.poolDataV4?.totalEntries || 0})` },

      // V5 Live Stats
      { label: "V5 PHASE", value: activeContest?.phase || "PURCHASE" },
      { label: "V5 TIMER", value: liveTimer || "00:00" },
      { label: "V5 PRIZE POOL", value: activeContest?.prizeAmountFormatted || `₹${(activeContest?.prizeAmount || 0).toLocaleString()}` },
      { label: "V5 ENTRIES", value: `${activeContest?.totalEntries || 0} (Today: ${dashboardData.poolData?.totalEntries || 0})` },

      // Aggregated Statistics
      { label: "TOTAL REVENUE", value: `₹${totalRev.toLocaleString('en-IN')}` },
      { label: "TOTAL ENTRIES", value: (dashboardData.poolDataV4?.totalEntries || 0) + (dashboardData.poolData?.totalEntries || 0) },
      { label: "TOTAL PARTICIPANTS", value: (dashboardData.poolDataV4?.totalParticipants || 0) + (dashboardData.poolData?.totalParticipants || 0) },
      { label: "ACTIVE CONTESTS", value: (dashboardData.poolDataV4?.activeContestCount || 0) + (dashboardData.poolData?.activeContestCount || 0) },

      { label: "UPDATED", value: new Date(dashboardData.timestamp || Date.now()).toLocaleTimeString("en-IN", { hour12: false }) },
    ];

    const filtered = items.filter((item) => item.value !== undefined && item.value !== null);

    return /** @type {{ label: string; value: string | number }[]} */ (filtered);
  }, [loading, dashboardData, activeContest, liveTimer, activeContestV4, v4MonitorData, liveTimerV4]);

  const recentWinners = useMemo(() => {
    if (!dashboardData?.recentWinners?.length) return [];
    return dashboardData.recentWinners.map((winner) => ({
      name: winner.user?.displayName || winner.user?.userId || "Anonymous",
      amount: winner.prizeAmount || 0,
      contestType: winner.contestType || "V5",
    }));
  }, [dashboardData]);

  // const systemHealth = dashboardData?.systemHealth || null;

  return (
    <div className="w-full h-screen bg-gray-900 text-white grid grid-rows-[auto_1fr_auto] overflow-hidden">
      {liveError && <div className="bg-red-600 text-white text-center py-2 text-sm">{liveError}</div>}

      <GlobalStatisticsStrip
        data={globalStatsItems}
        loading={Boolean(loading && !dashboardData)}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-1 pb-1 flex-1 min-h-0 overflow-hidden relative">
        {/* V4 Monitor (Left side) */}
        {(() => {
          if (loading && !dashboardDataV4) {
            return (
              <div className="flex h-full items-center justify-center bg-gray-800 rounded border-2 border-blue-500">
                <span className="animate-pulse text-gray-400">Initializing V4 Monitor…</span>
              </div>
            );
          }
          if (v4MonitorData) {
            return <V4Monitor data={v4MonitorData} />;
          }
          return (
            <div className="flex h-full items-center justify-center text-gray-400 bg-gray-800 rounded border-2 border-blue-500">
              No active V4 contest available.
            </div>
          );
        })()}

        {/* V5 Monitor (Right side) */}
        {(() => {
          // Show loading ONLY if initial load (no dashboard data yet)
          if (loading && !dashboardData) {
            return (
              <div className="flex h-full items-center justify-center bg-gray-800 rounded border-2 border-green-500">
                <span className="animate-pulse text-gray-400">Initializing V5 Monitor…</span>
              </div>
            );
          }

          // If we have dashboard data but no active contest, check if we have any contests
          if (dashboardData && !activeContest) {
            // If activeContests is undefined/null, still processing
            if (!Array.isArray(dashboardData.activeContests)) {
              return (
                <div className="flex h-full items-center justify-center bg-gray-800 rounded border-2 border-green-500">
                  <span className="animate-pulse text-gray-400">Loading contest data…</span>
                </div>
              );
            }
            // If activeContests array exists and is empty, no contests available
            if (dashboardData.activeContests.length === 0) {
              return <div className="flex h-full items-center justify-center text-gray-400 bg-gray-800 rounded border-2 border-green-500">No active V5 contest available.</div>;
            }
            // If activeContests has items but we haven't found activeContest yet, still processing
            return (
              <div className="flex h-full items-center justify-center bg-gray-800 rounded border-2 border-green-500">
                <span className="animate-pulse text-gray-400">Loading contest data…</span>
              </div>
            );
          }

          // If we have v5MonitorData, show it
          if (v5MonitorData) {
            return <V5Monitor data={v5MonitorData} />;
          }

          // Default: no contest available
          return <div className="flex h-full items-center justify-center text-gray-400 bg-gray-800 rounded border-2 border-green-500">No active V5 contest available.</div>;
        })()}
      </div>

      <RecentWinnersTicker winners={recentWinners} />

      {/* {systemHealth && <SystemHealthBox health={systemHealth} />} */}
    </div>
  );
};

export default LiveStreamDashboard;
