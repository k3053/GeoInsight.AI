import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFilter } from '../store/dashboardSlice';
import {
  FaWind,
  FaMountain,
  FaLeaf,
  FaBuilding,
  FaSun,
  FaImage,
  FaMapMarkedAlt,
  FaRoad,
  FaEllipsisV
} from 'react-icons/fa';

const Filters = ({ locationSelected }) => {
  const dispatch = useDispatch();
  const selectedFilter = useSelector((state) => state.dashboard.selectedFilter);
  const [showMore, setShowMore] = useState(false);
  const dropdownRef = useRef(null);

  // Expanded filters list
  const filters = [
    "Air Quality Index",
    "Weather Forecast",
    "Number of Buildings",
    "Elevation",
    "Solar",
    "Imagery Insights",
    "Places Insights",
    "Roads Management Insights"
  ];

  // Map filter names to icons
  const icons = {
    "Air Quality Index": <FaWind />,
    "Weather Forecast": <FaLeaf />,
    "Number of Buildings": <FaBuilding />,
    "Elevation": <FaMountain />,
    "Solar": <FaSun />,
    "Imagery Insights": <FaImage />,
    "Places Insights": <FaMapMarkedAlt />,
    "Roads Management Insights": <FaRoad />
  };

  const handleClick = (filter) => {
    if (!locationSelected) {
      alert("Please select a location first.");
      return;
    }
    if (selectedFilter === filter) {
      dispatch(setFilter(null));
    } else {
      dispatch(setFilter(filter));
    }
    setShowMore(false);
  };

  // Extract primary filters & additional filters
  const primaryFilters = filters.slice(0, 3);
  const additionalFilters = filters.slice(3);

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
        {primaryFilters.map((filter) => (
          <button
            key={filter}
            onClick={() => handleClick(filter)}
            className={`px-3 py-2 rounded flex items-center gap-1 ${
              selectedFilter === filter
                ? "bg-[#64ffda] text-black"
                : "bg-gray-800 text-white hover:bg-gray-700"
            }`}
          >
            {icons[filter]} {filter}
          </button>
        ))}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowMore(!showMore)}
            className="px-3 py-2 rounded flex items-center gap-1 bg-gray-800 text-white hover:bg-gray-700"
          >
            <FaEllipsisV />
          </button>
          {showMore && (
            <div className="absolute right-0 mt-2 w-56 bg-gray-800 text-white rounded shadow-lg z-10">
              <div className="py-1 flex flex-col">
                {additionalFilters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => handleClick(filter)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-700 ${
                      selectedFilter === filter ? "bg-[#64ffda] text-black" : ""
                    }`}
                  >
                    {icons[filter]} {filter}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Filters;