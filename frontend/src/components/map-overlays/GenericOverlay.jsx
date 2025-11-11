import React from "react";
import { Circle, Popup, GeoJSON, LayerGroup } from "react-leaflet";
import { normalizeFilterResponse } from "../services/filterVizConfig";

/**
 * GenericOverlay
 * - Renders geojson if present
 * - Renders points (scaled circles) when available
 * - Fallback: halo around selectedPos using main numeric stat
 *
 * Props:
 *  - selectedPos: [lat,lon]
 *  - data: backend response (raw or normalized)
 *  - filterName: string (optional)
 */
const GenericOverlay = ({ selectedPos, data, filterName }) => {
  if (!data || !selectedPos) return null;
  const norm = normalizeFilterResponse(data.raw || data);

  // GeoJSON preferred (land use, segmentation)
  if (norm.geojson) {
    return <GeoJSON data={norm.geojson} style={() => ({ color: "#2563eb", weight: 1, fillOpacity: 0.25 })} />;
  }

  // Points
  if (norm.points && norm.points.length) {
    return (
      <LayerGroup>
        {norm.points.map((p, i) => {
          const radius = Math.min(1000, Math.max(20, (Math.abs(p.value || 1) ** 0.5) * 20));
          const color = p.value == null ? "#64748b" : (p.value >= 0 ? "#2563eb" : "#ef4444");
          return (
            <Circle
              key={`${filterName || "flt"}-pt-${i}`}
              center={[p.lat, p.lon]}
              radius={radius}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.35, weight: 0.7 }}
            >
              <Popup>
                <div className="text-sm">
                  <strong>{p.label ?? filterName}</strong><br />
                  Value: {p.value != null ? p.value : "N/A"}
                </div>
              </Popup>
            </Circle>
          );
        })}
      </LayerGroup>
    );
  }

  // Fallback single halo using primary stat from stats
  const primaryVal = norm.stats?.sprawl_index ?? norm.stats?.price ?? norm.stats?.wqi ?? norm.stats?.vulnerability_score ?? norm.stats?.score ?? null;
  const radius = primaryVal ? Math.min(3000, Math.max(200, Math.abs(primaryVal) * 50)) : 600;
  return (
    <Circle
      center={selectedPos}
      radius={radius}
      pathOptions={{ color: "#6b7280", fillColor: "#6b7280", fillOpacity: 0.12, weight: 1 }}
    >
      <Popup>
        <div className="text-sm">
          <strong>{filterName || "Data"}</strong><br />
          {primaryVal != null ? `Primary: ${primaryVal}` : "No geometry available"}
        </div>
      </Popup>
    </Circle>
  );
};

export default GenericOverlay;