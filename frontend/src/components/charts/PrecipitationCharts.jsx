import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const toSeries = (stats) => {
  const ts = stats?.totals?.precipitation?.time_series || stats?.insights?.time_series || stats?.time_series || [];
  return ts.map((p) => ({
    date: p.date || p.label,
    value: p.value != null ? p.value : p.precip_mm || p.precip || 0,
  }));
};

const PrecipitationChart = ({ stats }) => {
  const series = toSeries(stats);
  if (!series || series.length === 0) {
    return <div className="flex items-center justify-center h-48 text-[var(--theme-text-secondary)]">No precipitation data</div>;
  }

  return (
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
  );
};

export default PrecipitationChart;