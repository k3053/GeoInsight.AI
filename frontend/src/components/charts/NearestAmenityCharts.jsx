import React from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

const COLORS = [
  "#42A5F5", "#90CAF9", "#66BB6A", "#FFA726",
  "#F4511E", "#E53935", "#8E24AA", "#3949AB"
];

// Helper: shorten long amenity names
const shortenType = (type) => {
  if (!type) return "unknown";
  const lower = type.toLowerCase();
  if (lower.includes("school")) return "school";
  if (lower.includes("college")) return "college";
  if (lower.includes("hospital")) return "hospital";
  if (lower.includes("park") || lower.includes("garden")) return "park";
  if (lower.includes("bus")) return "bus";
  if (lower.includes("rail")) return "rail";
  if (lower.includes("mall")) return "mall";
  if (lower.includes("restaurant")) return "food";
  if (lower.includes("temple")) return "temple";
  return type;
};

export default function AmenityCharts({ stats }) {
  // Extract amenity data from backend response
  const amenities = stats?.totals?.points?.points || [];
  const amenityTypeCounts = stats?.totals?.points?.amenityTypeCounts || {};
  let totalAmenities = stats?.totals?.points?.totalAmenities || 0;

  console.log("Incoming amenity stats:", stats?.totals);

  // Case 1: If backend already computed counts
  let typeCounts = amenityTypeCounts;

  // Case 2: Derive manually from points
  if (!typeCounts || Object.keys(typeCounts).length === 0) {
    typeCounts = amenities.reduce((acc, item) => {
      const type = item?.type || "unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
  }

  // Compute total if not provided
  if (!totalAmenities || totalAmenities === 0) {
    totalAmenities = amenities.length || Object.values(typeCounts).reduce((a, b) => a + b, 0);
  }

  // Format for recharts
  const typeData = Object.entries(typeCounts).map(([type, count]) => ({
    type: shortenType(type),
    count,
  }));

  const pieData = typeData.map((d) => ({
    name: d.type,
    value: d.count,
  }));

  // 🧭 Sort amenities by proximity
  const nearestAmenities = [...amenities]
    .filter((p) => p?.distance_m !== undefined)
    .sort((a, b) => a.distance_m - b.distance_m)
    .slice(0, 5);

  // No data case
  if (totalAmenities === 0 || typeData.length === 0) {
    return (
      <div className="card-glass p-4">
        <h2 className="text-lg font-semibold mb-2">
          Amenity Distribution Analysis
        </h2>
        <p className="text-xs text-gray-400 mt-2">
          No valid amenity data available.
        </p>
      </div>
    );
  }

  return (
    <div className="card-glass p-4">
      <h2 className="text-lg font-semibold mb-2">
        Amenity Distribution Analysis
      </h2>

      {/* Summary count */}
      <p className="text-xl text-gray-200 mb-6">
        Total Amenities Detected:{" "}
        <span className="font-bold text-[var(--theme-primary)]">
          {totalAmenities}
        </span>
      </p>

      <div className="flex flex-col gap-12">
        {/* Pie Chart */}
        <div className="flex flex-col items-center">
          <p className="text-lg text-gray-200 mb-2 font-semibold">
            Proportion of Each Amenity Type
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
            Count of Each Amenity Type
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

        {/* Nearby Amenities */}
        {nearestAmenities.length > 0 && (
          <div>
            <p className="text-lg text-gray-200 mb-3 font-semibold">
              Nearby Amenities (Closest {nearestAmenities.length})
            </p>
            <ul className="text-gray-300 text-lg space-y-2">
              {nearestAmenities.map((a, idx) => (
                <li key={idx} className="flex justify-between border-b border-gray-600 pb-1">
                  <span>
                    {a.name || "Unnamed"}{" "}
                    <span className="text-gray-500 text-xs">
                      ({shortenType(a.type)})
                    </span>
                  </span>
                  <span className="font-semibold text-[var(--theme-primary)]">
                    {a.distance_m.toFixed(0)} m
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
