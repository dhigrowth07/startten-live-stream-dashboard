import React from "react";

const LiveVideoPlayer = () => {
  return (
    <div className="w-full bg-black relative">
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        {" "}
        {/* 16:9 aspect ratio */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          {/* Placeholder for YouTube/OBS embed */}
          <div className="text-center">
            <div className="mb-4">
              <div className="inline-block bg-red-600 text-white px-4 py-2 rounded font-bold text-lg animate-pulse">🔴 STARTTEN LIVE</div>
            </div>
            <div className="text-gray-400 text-sm">[YouTube Live / OBS Output Embed]</div>
            <div className="text-gray-500 text-xs mt-2">16:9 Aspect Ratio • Auto-scale Responsive</div>
          </div>
        </div>
        {/* Optional watermark overlay */}
        <div className="absolute top-4 right-4 opacity-50">
          <div className="bg-black bg-opacity-50 px-3 py-1 rounded text-white text-xs font-semibold">STARTTEN</div>
        </div>
      </div>
    </div>
  );
};

export default LiveVideoPlayer;
