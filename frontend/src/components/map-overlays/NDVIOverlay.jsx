import React from "react";
import { Circle, Popup, LayerGroup } from "react-leaflet";

/**
 * NDVIOverlay
 * - If pixel/segment centers provided in data.raw.segments or raw.grid -> render colored circles
 * - Fallback: single circle at selectedPos with color based on avg NDVI
 */
const NDVIOverlay = ({ selectedPos, ndviData }) => {
  if (!ndviData || !selectedPos) return null;

  const raw = ndviData.raw || ndviData || {};
  const segments = raw.segments || raw.grid || raw.pixels || raw.segments_centers || [];

  if (segments && segments.length > 0) {
    return (
      <LayerGroup>
        {segments.map((s, i) => {
          const lat = s.center?.latitude || s.lat || s[0];
          const lon = s.center?.longitude || s.lon || s[1];
          const val = s.value ?? s.ndvi ?? s.mean ?? 0;
          // color scale: -1 => brown, 0 => yellow, +1 => green
          const green = Math.round(((val + 1) / 2) * 180);
          const red = Math.round(200 - ((val + 1) / 2) * 160);
          const color = `rgb(${red},${green},60)`;
          const radius = Math.max(8, Math.min(120, Math.abs(val) * 120));
          return (
            <Circle
              key={`ndvi-${i}`}
              center={[lat, lon]}
              radius={radius}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.45, weight: 0.8 }}
            >
              <Popup>
                <div className="text-sm">
                  <strong>NDVI</strong><br />
                  Value: {val != null ? val.toFixed(3) : "N/A"}
                </div>
              </Popup>
            </Circle>
          );
        })}
      </LayerGroup>
    );
  }

  const avg = ndviData.average_ndvi ?? ndviData.dailyAverage ?? ndviData.avg ?? 0;
  const intensity = Math.min(0.8, Math.max(0.05, (avg + 1) / 2));
  const color = `rgba(22,163,74,${intensity})`;
  const radius = Math.min(1500, Math.max(200, Math.abs(avg) * 800));

  return (
    <Circle
      center={selectedPos}
      radius={radius}
      pathOptions={{ color: "#16a34a", fillColor: color, fillOpacity: 0.22, weight: 1 }}
    >
      <Popup>
        <div className="text-sm">
          <strong>NDVI</strong><br />
          Average: {avg != null ? avg.toFixed(3) : "N/A"}
        </div>
      </Popup>
    </Circle>
  );
};

export default NDVIOverlay;