import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

/**
 * GreenCoverChart - shows trend of percent green cover over time
 */
const toSeries = (stats) => {
  const ts = stats?.totals?.green_cover?.time_series || stats?.insights?.time_series || stats?.time_series || [];
  return ts.map((p) => ({
    date: p.date || p.label,
    value: p.value != null ? p.value : p.green_percent ?? p.percent_green,
  }));
};

const GreenCoverChart = ({ stats }) => {
  const series = toSeries(stats);
  if (!series || series.length === 0) {
    return <div className="flex items-center justify-center h-48 text-[var(--theme-text-secondary)]">No green-cover data</div>;
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <Tooltip formatter={(v) => (v != null ? `${v}%` : v)} />
          <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GreenCoverChart;