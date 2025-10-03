import React from "react";

// Color helpers (same as in WeatherCharts)
function getTempColor(temp) {
  if (temp >= 0 && temp <= 10) return "#bde1fdff"; // blue
  if (temp > 10 && temp <= 20) return "#64b5f6"; // light blue
  if (temp > 20 && temp <= 30) return "#fcff3bff"; // yellow
  if (temp > 30 && temp <= 40) return "#ff7b00ff"; // orange
  if (temp > 40) return "#fc2617ff"; // red
}

function getHumidityColor(h) {
  if (h <= 30) return "#b3e5fc";
  if (h <= 60) return "#4fc3f7";
  return "#01579b";
}

function getWindColor(w) {
  if (w <= 2) return "#c8e6c9";
  if (w <= 5) return "#81c784";
  return "#388e3c";
}

function getCloudColor(cloud_pct) {
  if (cloud_pct <= 25) return "#d0d0d0";
  if (cloud_pct <= 50) return "#a0a0a0";
  if (cloud_pct <= 75) return "#707070";
  return "#404040";
}


export default function WeatherLegend() {
  return (
    <div className="mb-4 text-sm ml-5">
        
    </div>
  );
}