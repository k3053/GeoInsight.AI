
import React from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis,
  LineChart, Line, CartesianGrid, LabelList
} from "recharts";

// Population categories (example buckets)
const POP_CATEGORIES = [
  { label: "Low", range: [0, 1000], color: "#00E676", description: "Very low population density." },
  { label: "Medium", range: [1001, 10000], color: "#FFEB3B", description: "Moderate population density." },
  { label: "High", range: [10001, 20000], color: "#FF9800", description: "High population density." },
  { label: "Overload", range: [20001, 50000], color: "#E53935", description: "Extremely high population density." },
];

export default function PopulationCharts({ stats }) {
  const population = stats?.totals?.population || 0;
  const percent = ((population / 50000) * 100).toFixed(1);

  // Find current category
  const category = POP_CATEGORIES.find(c => population >= c.range[0] && population <= c.range[1]) || POP_CATEGORIES[POP_CATEGORIES.length - 1];

  // Pie chart data
  const pieData = [
    { name: `${category.label} (${population})`, value: population, color: category.color },
    { name: "Remaining to 50k", value: Math.max(0, 50000 - population), color: "#eeeeee" },
  ];

  // Bar chart data
  const barData = POP_CATEGORIES.map(c => {
    const inRange = population >= c.range[0] && population <= c.range[1];
    return {
      category: c.label,
      value: inRange ? percent : 0,
      color: c.color,
    };
  });

  // Line chart (trend, simulated)
  const lineData = [
    { year: "2010", value: Math.max(0, population * 0.7) },
    { year: "2015", value: Math.max(0, population * 0.85) },
    { year: "2020", value: population },
  ].map(d => ({
    ...d,
    percent: ((d.value / 50000) * 100).toFixed(1),
    color: POP_CATEGORIES.find(c => d.value >= c.range[0] && d.value <= c.range[1])?.color || "#999"
  }));

  return (
    <div className="card-glass p-4">
      <h2 className="text-[var(--geo-accent)] font-semibold mb-2">Population Analysis</h2>

      <div className="grid md:grid-rows-3 gap-3">
        {/* ----- Pie Chart ----- */}
        <div className="p-3 rounded-lg bg-black/30 outline-1 outline-white-700">
          <h3 className="text-sm font-semibold mb-4">Population % of Max (50,000)</h3>
          <div className="flex flex-row items-center mt-7 gap-6 ml-8">
            <PieChart width={300} height={260} margin={{ top: 10, right: 20, bottom: 40, left: 20 }}>
              <Legend verticalAlign="top" height={36} align="left" wrapperStyle={{ paddingBottom: 80 }}/>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label={({ value }) => `${((value / 50000) * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </div>
          <div className="mt-2 p-2 bg-gray-800 text-sm rounded">
            Current population is <b>{population}</b> ({percent}% of max scale). <br />
            <span style={{ color: category.color, fontWeight: "bold" }}>{category.label}</span>: {category.description}
          </div>
        </div>

        {/* ----- Bar Chart ----- */}
        <div className="p-3 rounded-lg bg-black/30 mt-[0px] outline-1 outline-white-700">
          <h3 className="text-sm font-semibold mb-2">Population Category Classification</h3>
          <BarChart
            width={350}
            height={320} 
            data={barData}
            margin={{ top: 20, right: 20, bottom: 60, left: 20 }}
          >
            <XAxis
              dataKey="category"
              angle={-25}
              textAnchor="end"
              interval={0}
            />
            <YAxis unit="%" />
            <Tooltip />
            <Bar dataKey="value">
              {barData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
          <div className="mt-5 p-2 bg-gray-800 text-sm rounded">
            All population categories are shown. The current category bar is filled with its
            percentage of the maximum scale (50,000).
          </div>
        </div>

        {/* ----- Line Chart ----- */}
        <div className="p-3 rounded-lg bg-black/30 outline-1 outline-white-700">
          <h3 className="text-sm font-semibold mb-2">Population Trend (2010-2020)</h3>
          <div className="flex flex-col items-left mt-7">
            <LineChart width={350} height={280} data={lineData}>
              <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
              <XAxis dataKey="year" />
              <YAxis domain={[0, 50000]} />
              <Tooltip formatter={(val) => `${val} people`} />
              <Line type="monotone" dataKey="value" stroke="#82ca9d" />
            </LineChart>
          </div>
          <div className="mt-8 p-2 bg-gray-800 text-sm rounded">
            Population values over the past decade. Current population is in the <b style={{ color: category.color }}>{category.label}</b> range.
          </div>
        </div>
      </div>
    </div>
  );
}
