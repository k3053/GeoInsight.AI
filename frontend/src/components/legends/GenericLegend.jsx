import React from "react";
import { normalizeFilterResponse } from "../services/filterVizConfig";

function inferUnitFromFilter(title) {
  if (!title) return null;
  const t = title.toLowerCase();

  if (t.includes("water quality index")) return "";
  if (t.includes("crime") || t.includes("safety")) return "%";   // now percentage
  if (t.includes("solar")) return "%";                           // now percentage
  if (t.includes("land use") || t.includes("land cover")) return "%";
  if (t.includes("ndvi") || t.includes("vegetation")) return "";
  if (t.includes("public infrastructure")) return "";
  if (t.includes("urban sprawl")) return "%";
  if (t.includes("property value")) return "₹";
  if (t.includes("property development potential")) return "%";
  if (t.includes("land price")) return "₹";
  if (t.includes("precipitation")) return "mm";
  if (t.includes("temporal population")) return "";
  if (t.includes("green cover")) return "%";
  if (t.includes("disaster") || t.includes("vulnerability")) return "%";

  return null;
}

// 🔥 NEW: Descriptions for each filter
const filterDescriptions = {
  "Water Quality Index": "Measures overall water cleanliness and suitability based on physical, chemical, and biological indicators.",
  "Crime Rate/Safety Index": "Indicates how safe an area is based on the frequency and severity of reported crimes.",
  "Solar": "Estimates solar energy potential using sunlight exposure and radiation levels.",
  "Land Use/Land Cover": "Shows how land is utilized, such as residential, commercial, forest, or water bodies.",
  "Vegetation Index(NDVI)": "Quantifies vegetation health and density using satellite reflectance data.",
  "Public Infrastructure": "Represents availability of facilities like schools, hospitals, and transport networks.",
  "Urban Sprawl Analysis": "Shows expansion and outward growth of urban areas over time.",
  "Property Value Trends": "Tracks change in real estate prices to highlight appreciation or depreciation.",
  "Property Development Potential": "Estimates an area's suitability for future development based on land and zoning factors.",
  "Land Price": "Displays cost variations of land across different locations.",
  "Precipitation Levels": "Shows rainfall levels to analyze climate and water availability.",
  "Temporal Population Density": "Shows how population concentration changes across time periods.",
  "Temporal Green Cover Analysis": "Tracks how green cover and vegetation change over multiple years.",
  "Disaster Volunerability": "Assesses risk levels for hazards like floods, earthquakes, or storms."
};

// ⭐ NEW: convert values for specific filters
function applySpecialValueTransforms(title, value) {
  if (!title || value == null) return value;

  const t = title.toLowerCase();

  // For solar potential — backend usually returns 0–1 floating value
  if (t.includes("solar")) return value * 100;

  // Crime/Safety Index also returned 0–1 → convert to %
  if (t.includes("crime") || t.includes("safety")) return value * 100;

  // Land use/lond cover also returned 0–1 → convert to %
  if (t.includes("land use") || t.includes("land cover")) return value * 100;

  if (t.includes("public") || t.includes("infrastructure")) return value * 100;

  if (t.includes("disaster") || t.includes("urban")) return value * 100;

  return value;
}

const GenericLegend = ({ data, title }) => {
  if (!data) return null;

  const stats = data;
  console.log("GenericLegend stats:", stats.years);
  const rawForNorm = stats?.data ?? stats.raw ?? stats;
  const norm = normalizeFilterResponse(rawForNorm || {});

  const description = filterDescriptions[title] || null;

  const unit = (() => {
    const backendUnit =
      stats?.unit ||
      stats?.units ||
      rawForNorm?.unit;

    const inferred = inferUnitFromFilter(title);

    return backendUnit ?? inferred ?? "";
  })();

  // original value extraction
  let currentValue = (() => {
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

  // ⭐ apply Solar/Crime transformations
  currentValue = applySpecialValueTransforms(title, currentValue);

  return (
    <div className="mb-4 p-3 bg-gray-800 rounded text-sm">
      <h3 className="font-semibold mb-1">{title || "Info"}</h3>

      {/* Description */}
      {description && (
        <p className="text-gray-400 text-md mb-3 leading-relaxed">
          {description}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-sm text-gray-400">Current</p>
          <div className="text-lg font-medium">
            {currentValue != null
              ? `${Number(currentValue).toLocaleString()}${unit ? ` ${unit}` : ""}`
              : "N/A"}
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-400">Geometry</p>
          <div className="text-lg font-medium">
            {norm.geojson ? "GeoJSON" : (norm.points?.length ? `Points (${norm.points.length})` : "None")}
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-400">Time series</p>
          <div className="text-lg font-medium">{(Object.keys(stats?.years).length ?? 0) || "N/A"}</div>
        </div>

        <div>
          <p className="text-sm text-gray-400">Categories</p>
          <div className="text-lg font-medium">{(norm.categories?.length ?? 0) || "N/A"}</div>
        </div>

        <div className="col-span-2">
          <p className="text-sm text-gray-400">Source</p>
          <div className="text-lg font-medium">
            {(stats?.source && (stats?.insights?.source || stats?.raw?.provider)) ||
             (data?.source && (data?.insights?.source || data?.raw?.provider)) ||
             "Agent/Backend"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenericLegend;
