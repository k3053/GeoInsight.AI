import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend
} from "recharts";

const toSeries = (stats) => {
  const ts = stats?.totals?.precipitation?.time_series || stats?.insights?.time_series || stats?.time_series || [];
  return ts
    .map((p) => ({
      date: p.date || p.label,
      value: p.value != null ? p.value : p.precip_mm ?? p.precip ?? null,
    }))
    .filter(item => item.value != null && !Number.isNaN(Number(item.value)));
};

const toYearsSeries = (yearsObj) => {
  if (!yearsObj || typeof yearsObj !== "object") return [];
  return Object.entries(yearsObj)
    .map(([year, value]) => ({ year: String(year), value: value }))
    .filter(item => item.value != null && !Number.isNaN(Number(item.value)))
    .map(item => ({ ...item, value: Number(item.value) }))
    .sort((a, b) => Number(a.year) - Number(b.year));
};

export default function PrecipitationChart({ stats }) {
  const series = toSeries(stats);
  const yearsSeries = toYearsSeries(stats?.years);
  const summary = stats?.summary;

  if ((!series || series.length === 0) && yearsSeries.length === 0 && !summary) {
    return <div className="flex items-center justify-center h-48 text-[var(--theme-text-secondary)]">No precipitation data</div>;
  }

  return (
    <div className="w-full space-y-4">
      {summary && (
        <div className="p-3 bg-card rounded text-sm">
          <div className="font-semibold mb-1">Precipitation Summary</div>
          <div>{String(summary)}</div>
        </div>
      )}

      {yearsSeries.length > 0 && (
        <div className="w-full" style={{ height: 300 }}>
          <div className="font-semibold text-sm mb-1">Precipitation by Year</div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={yearsSeries} margin={{ top: 8, right: 20, left: 10, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => (v != null ? `${v}` : v)} />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#0284c7" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {series && series.length > 0 && (
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis label={{ value: "mm", angle: -90, position: "insideLeft" }} />
              <Tooltip formatter={(v) => `${v} mm`} />
              <Bar dataKey="value" fill="#0284c7" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}