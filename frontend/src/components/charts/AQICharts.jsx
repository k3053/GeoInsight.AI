import React from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, LabelList,
  LineChart, Line, CartesianGrid
} from "recharts";

// Use the same getAQIColor logic for 10 intervals.
function getAQIColor(aqi) {
  if (aqi <= 50) return "#00E676";
  else if (aqi <= 100) return "#FFEB3B";
  else if (aqi <= 150) return "#FFA726";
  else if (aqi <= 200) return "#F4511E";
  else if (aqi <= 250) return "#E53935";
  else if (aqi <= 300) return "#8E24AA";
  else if (aqi <= 350) return "#3949AB";
  else if (aqi <= 400) return "#283593";
  else if (aqi <= 450) return "#1E88E5";
  else return "#039BE5";
}

// Generate dynamic categories in 50-unit intervals (0-50, 50-100, …, 450-500) 👉 exactly 10 intervals.
const dynamicCategories = Array.from({ length: 10 }, (_, i) => {
  const low = i * 50;
  const high = (i + 1) * 50;
  return {
    label: `${low}-${high}`,
    range: [low, high],
    color: getAQIColor((low + high) / 2),
    description: `AQI values from ${low} to ${high}`
  };
});

export default function AQICharts({ stats }) {
  // Extract current AQI from the forecast object structure.
  // Here we assume stats.totals.aqi.data.aqi holds the current AQI.
  const aqi = stats?.totals?.aqi?.data?.aqi || 0;
  // Calculate percentage relative to 500.
  const percent = ((aqi / 500) * 100).toFixed(1);

  // Determine the current interval category from our 10 dynamic categories.
  const category = dynamicCategories.find(c => aqi >= c.range[0] && aqi < c.range[1]) ||
                   dynamicCategories[dynamicCategories.length - 1];

  // Build PieChart data: current AQI and remainder to 500.
  const pieData = [
    { name: `${category.label} (${aqi})`, value: aqi, color: category.color },
    { name: "Remaining to 500", value: Math.max(0, 500 - aqi), color: "#eeeeee" },
  ];

  // Build BarChart data: one bar per interval.
  // Only fill the bar corresponding to the current AQI interval.
  const barData = dynamicCategories.map(c => ({
    category: c.label,
    value: (aqi >= c.range[0] && aqi < c.range[1]) ? percent : 0,
    color: c.color,
  }));

  // For the LineChart, use real forecast data if available (using forecast.daily.pm25).
  let lineData = [];
  if (stats?.totals?.aqi?.data?.forecast?.daily?.pm25 && stats.totals.aqi.data.forecast.daily.pm25.length >= 3) {
    // Using the first three forecast entries.
    lineData = stats.totals.aqi.data.forecast.daily.pm25.slice(0, 3).map(item => ({
      time: item.day,
      value: item.avg,
      percent: ((item.avg / 500) * 100).toFixed(1),
      color: getAQIColor(item.avg)
    }));
  } else {
    // Fallback simulated trend if forecast data is missing.
    lineData = [
      { time: "2h ago", value: Math.max(0, aqi - 30) },
      { time: "1h ago", value: Math.max(0, aqi - 15) },
      { time: "Now", value: aqi },
    ].map(d => ({
      ...d,
      percent: ((d.value / 500) * 100).toFixed(1),
      color: getAQIColor(d.value)
    }));
  }

  return (
    <div className="card-glass p-4">
      <h2 className="text-[var(--geo-accent)] font-semibold mb-2">Air Quality Analysis</h2>

      <div className="grid md:grid-rows-3 gap-3">
        {/* ----- Pie Chart ----- */}
        <div className="p-3 rounded-lg bg-black/30 outline-1 outline-white-700">
          <h3 className="text-sm font-semibold mb-4">Current AQI Percentage (Max 500)</h3>
          <div className="flex flex-row items-center mt-7 gap-6 ml-8">
            <PieChart width={300} height={260} margin={{ top: 10, right: 20, bottom: 40, left: 20 }}>
              <Legend verticalAlign="top" height={36} align="left" wrapperStyle={{ paddingBottom: 80 }} />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label={({ value }) => `${((value / 500) * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </div>
          <div className="mt-2 p-2 bg-gray-800 text-sm rounded">
            Current AQI is <b>{aqi}</b> ({percent}% of 500). Interval{" "}
            <b style={{ color: category.color }}>{category.label}</b>: {category.description}
          </div>
        </div>

        {/* ----- Bar Chart ----- */}
        <div className="p-3 rounded-lg bg-black/30 outline-1 outline-white-700">
          <h3 className="text-sm font-semibold mb-2">AQI Interval Distribution</h3>
          <BarChart
            width={350}
            height={320}
            data={barData}
            margin={{ top: 20, right: 20, bottom: 60, left: 20 }}
          >
            <XAxis dataKey="category" angle={-25} textAnchor="end" />
            <YAxis unit="%" />
            <Tooltip />
            <Bar dataKey="value">
              {barData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
              <LabelList dataKey="value" position="top" formatter={(val) => (val > 0 ? `${val}%` : "")} />
            </Bar>
          </BarChart>
          <div className="mt-5 p-2 bg-gray-800 text-sm rounded">
            Each bar represents a 50-point AQI interval (from 0 to 500). Only the interval corresponding to the current AQI is filled with its percentage value.
          </div>
        </div>

        {/* ----- Line Chart ----- */}
        <div className="p-3 rounded-lg bg-black/30 outline-1 outline-white-700">
          <h3 className="text-sm font-semibold mb-2">AQI Trend (Forecast)</h3>
          <div className="flex flex-col items-left mt-7">
            <LineChart width={350} height={280} data={lineData}>
              <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
              <XAxis dataKey="time" />
              <YAxis domain={[0, 500]} />
              <Tooltip formatter={(val) => `${val} AQI`} />
              <Line type="monotone" dataKey="value" stroke="#82ca9d" />
            </LineChart>
          </div>
          <div className="mt-8 p-2 bg-gray-800 text-sm rounded">
            AQI trend forecast based on current predictions. The current AQI interval is{" "}
            <b style={{ color: category.color }}>{category.label}</b>.
          </div>
        </div>
      </div>
    </div>
  );
}