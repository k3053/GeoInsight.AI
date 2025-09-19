import React, { useEffect, useState } from "react";
import ChatSection from "./ChatSection";
import { useSelector } from "react-redux";
// Recharts for Pie chart
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/** Population Legend (kept similar to your original) */
const PopulationDensityLegend = () => {
  const legendItems = [
    { label: "1 - 1000 (Low)", color: "#00E676" },
    { label: "1001 - 10000 (Medium)", color: "#FFEB3B" },
    { label: "10000 - 15000 (High)", color: "#FF9800" },
    { label: "15000+ (Overload)", color: "#E53935" },
  ];
  return (
    <div className="p-4 bg-white/95 rounded-lg shadow-lg mt-4">
      <h2 className="text-xl font-bold border-b pb-2 mb-3 text-[var(--geo-accent)]">
        Population Density Legend
      </h2>
      <div className="grid grid-cols-1 gap-2">
        {legendItems.map((item, idx) => (
          <div key={idx} className="flex items-center">
            <div
              className="w-6 h-6 mr-3 rounded"
              style={{ backgroundColor: item.color }}
            ></div>
            <span className="text-sm">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DashboardCharts = () => {
  const selectedFilter = useSelector((state) => state.dashboard.selectedFilter);
  const [stats, setStats] = useState(null);

  // listen for map stats events
  useEffect(() => {
    const handler = (e) => {
      setStats(e.detail);
    };
    window.addEventListener("mapStatsUpdated", handler);
    return () => window.removeEventListener("mapStatsUpdated", handler);
  }, []);

  // Build pie data for population buckets (example)
  const buildPieData = () => {
    if (!stats) return [];
    if (stats.filter === "Population Density") {
      // buckets: low, med, high, overload
      const buckets = stats.buckets || {};
      const data = [
        { name: "Low", value: buckets.low || 0, color: "#00E676" },
        { name: "Medium", value: buckets.med || 0, color: "#FFEB3B" },
        { name: "High", value: buckets.high || 0, color: "#FF9800" },
        { name: "Overload", value: buckets.overload || 0, color: "#E53935" },
      ];
      // normalize to percentages if total is > 0
      const total = data.reduce((s, d) => s + d.value, 0);
      if (total === 0) {
        // fallback: convert single population to a single slice
        if (stats.totals && stats.totals.population) {
          return [{ name: "Population", value: stats.totals.population, color: "#2196f3" }];
        }
        return data;
      }
      return data;
    } else if (stats.filter === "Air Quality Index") {
      const aqi = stats.totals.aqi || 0;
      // Represent aqi as one slice for simplicity + "rest"
      return [
        { name: `AQI (${aqi})`, value: aqi, color: "#F4511E" },
        { name: "Remaining", value: Math.max(0, 500 - aqi), color: "#eeeeee" },
      ];
    } else if (stats.filter === "Number of Buildings") {
      const total = stats.totals.totalBuildings || 0;
      return [
        { name: "Buildings in 5km", value: total, color: "#42A5F5" },
        { name: "Remaining (est)", value: Math.max(0, 500 - total), color: "#eeeeee" },
      ];
    }
    return [];
  };

  const pieData = buildPieData();
  const COLORS = pieData.map((d) => d.color || "#8884d8");

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-3xl font-extrabold text-[var(--geo-accent)] mb-4">
        Analytical Dashboard
      </h2>
      <div className="flex-grow text-white overflow-y-auto">
        <div className="grid grid-cols-1 gap-4">
          {!selectedFilter && (
            <>
              <div className="card-glass p-4">Line Chart Placeholder</div>
              <div className="card-glass p-4">Bar Chart Placeholder</div>
              <div className="card-glass p-4">Pie Chart Placeholder</div>
              <div className="card-glass p-4">Stats Placeholder</div>
            </>
          )}

          {/* Conditionally display overlay legend */}
          {selectedFilter === "Population Density" && <PopulationDensityLegend />}

          {/* Show pie chart when stats available */}
          {stats && (
            <div className="card-glass p-4">
              <h3 className="text-xl font-bold mb-2">Area Analysis</h3>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={100}
                      label
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Small textual stats */}
              <div className="mt-3 text-sm text-gray-300">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(stats.totals, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      <ChatSection />
    </div>
  );
};

export default DashboardCharts;
