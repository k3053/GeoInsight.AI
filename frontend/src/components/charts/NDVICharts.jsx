import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const toSeries = (stats) => {
  // accept multiple shapes: stats.totals.ndvi.time_series or insights.time_series
  const ts = stats?.totals?.ndvi?.time_series || stats?.insights?.time_series || stats?.time_series || [];
  return ts.map((p) => ({
    date: p.date || p.label || p.timestamp,
    value: p.value != null ? p.value : p.ndvi,
  }));
};

const NDVIChart = ({ stats }) => {
  const series = toSeries(stats);
  if (!series || series.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-[var(--theme-text-secondary)]">
        No NDVI time series available
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis domain={[ -1, 1 ]} tickFormatter={(v)=>v.toFixed(2)} />
          <Tooltip formatter={(v) => (v != null ? v.toFixed(3) : v)} />
          <Area type="monotone" dataKey="value" stroke="#16a34a" fill="#16a34a" fillOpacity={0.2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default NDVIChart;