import React from "react";

// 6 temperature intervals: <=0, 1-10, 11-20, 21-30, 31-40, >40
function getTempColor(temp) {
  if (temp <= 0) return "#2196f3"; // blue
  if (temp <= 10) return "#64b5f6"; // light blue
  if (temp <= 20) return "#ffeb3b"; // yellow
  if (temp <= 30) return "#ff9800"; // orange
  if (temp <= 40) return "#e53935"; // red
  return "#8d1919"; // dark red
}

const tempIntervals = [
  { label: "≤ 0°C", color: getTempColor(0) },
  { label: "1-10°C", color: getTempColor(5) },
  { label: "11-20°C", color: getTempColor(15) },
  { label: "21-30°C", color: getTempColor(25) },
  { label: "31-40°C", color: getTempColor(35) },
  { label: "> 40°C", color: getTempColor(45) },
];

export default function WeatherLegend() {
  return (
    <div className="mb-4 text-sm ml-5">
      <p className="font-semibold">Legend (Temperature Intervals):</p>
      <ul className="mt-3 space-y-1">
        {tempIntervals.map((item, idx) => (
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
}
