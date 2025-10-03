import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

export default function ElevationCharts({ stats }) {
    console.log("In Elevation Charts==> ", stats)
  if (!stats || !stats?.totals) return null;

  // Define fixed elevation bins and corresponding colors.
  const bins = [
    { label: "0-100 m", min: 0, max: 100, color: "#30bcf3ff", count: 0 },
    { label: "101-200 m", min: 101, max: 200, color: "#444f91ff", count: 0 },
    { label: "201-300 m", min: 201, max: 300, color: "#41ff3bff", count: 0 },
    { label: "301-400 m", min: 301, max: 400, color: "#fffb26ff", count: 0 },
    { label: "401+ m", min: 401, max: Infinity, color: "#f49e1eff", count: 0 },
  ];

  // Count the number of stats that fall into each bin.
  stats?.totals?.heatPoints?.forEach((pt) => {
    const elevation = pt[2];
    console.log("Elevation: ", elevation)
    for (let bin of bins) {
      if (elevation >= bin.min && elevation <= bin.max) {
        bin.count++;
        break;
      }
    }
  });

  // Convert bins for Recharts data.
  const data = bins.map(bin => ({
    range: bin.label,
    count: bin.count,
    color: bin.color
  }));

  return (
    <div className="p-4 rounded shadow text-white">
      <h2 className="text-lg font-semibold mb-2">Elevation Distribution</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 20, bottom: 40, left: -20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="range"
            tick={{ fontSize: 16, angle: -45, textAnchor: "end" }}
            interval={0}
          />
          <YAxis tick={{ fontSize: 16 }} />
          <Tooltip />
          <Bar dataKey="count">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}