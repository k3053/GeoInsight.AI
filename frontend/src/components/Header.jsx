import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from "lucide-react";
import Filters from './Filters';
import { LogOut } from 'lucide-react';
import { MdMoreVert } from 'react-icons/md';
import { auth } from '../firebaseConfig';

const Header = ({ searchQuery, setSearchQuery, onSearch, locationSelected, handleLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const cacheRef = useRef({}); // cache for search queries
  const debounceRef = useRef(null);
  const user = auth.currentUser;

  // nominatim suggestions with debounce + cache
  const fetchSuggestions = async (q) => {
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }

    // return from cache if available
    if (cacheRef.current[q]) {
      setSuggestions(cacheRef.current[q]);
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      cacheRef.current[q] = data; // cache it
      setSuggestions(data);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  // debounce search input
  useEffect(() => {
    if (!searchQuery) {
      setSuggestions([]);
      setActiveSuggestion(-1);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 500); // adjust debounce delay here

    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const handleKeyDown = (e) => {
    // If there are suggestions and none is selected, do not trigger search on Enter.
    if (e.key === 'Enter') {
      if (suggestions.length > 0 && activeSuggestion === -1) {
        // Prevent search so user can select from the suggestion list.
        e.preventDefault();
        return;
      }
    }

    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        setActiveSuggestion((prev) => Math.min(prev + 1, suggestions.length - 1));
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        setActiveSuggestion((prev) => Math.max(prev - 1, 0));
        e.preventDefault();
      } else if (e.key === 'Enter') {
        if (activeSuggestion >= 0 && activeSuggestion < suggestions.length) {
          const item = suggestions[activeSuggestion];
          setSearchQuery(item.display_name);
          setSuggestions([]);
          setActiveSuggestion(-1);
          // Pinpoint on map by triggering search
          onSearch();
        } 
      }
    } else if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <header 
      className="bg-[var(--theme-surface)] border-x border-b border-[var(--theme-border)] rounded-b-[1.5rem] 
                 p-4 flex flex-col lg:flex-row items-center justify-between gap-2 lg:gap-0 flex-shrink-0
                 shadow-[0_8px_32px_rgba(0,0,0,0.4)] mx-0 relative"
    >
      {/* Left: Title & Menu */}
      <div className="flex gap-0 items-center">
        {/* Menu Icon */}
        <button
          className="mr-4 p-2 rounded hover:bg-gray-700 focus:outline-none"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Open menu"
        >
          <span className="block w-6 h-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect y="5" width="24" height="2" rx="1" fill="#fff" />
              <rect y="11" width="24" height="2" rx="1" fill="#fff" />
              <rect y="17" width="24" height="2" rx="1" fill="#fff" />
            </svg>
          </span>
        </button>
        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="absolute left-0 top-16 z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-lg min-w-[160px] flex flex-col">
            <button
              className="px-5 py-3 text-left hover:bg-gray-800 text-white border-b border-gray-800"
              onClick={() => { setMenuOpen(false); navigate('/Chatbot'); }}
            >Chatbot</button>
            <button
              className="px-5 py-3 text-left hover:bg-gray-800 text-white border-b border-gray-800"
              onClick={() => { setMenuOpen(false); navigate('/History'); }}
            >History</button>
            <button
              className="px-5 py-3 text-left hover:bg-gray-800 text-red-500"
              onClick={() => { setMenuOpen(false); handleLogout(); }}
            >Logout</button>
          </div>
        )}
        <h1 className="text-2xl font-bold text-white tracking-wider">
          GeoInsight<span className="text-[var(--theme-primary)]">AI</span>
        </h1>
          <div className="relative flex items-center ml-[45px] max-w-xl flex-1">
            <input
              type="text"
              placeholder="Search location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full max-w-xl min-w-[340px] bg-transparent text-white px-4 py-2 pr-10 rounded-full border border-[var(--theme-border)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
            />
            <button
              onClick={onSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[var(--geo-accent)] text-white p-1.5 rounded-full flex items-center justify-center hover:bg-white hover:text-black focus:outline-none"
              style={{ height: '32px', width: '32px' }}
              tabIndex={-1}
            >
              <Search size={20} />
            </button>
              {suggestions.length > 0 && (
              <ul className="absolute top-full left-0 w-full bg-white text-black rounded-b shadow-md max-h-40 overflow-y-auto z-30">
                {suggestions.map((item, idx) => (
                  <li
                    key={idx}
                    onClick={() => {
                      setSearchQuery(item.display_name);
                      setSuggestions([]);
                      setActiveSuggestion(-1);
                      onSearch(); // Pinpoint on map
                    }}
                    className={`px-3 py-2 hover:bg-gray-200 cursor-pointer text-[13px] ${activeSuggestion === idx ? 'bg-gray-200' : ''}`}
                  >
                    {item.display_name}
                  </li>
                ))}
              </ul>
            )}
        </div>
      </div>
    
      
      {/* Right: Filters + More Filters */}
      <div className="w-full lg:w-auto lg:flex-1 flex items-center justify-center lg:justify-end gap-4 relative">
        <Filters locationSelected={locationSelected} />
        {/* More filters icon */}
        {/* <button
          className="ml-2 p-2 rounded hover:bg-black focus:outline-none"
          onClick={() => setMoreFiltersOpen(v => !v)}
          aria-label="More filters"
        >
          <MdMoreVert size={24} />
        </button> */}
        {/* More filters dropdown */}
        {moreFiltersOpen && (
          <div className="absolute right-0 top-16 z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-lg min-w-[160px] flex flex-col">
            <ul className="py-2">
              <li>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-700">Elevation</button>
              </li>
              <li>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-700">Solar</button>
              </li>
              <li>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-700">Imagery Insights</button>
              </li>
              <li>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-700">Places Insights</button>
              </li>
              <li>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-700">Roads Management Insights</button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;