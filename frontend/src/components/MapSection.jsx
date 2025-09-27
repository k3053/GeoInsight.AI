import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useSelector } from "react-redux";
import PopulationOverlay from "./map-overlays/PopulationOverlay";
import AQIOverlay from "./map-overlays/AQIOverlay";
import BuildingOverlay from "./map-overlays/BuildingOverlay";

// Helper component to recenter the map view
function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// Helper component to handle map clicks
function MapClickHandler({ setSelectedPos, onLocationSelect }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setSelectedPos([lat, lng]);
      onLocationSelect(); // Notify parent that a location has been selected
    },
  });
  return null;
}

// The API keys from the .env file
const VITE_API_NINJAS_KEY = import.meta.env.VITE_API_NINJAS_KEY;
const VITE_AQICN_TOKEN = import.meta.env.VITE_AQICN_TOKEN;

const MapSection = ({ searchQuery, searchTrigger, onLocationSelect }) => {
  const [selectedPos, setSelectedPos] = useState([21.1702, 72.8311]); // Default: Surat
  const selectedFilter = useSelector((state) => state.dashboard.selectedFilter);
  const [filterData, setFilterData] = useState(null);
  const [heatPoints, setHeatPoints] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- LOGIC MOVED FROM OLD SEARCH BAR ---
  // Effect to perform a search when the trigger changes
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery) return;
      setIsLoading(true);
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`);
        const data = await response.json();
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          setSelectedPos([parseFloat(lat), parseFloat(lon)]);
          onLocationSelect(); // Notify parent
        } else {
          alert("Location not found.");
        }
      } catch (error) {
        console.error("Search failed:", error);
        alert("Failed to perform search.");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (searchTrigger > 0) {
      performSearch();
    }
  }, [searchTrigger, searchQuery, onLocationSelect]);


  // --- RESTORED DATA FETCHING LOGIC ---
  // Effect to fetch data when filter or position changes
  useEffect(() => {
    if (!selectedFilter || !selectedPos) {
      setFilterData(null);
      setHeatPoints([]);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      let data = null;
      try {
        switch (selectedFilter) {
          case "Population Density": {
            const lat = selectedPos[0];
            const lng = selectedPos[1];
            const radius = 2000; // 5km radius
            const populationResponse = await fetch(`https://api.api-ninjas.com/v1/city?lat=${lat}&lon=${lng}&radius=${radius}`, {
              headers: { 'X-Api-Key': VITE_API_NINJAS_KEY }
            });
            const populationData = await populationResponse.json();
            const validPoints = Array.isArray(populationData)
              ? populationData
                  .filter(city =>
                    city.latitude !== undefined &&
                    city.longitude !== undefined &&
                    city.population !== undefined &&
                    !isNaN(Number(city.latitude)) &&
                    !isNaN(Number(city.longitude)) &&
                    !isNaN(Number(city.population))
                  )
                  .map(city => [
                    Number(city.latitude),
                    Number(city.longitude),
                    Math.max(1, Number(city.population) / 1000)
                  ])
              : [];
            const totalPopulation = validPoints.reduce((acc, pt) => acc + pt[2] * 1000, 0);
            data = { population: totalPopulation };
            setHeatPoints(validPoints);
            break;
          }
          case "Air Quality Index": {
            const aqiResponse = await fetch(`https://api.waqi.info/feed/geo:${selectedPos[0]};${selectedPos[1]}/?token=${VITE_AQICN_TOKEN}`);
            const aqiData = await aqiResponse.json();
            if (aqiData.status === "ok") {
              data = { aqi: aqiData.data.aqi };
            }
            break;
          }
          case "Number of Buildings": {
            const bounds = `${selectedPos[0] - 0.05},${selectedPos[1] - 0.05},${selectedPos[0] + 0.05},${selectedPos[1] + 0.05}`;
            const overpassQuery = `[out:json];(way["building"](${bounds}););out body;>;out skel qt;`;
            const overpassResponse = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`);
            const buildingsData = await overpassResponse.json();
            data = { totalBuildings: buildingsData.elements.length, points: buildingsData.elements };
            break;
          }
          default:
            break;
        }
      } catch (error) {
        console.error("Failed to fetch filter data:", error);
        alert(`Failed to fetch data for ${selectedFilter}.`);
      } finally {
        setFilterData(data || {}); // Always set, even if null
        window.dispatchEvent(new CustomEvent("mapStatsUpdated", { detail: { totals: data || {} } }));
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedFilter, selectedPos]);


  return (
    <div className="h-full w-full rounded-[1.5rem] overflow-hidden relative">
      {isLoading && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full z-10 animate-pulse">
          Loading...
        </div>
      )}
      <MapContainer
        center={selectedPos}
        zoom={13}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <ChangeMapView center={selectedPos} zoom={13} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        <MapClickHandler setSelectedPos={setSelectedPos} onLocationSelect={onLocationSelect} />
        <Marker position={selectedPos}>
          <Popup>{searchQuery || `Lat: ${selectedPos[0].toFixed(4)}, Lng: ${selectedPos[1].toFixed(4)}`}</Popup>
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
};

export default MapSection;

