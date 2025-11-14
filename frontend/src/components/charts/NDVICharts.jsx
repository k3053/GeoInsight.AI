import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend
} from "recharts";

const toSeries = (stats) => {
  const ts = stats?.totals?.ndvi?.time_series || stats?.insights?.time_series || stats?.time_series || [];
  return ts.map((p) => ({
    date: p.date || p.label || p.timestamp,
    value: p.value != null ? p.value : p.ndvi,
  }));
};

const toYearsSeries = (yearsObj) => {
  if (!yearsObj || typeof yearsObj !== "object") return [];
  return Object.entries(yearsObj)
    .map(([year, value]) => ({ year: String(year), value: value }))
    .sort((a, b) => Number(a.year) - Number(b.year));
};

const renderSummary = (summary) => {
  if (!summary) return null;
  if (typeof summary === "string") {
    return <div className="text-sm text-[var(--theme-text-secondary)]">{summary}</div>;
  }
  if (typeof summary === "object") {
    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        {Object.entries(summary).map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <span className="text-gray-300">{k}:</span>
            <span className="font-medium">{String(v)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// compute dynamic y-domain with padding to "zoom" into data
const getYDomain = (data) => {
  if (!data || data.length === 0) return [-1, 1];
  const vals = data.map(d => Number(d.value)).filter(v => !isNaN(v));
  if (!vals.length) return [-1, 1];
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const pad = (max - min) * 0.12 || 0.05; // small padding if flat data
  return [min - pad, max + pad];
};

const NDVIChart = ({ stats }) => {
  console.log("NDVI Stats:", stats);
  const series = toSeries(stats);
  const yearsSeries = toYearsSeries(stats?.years);
  const seriesYDomain = getYDomain(series);
  const yearsYDomain = getYDomain(yearsSeries);

  return (
    <div className="w-full space-y-4">
      {stats?.summary && (
        <div className="p-3 bg-card rounded">
          <div className="font-semibold mb-2">NDVI Summary</div>
          {renderSummary(stats.summary)}
        </div>
      )}

      {yearsSeries && yearsSeries.length > 0 ? (
        // larger height for better readability and tighter y-domain (zoom)
        <div className="w-full" style={{ height: 420 }}>
          <div className="font-semibold text-sm mb-1">NDVI by Year</div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={yearsSeries} margin={{ top: 8, right: 20, left: 10, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} interval={0} />
              <YAxis domain={yearsYDomain} tickFormatter={(v) => v.toFixed(3)} />
              <Tooltip formatter={(v) => (v != null ? Number(v).toFixed(3) : v)} />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : series && series.length > 0 ? (
        // increased height and dynamic y-domain to zoom into the series
        <div className="w-full" style={{ height: 620 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 20, left: 10, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
              <YAxis domain={seriesYDomain} tickFormatter={(v) => v.toFixed(3)} />
              <Tooltip formatter={(v) => (v != null ? Number(v).toFixed(3) : v)} />
              <Area type="monotone" dataKey="value" stroke="#16a34a" fill="#16a34a" fillOpacity={0.18} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 text-[var(--theme-text-secondary)]">
          No NDVI time series or yearly data available
        </div>
      )}
    </div>
  );
};

export default NDVIChart;