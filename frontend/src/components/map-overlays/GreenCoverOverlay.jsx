import React from "react";
import { Circle, Popup, LayerGroup } from "react-leaflet";

/**
 * GreenCoverOverlay: draw per-segment circles colored green with opacity proportional to percent green.
 */
const GreenCoverOverlay = ({ selectedPos, green }) => {
  if (!green || !selectedPos) return null;
  const raw = green.raw || green || {};
  const segments = raw.segments || raw.patches || raw.treeClusters || [];

  if (segments && segments.length > 0) {
    return (
      <LayerGroup>
        {segments.map((s, i) => {
          const lat = s.center?.latitude ?? s.lat ?? s.latitude;
          const lon = s.center?.longitude ?? s.lon ?? s.longitude;
          const pct = s.green_percent ?? s.percent_green ?? s.value ?? 0;
          const opacity = Math.min(0.8, Math.max(0.08, pct / 100));
          const radius = Math.min(600, Math.max(20, (pct || 1) * 6));
          return (
            <Circle
              key={`green-${i}`}
              center={[lat, lon]}
              radius={radius}
              pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: opacity, weight: 0.6 }}
            >
              <Popup>
                <div className="text-sm">
                  <strong>Green patch</strong><br />
                  {pct != null ? `${pct}% green` : "N/A"}
                </div>
              </Popup>
            </Circle>
          );
       })}
      </LayerGroup>
    );
  }

  const pct = green.green_percent ?? green.percent ?? 0;
  return (
    <Circle
      center={selectedPos}
      radius={Math.min(1500, Math.max(200, (pct || 1) * 10))}
      pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: Math.min(0.5, (pct || 0) / 100 + 0.05), weight: 1 }}
    />
  );
};

export default GreenCoverOverlay;