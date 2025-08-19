import React from 'react';
import { FaUsers, FaLeaf, FaWind } from "react-icons/fa";
import { useDispatch, useSelector } from 'react-redux';
import { setFilter } from '../store/dashboardSlice';

const Filters = ({ locationSelected }) => {
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.dashboard.filters);
  
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
    dispatch(setFilter(filter));
  };

  return (
    <div className="flex flex-row gap-2">
      {filters.map((filter) => (
        <button
          key={filter}
          disabled={!locationSelected}
          onClick={() => handleClick(filter)}
          className={`flex items-center gap-2 p-2 bg-white rounded ${
            locationSelected 
            ? "hover:bg-[var(--geo-accent)] cursor-pointer"
            : "opacity-90 cursor-not-allowed"
          }`}
        >
          {icons[filter]} {filter}
        </button>
      ))}
    </div>
  );
};

export default Filters;