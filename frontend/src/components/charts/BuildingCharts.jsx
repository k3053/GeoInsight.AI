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

const COLORS = ["#42A5F5", "#90CAF9", "#66BB6A", "#FFA726", "#F4511E", "#E53935", "#8E24AA", "#3949AB"];

export default function BuildingCharts({ stats }) {
  // Ensure that points is an array (if not, fallback to an empty array)
  const points = stats?.totals?.points?.points;
  console.log("points:", points);
  
  // Build frequency map by building type (defaulting to "unknown" if missing)
  const typeMap = {};
  points.forEach(point => {
    const type = point && point.type ? point.type : "unknown";
    typeMap[type] = (typeMap[type] || 0) + 1;
  });
  console.log("typeMap:", typeMap);
  
  // Convert the frequency map into an array for charts
  const typeData = Object.keys(typeMap).map(key => ({
    type: key,
    count: typeMap[key]
  }));
  console.log("typeData:", typeData);
  
  // Prepare pie chart data
  const pieData = typeData.map(item => ({
    name: item.type,
    value: item.count
  }));
  
  // If no data is found, display a fallback message
  if (typeData.length === 0) {
    return (
      <div className="card-glass p-4">
        <h2 className="text-lg font-semibold mb-2">Building Types Distribution Analysis</h2>
        <p className="text-xs text-gray-400 mt-2">No valid building type data available.</p>
      </div>
    );
  }
  
  return (
    <div className="card-glass p-4">
      <h2 className="text-lg font-semibold mb-2">Building Types Distribution Analysis</h2>
      <div className="grid md:grid-rows-2 gap-6">
        {/* Pie Chart */}
        <div>
          <PieChart width={300} height={280}>
            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} label>
              {pieData.map((entry, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="top" height={36} />
          </PieChart>
          <p className="text-xs text-gray-400 mt-2">
            Proportion of each detected building type.
          </p>
        </div>
        
        {/* Bar Chart */}
        <div>
          <BarChart width={300} height={280} data={typeData} margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
            <XAxis dataKey="type" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip />
            <Bar dataKey="count">
              {typeData.map((entry, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
          <p className="text-xs text-gray-400 mt-2">
            Count of each building type.
          </p>
        </div>
      </div>
    </div>
  );
}