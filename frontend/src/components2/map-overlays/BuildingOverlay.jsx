import React from "react";
import { Marker, Popup, Circle } from "react-leaflet";

export default function BuildingOverlay({ selectedPos, filterData }) {
  if (!filterData?.points?.length) return null;

  return (
    <>
      {filterData.points.map((p, idx) => (
        <Marker key={idx} position={[p.lat, p.lon]}>
          <Popup>
            <div>
              <b>Building</b>
              <div>{p.tags?.name || "OSM building"}</div>
            </div>
          </Popup>
        </Marker>
      ))}
      <Circle
        center={selectedPos}
        radius={5000}
        pathOptions={{
          color: "#ffffff20",
          dashArray: "6",
          weight: 1,
          fillOpacity: 0,
        }}
      />
    </>
  );
}
