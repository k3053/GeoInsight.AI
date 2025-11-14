import React from "react";

export default function AmenityLegend() {
  return (
    <div className="mb-4 text-lg">
      <p className="font-semibold mb-4">Legend (Amenities):</p>
      <ul className="space-y-1 text-gray-400">
        <li><span className="inline-block w-4 h-4 bg-[#FFA726] mr-2"></span>Petrol Pump</li>
        <li><span className="inline-block w-4 h-4 bg-[#F4511E] mr-2"></span>School</li>
        <li><span className="inline-block w-4 h-4 bg-[#90CAF9] mr-2"></span>Bank</li>
        <li><span className="inline-block w-4 h-4 bg-[#66BB6A] mr-2"></span>Hospital</li>
        <li><span className="inline-block w-4 h-4 bg-[#42A5F5] mr-2"></span>Food</li>
      </ul>
    </div>
  );
}
