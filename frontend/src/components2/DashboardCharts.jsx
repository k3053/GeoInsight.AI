import React from "react";
import ChatSection from "./ChatSection";

const DashboardCharts = () => {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-bold text-[var(--geo-accent)] mb-4">
        Analytical Dashboard
      </h2>
      {/* Charts Grid (scrollable if necessary) */}
      <div className="flex-grow text-white overflow-y-auto">
        <div className="grid grid-cols-1 gap-4">
          <div className="card-glass p-4">Line Chart Placeholder</div>
          <div className="card-glass p-4">Bar Chart Placeholder</div>
          <div className="card-glass p-4">Pie Chart Placeholder</div>
          <div className="card-glass p-4">Stats Placeholder</div>
        </div>
      </div>
      {/* ChatSection at the bottom */}
      <ChatSection />
    </div>
  );
};

export default DashboardCharts;