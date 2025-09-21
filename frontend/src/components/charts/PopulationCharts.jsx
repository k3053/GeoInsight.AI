import React from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis,
  LineChart, Line, CartesianGrid
} from "recharts";
import PopulationLegend from "../legends/PopulationLegend";

const COLORS = ["#00E676", "#FFEB3B", "#FF9800", "#E53935"];

export default function PopulationCharts({ stats }) {
  const population = stats?.totals?.population || 0;

  const pieData = [
    { name: "Population", value: population },
    { name: "Remaining (till 50k)", value: Math.max(0, 50000 - population) },
  ];

  const barData = [
    { category: "Low (0-1k)", value: population <= 1000 ? 1 : 0 },
    { category: "Medium (1k-10k)", value: population > 1000 && population <= 10000 ? 1 : 0 },
    { category: "High (10k-15k)", value: population > 10000 && population <= 15000 ? 1 : 0 },
    { category: "Overload (15k+)", value: population > 15000 ? 1 : 0 },
  ];

  const lineData = [
    { year: "2010", value: population * 0.7 },
    { year: "2015", value: population * 0.85 },
    { year: "2020", value: population },
  ];

  return (
    <div className="card-glass p-4">
      <h2 className="text-lg font-semibold mb-2">Population Analysis</h2>

      <div className="grid md:grid-rows-3 gap-6">
        {/* Pie Chart */}
        <div>
          <PieChart width={250} height={220}>
            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
              {pieData.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
          <p className="text-xs text-gray-400 mt-2">
            Shows estimated population vs. benchmark of 50,000.
          </p>
        </div>

        {/* Bar Chart */}
        <div>
          <BarChart width={250} height={220} data={barData}>
            <XAxis dataKey="category" />
            <YAxis hide />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
          <p className="text-xs text-gray-400 mt-2">
            Highlights which population bucket this area falls into.
          </p>
        </div>

        {/* Line Chart */}
        <div>
          <LineChart width={250} height={220} data={lineData}>
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#82ca9d" />
          </LineChart>
          <p className="text-xs text-gray-400 mt-2">
            Past population growth trend (illustrative).
          </p>
        </div>
      </div>
    </div>
  );
}
