import React from "react";

const RecentWinnersTicker = ({ winners }) => {
  const dummyWinners = [
    { name: "PLAYER#1004", amount: 2500, contestType: "V4" },
    { name: "PLAYER#3902", amount: 1000, contestType: "V5" },
    { name: "PLAYER#8812", amount: 5000, contestType: "V4" },
    { name: "PLAYER#2109", amount: 1500, contestType: "V5" },
  ];

  const actualWinners = Array.isArray(winners) ? winners : [];
  
  let baseWinners = [];
  if (actualWinners.length === 0) {
    baseWinners = dummyWinners;
  } else if (actualWinners.length < 4) {
    baseWinners = [...actualWinners, ...dummyWinners.slice(0, 4 - actualWinners.length)];
  } else {
    baseWinners = actualWinners;
  }

  const displayWinners = [...baseWinners, ...baseWinners];

  return (
    <div className="w-full bg-gradient-to-r from-yellow-900 via-yellow-800 to-yellow-900 border-y-2 border-yellow-400 overflow-hidden flex-shrink-0">
      <div className="flex animate-scroll-ticker whitespace-nowrap py-1">
        {displayWinners.map((winner, index) => (
          <div key={index} className="flex items-center mx-8 shrink-0">
            <span className="text-lg mr-1">🎉</span>
            <span className="text-white font-bold text-sm">
              <span className="text-yellow-300">{winner.name}</span> WON <span className="text-green-400">₹{winner.amount.toLocaleString()}</span>{" "}
              <span className="text-gray-300">({winner.contestType})</span>
            </span>
            <span className="text-yellow-600 mx-4 text-lg">|</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes scroll-ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-ticker {
          animation: scroll-ticker 40s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default RecentWinnersTicker;
