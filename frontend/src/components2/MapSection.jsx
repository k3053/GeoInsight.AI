import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Search } from "lucide-react";
import { FaEllipsisH } from "react-icons/fa";
import { useSelector } from "react-redux";
import Header from "./Header";
import Filters from "./Filters";
import PopulationOverlay from "./map-overlays/PopulationOverlay";
import AQIOverlay from "./map-overlays/AQIOverlay";
import BuildingOverlay from "./map-overlays/BuildingOverlay";

/**
 * ChangeMapView: re-centers the map when center changes
 */
function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

/** Component to handle map clicks */
function MapClickHandler({ setSelectedPos, setSearchQuery }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setSelectedPos([lat, lng]);
      setSearchQuery("");
    },
  });
  return null;
}

export default function MapSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPos, setSelectedPos] = useState([28.7041, 77.1025]);
  const [filterData, setFilterData] = useState(null);
  const [heatPoints, setHeatPoints] = useState([]);
  const selectedFilter = useSelector((state) => state.dashboard.selectedFilter);
  const cacheRef = useRef({}); // cache for search queries
  const debounceRef = useRef(null);

  // env keys 
  const API_NINJAS_KEY = import.meta.env.VITE_API_NINJAS_KEY; // used for population
  const AQICN_TOKEN = import.meta.env.VITE_AQICN_TOKEN; // used for AQI

  // nominatim suggestions with debounce + cache
  const fetchSuggestions = async (q) => {
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }

    // return from cache if available
    if (cacheRef.current[q]) {
      setSuggestions(cacheRef.current[q]);
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      cacheRef.current[q] = data; // cache it
      setSuggestions(data);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  // debounce search input
  useEffect(() => {
    if (!searchQuery) {
      setSuggestions([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 500); // adjust debounce delay here

    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  // Utility: reverse-geocode to get nearest city name (used for API Ninjas)
  const reverseGeocodeCity = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
      );
      const json = await res.json();
      // try to get city/town/village
      return json.address.city || json.address.town || json.address.village || json.address.county || null;
    } catch (err) {
      console.warn("Reverse geocode failed:", err);
      return null;
    }
  };

  // Overpass API query for buildings inside radius (no API key needed)
  const fetchBuildingsOverpass = async (lat, lon, radiusMeters = 5000) => {
    // Overpass QL: fetch building ways/nodes in radius
    const query = `[out:json][timeout:25];
      (
        node["building"](around:${radiusMeters},${lat},${lon});
        way["building"](around:${radiusMeters},${lat},${lon});
        relation["building"](around:${radiusMeters},${lat},${lon});
      );
      out center;`;
    const url = "https://overpass-api.de/api/interpreter";
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      });
      const json = await res.json();
      return json.elements || [];
    } catch (err) {
      console.error("Overpass error:", err);
      return [];
    }
  };

  // Main effect: when filter or location changes, call the right API and compute overlays
  useEffect(() => {
    if (!selectedPos || !selectedFilter) return;
    const [lat, lng] = selectedPos;
    const radius = 5000; // 5km

    const doPopulation = async () => {
      // 1) reverse-geocode to get city
      const city = await reverseGeocodeCity(lat, lng);
      if (!city) {
        console.warn("Could not get city name for population lookup.");
        setFilterData(null);
        setHeatPoints([]);
        return;
      }
      // 2) call API Ninjas population endpoint
      // API usage: VITE_API_NINJAS_KEY from env
      // URL: https://api.api-ninjas.com/v1/city?name=<CITY>  (Note: API Ninjas has different endpoints; adapt if needed)
      // We'll call the population endpoint if available. If API differs, adapt accordingly.
      const url = `https://api.api-ninjas.com/v1/population?city=${encodeURIComponent(city)}`;
      try {
        const res = await fetch(url, {
          headers: { "X-Api-Key": API_NINJAS_KEY || "" },
        });
        if (!res.ok) {
          console.error("Population API failed", res.status, await res.text());
          setFilterData(null);
          setHeatPoints([]);
          return;
        }
        const json = await res.json();
        // api-ninjas returns something like { city: '...', population: 12345, year: 2020 } (depending on API version)
        const population = json.population || (json[0] && json[0].population) || 0;
        // create heat points across 5 km radius using population as base weight
        const baseWeight = Math.min(1.0, population / 50000); // normalize
        const points = generateHeatPoints([lat, lng], baseWeight, 180, radius);
        setHeatPoints(points);
        setFilterData({ city, population, raw: json });

        // compute simple breakdown for chart: low/med/high buckets by population
        const buckets = {
          low: population <= 1000 ? 1 : 0,
          med: population > 1000 && population <= 10000 ? 1 : 0,
          high: population > 10000 && population <= 15000 ? 1 : 0,
          overload: population > 15000 ? 1 : 0,
        };
        window.dispatchEvent(
          new CustomEvent("mapStatsUpdated", {
            detail: {
              filter: "Population Density",
              totals: { population, count: 1 },
              buckets,
              heatPointsCount: points.length,
            },
          })
        );
      } catch (err) {
        console.error("Population API error:", err);
        setFilterData(null);
        setHeatPoints([]);
      }
    };

    const doAQI = async () => {
      // Call AQICN with token set as VITE_AQICN_TOKEN in env.
      // Endpoint: https://api.waqi.info/feed/geo:{lat};{lon}/?token=YOUR_TOKEN
      try {
        const url = `https://api.waqi.info/feed/geo:${lat};${lng}/?token=${AQICN_TOKEN || ""}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.status !== "ok") {
          console.warn("AQI API returned non-ok:", json);
          setFilterData(null);
          window.dispatchEvent(
            new CustomEvent("mapStatsUpdated", {
              detail: { filter: "Air Quality Index", totals: {}, buckets: {}, aqi: null },
            })
          );
          return;
        }
        const aqi = json.data.aqi;
        setFilterData({ raw: json, aqi });
        window.dispatchEvent(
          new CustomEvent("mapStatsUpdated", {
            detail: {
              filter: "Air Quality Index",
              totals: { aqi },
              buckets: { aqi },
            },
          })
        );
      } catch (err) {
        console.error("AQI fetch failed:", err);
        setFilterData(null);
      }
    };

    const doBuildings = async () => {
      try {
        const elements = await fetchBuildingsOverpass(lat, lng, radius);
        // Overpass returns nodes/ways/relations; many have a center or lat/lon
        const points = elements
          .map((el) => {
            if (el.type === "node") return { lat: el.lat, lon: el.lon, tags: el.tags || {} };
            if (el.type === "way" || el.type === "relation") {
              if (el.center) return { lat: el.center.lat, lon: el.center.lon, tags: el.tags || {} };
            }
            return null;
          })
          .filter(Boolean);
        setFilterData({ raw: elements, points });
        window.dispatchEvent(
          new CustomEvent("mapStatsUpdated", {
            detail: {
              filter: "Number of Buildings",
              totals: { totalBuildings: points.length },
              buckets: { totalBuildings: points.length },
            },
          })
        );
      } catch (err) {
        console.error("Buildings fetch failed:", err);
        setFilterData(null);
      }
    };

    // call the appropriate job
    if (selectedFilter === "Population Density") {
      doPopulation();
    } else if (selectedFilter === "Air Quality Index") {
      doAQI();
    } else if (selectedFilter === "Number of Buildings") {
      doBuildings();
    }
  }, [selectedFilter, selectedPos]);

  return (
    <div className="relative h-full">
      {/* Header + Filters */}
      <div className="absolute top-0 left-0 w-full z-20">
        <Header />
        <div className="bg-[#111]/95 backdrop-blur-md shadow-md flex flex-col px-4 py-2 gap-2">
          <div className="flex items-center justify-between gap-4">
            {/* Search input */}
            <div className="relative flex items-center ml-[45px] max-w-md flex-1">
              <input
                type="text"
                placeholder="Search location..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  // fetchSuggestions(e.target.value);
                }}
                className="flex-1 text-[14px] bg-transparent border border-gray-600 text-white rounded-l px-3 py-2 focus:outline-none"
              />
              <button
                onClick={() => console.log("Searching for:", searchQuery)}
                className="bg-[var(--geo-accent)] text-black px-2 py-2 rounded-r flex items-center gap-1 font-medium"
              >
                <Search size={22} />
              </button>
              {suggestions.length > 0 && (
                <ul className="absolute top-full left-0 w-full bg-white text-black rounded-b shadow-md max-h-40 overflow-y-auto z-30">
                  {suggestions.map((item, idx) => (
                    <li
                      key={idx}
                      onClick={() => {
                        setSearchQuery(item.display_name);
                        setSelectedPos([+item.lat, +item.lon]);
                        setSuggestions([]);
                      }}
                      className="px-3 py-2 hover:bg-gray-200 cursor-pointer text-[13px]"
                    >
                      {item.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <Filters locationSelected={true} />
              <button className="px-3 py-2 rounded flex items-center gap-1 bg-gray-800 text-white hover:bg-gray-700">
                <FaEllipsisH />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={selectedPos}
        zoom={13}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <ChangeMapView center={selectedPos} zoom={13} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        <MapClickHandler setSelectedPos={setSelectedPos} setSearchQuery={setSearchQuery} />
        <Marker position={selectedPos}>
          <Popup>{searchQuery || "Selected Location"}</Popup>
        </Marker>

        {/* Modular overlays */}
        {selectedFilter === "Population Density" && (
          <PopulationOverlay selectedPos={selectedPos} heatPoints={heatPoints} />
        )}
        {selectedFilter === "Air Quality Index" && (
          <AQIOverlay selectedPos={selectedPos} filterData={filterData} />
        )}
        {selectedFilter === "Number of Buildings" && (
          <BuildingOverlay selectedPos={selectedPos} filterData={filterData} />
        )}
      </MapContainer>
    </div>
  );
}
