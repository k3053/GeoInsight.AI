import React from "react";

const GreenCoverLegend = ({ green }) => {
  const raw = green?.raw || green || {};
  const percent = raw.green_percent ?? green?.percent ?? null;
  const canopyArea = raw.canopy_area_m2 ?? green?.canopy_area ?? null;
  const change = raw.change_percent ?? green?.change ?? null;

  return (
    <div className="mb-4 p-3 bg-gray-800 rounded text-sm">
      <h3 className="font-semibold mb-2">Green Cover</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-400">Percent green</p>
          <div className="text-lg font-medium">{percent != null ? `${percent}%` : "N/A"}</div>
        </div>
        <div>
          <p className="text-xs text-gray-400">Canopy area</p>
          <div className="text-lg font-medium">{canopyArea != null ? `${canopyArea.toFixed(0)} m²` : "N/A"}</div>
        </div>
        <div>
          <p className="text-xs text-gray-400">Change</p>
          <div className="text-lg font-medium">{change != null ? `${change}%` : "N/A"}</div>
        </div>
        <div>
          <p className="text-xs text-gray-400">Source</p>
          <div className="text-lg font-medium">{raw.source || "Agent"}</div>
        </div>
      </div>
    </div>
  );
};

export default GreenCoverLegend;