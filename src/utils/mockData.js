// Mock data generator for Live Stream Dashboard

const generateRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateTimeString = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
};

const generateV4LiveFeed = () => {
  const feed = [];
  for (let i = 0; i < 20; i++) {
    feed.push({
      time: generateTimeString(),
      userId: generateRandomNumber(1000, 9999),
      prediction: String(generateRandomNumber(0, 9999)).padStart(4, "0"),
      status: Math.random() > 0.2 ? "accepted" : "failed",
    });
  }
  return feed;
};

const generateV5LiveFeed = () => {
  const feed = [];
  for (let i = 0; i < 20; i++) {
    feed.push({
      time: generateTimeString(),
      userId: generateRandomNumber(1000, 9999),
      number: String(generateRandomNumber(0, 999)).padStart(3, "0"),
    });
  }
  return feed;
};

const generateV5Heatmap = () => {
  const heatmap = {};
  // Generate random purchased numbers
  for (let i = 0; i < 150; i++) {
    const num = String(generateRandomNumber(0, 999)).padStart(3, "0");
    heatmap[num] = (heatmap[num] || 0) + 1;
  }
  return heatmap;
};

const generateRecentWinners = () => {
  const winners = [];
  const names = ["User****", "Player***", "Winner**", "Champ***", "Lucky**", "Star****"];
  const contestTypes = ["V4", "V5"];

  for (let i = 0; i < 10; i++) {
    winners.push({
      name: names[generateRandomNumber(0, names.length - 1)] + generateRandomNumber(10, 99),
      amount: contestTypes[generateRandomNumber(0, 1)] === "V5" ? 1000 : generateRandomNumber(500, 5000),
      contestType: contestTypes[generateRandomNumber(0, 1)],
    });
  }
  return winners;
};

const generatePoolGrowthData = () => {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000);
    data.push({
      time: `${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`,
      value: generateRandomNumber(50000, 200000),
    });
  }
  return data;
};

const generateEntryRateData = () => {
  const data = [];
  for (let i = 0; i < 30; i++) {
    data.push({
      minute: i,
      entries: generateRandomNumber(5, 50),
    });
  }
  return data;
};

const generatePredictionDistribution = () => {
  const ranges = [
    { range: "0-1999", value: generateRandomNumber(10, 30) },
    { range: "2000-3999", value: generateRandomNumber(15, 35) },
    { range: "4000-5999", value: generateRandomNumber(20, 40) },
    { range: "6000-7999", value: generateRandomNumber(10, 30) },
    { range: "8000-9999", value: generateRandomNumber(5, 25) },
  ];
  return ranges;
};

const generateWinningHistory = () => {
  const data = [];
  const types = ["V4", "V5"];
  for (let i = 0; i < 50; i++) {
    types.forEach((type) => {
      data.push({
        contest: i,
        number: type === "V4" ? generateRandomNumber(0, 9999) : generateRandomNumber(0, 999),
        type: type,
      });
    });
  }
  return data;
};

const generateSchedulerHealth = () => {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000);
    const rand = Math.random();
    data.push({
      time: `${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`,
      status: rand > 0.8 ? "missed" : rand > 0.6 ? "degraded" : "healthy",
    });
  }
  return data;
};

const generateRedisLatency = () => {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 10000);
    data.push({
      time: `${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}:${String(time.getSeconds()).padStart(2, "0")}`,
      latency: generateRandomNumber(1, 50),
    });
  }
  return data;
};

/**
 * Generate V4 mock data
 * @returns {Object} V4 contest mock data
 */
export const generateV4MockData = () => {
  const phases = ["PREDICTION", "COUNTDOWN", "ENDED"];
  const v4Phase = phases[generateRandomNumber(0, 2)];

  return {
    phase: v4Phase,
    timer: `${String(generateRandomNumber(0, 5)).padStart(2, "0")}:${String(generateRandomNumber(0, 59)).padStart(2, "0")}`,
    hiddenNumber: v4Phase === "ENDED" ? String(generateRandomNumber(0, 9999)).padStart(4, "0") : null,
    prizePool: generateRandomNumber(50000, 200000),
    totalPredictions: generateRandomNumber(100, 500),
    lastPaymentTS: generateTimeString(),
    winner: v4Phase === "ENDED" ? `User#${generateRandomNumber(1000, 9999)}` : null,
    liveFeed: generateV4LiveFeed(),
  };
};

export const generateMockData = () => {
  const phases = ["PREDICTION", "COUNTDOWN", "ENDED"];
  const v5Phases = ["ACTIVE", "LOCKED", "ENDED"];
  const schedulerStatuses = ["OK", "DEGRADED", "ERROR"];

  const v4Phase = phases[generateRandomNumber(0, 2)];
  const v5Phase = v5Phases[generateRandomNumber(0, 2)];

  return {
    globalStats: {
      activeV4ContestId: `V4-${generateRandomNumber(1000, 9999)}`,
      activeV5ContestId: `V5-${generateRandomNumber(1000, 9999)}`,
      totalPoolToday: generateRandomNumber(500000, 2000000),
      totalParticipantsToday: generateRandomNumber(500, 2000),
      totalEntriesToday: generateRandomNumber(1000, 5000),
      totalRevenueToday: generateRandomNumber(300000, 1500000),
      liveViewers: generateRandomNumber(100, 500),
      nextContestStartTime: "15:30:00",
      lastWinnerSummary: "User****45 won ₹2,500",
      lastWinningNumber: "5321",
      schedulerStatus: schedulerStatuses[generateRandomNumber(0, 2)],
    },
    v4: generateV4MockData(),
    v5: {
      phase: v5Phase,
      timer: `${String(generateRandomNumber(0, 9)).padStart(2, "0")}:${String(generateRandomNumber(0, 59)).padStart(2, "0")}`,
      totalParticipants: generateRandomNumber(80, 200),
      totalEntries: generateRandomNumber(150, 400),
      totalRevenue: generateRandomNumber(15000, 40000),
      minPlayers120: generateRandomNumber(80, 200) >= 120,
      winner: v5Phase === "ENDED" ? `User#${generateRandomNumber(1000, 9999)}` : null,
      heatmap: generateV5Heatmap(),
      liveFeed: generateV5LiveFeed(),
    },
    recentWinners: generateRecentWinners(),
    analytics: {
      poolGrowth: generatePoolGrowthData(),
      entryRate: generateEntryRateData(),
      predictionDistribution: generatePredictionDistribution(),
      winningHistory: generateWinningHistory(),
      schedulerHealth: generateSchedulerHealth(),
      redisLatency: generateRedisLatency(),
      v5Heatmap: generateV5Heatmap(),
    },
    systemHealth: {
      database: {
        status: Math.random() > 0.1 ? "connected" : "disconnected",
      },
      redis: {
        status: Math.random() > 0.15 ? "ready" : "failing",
      },
      scheduler: {
        status: Math.random() > 0.2 ? "healthy" : Math.random() > 0.5 ? "degraded" : "unhealthy",
        lastExecution: generateTimeString(),
        nextScheduledRun: "15:30:00",
      },
      broadcast: {
        status: Math.random() > 0.1 ? "operational" : "degraded",
        lastDispatch: generateTimeString(),
        currentInterval: "10000",
      },
    },
  };
};
