import React from "react";
import { Circle, Popup, LayerGroup } from "react-leaflet";

/**
 * PrecipitationOverlay
 * - If polygon/points with precip values exist, render circles sized by mm
 * - Fallback: single circle at selectedPos with opacity proportional to total precipitation
 */
const PrecipitationOverlay = ({ selectedPos, precipitation }) => {
  if (!precipitation || !selectedPos) return null;
  const raw = precipitation.raw || precipitation || {};
  const points = raw.points || raw.stations || raw.grid || [];

  if (points && points.length > 0) {
    return (
      <LayerGroup>
        {points.map((p, i) => {
          const lat = p.lat ?? p.center?.latitude ?? p.latitude;
          const lon = p.lon ?? p.center?.longitude ?? p.longitude;
          const mm = p.value ?? p.mm ?? p.precip_mm ?? 0;
          const radius = Math.min(800, Math.max(50, mm * 40));
          const color = mm > 10 ? "#0ea5e9" : "#60a5fa";
          return (
            <Circle
              key={`precip-${i}`}
              center={[lat, lon]}
              radius={radius}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.35, weight: 0.6 }}
            >
              <Popup>
                <div className="text-sm">
                  <strong>Precipitation</strong><br />
                  {mm ? `${mm} mm` : "N/A"}
                </div>
              </Popup>
            </Circle>
          );
        })}
      </LayerGroup>
    );
  }

  const total = precipitation.total_mm ?? precipitation.total ?? 0;
  const opacity = Math.min(0.6, Math.max(0.05, Math.sqrt(total) / 10));
  return (
    <Circle
      center={selectedPos}
      radius={Math.min(2000, Math.max(200, (total || 1) * 50))}
      pathOptions={{ color: "#0284c7", fillColor: "#0284c7", fillOpacity: opacity, weight: 1 }}
    >
      <Popup>
        <div className="text-sm">
          <strong>Precipitation</strong><br />
          Total: {total ? `${total} mm` : "N/A"}
        </div>
      </Popup>
    </Circle>
  );
};

export default PrecipitationOverlay;