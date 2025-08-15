// src/components/MapSection.js
// You can replace this map image URL with your actual map tile server or a static image.
const MAP_IMAGE_URL = 'http://googleusercontent.com/file_content/0';

export default function MapSection() {
  return (
    <div className="relative flex-1">
      {/* Filters Button */}
      <button className="absolute top-4 left-4 bg-white text-black px-4 py-2 rounded-md shadow-lg z-10 font-semibold">
        Filters
      </button>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search or pin point location"
        className="absolute top-4 left-28 bg-black text-white px-4 py-2 rounded-md shadow-lg z-10 w-72 focus:outline-none"
      />

      {/* Map Display */}
      <div className="w-full h-full bg-gray-200">
        <img
          src={MAP_IMAGE_URL}
          alt="Heatmap of a geographical location"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Pin Marker - Centered */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        {/* You can use an SVG or a custom pin image here */}
        <span className="text-4xl drop-shadow-lg">📍</span>
      </div>
    </div>
  );
}