import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

/* Helpers to estimate total area from bbox (if provided) */
const R = 6371000; // earth radius in meters
const toRad = d => (d * Math.PI) / 180;
function haversineMeters(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function estimateAreaFromBbox(bbox) {
  // bbox: [minLat, minLon, maxLat, maxLon] or {bbox: [...]}
  if (!Array.isArray(bbox) || bbox.length < 4) return null;
  const [minLat, minLon, maxLat, maxLon] = bbox;
  const height = haversineMeters(minLat, minLon, maxLat, minLon);
  const width = haversineMeters(minLat, minLon, minLat, maxLon);
  if (height > 0 && width > 0 && isFinite(height) && isFinite(width)) {
    return height * width; // m^2
  }
  return null;
}

/* Convert stats.years object -> series array sorted by year, ignoring null values */
const yearsToSeries = (yearsObj) => {
  if (!yearsObj) return [];
  if (Array.isArray(yearsObj)) return yearsObj;
  return Object.entries(yearsObj)
    .filter(([, v]) => v != null && !Number.isNaN(Number(v)))
    .map(([year, value]) => ({ year: String(year), value: Number(value) }))
    .sort((a, b) => Number(a.year) - Number(b.year));
};

/* Main component */
export default function GreenCoverCharts({ stats = {} }) {
  const greenRaw = stats?.data ?? stats?.totals?.green_cover?.value ?? null;
  const greenArea = Number(greenRaw) || 0;

  // find total area if provided, try several common fields
  let totalArea =
    Number(stats?.total_area_m2 ?? stats?.totals?.area_m2 ?? stats?.area_m2 ?? stats?.total_area) || null;

  // try bbox-based estimate if no explicit total area
  if (!totalArea) {
    const bbox = stats?.bbox ?? stats?.bounds ?? stats?.extent ?? stats?.totals?.bbox;
    if (bbox) totalArea = estimateAreaFromBbox(bbox);
  }

  const percentage = totalArea && totalArea > 0 ? (greenArea / totalArea) * 100 : null;

  const pieData = percentage != null
    ? [
        { name: "Green", value: greenArea, color: "#10b981" },
        { name: "Other", value: Math.max(0, totalArea - greenArea), color: "#e5e7eb" }
      ]
    : [{ name: "Green", value: greenArea, color: "#10b981" }];

  const yearsSeries = yearsToSeries(stats?.years ?? stats?.totals?.green_cover?.years ?? stats?.totals?.green_cover?.time_series);

  const summaryText = stats?.summary ? String(stats.summary) : null;

  return (
    <div className="space-y-6">
      {summaryText && (
        <div className="p-3 bg-gray-800 text-sm rounded">
          <div className="font-semibold mb-1">Summary</div>
          <div>{summaryText}</div>
        </div>
      )}

      <div className="p-3 bg-gray-800 rounded">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xs text-gray-400">Current green cover</div>
            <div className="text-2xl font-semibold">
              {greenArea ? `${Number(greenArea).toLocaleString()} m²` : "N/A"}
            </div>
            <div className="text-sm text-gray-300 mt-1">
              {percentage != null ? `${percentage.toFixed(2)}% of total area` : "Total area not available"}
            </div>
          </div>

          <div style={{ width: 220, height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Legend verticalAlign="top" height={24} />
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={40}
                  outerRadius={70}
                  labelLine={false}
                  label={({ name, percent: p }) =>
                    name === "Green" ? `${percentage != null ? percentage.toFixed(1) + "%" : ""}` : null
                  }
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => (v != null ? `${Number(v).toLocaleString()} m²` : v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="p-3 bg-gray-800 rounded">
        <div className="font-semibold mb-2">Green Cover Trend</div>
        {yearsSeries && yearsSeries.length > 0 ? (
          <div style={{ width: "100%", height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yearsSeries} margin={{ top: 8, right: 20, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={yearsSeries[0].year ? "year" : "date"} tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => (v != null ? `${v}%` : v)} />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-sm text-[var(--theme-text-secondary)]">
            No yearly green-cover data available
          </div>
        )}
      </div>
    </div>
  );
}