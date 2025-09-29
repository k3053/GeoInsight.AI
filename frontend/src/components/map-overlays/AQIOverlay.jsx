import React from "react";
import { Circle, Marker, Popup } from "react-leaflet";

// getAQIColor for exactly 10 intervals (0-50, 51-100, …, 451-500)
function getAQIColor(aqi) {
  if (aqi <= 50) return "#00E676";       // Good (Green)
  else if (aqi <= 100) return "#FFEB3B";   // Moderate (Yellow)
  else if (aqi <= 150) return "#FFA726";   // Unhealthy for Sensitive Groups (Orange)
  else if (aqi <= 200) return "#F4511E";   // Unhealthy (Red-Orange)
  else if (aqi <= 250) return "#E53935";   // Very Unhealthy (Red)
  else if (aqi <= 300) return "#8E24AA";   // Hazardous (Purple)
  else if (aqi <= 350) return "#3949AB";   // Superior 1 (Indigo)
  else if (aqi <= 400) return "#283593";   // Superior 2 (Dark Indigo)
  else if (aqi <= 450) return "#1E88E5";   // Superior 3 (Blue)
  else return "#039BE5";                   // Superior 4 (Light Blue)
}

export default function AQIOverlay({ selectedPos, filterData }) {
  // Ensure filterData exists and contains the AQI in filterData.aqi.data.aqi.
  if (!filterData || !filterData.aqi || filterData.aqi.data.aqi === undefined) return null;
  const aqiValue = filterData.aqi.data.aqi;

  return (
    <>
      <Circle
        center={selectedPos}
        radius={1000}
        pathOptions={{
          color: getAQIColor(aqiValue),
          fillColor: getAQIColor(aqiValue),
          fillOpacity: 0.3,
          weight: 2,
        }}
      />
      <Marker position={selectedPos}>
        <Popup>
          <div>
            <b>AQI:</b> {aqiValue} <br />
            <small>City: {filterData.aqi.data.city?.name || "N/A"}</small>
          </div>
        </Popup>
      </Marker>
    </>
  );
}