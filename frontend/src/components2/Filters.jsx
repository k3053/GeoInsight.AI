import { FaUsers, FaLeaf, FaWind } from "react-icons/fa";
import { setFilter } from '../store/dashboardSlice';
import store from '../store/dashboardSlice';

const Filters = () => {
  const filters = store.getState().dashboard.filters;
  const icons = {
    "Air Quality Index": <FaWind />,
    "Population Density": <FaUsers />,
    "% of GreenCover": <FaLeaf />,
  };

  return (
    <div className="flex flex-row gap-2">
      {filters.map((filter) => (
        <button
          key={filter}
          className="flex items-center gap-2 p-2 bg-white hover:bg-[var(--geo-accent)] cursor-pointer rounded"
          onClick={() => store.dispatch(setFilter(filter))}
        >
          {icons[filter]} {filter}
        </button>
      ))}
    </div>
  );
};

export default Filters;