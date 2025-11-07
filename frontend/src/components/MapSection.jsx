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
import SolarOverlay from './map-overlays/SolarOverlay';
import WeatherOverlay from "./map-overlays/WeatherOverlay";
import { fetchNearbyPlaces, fetchFilterData } from './services/mapServices';
import { FaUtensils, FaSchool, FaUniversity, FaTree } from "react-icons/fa";
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
  const iconComponent = categoryIcons[category] || undefined;
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
  onLocationSelect({  lat: e.latlng.lat, lng: e.latlng.lng}); // This now sends the exact coordinates to the parent.
},
  });
  return null;
};

const MapSection = ({ searchQuery, searchTrigger, onLocationSelect, locationFromChat }) => {
  // const [selectedPos, setSelectedPos] = useState([21.1702, 72.8311]); // Default: Surat
  const selectedFilter = useSelector((state) => state.dashboard.selectedFilter);
  const [position, setPosition] = useState([21.1702, 72.8311]); 
  const [mapCenter, setMapCenter] = useState([21.1702, 72.8311]);
  const [filterData, setFilterData] = useState(null);
  // const [heatPoints, setHeatPoints] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);

    useEffect(() => {
      if (!position) return;
      const getNearbyPlaces = async () => {
        try {
          const [lat, lon] = position;
          const places = await fetchNearbyPlaces(lat, lon);
          setNearbyPlaces(places);
        } catch (error) {
          console.error('Error:', error);
        }
      };

      getNearbyPlaces();
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
    if (!selectedFilter || !position) return;

    const getFilterData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchFilterData(selectedFilter, position);
        setFilterData(data);
        // Dispatch event for dashboard
        window.dispatchEvent(
          new CustomEvent('mapStatsUpdated', { detail: { totals: data } })
        );
      } catch (error) {
        console.error('Error fetching filter data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getFilterData();
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

        {nearbyPlaces?.map((place, idx) => {
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
        {selectedFilter === "Solar" && (
          <SolarOverlay selectedPos={position} solarData={filterData?.solar} />
        )}
        {/* {selectedFilter === "3D Buildings" && (
          <OSMBuildingsOverlay selectedPos={position} />
        )} */}
      </MapContainer>
    </div>
  );
};

export default MapSection;