import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { normalizeFilterResponse } from "../services/filterVizConfig";

const COLORS = ["#2563eb","#10b981","#f97316","#ef4444","#a78bfa","#06b6d4"];

const toYearsSeries = (yearsObj) => {
  if (!yearsObj) return [];
  if (Array.isArray(yearsObj)) return yearsObj;
  return Object.entries(yearsObj)
    .filter(([, v]) => v != null && !Number.isNaN(Number(v)))
    .map(([year, value]) => ({ year: String(year), value: Number(value) }))
    .sort((a, b) => Number(a.year) - Number(b.year));
};

const getCurrentFromStats = (stats) => {
  if (!stats) return null;
  const v = stats.data ?? stats.current ?? stats.value ?? stats.total ?? null;
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (typeof v === "string" && !Number.isNaN(Number(v))) return Number(v);
  if (typeof v === "object") {
    if (v.totalBuildings != null) return v.totalBuildings;
    if (v.count != null) return v.count;
    if (v.population != null) return v.population;
    if (v.green_area != null) return v.green_area;
    if (Array.isArray(v.points)) return v.points.length;
  }
  return null;
};

const GenericCharts = ({ data, filterName }) => {
  if (!data) return null;

  // Accept both normalized payloads and direct stats object:
  const stats = data; // per contract stats.data, stats.summary, stats.years
  const norm = normalizeFilterResponse(data.raw || data);

  // Show summary if available
  const summaryText = stats?.summary ?? norm?.summary ?? null;
  const filterInfo = stats?.info_of_filter ?? norm?.info_of_filter ?? null;

  // Years series takes precedence (line chart)
  const yearsSeries = toYearsSeries(stats?.years ?? norm?.years ?? norm?.stats?.years);

  // Time series fallback from normalized response
  const ts = (norm.time_series && norm.time_series.length) ? norm.time_series.map(s => ({ date: s.date, value: s.value })) : [];

  // Categories fallback
  const categories = norm.categories && norm.categories.length ? norm.categories.map(c => ({ name: c.key || c.label, value: c.value })) : null;

  // Current single metric
  const currentValue = getCurrentFromStats(stats) ?? getCurrentFromStats(norm);

  // If summary present, render at top then charts below
  if (!yearsSeries.length && !ts.length && !categories && currentValue == null) {
    return (
      <div className="p-3">
        {summaryText && (
          <div className="mb-3 bg-gray-800 p-3 rounded text-lg">
            <div className="font-medium">Summary</div>
            <div className="mt-1">{String(summaryText)}</div>
          </div>
        )}
        <div className="text-sm text-gray-400">No chartable data for {filterName}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-3">

      {filterInfo && (
        <div className="bg-gray-800 p-3 rounded text-lg">
          <div className="font-medium mb-1">Filter Information</div>
          <div>{String(filterInfo)}</div>
        </div>
      )}
      
      {summaryText && (
        <div className="bg-gray-800 p-3 rounded text-lg">
          <div className="font-medium mb-1">Summary</div>
          <div>{String(summaryText)}</div>
        </div>
      )}

      {yearsSeries.length > 0 && (
        <div className="w-full" style={{ height: 340 }}>
          <div className="font-semibold mb-2">By Year</div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={yearsSeries} margin={{ top: 8, right: 20, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {ts.length > 0 && yearsSeries.length <= 0 && (
        <div className="w-full" style={{ height: 300 }}>
          <div className="font-semibold mb-2">Time Series</div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#10b981" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {categories && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="w-full" style={{ height: 300 }}>
            <div className="font-semibold mb-2">Categories (Bar)</div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" interval={0} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#f97316">
                  {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full" style={{ height: 300 }}>
            <div className="font-semibold mb-2">Categories (Pie)</div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categories} dataKey="value" nameKey="name" innerRadius={30} outerRadius={80} label>
                  {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* {currentValue != null && !categories && !ts.length && !yearsSeries.length && (
        <div className="bg-gray-800 p-3 rounded text-sm">
          <div className="font-medium mb-1">Current</div>
          <div className="text-2xl font-semibold">{Number(currentValue).toLocaleString()}</div>
        </div>
      )}

      {currentValue != null && !categories && (yearsSeries.length || ts.length) && (
        <div className="bg-gray-800 p-3 rounded text-sm">
          <div className="font-medium mb-1">Current</div>
          <div className="text-xl font-semibold">{Number(currentValue).toLocaleString()}</div>
        </div>
      )} */}
    </div>
  );
};

export default GenericCharts;