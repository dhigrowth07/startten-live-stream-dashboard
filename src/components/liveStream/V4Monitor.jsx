import React, { useState, useEffect, useRef } from "react";
import { Card, Badge, Tag } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

const V4Monitor = ({ data }) => {
  const [timer, setTimer] = useState(data.timer);
  const feedRef = useRef(null);

  useEffect(() => {
    setTimer(data.timer);
  }, [data.timer]);

  // Auto-scroll live feed to the bottom when new entries arrive
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [data.liveFeed]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
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
  }, []);

  const getPhaseColor = (phase) => {
    switch (phase) {
      case "PREDICTION":
        return "blue";
      case "COUNTDOWN":
        return "orange";
      case "ENDED":
        return "red";
      default:
        return "default";
    }
  };

  const getSecondsRemaining = () => {
    if (!timer || !timer.includes(":")) return 999;
    const [min, sec] = timer.split(":").map(Number);
    return min * 60 + sec;
  };

  const secondsRemaining = getSecondsRemaining();

  return (
    <Card
      className="h-full bg-gray-800 border-2 border-blue-500 flex flex-col min-h-0 overflow-hidden"
      styles={{ body: { padding: "5px", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 } }}
      title={
        <div className="flex items-center justify-between py-1">
          <span className="text-black text-sm font-bold">V4 – FAST 50/50 (LIVE)</span>
          <Tag color={getPhaseColor(data.phase)} className="text-white font-semibold text-xs">
            {data.phase}
          </Tag>
        </div>
      }
    >
      <div className="space-y-2 flex-1 flex flex-col min-h-0">
        {/* Header Stats */}
        <div className="grid grid-cols-2 gap-2 text-white">
          <div className="bg-gray-700 p-1.5 rounded">
            <div className="text-[10px] text-gray-400">TIMER</div>
            <div className="text-base font-bold text-yellow-400">{timer}</div>
          </div>
          <div className="bg-gray-700 p-1.5 rounded">
            <div className="text-[10px] text-gray-400">HIDDEN NUMBER</div>
            <div className="text-base font-bold text-green-400">{data.hiddenNumber || "****"}</div>
          </div>
          <div className="bg-gray-700 p-1.5 rounded">
            <div className="text-[10px] text-gray-400">PRIZE POOL</div>
            <div className="text-sm font-bold">₹{data.prizePool.toLocaleString()}</div>
          </div>
          <div className="bg-gray-700 p-1.5 rounded">
            <div className="text-[10px] text-gray-400">TOTAL PREDICTIONS</div>
            <div className="text-sm font-bold">{data.totalPredictions}</div>
          </div>
          <div className="bg-gray-700 p-1.5 rounded col-span-2">
            <div className="text-[10px] text-gray-400">LAST PAYMENT TS</div>
            <div className="text-xs font-mono">{data.lastPaymentTS}</div>
          </div>
          {data.winner && (
            <div className="bg-green-900 p-1.5 rounded col-span-2">
              <div className="text-[10px] text-green-300">WINNER</div>
              <div className="text-sm font-bold text-green-400">{data.winner}</div>
            </div>
          )}
        </div>

        {/* Live Feed with Fixed Height and Auto-scroll */}
        <div
          ref={feedRef}
          className="bg-gray-900 rounded p-2 flex-1 min-h-0 overflow-y-auto scrollbar-thin transition-all duration-300"
        >
          <div className="text-[10px] text-gray-400 mb-1 font-semibold sticky top-0 bg-gray-900 py-0.5 z-10">
            LIVE FEED (Last 10 Entries)
          </div>
          <div className="space-y-0.5">
            {[...data.liveFeed].reverse().map((entry, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-1 rounded text-[10px] ${entry.status === "accepted" ? "bg-green-900 bg-opacity-30 border-l-2 border-green-500" : "bg-red-900 bg-opacity-30 border-l-2 border-red-500"
                  }`}
              >
                <span className="text-gray-300">
                  <span className="font-mono text-gray-400">{entry.time}</span> <span className="font-semibold">User#{entry.userId}</span>{" "}
                  {entry.type === "COUNTDOWN" ? "countdown entry" : "predicted"}{" "}
                  <span className="font-bold text-yellow-400">{entry.prediction}</span>
                </span>
                {entry.status === "accepted" ? <CheckCircleOutlined className="text-green-500" /> : <CloseCircleOutlined className="text-red-500" />}
              </div>
            ))}
          </div>
        </div>

        {/* Countdown Streak Timeline (if in COUNTDOWN phase) */}
        {data.phase === "COUNTDOWN" && (
          <div className="bg-gray-900 bg-opacity-30 rounded-md p-2 border border-gray-700/30 backdrop-blur-sm transition-all duration-300">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">
                {secondsRemaining <= 15 ? "🚨 FINAL COUNTDOWN" : "Countdown Streak (Final 15s)"}
              </span>
              <span className="text-[10px] font-mono text-yellow-400 font-bold">
                {secondsRemaining <= 15 ? `${secondsRemaining}s` : ""}
              </span>
            </div>
            <div className="flex gap-0.5 h-2.5">
              {Array.from({ length: 15 }, (_, i) => {
                const secondVal = i + 1;
                const isActive = secondsRemaining >= secondVal;

                let activeClass = "bg-gray-700 bg-opacity-40 border border-gray-800";
                if (isActive) {
                  if (secondsRemaining <= 5) {
                    activeClass = "bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.6)]";
                  } else if (secondsRemaining <= 10) {
                    activeClass = "bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.6)]";
                  } else {
                    activeClass = "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]";
                  }
                }

                return (
                  <div
                    key={i}
                    className={`flex-1 h-full rounded-sm transition-all duration-300 ${activeClass}`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default V4Monitor;
