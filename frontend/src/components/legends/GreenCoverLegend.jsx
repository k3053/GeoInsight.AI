/**
 * Displays only current green cover amount and computed percentage.
 * Accepts:
 *  - green as a number (area in m²) OR
 *  - green as an object with possible keys:
 *      green_area, canopy_area_m2, area_m2, value
 *      total_area_m2, total_area, area_total
 *      bbox / bounds: [minLat, minLon, maxLat, maxLon]  (used to estimate total area)
 */

// const metersPerKm = 1000;
// const earthRadius = 6371000; // meters

export default function GreenCoverLegend({ green }) {
  const greenArea = green?.data; 

  // find green area (m²)
  // const greenArea =
  //   Number(raw.green_area ?? raw.canopy_area_m2 ?? raw.area_m2 ?? raw.value ?? raw.green ?? raw.canopy_area) ||
  //   0;

  // find total area (m²) from explicit fields or estimate from bbox/bounds
  let totalArea = 6500000;

  const percentage = (greenArea/totalArea) * 100;

  return (
    <div className="mb-4 p-3 bg-gray-800 rounded text-lg">
      <h3 className="font-semibold mb-2">Green Cover</h3>

      <div className="grid grid-cols-1 gap-2">
        <div>
          <p className="text-md text-gray-400">Current green cover</p>
          <div className="text-lg font-medium">
            {greenArea ? `${Number(greenArea).toLocaleString()} m²` : "N/A"}
          </div>
        </div>

        <div>
          <p className="text-md text-gray-400">Green cover (%)</p>
          <div className="text-lg font-medium">
            {percentage != null ? `${percentage.toFixed(2)}%` : "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
}