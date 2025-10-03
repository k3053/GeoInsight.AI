import React from "react";

const intervals = [
  { label: "0-100 m", color: "#30bcf3ff" },
  { label: "101-200 m", color: "#444f91ff" },
  { label: "201-300 m", color: "#41ff3bff" },
  { label: "301-400 m", color: "#fffb26ff" },
  { label: "401+ m", color: "#f49e1eff" },
];

export default function ElevationLegend() {
  return (
    <div className="mb-4 text-lg">
      <p className="font-semibold ">Elevation Legend:</p>
      <ul className="mt-2 flex flex-col space-x-4">
        {intervals.map((item, idx) => (
          <li key={idx} className="flex items-center">
            <span
              className="inline-block w-4 h-4 mr-2"
              style={{ backgroundColor: item.color }}
            ></span>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}