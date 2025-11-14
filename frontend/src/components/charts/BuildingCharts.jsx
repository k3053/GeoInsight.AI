// import React from "react";
// import {
//   PieChart, Pie, Cell, Tooltip, Legend,
//   BarChart, Bar, XAxis, YAxis,
//   LineChart, Line, CartesianGrid
// } from "recharts";
// import BuildingLegend from "../legends/BuildingLegend";

// const COLORS = ["#42A5F5", "#90CAF9"];

// export default function BuildingCharts({ stats }) {
//   const totalBuildings = stats?.totals?.totalBuildings || 0;
//   console.log("Buildings===>", stats?.totals?.points)
//   const pieData = [
//     { name: "Buildings Found", value: totalBuildings },
//     { name: "Empty Land", value: Math.max(0, 500 - totalBuildings) },
//   ];

//   const barData = [
//     { category: "Residential", value: Math.floor(totalBuildings * 0.6) },
//     { category: "Commercial", value: Math.floor(totalBuildings * 0.25) },
//     { category: "Others", value: Math.floor(totalBuildings * 0.15) },
//   ];

//   const lineData = [
//     { distance: "1km", value: Math.floor(totalBuildings * 0.2) },
//     { distance: "3km", value: Math.floor(totalBuildings * 0.5) },
//     { distance: "5km", value: totalBuildings },
//   ];

//   return (
//     <div className="card-glass p-4">
//       <h2 className="text-lg font-semibold mb-2">Building Density Analysis</h2>
//       {/* <BuildingLegend /> */}

//       <div className="grid md:grid-rows-3 gap-6">
//         {/* Pie Chart */}
//         <div>
//           <PieChart width={250} height={220}>
//             <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
//               {pieData.map((_, idx) => (
//                 <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
//               ))}
//             </Pie>
//             <Tooltip />
//             <Legend />
//           </PieChart>
//           <p className="text-xs text-gray-400 mt-2">
//             Shows proportion of detected buildings vs. empty space.
//           </p>
//         </div>

//         {/* Bar Chart */}
//         <div>
//           <BarChart width={250} height={220} data={barData}>
//             <XAxis dataKey="category" />
//             <YAxis />
//             <Tooltip />
//             <Bar dataKey="value" fill="#8884d8" />
//           </BarChart>
//           <p className="text-xs text-gray-400 mt-2">
//             Estimated distribution of building types.
//           </p>
//         </div>

//         {/* Line Chart */}
//         <div>
//           <LineChart width={250} height={220} data={lineData}>
//             <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
//             <XAxis dataKey="distance" />
//             <YAxis />
//             <Tooltip />
//             <Line type="monotone" dataKey="value" stroke="#82ca9d" />
//           </LineChart>
//           <p className="text-xs text-gray-400 mt-2">
//             Building count increasing with radius distance.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

import React from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

const COLORS = [
  "#42A5F5", "#90CAF9", "#66BB6A", "#FFA726",
  "#F4511E", "#E53935", "#8E24AA", "#3949AB"
];

// Helper function to shorten labels
const shortenType = (type) => {
  if (!type) return "unknown";
  const lower = type.toLowerCase();
  if (lower === "yes") return "old";
  if (lower === "apartments" || lower === "apartment") return "apart";
  if (lower === "residential") return "resident";
  if (lower === "commercial") return "commerce";
  return type;
};

export default function BuildingCharts({ stats }) {
  // Extract possible data from backend
  const points = stats?.totals?.points?.points || [];
  const buildingTypeCounts = stats?.totals?.points?.buildingTypeCounts || {};
  let totalBuildings = stats?.totals?.points?.totalBuildings || 0;

  console.log("Incoming stats:", stats?.totals);

  // Case 1: If backend already gave `buildingTypeCounts`
  let typeCounts = buildingTypeCounts;

  // Case 2: Derive manually if needed
  if (!typeCounts || Object.keys(typeCounts).length === 0) {
    typeCounts = points.reduce((acc, item) => {
      const type = item?.type || "unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
  }

  // Compute total buildings if not provided
  if (!totalBuildings || totalBuildings === 0) {
    totalBuildings = points.length || Object.values(typeCounts).reduce((a, b) => a + b, 0);
  }

  // Convert typeCounts object → array
  const typeData = Object.entries(typeCounts).map(([type, count]) => ({
    type: shortenType(type),
    count,
  }));

  // Prepare Pie data
  const pieData = typeData.map((d) => ({
    name: d.type,
    value: d.count,
  }));

  // 🧭 Sort buildings by proximity
  const nearestBuildings = [...points]
    .filter((p) => p?.distance_m !== undefined)
    .sort((a, b) => a.distance_m - b.distance_m)
    .slice(0, 5); // top 5 closest

  // Handle no valid data
  if (totalBuildings === 0 || typeData.length === 0) {
    return (
      <div className="card-glass p-4">
        <h2 className="text-lg font-semibold mb-2">
          Building Types Distribution Analysis
        </h2>
        <p className="text-xs text-gray-400 mt-2">
          No valid building data available.
        </p>
      </div>
    );
  }

  return (
    <div className="card-glass p-4">
      <h2 className="text-lg font-semibold mb-2">
        Building Types Distribution Analysis
      </h2>

      {/* Display total building count */}
      <p className="text-xl text-gray-200 mb-6">
        Total Buildings Detected:{" "}
        <span className="font-bold text-[var(--theme-primary)]">
          {totalBuildings}
        </span>
      </p>

      <div className="flex flex-col gap-12">
        {/* Pie Chart */}
        <div className="flex flex-col items-center">
          <p className="text-lg text-gray-200 mb-2 font-semibold">
            Proportion of Each Building Type
          </p>
          <PieChart width={380} height={320}>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              outerRadius={100}
              label
            >
              {pieData.map((entry, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </div>

        {/* Bar Chart */}
        <div className="flex flex-col items-center">
          <p className="text-lg text-gray-200 mb-2 font-semibold">
            Count of Each Building Type
          </p>
          <BarChart
            width={380}
            height={320}
            data={typeData}
            margin={{ top: 20, right: 20, bottom: 40, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="type"
              tick={{
                fontSize: 16,
                angle: -30,
                textAnchor: "end",
                fill: "#FFFFFF",
              }}
              interval={0}
            />
            <YAxis tick={{ fontSize: 16, fill: "#FFFFFF" }} />
            <Tooltip />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {typeData.map((entry, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </div>

        {/* Nearby Buildings Section */}
        {nearestBuildings.length > 0 && (
          <div>
            <p className="text-lg text-gray-200 mb-3 font-semibold">
              Nearby Amenities (Closest {nearestBuildings.length})
            </p>
            <ul className="text-gray-300 text-lg space-y-2">
              {nearestBuildings.map((b, idx) => (
                <li key={idx} className="flex justify-between border-b border-gray-600 pb-1">
                  <span>
                    {b.name || "Unnamed Building"}{" "}
                    <span className="text-gray-500 text-xs">
                      ({shortenType(b.type)})
                    </span>
                  </span>
                  <span className="font-semibold text-[var(--theme-primary)]">
                    {b.distance_m.toFixed(0)} m
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
