import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

// Import modular chart and legend components
import PopulationCharts from "./charts/PopulationCharts";
import AQICharts from "./charts/AQICharts";
import BuildingCharts from "./charts/BuildingCharts";
import PopulationLegend from "./legends/PopulationLegend";
import AQILegend from "./legends/AQILegend";
import BuildingLegend from "./legends/BuildingLegend";
import { Info } from "lucide-react";

const DashboardCharts = () => {
  const selectedFilter = useSelector((state) => state.dashboard.selectedFilter);
  const [stats, setStats] = useState(null);

  // Listen for map stats events from MapSection
  useEffect(() => {
    const handler = (e) => setStats(e.detail);
    window.addEventListener("mapStatsUpdated", handler);
    return () => window.removeEventListener("mapStatsUpdated", handler);
  }, []);

  // Content for when a filter is selected but no data is available yet
  const LoadingOrNoData = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-[var(--theme-text-secondary)]">
        <Info size={48} className="mb-4"/>
        <h3 className="font-semibold text-lg">Waiting for Data</h3>
        <p>Select a location on the map to see analytics.</p>
    </div>
  );

  // Placeholder content for when no filter is selected
  const NoFilterSelected = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-[var(--theme-text-secondary)]">
        <Info size={48} className="mb-4"/>
        <h3 className="font-semibold text-lg">Select a Filter</h3>
        <p>First, pick a location on the map, then choose a data filter from the header to begin analysis.</p>
    </div>
  );

  // Helper to render the correct content based on the state
  const renderContent = () => {
    if (!selectedFilter) {
      return <NoFilterSelected />;
    }
    if (!stats) {
      return <LoadingOrNoData />;
    }

    switch (selectedFilter) {
      case "Population Density":
        return (
          <>
            <PopulationLegend />
            <PopulationCharts stats={stats} />
          </>
        );
      case "Air Quality Index":
        return (
          <>
            <AQILegend />
            <AQICharts stats={stats} />
          </>
        );
      case "Number of Buildings":
         return (
          <>
            <BuildingLegend />
            <BuildingCharts stats={stats} />
          </>
        );
      default:
        return <NoFilterSelected />;
    }
  };

  return (
    <div className="flex flex-col h-full p-6">
      <h2 className="text-2xl font-bold text-[var(--theme-primary)] mb-4 flex-shrink-0">
        Analytical Dashboard
      </h2>
      <div className="flex-grow text-white overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default DashboardCharts;
