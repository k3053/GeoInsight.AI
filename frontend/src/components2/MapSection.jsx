import React, { useState, useRef } from 'react';
import Filters from './Filters';
import { FaSearch } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom red marker
const redIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Component to move map when location changes
const MapUpdater = ({ position }) => {
  const map = useMap();
  if (position) {
    map.setView(position, 13);
  }
  return null;
};

const MapSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPos, setSelectedPos] = useState(null);

  const fetchSuggestions = async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
    );
    const data = await res.json();
    setSuggestions(data);
  };

  const handleSearch = async (place) => {
    if (!place) return;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${place}`
    );
    const data = await res.json();
    if (data.length > 0) {
      const { lat, lon } = data[0];
      const coords = [parseFloat(lat), parseFloat(lon)];
      setSelectedPos(coords);
      setSuggestions([]);
      setSearchQuery(place);
    }
  };

  return (
    <div className="relative w-full h-full bg-gray-200 overflow-hidden">
      {/* Filters Overlay */}
      <div className="absolute top-6 left-11 z-[1000]">
        <Filters />
      </div>

      {/* Search Overlay */}
      <div className="absolute top-6 right-1 z-[1000] w-72">
        <div className="flex items-center bg-white/90 backdrop-blur-md rounded shadow border text-sm">
          <FaSearch
            className="mx-2 text-gray-500 cursor-pointer"
            onClick={() => handleSearch(searchQuery)}
          />
          <input
            type="text"
            placeholder="Search or pin point location"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              fetchSuggestions(e.target.value);
            }}
            className="w-full outline-none bg-transparent py-2"
          />
        </div>
        {/* Suggestions */}
        {suggestions.length > 0 && (
          <ul className="bg-white shadow rounded mt-1 max-h-40 overflow-auto text-sm">
            {suggestions.map((item, idx) => (
              <li
                key={idx}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSearch(item.display_name)}
              >
                {item.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map */}
      <MapContainer
        center={[20.5937, 78.9629]} // India default
        zoom={5}
        scrollWheelZoom={true}
        className="w-full h-[80%]"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapUpdater position={selectedPos} />
        {selectedPos && (
          <Marker position={selectedPos} icon={redIcon}>
            <Popup>{searchQuery}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default MapSection;
