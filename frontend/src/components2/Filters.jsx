import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFilter } from '../store/dashboardSlice'; // Action to set the filter in Redux
import { FaWind, FaUsers, FaLeaf, FaBuilding } from 'react-icons/fa';

const Filters = ({ locationSelected }) => {
  const dispatch = useDispatch();
  const selectedFilter = useSelector((state) => state.dashboard.selectedFilter);
  
  const filters = [
    "Air Quality Index",
    "Population Density",
    "Number of Buildings"
  ];
  
  const icons = {
    "Air Quality Index": <FaWind />,
    "Population Density": <FaUsers />,
    "Number of Buildings": <FaBuilding />,
  };

  const handleClick = (filter) => {
    if (!locationSelected) {
      alert("Please select a location first.");
      return;
    }
    // Toggle the filter: deselect it if it's already selected.
    if (selectedFilter === filter) {
      dispatch(setFilter(null));
    } else {
      dispatch(setFilter(filter));
    }
  };

  return (
    <div className="flex space-x-0 text-[14px]">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => handleClick(filter)}
          className={`ml-2 px-1 py-2 rounded flex items-center gap-1 ${
            selectedFilter === filter
              ? "bg-[#64ffda] text-black"
              : "bg-gray-800 text-white hover:bg-gray-700"
          }`}
        >
          {icons[filter]} {filter}
        </button>
      ))}
    </div>
  );
};

export default Filters;
