//Source of AQI data: https://www.airnow.gov/aqi/aqi-basics/
import React from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis,
  LineChart, Line, CartesianGrid, LabelList
} from "recharts";

// EPA AQI Categories
const AQI_CATEGORIES = [
  { label: "Good", range: [0, 50], color: "#00E676", description: "Air quality is satisfactory, and air pollution poses little or no risk." },
  { label: "Moderate", range: [51, 100], color: "#FFEB3B", description: "Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution." },
  { label: "Unhealthy for Sensitive Groups", range: [101, 150], color: "#F4511E", description: "Members of sensitive groups may experience health effects. The general public is less likely to be affected." },
  { label: "Unhealthy", range: [151, 200], color: "#F4511E", description: "Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects." },
  { label: "Very Unhealthy", range: [201, 300], color: "#b1201eff", description: "Health alert: The risk of health effects is increased for everyone." },
  { label: "Hazardous", range: [301, 500], color: "#6A1B9A", description: "Health warning of emergency conditions: everyone is more likely to be affected." },
];

export default function AQICharts({ stats }) {
  const aqi = stats?.totals?.aqi || 0;
  const percent = ((aqi / 500) * 100).toFixed(1);

  // Find current AQI category
  const category = AQI_CATEGORIES.find(c => aqi >= c.range[0] && aqi <= c.range[1]) || AQI_CATEGORIES[AQI_CATEGORIES.length - 1];

  // ----- PIE CHART -----
  const pieData = [
    { name: `${category.label} (${aqi})`, value: aqi, color: category.color },
    { name: "Remaining to 500", value: Math.max(0, 500 - aqi), color: "#eeeeee" },
  ];

  // ----- BAR CHART DATA -----
  const barData = AQI_CATEGORIES.map(c => {
    const inRange = aqi >= c.range[0] && aqi <= c.range[1];
    return {
      category: c.label,
      value: inRange ? percent : 0,  // only current one has % value
      color: c.color,
    };
  });

  // ----- LINE CHART (trend, simulated) -----
  const lineData = [
    { time: "2h ago", value: Math.max(0, aqi - 35) },
    { time: "1h ago", value: Math.max(0, aqi - 20) },
    { time: "Now", value: aqi },
  ].map(d => ({
    ...d,
    percent: ((d.value / 500) * 100).toFixed(1),
    color: AQI_CATEGORIES.find(c => d.value >= c.range[0] && d.value <= c.range[1])?.color || "#999"
  }));

  return (
    <div className="card-glass p-4">
      <h2 className="text-[var(--geo-accent)] font-semibold mb-2">Air Quality Analysis</h2>

      <div className="grid md:grid-rows-3 gap-3">
        {/* ----- Pie Chart ----- */}
        <div className="p-3 rounded-lg bg-black/30 outline-1 outline-white-700">
          <h3 className="text-sm font-semibold mb-4">AQI Percentage of Max (500)</h3>
          <div className="flex flex-row items-center mt-7 gap-6 ml-8">
            <PieChart width={300} height={260} margin={{ top: 10, right: 20, bottom: 40, left: 20 }}>
              <Legend verticalAlign="top" height={36} align="left" wrapperStyle={{ paddingBottom: 80 }}/>
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
            Current AQI is <b>{aqi}</b> ({percent}% of hazardous level). <br />
            <span style={{ color: category.color, fontWeight: "bold" }}>{category.label}</span>: {category.description}
          </div>
        </div>

        {/* ----- Bar Chart ----- */}
        <div className="p-3 rounded-lg bg-black/30 mt-[0px] outline-1 outline-white-700">
          <h3 className="text-sm font-semibold mb-2">AQI Category Classification</h3>
          <BarChart
            width={350}
            height={320} 
            data={barData}
            margin={{ top: 20, right: 20, bottom: 60, left: 20 }} // give space at bottom
          >
            <XAxis
              dataKey="category"
              angle={-25}
              textAnchor="end"
              interval={0}
              tickFormatter={(val) =>
                val === "Unhealthy for Sensitive Groups" ? "Unhealthy" : val
              }
            />
            <YAxis unit="%" />
            <Tooltip />
            <Bar dataKey="value">
              {barData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
              <LabelList
                dataKey="value"
                position="top"
                formatter={(val) => (val > 0 ? `${val}%` : "")}
              />
            </Bar>
          </BarChart>
          <div className="mt-5 p-2 bg-gray-800 text-sm rounded">
            All AQI categories are shown. The current category bar is filled with its
            percentage of the maximum scale (500).
          </div>
        </div>

        {/* ----- Line Chart ----- */}
        <div className="p-3 rounded-lg bg-black/30 outline-1 outline-white-700">
          <h3 className="text-sm font-semibold mb-2">AQI Trend (Last 2 Hours)</h3>
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
            AQI values over the past 2 hours. Current AQI is in the <b style={{ color: category.color }}>{category.label}</b> range.
          </div>
        </div>
      </div>
    </div>
  );
}
