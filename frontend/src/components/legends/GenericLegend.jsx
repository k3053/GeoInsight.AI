import React from "react";
import { normalizeFilterResponse } from "../services/filterVizConfig";

const GenericLegend = ({ data, title }) => {
  if (!data) return null;

  // Per contract: incoming object is stats — current payload lives in stats.data and summary in stats.summary
  const stats = data;
  const rawForNorm = stats.data ?? stats.raw ?? stats;
  const norm = normalizeFilterResponse(rawForNorm || {});

  // const summaryText = stats.summary ?? (stats.raw && stats.raw.summary) ?? null;

  // derive a single "current" metric to display (works for numbers and common object shapes)
  const currentValue = (() => {
    const v = stats.data ?? stats.current ?? rawForNorm;
    if (v == null) return null;
    if (typeof v === "number") return v;
    if (typeof v === "string" && !Number.isNaN(Number(v))) return Number(v);
    if (typeof v === "object") {
      if (v.totalBuildings != null) return v.totalBuildings;
      if (v.total != null) return v.total;
      if (v.count != null) return v.count;
      if (v.value != null) return v.value;
      if (v.population != null) return v.population;
      if (v.green_area != null) return v.green_area;
      if (Array.isArray(v.points)) return v.points.length;
      if (Array.isArray(v.categories)) return v.categories.length;
      if (v.totals && typeof v.totals === "object") {
        const candidates = ["population", "green_cover", "value", "count", "totalBuildings", "area_m2", "total"];
        for (const k of candidates) if (v.totals[k] != null) return v.totals[k];
      }
    }
    return null;
  })();

  const unit = (stats?.unit || stats?.units || (rawForNorm && rawForNorm.unit) || null);

  return (
    <div className="mb-4 p-3 bg-gray-800 rounded text-sm">
      <h3 className="font-semibold mb-2">{title || "Info"}</h3>

      {/* {summaryText && (
        <div className="mb-3 text-sm text-gray-300">
          <div className="font-medium">Summary</div>
          <div className="mt-1">{String(summaryText)}</div>
        </div>
      )} */}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-sm text-gray-400">Current</p>
          <div className="text-lg font-medium">
            {currentValue != null ? `${Number(currentValue).toLocaleString()}${unit ? ` ${unit}` : ""}` : "N/A"}
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-400">Geometry</p>
          <div className="text-lg font-medium">{norm.geojson ? "GeoJSON" : (norm.points?.length ? `Points (${norm.points.length})` : "None")}</div>
        </div>

        <div>
          <p className="text-sm text-gray-400">Time series</p>
          <div className="text-lg font-medium">{(norm.time_series?.length ?? 0) || "N/A"}</div>
        </div>

        <div>
          <p className="text-sm text-gray-400">Categories</p>
          <div className="text-lg font-medium">{(norm.categories?.length ?? 0) || "N/A"}</div>
        </div>

        <div className="col-span-2">
          <p className="text-sm text-gray-400">Source</p>
          <div className="text-lg font-medium">
            {(stats.raw && (stats.raw.source || stats.raw.provider)) || (data.raw && (data.raw.source || data.raw.provider)) || "Agent/Backend"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenericLegend;