import React from "react";
import { normalizeFilterResponse } from "../services/filterVizConfig";

const GenericLegend = ({ data, title }) => {
  if (!data) return null;
  const norm = normalizeFilterResponse(data.raw || data);

  return (
    <div className="mb-4 p-3 bg-gray-800 rounded text-sm">
      <h3 className="font-semibold mb-2">{title || "Info"}</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-400">Geometry</p>
          <div className="text-lg font-medium">{norm.geojson ? "GeoJSON" : (norm.points.length ? "Points" : "None")}</div>
        </div>
        <div>
          <p className="text-xs text-gray-400">Time series</p>
          <div className="text-lg font-medium">{norm.time_series.length || "N/A"}</div>
        </div>
        <div>
          <p className="text-xs text-gray-400">Categories</p>
          <div className="text-lg font-medium">{norm.categories.length || "N/A"}</div>
        </div>
        <div>
          <p className="text-xs text-gray-400">Source</p>
          <div className="text-lg font-medium">{(data.raw && (data.raw.source || data.raw.provider)) || "Agent/Backend"}</div>
        </div>
      </div>
    </div>
  );
};

export default GenericLegend;