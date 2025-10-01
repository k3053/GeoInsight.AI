import React from "react";
// import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, Legend } from "recharts";

// Color helpers for temperature, humidity, wind
function getTempColor(temp) {
  if (temp <= 0) return "#2196f3";
  if (temp <= 10) return "#64b5f6";
  if (temp <= 20) return "#ffeb3b";
  if (temp <= 30) return "#ff9800";
  if (temp <= 40) return "#e53935";
  return "#8d1919";
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

export default function WeatherCharts({ weather }) {
  if (!weather) return null;
  const temp = weather.main.temp;
  const humidity = weather.main.humidity;
  const wind = weather.wind.speed;

  // Bar data for each metric
  const barData = [
    { label: "Temperature (°C)", value: temp, color: getTempColor(temp), max: 50 },
    { label: "Humidity (%)", value: humidity, color: getHumidityColor(humidity), max: 100 },
    { label: "Wind (m/s)", value: wind, color: getWindColor(wind), max: 20 },
  ];

  return (
    <div className="absolute bottom-4 left-4 bg-white bg-opacity-80 p-2 rounded shadow z-40 text-xs min-w-[200px]">
      <div className="font-bold mb-1">Weather Charts</div>
      <div className="space-y-2 mt-2">
        {barData.map((item, idx) => (
          <div key={idx} className="mb-2">
            <div className="mb-1">{item.label}: <b>{Math.round(item.value)}</b></div>
            <div className="w-full bg-gray-200 rounded h-2 mb-1">
              <div
                className="h-2 rounded"
                style={{ width: `${Math.min(100, (item.value / item.max) * 100)}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
