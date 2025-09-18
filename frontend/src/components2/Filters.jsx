import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFilter } from '../store/dashboardSlice'; // Action to set the filter in Redux
import { FaWind, FaUsers, FaLeaf } from 'react-icons/fa';

const Filters = ({ locationSelected }) => {
  const dispatch = useDispatch();
  const selectedFilter = useSelector((state) => state.dashboard.selectedFilter);
  
  const filters = [
    "Air Quality Index",
    "Population Density",
    "% of GreenCover"
  ];
  
  const icons = {
    "Air Quality Index": <FaWind />,
    "Population Density": <FaUsers />,
    "% of GreenCover": <FaLeaf />,
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
    <div className="flex space-x-2">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => handleClick(filter)}
          className={`flex items-center gap-1 px-3 py-2 rounded border transition-colors ${
            selectedFilter === filter 
              ? "bg-[var(--geo-accent)] text-black border-[var(--geo-accent)]"
              : "bg-white text-black hover:bg-blue-100"
          }`}
        >
          {icons[filter]} {filter}
        </button>
      ))}
    </div>
  );
};

export default Filters;