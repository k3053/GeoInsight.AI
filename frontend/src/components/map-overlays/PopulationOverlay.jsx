import React from "react";
import { Circle, Popup, LayerGroup } from "react-leaflet";

/**
 * PopulationOverlay
 * - If granular population points exist, render circles sized by population
 * - Otherwise fallback to single circle sized by density or count
 */
const PopulationOverlay = ({ selectedPos, population }) => {
  if (!population || !selectedPos) return null;
  const raw = population.raw || population || {};
  const points = raw.points || raw.grid || [];

  if (points && points.length > 0) {
    return (
      <LayerGroup>
        {points.map((p, i) => {
          const lat = p.lat ?? p.center?.latitude ?? p.latitude;
          const lon = p.lon ?? p.center?.longitude ?? p.longitude;
          const val = p.value ?? p.population ?? 0;
          const radius = Math.min(800, Math.max(20, Math.sqrt(val) * 6));
          return (
            <Circle
              key={`pop-${i}`}
              center={[lat, lon]}
              radius={radius}
              pathOptions={{ color: "#f97316", fillColor: "#fb923c", fillOpacity: 0.35, weight: 0.6 }}
            >
              <Popup>
                <div className="text-sm">
                  <strong>Population</strong><br />
                  {val ? val.toLocaleString() : "N/A"}
                </div>
              </Popup>
            </Circle>
          );
        })}
      </LayerGroup>
    );
  }

  const total = population.total_population ?? population.current_population ?? 0;
  const radius = Math.min(2000, Math.max(200, Math.sqrt(total) * 5));
  return (
    <Circle
      center={selectedPos}
      radius={radius}
      pathOptions={{ color: "#f97316", fillColor: "#fb923c", fillOpacity: 0.18, weight: 1 }}
    >
      <Popup>
        <div className="text-sm">
          <strong>Population</strong><br />
          {total ? total.toLocaleString() : "N/A"}
        </div>
      </Popup>
    </Circle>
  );
};

export default PopulationOverlay;