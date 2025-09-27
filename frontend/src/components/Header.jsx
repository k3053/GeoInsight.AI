import React, { useRef, useState, useEffect } from 'react';
import { Search } from "lucide-react";
import Filters from './Filters';
import { LogOut } from 'lucide-react';
import { auth } from '../firebaseConfig';

const Header = ({ searchQuery, setSearchQuery, onSearch, locationSelected, handleLogout }) => {
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
        } else {
          onSearch();
        }
      }
    } else if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    // Added mx-5 for horizontal margins and removed w-full
    <header 
      className="bg-[var(--theme-surface)] border-x border-b border-[var(--theme-border)] rounded-b-[1.5rem] 
                 p-4 flex flex-col lg:flex-row items-center justify-between gap-2 lg:gap-0 flex-shrink-0
                 shadow-[0_8px_32px_rgba(0,0,0,0.4)] mx-0"
    >
      {/* Left: Title */}
      <div className="flex gap-0">
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
    
      
      {/* Right: Filters & Logout Button */}
      <div className="w-full lg:w-auto lg:flex-1 flex items-center justify-center lg:justify-end gap-4">
        <Filters locationSelected={locationSelected} />
        
        {user && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-600/20 border border-red-600/50 hover:bg-red-600/50 rounded-lg transition-colors"
              title={`Log out ${user.email}`}
            >
              <LogOut size={16} />
            </button>
        )}
      </div>
    </header>
  );
};

export default Header;

