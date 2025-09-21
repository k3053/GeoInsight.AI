import React from "react";

export default function PopulationLegend() {
  return (
    <div className="mb-4 text-sm">
      <p className="font-semibold">Legend (Population Density):</p>
      <ul className="space-y-1 text-gray-400">
        <li><span className="inline-block w-4 h-4 bg-green-500 mr-2"></span>Low (0-1k)</li>
        <li><span className="inline-block w-4 h-4 bg-yellow-400 mr-2"></span>Medium (1k-10k)</li>
        <li><span className="inline-block w-4 h-4 bg-orange-500 mr-2"></span>High (10k-15k)</li>
        <li><span className="inline-block w-4 h-4 bg-red-600 mr-2"></span>Overload (15k+)</li>
      </ul>
    </div>
  );
}
