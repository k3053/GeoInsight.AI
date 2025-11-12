import React from "react";

/**
 * Displays only current green cover amount and computed percentage.
 * Accepts:
 *  - green as a number (area in m²) OR
 *  - green as an object with possible keys:
 *      green_area, canopy_area_m2, area_m2, value
 *      total_area_m2, total_area, area_total
 *      bbox / bounds: [minLat, minLon, maxLat, maxLon]  (used to estimate total area)
 */

const metersPerKm = 1000;
const earthRadius = 6371000; // meters

function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function estimateAreaFromBbox(bbox) {
  // bbox: [minLat, minLon, maxLat, maxLon]
  if (!Array.isArray(bbox) || bbox.length < 4) return null;
  const [minLat, minLon, maxLat, maxLon] = bbox;
  const height = haversineDistanceMeters(minLat, minLon, maxLat, minLon);
  const width = haversineDistanceMeters(minLat, minLon, minLat, maxLon);
  if (isFinite(height) && isFinite(width) && height > 0 && width > 0) {
    return height * width; // m^2
  }
  return null;
}

export default function GreenCoverLegend({ green }) {
  const raw = (green && typeof green === "object") ? green : { green_area: green };

  // find green area (m²)
  const greenArea =
    Number(raw.green_area ?? raw.canopy_area_m2 ?? raw.area_m2 ?? raw.value ?? raw.green ?? raw.canopy_area) ||
    0;

  // find total area (m²) from explicit fields or estimate from bbox/bounds
  let totalArea =
    Number(raw.total_area_m2 ?? raw.total_area ?? raw.area_total ?? raw.extent_area) || null;

  if (!totalArea) {
    const bbox = raw.bbox ?? raw.bounds ?? raw.bounding_box;
    if (bbox) {
      totalArea = estimateAreaFromBbox(bbox);
    }
  }

  const percentage =
    totalArea && totalArea > 0
      ? Math.max(0, Math.min(100, (greenArea / totalArea) * 100))
      : null;

  return (
    <div className="mb-4 p-3 bg-gray-800 rounded text-sm">
      <h3 className="font-semibold mb-2">Green Cover</h3>

      <div className="grid grid-cols-1 gap-2">
        <div>
          <p className="text-xs text-gray-400">Current green cover</p>
          <div className="text-lg font-medium">
            {greenArea ? `${Number(greenArea).toLocaleString()} m²` : "N/A"}
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-400">Green cover (%)</p>
          <div className="text-lg font-medium">
            {percentage != null ? `${percentage.toFixed(2)}%` : "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
}