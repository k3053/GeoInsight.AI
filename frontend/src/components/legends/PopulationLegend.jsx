import React from "react";

const PopulationLegend = ({ population }) => {
  const current = population?.data || population || {};
  // const current = raw.current_population ?? population?.current ?? null;
  // const peak = raw.peak_population ?? population?.peak ?? null;
  // const peakTime = raw.peak_time ?? population?.peak_time ?? null;
  // const density = raw.density_per_km2 ?? population?.density ?? null;

  return (
    <div className="mb-4 p-3 bg-gray-800 rounded text-lg">
      <h3 className="font-semibold mb-2">Temporal Population</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-sm text-gray-400">Current</p>
          <div className="text-lg font-medium">{current != null ? (current*1000000).toLocaleString() : "N/A"}</div>
        </div>
        {/* <div>
          <p className="text-xs text-gray-400">Peak</p>
          <div className="text-lg font-medium">{peak != null ? peak.toLocaleString() : "N/A"}</div>
        </div>
        <div>
          <p className="text-xs text-gray-400">Peak time</p>
          <div className="text-lg font-medium">{peakTime || "N/A"}</div>
        </div>
        <div>
          <p className="text-xs text-gray-400">Density</p>
          <div className="text-lg font-medium">{density != null ? `${density} /km²` : "N/A"}</div>
        </div> */}
      </div>
    </div>
  );
};

export default PopulationLegend;