import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Search } from "lucide-react";
import { FaEllipsisH } from "react-icons/fa";
import Header from "./Header";
import Filters from "./Filters";

// Component to update map view on selected position change
function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  // selectedPos as an array [lat, lng] (default center is India)
  const [selectedPos, setSelectedPos] = useState([20.5937, 78.9629]);

  // Fetch autosuggestions from Nominatim
  const fetchSuggestions = async (q) => {
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${q}`
      );
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  // Called when search button is pressed (optional manual search)
  const handleSearch = () => {
    console.log("Searching for:", searchQuery);
  };

  // Handle selection of suggestion
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.display_name);
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);
    setSelectedPos([lat, lon]);
    setSuggestions([]);
  };

  return (
    <div className="relative h-full">
      {/* Navbar Container */}
      <div className="absolute top-0 left-0 w-full z-20">
        <Header />
        <div className="bg-[#111]/95 backdrop-blur-md shadow-md flex flex-col px-4 py-2 gap-2">
          {/* Top Row: Search Bar and Toolbar Buttons */}
          <div className="flex items-center justify-between gap-4">
            {/* Left Section: Search Bar */}
            <div className="relative flex items-center ml-[45px] max-w-md flex-1">
              <input
                type="text"
                placeholder="Search location..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchSuggestions(e.target.value);
                }}
                className="flex-1 text-[14px] bg-transparent border border-gray-600 text-white rounded-l px-3 py-2 focus:outline-none"
              />
              <button
                onClick={handleSearch}
                className="bg-[var(--geo-accent)] text-black px-2 py-2 rounded-r flex items-center gap-1 font-medium"
              >
                <Search size={22} />
              </button>

              {/* Suggestions Dropdown */}
              {suggestions.length > 0 && (
                <ul className="absolute top-full left-0 w-full bg-white text-black rounded-b shadow-md max-h-40 overflow-y-auto z-30">
                  {suggestions.map((item, idx) => (
                    <li
                      key={idx}
                      onClick={() => handleSuggestionClick(item)}
                      className="px-3 py-2 hover:bg-gray-200 cursor-pointer text-[13px]"
                    >
                      {item.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Toolbar Buttons */}
            <div className="flex items-center gap-2">
              <Filters locationSelected={true} />
              <button className="px-3 py-2 rounded flex items-center gap-1 bg-gray-800 text-white hover:bg-gray-700">
                <FaEllipsisH/>
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
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <Marker position={selectedPos}>
          <Popup>{searchQuery || "Selected Location"}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}