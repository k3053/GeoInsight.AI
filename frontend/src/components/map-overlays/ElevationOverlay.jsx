import React from "react";
import { HeatmapLayer } from "react-leaflet-heatmap-layer-v3";
import { Circle } from "react-leaflet";

function ElevationOverlay({ selectedPos, heatPoints }) {
  if (!heatPoints?.length) return null;

  return (
    <>
      <HeatmapLayer
        fitBoundsOnLoad
        fitBoundsOnUpdate
        points={heatPoints}
        longitudeExtractor={(m) => m[1]}
        latitudeExtractor={(m) => m[0]}
        intensityExtractor={(m) => m[2]}
        maxZoom={18}
        radius={25}
        blur={40}
      />
      <Circle
        center={selectedPos}
        radius={5000}
        pathOptions={{
          color: "#ffffff20",
          weight: 1,
          dashArray: "6",
          fillOpacity: 0,
        }}
      />
    </>
  );
}

export default ElevationOverlay;