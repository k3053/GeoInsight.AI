import React from "react";
import {
  ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis,
  LineChart, Line, CartesianGrid
} from "recharts";

const COLORS = ["#42A5F5", "#90CAF9", "#66BB6A", "#FFA726", "#F4511E", "#E53935", "#8E24AA", "#3949AB"];

export default function PopulationCharts({ stats = {} }) {
  // current population number (accept stats.data or fallback)
  const current = Number(stats.data ?? stats.totals?.population ?? 0) || 0;
  // max scale (allow override from stats.max, else default 50000)
  const maxScale = Number(stats.max ?? 50000) || 50000;
  const percent = Math.min(100, (current / maxScale) * 100);

  // Pie data: current % and remaining
  const pieData = [
    { name: `Current (${current})`, value: current, color: COLORS[0] },
    { name: `Remaining to ${maxScale}`, value: Math.max(0, maxScale - current), color: "#eeeeee" },
  ];

  // Build years series from stats.years (ignore null/undefined)
  const yearsSeries = Array.isArray(stats?.years)
    ? stats.years // support array shape if provided
    : stats?.years && typeof stats.years === "object"
    ? Object.entries(stats.years)
        .filter(([, v]) => v != null && !Number.isNaN(Number(v)))
        .map(([year, value]) => ({ year: String(year), value: Number(value) }))
        .sort((a, b) => Number(a.year) - Number(b.year))
    : [];

  // Summary text
  const summaryText = stats?.summary ? String(stats.summary) : null;

  return (
    <div className="card-glass p-4 space-y-6">
      <h2 className="text-[var(--geo-accent)] font-semibold mb-2">Population Analysis</h2>

      {summaryText && (
        <div className="p-3 bg-gray-800 text-sm rounded">
          <div className="font-semibold mb-1">Summary</div>
          <div className="text-sm">{summaryText}</div>
        </div>
      )}

      {/* Pie (percentage of max) */}
      <div className="p-3 rounded-lg bg-black/30 w-full">
        <h3 className="text-sm font-semibold mb-3">Population % of Max ({maxScale})</h3>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Legend verticalAlign="top" height={36} />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={80}
                label={({ name }) => (name.startsWith("Current") ? `${percent.toFixed(1)}%` : null)}
              >
                {pieData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${v}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-sm p-2 bg-gray-800 rounded">
          Current: <b>{current}</b> ({percent.toFixed(1)}% of {maxScale})
        </div>
      </div>

      {/* Bar chart: categories */}
      <div className="p-3 rounded-lg bg-black/30 w-full">
        <h3 className="text-sm font-semibold mb-3">Population Category</h3>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            {Array.isArray(stats?.categories) && stats.categories.length > 0 ? (
              <BarChart data={stats.categories} margin={{ left: 10, right: 10, top: 10, bottom: 40 }}>
                <XAxis dataKey="label" tick={{ fontSize: 12 }} angle={-25} textAnchor="end" interval={0} />
                <YAxis unit="%" />
                <Tooltip />
                <Bar dataKey="percent">
                  {stats.categories.map((c, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <BarChart data={[{ label: "Current", percent }]} margin={{ left: 10, right: 10, top: 10, bottom: 40 }}>
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis unit="%" domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="percent">
                  <Cell fill={COLORS[0]} />
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line chart: stats.years */}
      <div className="p-3 rounded-lg bg-black/30 w-full">
        <h3 className="text-sm font-semibold mb-3">Population by Year</h3>
        {yearsSeries.length > 0 ? (
          <div style={{ width: "100%", height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yearsSeries} margin={{ left: 10, right: 10, top: 10, bottom: 40 }}>
                <CartesianGrid stroke="#444" strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis domain={["dataMin", "dataMax"]} />
                <Tooltip formatter={(v) => `${v} people`} />
                <Line type="monotone" dataKey="value" stroke="#82ca9d" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-sm text-[var(--theme-text-secondary)]">
            No yearly population data available
          </div>
        )}
      </div>
    </div>
  );
}
