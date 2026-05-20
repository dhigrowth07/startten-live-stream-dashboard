import React, { useState, useEffect } from "react";
import { Card, Tag, Badge } from "antd";

const V5Monitor = ({ data }) => {
  const [timer, setTimer] = useState(data?.timer || "00:00");
  const [currentPhase, setCurrentPhase] = useState(data?.phase || "ACTIVE");
  const [predictionCountdown, setPredictionCountdown] = useState(data?.predictionCountdown || "00:00");
  const heatmapData = data?.heatmap || {};

  // Update phase when data changes
  useEffect(() => {
    if (data?.phase && data.phase !== currentPhase) {
      setCurrentPhase(data.phase);
    }
  }, [data?.phase, currentPhase]);

  useEffect(() => {
    const isSelectingWinner =
      (currentPhase === "DECISION" || currentPhase === "DECIDED" || currentPhase === "ENDED") &&
      !data?.winner &&
      data?.minPurchasesMet;

    if (isSelectingWinner) {
      setTimer("01:00");
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => {
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
  }, [currentPhase, data?.winner, data?.minPurchasesMet]);

  // Update timer when data.timer changes (from backend updates)
  useEffect(() => {
    if (data?.timer) {
      setTimer(data.timer);
    }
  }, [data?.timer]);

  // Update prediction countdown when data changes
  useEffect(() => {
    if (data?.predictionCountdown) {
      setPredictionCountdown(data.predictionCountdown);
    }
  }, [data?.predictionCountdown]);

  // Prediction countdown timer (counts down every second)
  useEffect(() => {
    if (currentPhase !== "ACTIVE" || !data?.predictionCountdown) {
      return;
    }

    // Initialize countdown
    setPredictionCountdown(data.predictionCountdown);

    const interval = setInterval(() => {
      setPredictionCountdown((prev) => {
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
  }, [currentPhase, data?.predictionCountdown]);

  const getPhaseColor = (phase) => {
    switch (phase) {
      case "ACTIVE":
        return "green";
      case "LOCKED":
        return "orange";
      case "ENDED":
        return "red";
      default:
        return "default";
    }
  };

  const getHeatmapColor = (count) => {
    if (count === 0) return "bg-gray-700";
    if (count === 1) return "bg-yellow-600";
    if (count === 2) return "bg-orange-500";
    if (count >= 3) return "bg-red-500";
    return "bg-gray-700";
  };

  return (
    <Card
      className="h-full bg-gray-800 border-2 border-green-500 flex flex-col min-h-0 overflow-hidden"
      styles={{ body: { padding: "3px", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 } }}
      title={
        <div className="flex items-center justify-between py-1">
          <span className="text-black text-sm font-bold">V5 – TEA TIME (LIVE)</span>
          <Tag color={getPhaseColor(currentPhase)} className="text-white font-semibold text-xs">
            {currentPhase}
          </Tag>
        </div>
      }
    >
      <div className="space-y-2 flex-1 flex flex-col min-h-0">
        {/* Header Stats */}
        <div className="grid grid-cols-2 gap-2 text-white">
          <div className="bg-gray-700 p-[9px] rounded">
            <div className="text-[10px] text-gray-400">
              {currentPhase === "DECISION" || currentPhase === "DECIDED" ? "NEXT IN" : "TOTAL TIME"}
            </div>
            <div className={`text-base font-bold ${currentPhase === "DECISION" || currentPhase === "DECIDED" ? "text-red-400 animate-pulse" : "text-yellow-400"}`}>
              {timer}
            </div>
          </div>
          <div className="bg-gray-700 p-[9px] rounded">
            <div className="text-[10px] text-gray-400">MIN PURCHASE {data.minPurchases || 120}+</div>
            <div className="text-sm font-bold">{data.minPurchasesMet ? <span className="text-green-400">YES</span> : <span className="text-red-400">NO</span>}</div>
          </div>
          <div className="bg-gray-700 p-[9px] rounded">
            <div className="text-[10px] text-gray-400">TOTAL PARTICIPANTS</div>
            <div className="text-sm font-bold">{data.totalParticipants}</div>
          </div>
          <div className="bg-gray-700 p-[9px] rounded">
            <div className="text-[10px] text-gray-400">TOTAL ENTRIES</div>
            <div className="text-sm font-bold">{data.totalEntries}</div>
          </div>
          <div className="bg-gray-700 p-[9px] rounded">
            <div className="text-[10px] text-gray-400">TOTAL REVENUE</div>
            <div className="text-sm font-bold">{data.totalRevenueFormatted || `₹${data.totalRevenue.toLocaleString()}`}</div>
          </div>
          <div className="bg-gray-700 p-[9px] rounded">
            <div className="text-[10px] text-gray-400">PRIZE AMOUNT</div>
            <div className="text-sm font-bold text-green-400">{data.prizeAmountFormatted || `₹${data.prizeAmount.toLocaleString()}`}</div>
          </div>
          {data.winner ? (
            <div className="bg-green-900 p-[9px] rounded col-span-2 animate-pulse border border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.4)]">
              <div className="text-[10px] text-green-300 font-bold uppercase tracking-widest flex items-center gap-1">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 mr-1"></span>
                WINNER ANNOUNCED!
              </div>
              <div className="text-sm font-bold text-green-400 mt-1">{data.winner}</div>
            </div>
          ) : (currentPhase === "DECISION" || currentPhase === "DECIDED" || currentPhase === "ENDED" || currentPhase === "CLOSED_NO_WINNER") ? (
            data.minPurchasesMet ? (
              <div className="bg-yellow-900 bg-opacity-40 p-[9px] rounded col-span-2 animate-pulse border border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                <div className="text-[10px] text-yellow-300 font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500 mr-1"></span>
                  SELECTING WINNER...
                </div>
                <div className="text-xs text-yellow-400 mt-1">Please wait while the system completes the draw</div>
              </div>
            ) : (
              <div className="bg-red-900 bg-opacity-40 p-[9px] rounded col-span-2 border border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                <div className="text-[10px] text-red-300 font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 mr-1"></span>
                  NO WINNER
                </div>
                <div className="text-xs text-red-400 mt-1">Minimum purchases threshold not met</div>
              </div>
            )
          ) : null}
        </div>

        {/* 000-999 Heatmap Grid */}
        <div className="bg-gray-900 rounded p-1 flex flex-col min-h-0">
          <div className="text-[10px] text-gray-400 mb-0.5 font-semibold uppercase tracking-wider">000-999 GRID HEATMAP</div>
          <div className="grid gap-px overflow-y-auto scrollbar-hide border border-gray-800" style={{ gridTemplateColumns: "repeat(25, 1fr)", maxHeight: "160px" }}>
            {(() => {
              // Create array of all numbers with their counts
              const numbers = Array.from({ length: 1000 }, (_, i) => {
                const number = String(i).padStart(3, "0");
                return { number, index: i, count: heatmapData[number] || 0 };
              });

              // Sort: purchased numbers first (locked when phase is LOCKED), then available
              const sortedNumbers = numbers.sort((a, b) => {
                // If phase is LOCKED, purchased numbers are locked
                const aIsLocked = currentPhase === "LOCKED" && a.count > 0;
                const bIsLocked = currentPhase === "LOCKED" && b.count > 0;

                // Locked numbers first
                if (aIsLocked && !bIsLocked) return -1;
                if (!aIsLocked && bIsLocked) return 1;

                // Then purchased numbers (count > 0)
                if (a.count > 0 && b.count === 0) return -1;
                if (a.count === 0 && b.count > 0) return 1;

                // Maintain original order for same type
                return a.index - b.index;
              });

              return sortedNumbers.map((item) => {
                const isWinner = data.winningNumber === item.number;
                const baseClasses = `text-[9px] flex items-center justify-center font-mono h-5 transition-all duration-300`;
                
                let colorClasses = "";
                if (isWinner) {
                  colorClasses = "bg-yellow-400 text-black font-extrabold animate-pulse ring-2 ring-yellow-500 ring-offset-1 ring-offset-gray-900 z-10 scale-[1.3] shadow-[0_0_15px_rgba(250,204,21,0.8)] rounded-sm";
                } else {
                  colorClasses = `${getHeatmapColor(item.count)} ${item.count > 0 ? "text-white font-bold ring-1 ring-inset ring-white/20" : "text-gray-500"}`;
                }

                return (
                  <div
                    key={item.index}
                    className={`${baseClasses} ${colorClasses}`}
                    title={`${item.number}: ${item.count} purchase(s)${currentPhase === "LOCKED" && item.count > 0 ? " [LOCKED]" : ""}${isWinner ? " - WINNER!" : ""}`}
                  >
                    {item.number}
                  </div>
                );
              });
            })()}
          </div>
          <div className="flex items-center justify-between mt-0.5 text-[8px] text-gray-400 px-1">
            <span>Grey = Available</span>
            <span>Yellow/Red = Purchased</span>
          </div>
        </div>

        {/* Live Feed */}
        {/* <div className="bg-gray-900 rounded p-2 max-h-24 overflow-y-auto scrollbar-thin">
          <div className="text-[10px] text-gray-400 mb-1 font-semibold">LIVE FEED (Last 3 Purchases)</div>
          <div className="space-y-0.5">
            {data.liveFeed && data.liveFeed.length > 0 ? (
              data.liveFeed.slice(0, 3).map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-1 rounded text-[10px] bg-green-900 bg-opacity-20 border-l-2 border-green-500">
                  <span className="text-gray-300">
                    <span className="font-mono text-gray-400">{entry.time}</span> <span className="font-semibold">{entry.userName ? entry.userName : `User#${entry.userId}`}</span> bought{" "}
                    <span className="font-bold text-green-400">{entry.number}</span>
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center p-2 text-[10px] text-gray-500">
                <span>No purchases yet</span>
              </div>
            )}
          </div>
        </div> */}

        {/* Prediction Countdown Indicator */}
        {currentPhase === "ACTIVE" && (
          <div className="bg-blue-900 bg-opacity-50 rounded p-1.5">
            <div className="text-center text-blue-400 font-bold text-xs">⏱️ PREDICTION COUNTDOWN: {predictionCountdown}</div>
          </div>
        )}

        {/* Lock Animation Indicator */}
        {currentPhase === "LOCKED" && (
          <div className="bg-orange-900 bg-opacity-50 rounded p-1.5 animate-pulse">
            <div className="text-center text-orange-400 font-bold text-xs">🔒 LOCKED AT MINUTE 9</div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default V5Monitor;
