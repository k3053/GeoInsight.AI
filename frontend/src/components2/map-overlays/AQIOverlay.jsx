import React from "react";
import { Circle, Marker, Popup } from "react-leaflet";

function getAQIColor(aqi) {
  if (aqi <= 50) return "#00E676";
  if (aqi <= 100) return "#FFEB3B";
  if (aqi <= 150) return "#F4511E";
  if (aqi <= 200) return "#F4511E";
  if (aqi <= 300) return "#b1201eff";
  return "#6A1B9A";
}

export default function AQIOverlay({ selectedPos, filterData }) {
  if (!filterData || filterData.aqi === undefined) return null;

  return (
    <>
      <Circle
        center={selectedPos}
        radius={5000}
        pathOptions={{
          color: getAQIColor(filterData.aqi),
          fillColor: getAQIColor(filterData.aqi),
          fillOpacity: 0.18,
          weight: 2,
        }}
      />
      <Marker position={selectedPos}>
        <Popup>
          <div>
            <b>AQI:</b> {filterData.aqi} <br />
            <small>Source: AQICN</small>
          </div>
        </Popup>
      </Marker>
    </>
  );
}
