import React from 'react';
import Filters from './Filters';
import { LogOut } from 'lucide-react';
import { auth } from '../firebaseConfig';

const Header = ({ searchQuery, setSearchQuery, onSearch, locationSelected, handleLogout }) => {
  const user = auth.currentUser;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    // Added mx-5 for horizontal margins and removed w-full
    <header 
      className="bg-[var(--theme-surface)] border-x border-b border-[var(--theme-border)] rounded-b-[1.5rem] 
                 p-4 flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-0 flex-shrink-0
                 shadow-[0_8px_32px_rgba(0,0,0,0.4)] mx-0"
    >
      {/* Left: Title */}
      <div className="flex-shrink-0 lg:flex-1 lg:justify-start">
        <h1 className="text-2xl font-bold text-white tracking-wider">
          GeoInsight<span className="text-[var(--theme-primary)]">AI</span>
        </h1>
      </div>
      
      {/* Center: Search Bar */}
      <div className="w-full lg:w-auto lg:flex-1 flex justify-center">
        <input
          type="text"
          placeholder="Search location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full max-w-md bg-transparent text-white px-4 py-2 rounded-full border border-[var(--theme-border)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
        />
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

