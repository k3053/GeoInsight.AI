import React from "react";

export default function BuildingLegend() {
  return (
    <div className="mb-4 text-sm">
      <p className="font-semibold">Legend (Buildings):</p>
      <ul className="space-y-1 text-gray-400">
        <li><span className="inline-block w-4 h-4 bg-blue-500 mr-2"></span>Residential</li>
        <li><span className="inline-block w-4 h-4 bg-indigo-400 mr-2"></span>Commercial</li>
        <li><span className="inline-block w-4 h-4 bg-gray-500 mr-2"></span>Other</li>
      </ul>
    </div>
  );
}
