// import React, { useState, useRef, useEffect } from 'react';
// import { useSelector } from 'react-redux';
// import Filters from './Filters';
// import { FaSearch } from 'react-icons/fa';
// import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';
// import L from 'leaflet';

// // Custom red marker for the searched location
// const redIcon = new L.Icon({
//   iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
//   iconSize: [32, 32],
//   iconAnchor: [16, 32],
// });

// // Blue marker icon for filter data markers (sample icon)
// const blueIcon = new L.Icon({
//   iconUrl: 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|0000FF',
//   iconSize: [32, 32],
//   iconAnchor: [16, 32],
// });

// // Component to update the map view when the location changes
// const MapUpdater = ({ position }) => {
//   const map = useMap();
//   if (position) {
//     map.setView(position, 13);
//   }
//   return null;
// };

// const MapSection = () => {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [suggestions, setSuggestions] = useState([]);
//   const [selectedPos, setSelectedPos] = useState(null);
//   const [filterData, setFilterData] = useState([]);

//   // Get selected filter from redux state (set using Filters.jsx)
//   const selectedFilter = useSelector((state) => state.dashboard.selectedFilter);

//   const mapRef = useRef();

//   // Fetch suggestions from OpenStreetMap Nominatim
//   const fetchSuggestions = async (query) => {
//     if (query.length < 2) {
//       setSuggestions([]);
//       return;
//     }
//     try {
//       const res = await fetch(
//         `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
//       );
//       const data = await res.json();
      
//       setSuggestions(data);
//     } catch (error) {
//       console.error('Error fetching suggestions:', error);
//     }
//   };

//   // Handle search from input or suggestion click
//   const handleSearch = async (place) => {
//     if (!place) return;
//     try {
//       const res = await fetch(
//         `https://nominatim.openstreetmap.org/search?format=json&q=${place}`
//       );
//       const data = await res.json();
//       if (data.length > 0) {
//         const { lat, lon, display_name } = data[0];
//         const coords = [parseFloat(lat), parseFloat(lon)];
//         setSelectedPos(coords);
//         setSuggestions([]);
//         setSearchQuery(display_name);
//       }
//     } catch (error) {
//       console.error('Error in search:', error);
//     }
//   };

//   // When a filter is selected and location is available, call Google Maps API
//   useEffect(() => {
//     const fetchFilterData = async () => {
//       if (!selectedPos || !selectedFilter) return;
//       const radius = 5000; // in meters (example)
//       const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
//       let endpoint = '';

//       // Build endpoint based on selected filter
//       if (selectedFilter === 'Air Quality Index') {
//         endpoint = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${selectedPos[0]},${selectedPos[1]}&radius=${radius}&keyword=air+quality&key=${apiKey}`;
//       } else if (selectedFilter === 'Population Density') {
//         endpoint = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${selectedPos[0]},${selectedPos[1]}&radius=${radius}&keyword=population+density&key=${apiKey}`;
//       } else if (selectedFilter === '% of GreenCover') {
//         endpoint = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${selectedPos[0]},${selectedPos[1]}&radius=${radius}&keyword=green+cover&key=${apiKey}`;
//       }
//       try {
//         const res = await fetch(endpoint);
//         const data = await res.json();
//         console.log("Fetched Data from API:", data.results);
//         // Assume the relevant data is in data.results
//         setFilterData(data.results || []);
//       } catch (error) {
//         console.error('Error fetching filter data:', error);
//       }
//     };

//     fetchFilterData();
//   }, [selectedPos, selectedFilter]);

//   // Handle enter key in search input
//   const handleKeyDown = (e) => {
//     if (e.key === 'Enter') {
//       handleSearch(searchQuery);
//     }
//   };

//   return (
//     <div className="relative w-full h-full bg-gray-200 overflow-hidden">
//       {/* Filters Overlay */}
//       <div className="absolute top-6 left-11 z-[1000]">
//         <Filters locationSelected={!!selectedPos} />
//       </div>

//       {/* Search Overlay */}
//       <div className="absolute top-6 right-1 z-[1000] w-72">
//         <div className="flex items-center bg-white/90 backdrop-blur-md rounded shadow border text-sm">
//           <FaSearch
//             className="mx-2 text-gray-500 cursor-pointer"
//             onClick={() => handleSearch(searchQuery)}
//           />
//           <input
//             type="text"
//             placeholder="Search or pin point location"
//             value={searchQuery}
//             onChange={(e) => {
//               setSearchQuery(e.target.value);
//               fetchSuggestions(e.target.value);
//             }}
//             onKeyDown={handleKeyDown}
//             className="w-full outline-none bg-transparent py-2"
//           />
//         </div>
//         {/* Suggestions */}
//         {suggestions.length > 0 && (
//           <ul className="bg-white shadow rounded mt-1 max-h-40 overflow-auto text-sm">
//             {suggestions.map((item, idx) => (
//               <li
//                 key={idx}
//                 className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
//                 onClick={() => handleSearch(item.display_name)}
//               >
//                 {item.display_name}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>

//       {/* Map */}
//       <MapContainer
//         center={[20.5937, 78.9629]} // Default center (India)
//         zoom={5}
//         scrollWheelZoom={true}
//         className="w-full h-[80%]"
//         whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
//       >
//         <TileLayer
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//           attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
//         />
//         <MapUpdater position={selectedPos} />
//         {selectedPos && (
//           <Marker position={selectedPos} icon={redIcon}>
//             <Popup>{searchQuery}</Popup>
//           </Marker>
//         )}
//         {/* Display filter data markers from Google Maps API call */}
//         {filterData &&
//           filterData.map((item, idx) => {
//             const lat = item.geometry?.location?.lat;
//             const lng = item.geometry?.location?.lng;
//             if (!lat || !lng) return null;
//             return (
//               <Marker key={idx} position={[lat, lng]} icon={blueIcon}>
//                 <Popup>
//                   {item.name}
//                   <br />
//                   {selectedFilter}
//                 </Popup>
//               </Marker>
//             );
//           })}
//       </MapContainer>
//     </div>
//   );
// };

// export default MapSection;

import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import Filters from "./Filters";
import { FaSearch } from "react-icons/fa";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "80vh",
};

const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629,
};

// Keep libraries as a constant outside the component
const libraries = ["places", "visualization"];

const MapSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  // selectedPos holds an object with lat and lng
  const [selectedPos, setSelectedPos] = useState(null);
  // For markers-based filter data (non–air-quality)
  const [filterData, setFilterData] = useState([]);
  const [map, setMap] = useState(null);
  // Reference to the heatmap overlay for Air Quality filter
  const heatmapRef = useRef(null);

  const selectedFilter = useSelector((state) => state.dashboard.selectedFilter);

  const fetchSuggestions = async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
      );
      const data = await res.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const handleSearch = async (place) => {
    if (!place) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${place}`
      );
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const coords = { lat: parseFloat(lat), lng: parseFloat(lon) };
        setSelectedPos(coords);
        setSuggestions([]);
        setSearchQuery(display_name);
        if (map) {
          map.panTo(coords);
          map.setZoom(13);
        }
      }
    } catch (error) {
      console.error("Error in search:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch(searchQuery);
    }
  };

  // This effect fetches filter data when a location is set and a filter is selected.
  useEffect(() => {
    if (!selectedPos || !selectedFilter || !map) return;

    // If Air Quality Index filter is selected, call the proper API then show a heatmap.
    if (selectedFilter === "Air Quality Index") {
      // Remove any previous overlay if needed
      if (map.overlayMapTypes.getLength() > 0) {
        map.overlayMapTypes.clear();
      }
      const tileUrlTemplate = `https://airquality.googleapis.com/v1/mapTypes/UAQI_RED_GREEN/heatmapTiles/{z}/{x}/{y}?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;
      const airQualityTileLayer = new google.maps.ImageMapType({
        getTileUrl: (coord, zoom) =>
          tileUrlTemplate
            .replace("{z}", String(zoom))
            .replace("{x}", String(coord.x))
            .replace("{y}", String(coord.y)),
        tileSize: new google.maps.Size(256,256),
        name: "Air Quality Heatmap",
        maxZoom: 16,
      });
      // Insert the tile overlay at index 0
      map.overlayMapTypes.insertAt(0, airQualityTileLayer);

      setFilterData([]);
    } else {
      // For other filters (like Population Density or % of GreenCover)
      const fetchFilterData = async () => {
        const radius = 5000;
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        let keyword = "";
        if (selectedFilter === "Population Density") {
          keyword = "population density";
        } else if (selectedFilter === "% of GreenCover") {
          keyword = "green cover";
        }
        if (keyword) {
          const endpoint = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${selectedPos.lat},${selectedPos.lng}&radius=${radius}&keyword=${encodeURIComponent(
            keyword
          )}&key=${apiKey}`;
          try {
            const res = await fetch(endpoint);
            const data = await res.json();
            console.log("Fetched Data from API:", data.results);
            setFilterData(data.results || []);
          } catch (error) {
            console.error("Error fetching filter data:", error);
          }
        }
      };
      fetchFilterData();
    }
  }, [selectedFilter, selectedPos, map]);

  return (
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
      libraries={libraries}
    >
      <div className="relative" style={{ height: "100%" }}>
        <div className="absolute top-20 left-2 z-[1000]">
          <Filters locationSelected={!!selectedPos} />
        </div>

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
              onKeyDown={handleKeyDown}
              className="w-full outline-none bg-transparent py-2"
            />
          </div>
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

        <GoogleMap
          mapContainerStyle={containerStyle}
          center={selectedPos || defaultCenter}
          zoom={selectedPos ? 13 : 5}
          onLoad={(mapInstance) => setMap(mapInstance)}
        >
          {selectedPos && (
            <>
              <Marker position={selectedPos} />
              <InfoWindow position={selectedPos}>
                <div>{searchQuery}</div>
              </InfoWindow>
            </>
          )}
          {/* For non-air-quality filters, show markers with InfoWindows */}
          {filterData.map((item, idx) => {
            const lat = item.geometry?.location?.lat;
            const lng = item.geometry?.location?.lng;
            if (!lat || !lng) return null;
            return (
              <Marker key={idx} position={{ lat, lng }}>
                <InfoWindow position={{ lat, lng }}>
                  <div>
                    {item.name}
                    <br />
                    {selectedFilter}
                  </div>
                </InfoWindow>
              </Marker>
            );
          })}
        </GoogleMap>
      </div>
    </LoadScript>
  );
};

export default MapSection;