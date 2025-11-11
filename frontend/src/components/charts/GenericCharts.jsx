import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { normalizeFilterResponse } from "../services/filterVizConfig";

const COLORS = ["#2563eb","#10b981","#f97316","#ef4444","#a78bfa","#06b6d4"];

const GenericCharts = ({ data, filterName }) => {
  if (!data) return null;
  const norm = normalizeFilterResponse(data.raw || data);

  // Timeseries -> line chart
  if (norm.time_series && norm.time_series.length) {
    const series = norm.time_series.map(s => ({ date: s.date, value: s.value }));
    return (
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#2563eb" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Categories -> bar + pie
  if (norm.categories && norm.categories.length) {
    const catData = norm.categories.map(c => ({ name: c.key, value: c.value }));
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="w-full h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={catData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={catData} dataKey="value" nameKey="name" innerRadius={20} outerRadius={60}>
                {catData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // Stats cards fallback
  const stats = norm.stats || {};
  const entries = Object.entries(stats).slice(0,6);
  if (entries.length) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {entries.map(([k,v]) => (
          <div key={k} className="bg-gray-800 p-3 rounded text-sm">
            <div className="text-xs text-gray-400">{k}</div>
            <div className="text-lg font-medium">{typeof v === "number" ? v.toLocaleString() : String(v)}</div>
          </div>
        ))}
      </div>
    );
  }

  return <div className="text-sm text-gray-400">No chartable data for {filterName}</div>;
};

export default GenericCharts;