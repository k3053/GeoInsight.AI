import React, { useEffect, useState } from "react";
import ChatSection from "./ChatSection";
import { useSelector } from "react-redux";

// Import modular chart components
import PopulationCharts from "./charts/PopulationCharts";
import AQICharts from "./charts/AQICharts";
import BuildingCharts from "./charts/BuildingCharts";

// Import modular legend components
import PopulationLegend from "./legends/PopulationLegend";
import AQILegend from "./legends/AQILegend";
import BuildingLegend from "./legends/BuildingLegend";

const DashboardCharts = () => {
  const selectedFilter = useSelector((state) => state.dashboard.selectedFilter);
  const [stats, setStats] = useState(null);

  // Listen for map stats events from MapSection
  useEffect(() => {
    const handler = (e) => setStats(e.detail);
    window.addEventListener("mapStatsUpdated", handler);
    return () => window.removeEventListener("mapStatsUpdated", handler);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-3xl font-extrabold text-[var(--geo-accent)] mb-4">
        Analytical Dashboard
      </h2>

      <div className="flex-grow text-white overflow-y-auto">
        <div className="grid grid-cols-1 gap-4">
          {/* When no filter is selected */}
          {!selectedFilter && (
            <>
              <div className="card-glass p-4">Line Chart Placeholder</div>
              <div className="card-glass p-4">Bar Chart Placeholder</div>
              <div className="card-glass p-4">Pie Chart Placeholder</div>
              <div className="card-glass p-4">Stats Placeholder</div>
            </>
          )}

          {/* Population Filter */}
          {selectedFilter === "Population Density" && stats && (
            <>
              <PopulationLegend />
              <PopulationCharts stats={stats} />
            </>
          )}

          {/* AQI Filter */}
          {selectedFilter === "Air Quality Index" && stats && (
            <>
              <AQILegend />
              <AQICharts stats={stats} />
            </>
          )}

          {/* Buildings Filter */}
          {selectedFilter === "Number of Buildings" && stats && (
            <>
              <BuildingLegend />
              <BuildingCharts stats={stats} />
            </>
          )}
        </div>
      </div>

      {/* Keep ChatSection fixed at bottom */}
      <ChatSection />
    </div>
  );
};

export default DashboardCharts;
