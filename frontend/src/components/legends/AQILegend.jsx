import React from "react";

export default function AQILegend() {
  return (
    <div className="mb-4 text-sm ml-5">
      <p className="font-semibold">Legend (AQI):</p>
      <ul className="mt-3 space-y-1 text-gray-400">
        <li><span className="inline-block w-4 h-4 bg-[#00E676] mr-2"></span>Good (0-50)</li>
        <li><span className="inline-block w-4 h-4 bg-[#FFEB3B] mr-2"></span>Moderate (51-100)</li>
        <li><span className="inline-block w-4 h-4 bg-[#F4511E] mr-2"></span>Unhealthy Sensitive (101-150)</li>
        <li><span className="inline-block w-4 h-4 bg-[#b1201eff] mr-2"></span>Unhealthy (151-200)</li>
        <li><span className="inline-block w-4 h-4 bg-[#6A1B9A] mr-2"></span>Hazardous (301+)</li>
      </ul>
    </div>
  );
}
