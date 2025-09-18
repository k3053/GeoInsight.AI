import React from 'react';
import { useSelector } from 'react-redux';

const AQILegend = () => {
  const legendItems = [
    { label: "Good (0-50)", color: "#00e400" },
    { label: "Moderate (51-100)", color: "#ffff00" },
    { label: "Unhealthy for Sensitive Groups (101-150)", color: "#ff7e00" },
    { label: "Unhealthy (151-200)", color: "#ff0000" },
    { label: "Very Unhealthy (201-300)", color: "#8f3f97" },
    { label: "Hazardous (301-500)", color: "#7e0023" },
  ];

  return (
    <div className="p-4 bg-white shadow rounded mt-4">
      <h2 className="font-bold mb-2">AQI Legend</h2>
      <div className="grid grid-cols-2 gap-2">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center">
            <div
              className="w-6 h-6 mr-2 rounded"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DashboardCharts = () => {
  const selectedFilter = useSelector((state) => state.dashboard.selectedFilter);

  return (
    <div className="p-4">
      <span className="text-2xl text-[var(--geo-accent)] font-extrabold tracking-wide link-underline">
          Analytical Dashboard 
      </span>

      <div className="grid grid-cols-2 gap-4 mt-2">
        <div className="bg-white p-4 shadow rounded">Line Chart Placeholder</div>
        <div className="bg-white p-4 shadow rounded">Bar Chart Placeholder</div>
        <div className="bg-white p-4 shadow rounded">Pie Chart Placeholder</div>
        <div className="bg-white p-4 shadow rounded">Stats Placeholder</div>
      </div>
      {selectedFilter === "Air Quality Index" && <AQILegend />}
    </div>
  );
};

export default DashboardCharts;