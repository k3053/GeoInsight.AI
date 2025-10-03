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
import ElevationOverlay from "./map-overlays/ElevationOverlay";
import AQIOverlay from "./map-overlays/AQIOverlay";
import BuildingOverlay from "./map-overlays/BuildingOverlay";
import OSMBuildingsOverlay from "./map-overlays/OSMBuildingsOverlay";
import WeatherOverlay from "./map-overlays/WeatherOverlay";
import { FaUtensils, FaHospital, FaSchool, FaUniversity, FaTree } from "react-icons/fa";
import { renderToStaticMarkup } from "react-dom/server";
import L from "leaflet";

const categoryIcons = {
  restaurant: <FaUtensils color="red" size={18} />,
  // hospital: <FaHospital color="blue" size={18} />,
  school: <FaSchool color="green" size={18} />,
  college: <FaUniversity color="orange" size={18} />,
  university: <FaUniversity color="orange" size={18} />,
  park: <FaTree color="teal" size={18} />,
};

const getDivIcon = (category) => {
  const iconComponent = categoryIcons[category] || <FaUtensils color="gray" size={18} />;
  return L.divIcon({
    html: renderToStaticMarkup(iconComponent),
    className: "",   // remove default styles
    iconSize: [20, 20],
    popupAnchor: [0, -10],
  });
};

// Fix for default marker icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Helper component to recenter the map view
function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom);
  }, [center, zoom, map]);
  return null;
}

const MapClickHandler = ({ onLocationSelect, setPosition }) => {
  useMapEvents({
    click(e) {
  console.log("Map clicked! Coordinates:", e.latlng);     
  const newPos = [e.latlng.lat, e.latlng.lng];
  setPosition(newPos);                                  // This still updates the marker's position.
  onLocationSelect({  lat: e.latlng.lat, lng: e.latlng.lng}); // ✅ This now sends the exact coordinates to the parent.
},
  });
  return null;
};

// The API keys from the .env file
const VITE_API_WEATHER_KEY = import.meta.env.VITE_API_WEATHER_KEY;
// const VITE_API_NINJAS_KEY = import.meta.env.VITE_API_NINJAS_KEY;
const VITE_AQICN_TOKEN = import.meta.env.VITE_AQICN_TOKEN;
const VITE_API_WEATHER_FORECAST = import.meta.env.VITE_API_WEATHER_FORECAST;

const MapSection = ({ searchQuery, searchTrigger, onLocationSelect, locationFromChat }) => {
  // const [selectedPos, setSelectedPos] = useState([21.1702, 72.8311]); // Default: Surat
  const selectedFilter = useSelector((state) => state.dashboard.selectedFilter);
  const [position, setPosition] = useState([21.1702, 72.8311]); 
  const [mapCenter, setMapCenter] = useState([21.1702, 72.8311]);
  const [filterData, setFilterData] = useState(null);
  const [heatPoints, setHeatPoints] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);

    useEffect(() => {
      if (!position) return;
      const fetchNearbyPlaces = async () => {
        try {
          const [lat, lon] = position;
          const radius = 5000; // 5 km

          const query = `
            [out:json];
            (
              node["amenity"~"restaurant|school|college|university|park"](around:${radius},${lat},${lon});
              way["amenity"~"restaurant|school|college|university|park"](around:${radius},${lat},${lon});
              relation["amenity"~"restaurant|school|college|university|park"](around:${radius},${lat},${lon});
            );
            out center;
          `;

          const response = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            body: query,
          });

          const data = await response.json();
          if (data && data.elements) {
            setNearbyPlaces(data.elements);
          }
        } catch (error) {
          console.error("Failed to fetch nearby places:", error);
        }
      };

      fetchNearbyPlaces();
    }, [position]);

    useEffect(() => {
    if (searchTrigger > 0 && searchQuery) {
      const fetchCoords = async () => {
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
          const data = await response.json();
          if (data && data.length > 0) {
            const { lat, lon } = data[0];
            const newPos = [parseFloat(lat), parseFloat(lon)];
            setPosition(newPos);
            setMapCenter(newPos);

            // ✅ RESTORED FUNCTIONALITY: Call the prop after a successful search
            onLocationSelect({ lat: newPos[0], lng: newPos[1] });
          }
        } catch (error) {
          console.error("Failed to fetch coordinates for search query", error);
        }
      };
      fetchCoords();
    }
  }, [searchTrigger, searchQuery]);

  // Data fetching effect for selectedFilter and selectedPos.
  useEffect(() => {
    if (!selectedFilter || !position) {
      // setFilterData(null);
      // setHeatPoints([]);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      const lat = position[0];
      const lng = position[1];
      let data = null;
      try {
        switch (selectedFilter) {
          // Inside your data fetching effect's switch-case for "Weather Forecast":
          case "Weather Forecast": {
            const lat = position[0];
            const lon = position[1];
            // Call the API Ninjas weather endpoint
            const weatherResponse = await fetch(
              `https://api.api-ninjas.com/v1/weather?lat=${lat}&lon=${lon}`,
              { headers: { 'X-Api-Key': VITE_API_WEATHER_KEY } }
            );
            const weatherData1 = await weatherResponse.json();
            console.log("Weather data from API Ninjas: ", weatherData1);

            // Call the WeatherAPI.com forecast endpoint using the provided key
            const weatherApiUrl = `http://api.weatherapi.com/v1/forecast.json?key=${VITE_API_WEATHER_FORECAST}&q=${lat},${lon}&days=1`;
            const weatherApiResponse = await fetch(weatherApiUrl);
            const weatherData2 = await weatherApiResponse.json();
            // console.log("Weather data from WeatherAPI.com: ", weatherData2);

            // Merge responses (WeatherAPI data may have forecast & history while API Ninjas gives current conditions)
            const mergedWeatherData = { ...weatherData1, ...weatherData2 };
            console.log("Weather data: ", mergedWeatherData);
            data = { weather: mergedWeatherData };
            break;
          }
          case "Elevation": {
            // Example: fetch elevation for a few points around the selected position
            const locations = [
              `${lat},${lng}`,
              `${lat+0.01},${lng+0.01}`,
              `${lat-0.01},${lng-0.01}`
            ].join('|');
            const elevResponse = await fetch(
              `https://api.open-elevation.com/api/v1/lookup?locations=${locations}`
            );
            const elevData = await elevResponse.json();
            console.log("Elevation data===>>> \n", elevData);
            // Prepare points for heatmap overlay
            let heatPoints = [];
            if (elevData.results) {
              heatPoints = elevData.results.map(r => [r.latitude, r.longitude, r.elevation]);
            }
            data = { elevations: elevData.results, heatPoints };
            break;
          }
          case "Air Quality Index": {
            const aqiResponse = await fetch(
              `https://api.waqi.info/feed/geo:${position[0]};${position[1]}/?token=${VITE_AQICN_TOKEN}`
            );
            const aqiData = await aqiResponse.json();
            console.log("AQI data===>>> \n", aqiData);
            if (aqiData.status === "ok") {
              data = { aqi: aqiData };
            }
            break;
          }
          case "Number of Buildings": {
              const lat = position[0];
              const lng = position[1];
              if (lat == null || lng == null) {
                console.error("Missing coordinates for buildings API call");
                break;
              }
              const buildingsResponse = await fetch(`http://127.0.0.1:8000/data/buildings?latitude=${lat}&longitude=${lng}`);
              const buildingsData = await buildingsResponse.json();
              console.log("Buildings data from local API ===>>> \n", buildingsData);
              data = { totalBuildings: buildingsData.totalBuildings, points: buildingsData };
              break;
            }     
          default:
            break;
        }
      } catch (error) {
        console.error("Failed to fetch filter data:", error);
        alert(`Failed to fetch data for ${selectedFilter}.`);
      } finally {
        setFilterData(data || {});
        window.dispatchEvent(new CustomEvent("mapStatsUpdated", { detail: { totals: data || {} } }));
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedFilter, position]);

  // EFFECT for Chat -> Map communication
  useEffect(() => {
    if (locationFromChat && locationFromChat.latitude && locationFromChat.longitude) {
      const newPos = [locationFromChat.latitude, locationFromChat.longitude];
      setPosition(newPos);
      setMapCenter(newPos);
    }
  }, [locationFromChat]);

  return (
    <div className="h-full w-full rounded-[1.5rem] overflow-hidden relative">
      {isLoading && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full z-10 animate-pulse">
          Loading...
        </div>
      )}
      <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%", zIndex: 0 }} whenCreated={map => { window.leafletMap = map; }}>
            <ChangeMapView center={mapCenter} zoom={13} />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
            <MapClickHandler onLocationSelect={onLocationSelect} setPosition={setPosition}/>
            <Marker position={position}>
              <Popup>
                {searchQuery || `Lat: ${position[0].toFixed(4)}, Lng: ${position[1].toFixed(4)}`}
              </Popup>
            </Marker>

        {nearbyPlaces.map((place, idx) => {
          const category = place.tags?.amenity;
          return (
            <Marker
              key={idx}
              position={[
                place.lat || place.center?.lat,
                place.lon || place.center?.lon,
              ]}
              icon={getDivIcon(category)}
            >
              <Popup>
                <strong>{place.tags?.name || "Unnamed Place"}</strong><br />
                {category}
              </Popup>
            </Marker>
          );
        })}
        
        {/* Modular overlays */}
        {selectedFilter === "Elevation" && (
          <ElevationOverlay selectedPos={position} heatPoints={filterData?.heatPoints} />
        )}
        {selectedFilter === "Air Quality Index" && (
          <AQIOverlay selectedPos={position} filterData={filterData} />
        )}
        
        {selectedFilter === 'Number of Buildings' && 
          <BuildingOverlay selectedPos={position}/>
        }
        {selectedFilter === "Weather Forecast" && (
          <>
            <WeatherOverlay selectedPos={position} weatherData={filterData} />
          </>
        )}
        {/* {selectedFilter === "3D Buildings" && (
          <OSMBuildingsOverlay selectedPos={position} />
        )} */}
      </MapContainer>
    </div>
  );
};

export default MapSection;