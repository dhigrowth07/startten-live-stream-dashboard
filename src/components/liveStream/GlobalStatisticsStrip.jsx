import React from "react";

/**
 * @param {{ data?: { label: string; value: string | number }[]; loading?: boolean }} props
 */
const GlobalStatisticsStrip = ({ data = [], loading = false }) => {
  const items = Array.isArray(data) ? data : [];

  if (loading && items.length === 0) {
    return (
      <div className="w-full bg-gray-800 border-y-2 border-yellow-500 overflow-hidden flex-shrink-0">
        <div className="py-2 text-center text-sm text-gray-300">Preparing live statistics…</div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="w-full bg-gray-800 border-y-2 border-yellow-500 overflow-hidden flex-shrink-0">
        <div className="py-2 text-center text-sm text-gray-400">No live statistics available</div>
      </div>
    );
  }

  const marqueeItems = [...items, ...items];

  return (
    <div className="w-full bg-gray-800 border-y-2 border-yellow-500 overflow-hidden flex-shrink-0">
      <div className="flex animate-scroll whitespace-nowrap py-0">
        {marqueeItems.map((stat, index) => (
          <div key={`${stat.label}-${index}`} className="flex items-center mx-6 shrink-0">
            <span className="text-yellow-400 font-bold mr-2">{stat.label}:</span>
            <span className="text-white font-semibold">{stat.value}</span>
            <span className="text-gray-500 mx-4">|</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default GlobalStatisticsStrip;
