import React from "react";

const NDVILegend = ({ ndvi }) => {
  // ndvi can be stats.totals.ndvi or parsed insights under ndvi
  const ndvi_estimate = ndvi?.data || ndvi || {};
  // const avg = raw.average_ndvi ?? raw.mean ?? ndvi?.average ?? null;
  // const latest = raw.latest_value ?? ndvi?.latest ?? null;
  // const period = raw.period || `${raw.startDate || ""} - ${raw.endDate || ""}`;

  {/* <div>
    <p className="text-xs text-gray-400">Period</p>
    <div className="text-lg font-medium">{period || "N/A"}</div>
  </div>
  <div>
    <p className="text-xs text-gray-400">Green cover (%)</p>
    <div className="text-lg font-medium">{raw.green_percent != null ? `${raw.green_percent}%` : "N/A"}</div>
  </div> */}
  {/* <div>
          <p className="text-xs text-gray-400">Average NDVI</p>
          <div className="text-lg font-medium">{avg != null ? avg.toFixed(3) : "N/A"}</div>
        </div> */}
  return (
    <div className="mb-4 p-3 bg-gray-800 rounded text-sm">
      <h3 className="font-semibold mb-2">Vegetation (NDVI)</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-400">Latest NDVI</p>
          <div className="text-lg font-medium">{ndvi_estimate != null ? ndvi_estimate : "N/A"}</div>
        </div>
      </div>
    </div>
  );
};

export default NDVILegend;