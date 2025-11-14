// Filters.jsx
import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFilter } from '../store/dashboardSlice';
import {
  FaWind, FaCloudSun, FaBuilding, FaMountain, FaSun, FaLeaf, FaCloudRain, FaUsers, FaTree, FaMapMarkedAlt, FaDrawPolygon, FaRoad, FaExclamationTriangle, FaCity, FaTint, FaShieldAlt, FaDollarSign, FaStore, FaChartLine, FaLandmark, FaEllipsisV 
} from 'react-icons/fa';

const ROLE_FILTER_MAP = {
  'Citizen': [
    "Air Quality Index",
    "Weather Forecast",
    "Water Quality Index",
    "Crime Rate/Safety Index",
    "Number of Buildings",
    "Distance to Nearest Amenities",
    "Solar"
  ],
  'Urban Planner': [
    "Air Quality Index",
    "Land Use/Land Cover",
    "Number of Buildings",
    // "Land Use/Land Cover",
    "Vegetation Index(NDVI)",
    "Public Infrastructure",
    "Urban Sprawl Analysis",
  ],
  'Real Estate': [
    "Number of Buildings",
    "Elevation",
    "Solar",
    "Vegetation Index(NDVI)",
    "Property Value Trends",
    "Property Development Potential",
    "Land Price",
    "Land Use/Land Cover",
    "Distance to Nearest Amenities",
  ],
  // Researcher gets all filters
  'Researcher': [
    "Air Quality Index",
    "Weather Forecast",
    "Number of Buildings",
    "Elevation",
    "Solar",
    "Vegetation Index(NDVI)",
    "Precipitation Levels",
    "Temporal Population Density",
    "Temporal Green Cover Analysis",
    "Land Use/Land Cover",
    // "Building Segmentation",
    "Public Infrastructure",
    "Disaster Volunerability",
    "Urban Sprawl Analysis",
    "Water Quality Index",
    "Crime Rate/Safety Index",
    "Property Value Trends",
    "Distance to Nearest Amenities",
    "Property Development Potential",
    "Land Price"
  ]
};

// Map filter names to icons (Remains the same)
const icons = {
  "Air Quality Index": <FaWind />,
  "Weather Forecast": <FaCloudSun />,
  "Number of Buildings": <FaBuilding />,
  "Elevation": <FaMountain />,
  "Solar": <FaSun />,
  "Vegetation Index(NDVI)": <FaLeaf />,
  "Precipitation Levels": <FaCloudRain />,
  "Temporal Population Density": <FaUsers />,
  "Temporal Green Cover Analysis": <FaTree />,
  "Land Use/Land Cover": <FaMapMarkedAlt />,
  "Building Segmentation": <FaDrawPolygon />,
  "Public Infrastructure": <FaRoad />,
  "Disaster Volunerability": <FaExclamationTriangle />,
  "Urban Sprawl Analysis": <FaCity />,
  "Water Quality Index": <FaTint />,
  "Crime Rate/Safety Index": <FaShieldAlt />,
  "Property Value Trends": <FaDollarSign />,
  "Distance to Nearest Amenities": <FaStore />,
  "Property Development Potential": <FaChartLine />,
  "Land Price": <FaLandmark />
};

// 💡 Accept userRole as a prop
const Filters = ({ locationSelected, userRole }) => {
  const dispatch = useDispatch();
  const selectedFilter = useSelector((state) => state.dashboard.selectedFilter);
  const [showMore, setShowMore] = useState(false);
  const dropdownRef = useRef(null);

  const availableFilters = ROLE_FILTER_MAP[userRole] || ROLE_FILTER_MAP['Citizen']; 
  
  const primaryFilters = availableFilters.slice(0, 3);
  const additionalFilters = availableFilters.slice(3);

  const handleClick = (filter) => {
    if (!locationSelected) {
      // alert("Please select a location first.");
      console.log("Please select a location first.");
      return;
    }
    
    if (!availableFilters.includes(filter)) {
      console.log(`Access Denied. The '${filter}' filter is not available for the '${userRole}' role.`);
      if (selectedFilter === filter) {
             dispatch(setFilter(null));
        }
        return;
    }
    
    if (selectedFilter === filter) {
      dispatch(setFilter(null));
    } else {
      dispatch(setFilter(filter));
    }
    setShowMore(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMore(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <div className="flex flex-col">
      <div className="flex space-x-2 text-[14px] items-center">
        {/* Render Primary Filters based on role */}
        {primaryFilters.map((filter) => (
          <button
            key={filter}
            onClick={() => handleClick(filter)}
            className={`px-3 py-2 rounded flex items-center gap-1 ${
              selectedFilter === filter
                ? "bg-[#64ffda] text-black"
                : "bg-gray-800 text-white hover:bg-gray-700"
            }`}
            title={filter}
          >
            {icons[filter]} {filter}
          </button>
        ))}
        {/* Render More button only if there are additional filters */}
        {additionalFilters.length > 0 && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowMore(!showMore)}
              className="px-3 py-2 rounded flex items-center gap-1 bg-gray-800 text-white hover:bg-gray-700"
            >
              <FaEllipsisV /> More
            </button>
            {showMore && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-800 text-white rounded shadow-lg z-10">
                <div className="py-1 flex flex-col">
                  {/* Render Additional Filters based on role */}
                  {additionalFilters.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => handleClick(filter)}
                      className={`w-full text-left text-sm px-3 py-2 flex items-center gap-2 transition-colors duration-100 ${
                        selectedFilter === filter 
                          ? "bg-[#64ffda] text-black" 
                          : "hover:bg-gray-700 hover:text-white" // Explicitly ensure hover text color is stable
                      }`}
                      title={filter}
                    >
                      {/* {icons[filter]} */}
                      <span className="w-4 h-4 flex items-center justify-center">
                         {icons[filter]} 
                      </span>
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Display current role for clarity */}
      <div className='text-xs text-gray-400 mt-1 ml-2'>
        Current Role: <span className='text-[var(--theme-primary)] font-semibold'>{userRole}</span>
      </div>
    </div>
  );
};

export default Filters;