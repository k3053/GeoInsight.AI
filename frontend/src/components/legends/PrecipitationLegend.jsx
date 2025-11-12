import React from "react";

const PrecipitationLegend = ({ precipitation }) => {
  const total = precipitation?.data || precipitation || {};
  // const total = raw.total_mm ?? precipitation?.total ?? null;
  // const prob = raw.probability_percent ?? precipitation?.probability ?? null;
  // const max = raw.max_mm ?? raw.peak_mm ?? null;

  return (
    <div className="mb-4 p-3 bg-gray-800 rounded text-sm">
      <h3 className="font-semibold mb-2">Precipitation</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-400">Total</p>
          <div className="text-lg font-medium">{total != null ? `${total} mm` : "N/A"}</div>
        </div>
        {/* <div>
          <p className="text-xs text-gray-400">Chance</p>
          <div className="text-lg font-medium">{prob != null ? `${prob}%` : "N/A"}</div>
        </div>
        <div>
          <p className="text-xs text-gray-400">Peak intensity</p>
          <div className="text-lg font-medium">{max != null ? `${max} mm/hr` : "N/A"}</div>
        </div>
        <div>
          <p className="text-xs text-gray-400">Period</p>
          <div className="text-lg font-medium">{raw.period || "N/A"}</div>
        </div> */}
      </div>
    </div>
  );
};

export default PrecipitationLegend;