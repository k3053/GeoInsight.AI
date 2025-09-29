import React from "react";

function getAQIColor(aqi) {
  // 10 intervals over 0 to 500
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

const AQILegend = () => {
  // Generate 10 intervals (0-50, 50-100, …, 450-500)
  const legendItems = Array.from({ length: 10 }, (_, i) => {
    const low = i * 50;
    const high = (i + 1) * 50;
    const color = getAQIColor((low + high) / 2);
    return { label: `${low}-${high}`, color };
  });
  
  return (
    <div className="mb-4 text-sm ml-5">
      <p className="font-semibold">Legend (AQI Intervals):</p>
      <ul className="mt-3 space-y-1">
        {legendItems.map((item, idx) => (
          <li key={idx} className="flex items-center">
            <span
              className="inline-block w-4 h-4 mr-2"
              style={{ backgroundColor: item.color }}
            ></span>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AQILegend;