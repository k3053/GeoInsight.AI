/**
 * Small config + normalizer for filter visualization.
 * Normalize backend-insights/raw into a predictable shape:
 * { points: [{lat,lon,value,label}], geojson, time_series: [{date,value}], categories: [{key,value}], stats: {k:v}, raw }
 */

export const FILTER_VIZ = {
  "Land Use/Land Cover": { viz: "categories_or_geojson", valueKey: "land_use" },
  "Building Segmentation": { viz: "geojson", valueKey: "segment" },
  "Public Infrastructure": { viz: "points", valueKey: "type" },
  "Disaster Volunerability": { viz: "heat_or_points", valueKey: "vulnerability_score" },
  "Urban Sprawl Analysis": { viz: "timeseries_or_stats", valueKey: "sprawl_index" },
  "Water Quality Index": { viz: "timeseries_or_points", valueKey: "wqi" },
  "Crime Rate/Safety Index": { viz: "categories_or_timeseries", valueKey: "crime_rate" },
  "Property Value Trends": { viz: "timeseries", valueKey: "price" },
  "Distance to Nearest Amenities": { viz: "points", valueKey: "distance_m" },
  "Property Development Potential": { viz: "stats_or_points", valueKey: "score" },
  "Land Price": { viz: "timeseries_or_stats", valueKey: "price" }
};

function _toNum(v) {
  if (v == null) return null;
  if (typeof v === "number") return v;
  const s = String(v).replace(/[^\d.-]/g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

export function normalizeFilterResponse(rawResp = {}) {
  const out = {
    raw: rawResp,
    points: [],
    geojson: null,
    time_series: [],
    categories: [],
    stats: {}
  };

  const insights = rawResp.insights || rawResp.parsed_insights || rawResp.data || rawResp;

  // time_series
  const ts = insights?.time_series || insights?.timeseries || insights?.trend;
  if (Array.isArray(ts) && ts.length) {
    out.time_series = ts.map((p) => ({
      date: p.date || p.label || p.timestamp,
      value: _toNum(p.value ?? p.v ?? p.price ?? p.wqi ?? p.sprawl_index ?? p.score)
    }));
  }

  // geojson
  if (insights?.geojson) {
    out.geojson = insights.geojson;
  } else if (insights?.features) {
    out.geojson = { type: "FeatureCollection", features: insights.features };
  }

  // points
  const pts = insights?.points || insights?.stations || insights?.locations || insights?.data_points || [];
  if (Array.isArray(pts) && pts.length) {
    out.points = pts.map((p) => ({
      lat: p.lat ?? p.latitude ?? p.center?.latitude,
      lon: p.lon ?? p.longitude ?? p.center?.longitude,
      value: _toNum(p.value ?? p.v ?? p.wqi ?? p.price ?? p.distance_m ?? p.score ?? p.vulnerability_score),
      label: p.name ?? p.id ?? p.type ?? p.category
    })).filter(pt => pt.lat != null && pt.lon != null);
  }

  // categories / breakdowns
  if (insights?.breakdowns && typeof insights.breakdowns === "object") {
    out.categories = Object.entries(insights.breakdowns).map(([k,v]) => ({ key: k, value: _toNum(v) }));
  } else if (Array.isArray(insights?.categories)) {
    out.categories = insights.categories.map(c => ({ key: c.key ?? c.name, value: _toNum(c.value) }));
  }

  // stats: filter_specific or numeric_values
  if (insights?.filter_specific && typeof insights.filter_specific === "object") {
    out.stats = { ...out.stats, ...insights.filter_specific };
  }
  if (insights?.numeric_values && Array.isArray(insights.numeric_values)) {
    out.stats.numeric_values = insights.numeric_values;
  }
  // fallback top-level numeric keys
  ["wqi","crime_rate","average_price","median_price","land_price","sprawl_index","vulnerability_score","development_score"].forEach(k=>{
    if (insights?.[k] != null && out.stats[k] == null) out.stats[k] = _toNum(insights[k]);
  });

  return out;
}