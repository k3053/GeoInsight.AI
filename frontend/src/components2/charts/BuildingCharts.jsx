import React from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis,
  LineChart, Line, CartesianGrid
} from "recharts";
import BuildingLegend from "../legends/BuildingLegend";

const COLORS = ["#42A5F5", "#90CAF9"];

export default function BuildingCharts({ stats }) {
  const totalBuildings = stats?.totals?.totalBuildings || 0;

  const pieData = [
    { name: "Buildings Found", value: totalBuildings },
    { name: "Empty Land", value: Math.max(0, 500 - totalBuildings) },
  ];

  const barData = [
    { category: "Residential", value: Math.floor(totalBuildings * 0.6) },
    { category: "Commercial", value: Math.floor(totalBuildings * 0.25) },
    { category: "Others", value: Math.floor(totalBuildings * 0.15) },
  ];

  const lineData = [
    { distance: "1km", value: Math.floor(totalBuildings * 0.2) },
    { distance: "3km", value: Math.floor(totalBuildings * 0.5) },
    { distance: "5km", value: totalBuildings },
  ];

  return (
    <div className="card-glass p-4">
      <h2 className="text-lg font-semibold mb-2">Building Density Analysis</h2>
      {/* <BuildingLegend /> */}

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
            Shows proportion of detected buildings vs. empty space.
          </p>
        </div>

        {/* Bar Chart */}
        <div>
          <BarChart width={250} height={220} data={barData}>
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
          <p className="text-xs text-gray-400 mt-2">
            Estimated distribution of building types.
          </p>
        </div>

        {/* Line Chart */}
        <div>
          <LineChart width={250} height={220} data={lineData}>
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis dataKey="distance" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#82ca9d" />
          </LineChart>
          <p className="text-xs text-gray-400 mt-2">
            Building count increasing with radius distance.
          </p>
        </div>
      </div>
    </div>
  );
}
