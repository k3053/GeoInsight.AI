import React from "react";
import {
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from "recharts";

// Color helpers based on the new weather API data
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

// Predefined legend intervals for each metric
const tempIntervals = [
  { label: "≤ 0°C", color: getTempColor(0) },
  { label: "1-10°C", color: getTempColor(5) },
  { label: "11-20°C", color: getTempColor(15) },
  { label: "21-30°C", color: getTempColor(25) },
  { label: "31-40°C", color: getTempColor(35) },
  { label: "> 40°C", color: getTempColor(45) },
];

const humidityIntervals = [
  { label: "Low (≤ 30%)", color: getHumidityColor(20) },
  { label: "Moderate (31-60%)", color: getHumidityColor(45) },
  { label: "High (> 60%)", color: getHumidityColor(80) },
];

const windIntervals = [
  { label: "Calm (≤ 2 m/s)", color: getWindColor(1) },
  { label: "Breezy (3-5 m/s)", color: getWindColor(4) },
  { label: "Windy (> 5 m/s)", color: getWindColor(7) },
];

const cloudIntervals = [
  { label: "Clear (≤ 25%)", color: getCloudColor(20) },
  { label: "Partly Cloudy (26-50%)", color: getCloudColor(40) },
  { label: "Mostly Cloudy (51-75%)", color: getCloudColor(60) },
  { label: "Overcast (>75%)", color: getCloudColor(90) },
];

export default function WeatherCharts({ weather }) {
  console.log("In Weather Charts: ", weather);
  if (!weather) return null;
  
  // Extract values from the weather API response for current conditions
  const { temp, feels_like, humidity, wind_speed, cloud_pct, max_temp, min_temp } = weather;

  // Build bar data for key analytics
  const barData = [
    { label: "Temperature (°C)", value: temp, color: getTempColor(temp), max: 50 },
    { label: "Feels Like (°C)", value: feels_like, color: getTempColor(feels_like), max: 50 },
    { label: "Humidity (%)", value: humidity, color: getHumidityColor(humidity), max: 100 },
    { label: "Wind Speed (m/s)", value: wind_speed, color: getWindColor(wind_speed), max: 20 },
    { label: "Cloud (%)", value: cloud_pct, color: getCloudColor(cloud_pct), max: 100 },
  ];
  
  // Helper function to render the complete legend for each metric in a horizontal layout.
  function renderLegendForMetric(metricLabel) {
    let intervals = null;
    if (metricLabel.includes("Temperature") || metricLabel.includes("Feels Like")) {
      intervals = tempIntervals;
    } else if (metricLabel.includes("Humidity")) {
      intervals = humidityIntervals;
    } else if (metricLabel.includes("Wind Speed")) {
      intervals = windIntervals;
    } else if (metricLabel.includes("Cloud")) {
      intervals = cloudIntervals;
    }
    if (!intervals) return null;
    return (
      <div className="flex space-x-2 mt-1">
        {intervals.map((li, idx) => (
          <div key={idx} className="flex items-center">
            <span
              className="inline-block w-3 h-3 mr-1"
              style={{ backgroundColor: li.color }}
            ></span>
            <span className="text-xs">{li.label}</span>
          </div>
        ))}
      </div>
    );
  }

  // Prepare hourly forecast data using weather.forecast.forecastday[0].hour
  const hourlyData =
    weather.forecast &&
    weather.forecast.forecastday &&
    weather.forecast.forecastday[0] &&
    weather.forecast.forecastday[0].hour
      ? weather.forecast.forecastday[0].hour.map(hourItem => ({
          // Extract time portion (ex: "09:00")
          time: hourItem.time.substring(11),
          temp: hourItem.temp_c,
        }))
      : [];

  return (
    <div className="p-2 rounded shadow bg-opacity-90 z-40 min-w-[220px]">
      <div className="font-bold mb-1">Weather Overview</div>
      <div className="mb-2 text-xs">
        <div>
          Temp: {Math.round(temp)}°C; Feels Like: {Math.round(feels_like)}°C
        </div>
        <div>
          Min: {Math.round(min_temp)}°C, Max: {Math.round(max_temp)}°C
        </div>
      </div>
      <div className="space-y-2">
        {barData.map((item, idx) => (
          <div key={idx} className="mb-3">
            <div className="mb-1 text-xs">
              {item.label}: <b>{Math.round(item.value)}</b>
            </div>
            <div className="w-full bg-gray-200 rounded h-2">
              <div
                className="h-2 rounded"
                style={{
                  width: `${Math.min(100, (item.value / item.max) * 100)}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
            {/* Display the entire legend for this metric horizontally */}
            {renderLegendForMetric(item.label)}
          </div>
        ))}
      </div>
      {/* Hourly Forecast Line Chart */}
      {hourlyData.length > 0 && (
        <div className="mt-4">
          <div className="font-bold mb-1">Hourly Forecast (°C)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={hourlyData} margin={{ top: 5, right: 40, left: -30, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis domain={["dataMin - 2", "dataMax + 2"]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="temp" stroke="#ff7b00" dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}