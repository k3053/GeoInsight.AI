import React, { useState, useEffect, useRef } from 'react';
import { 
  FaUser, 
  FaRobot, 
  FaTachometerAlt, 
  FaHistory, 
  FaSignOutAlt, 
  FaBars, 
  FaArrowLeft 
} from 'react-icons/fa';

const Header = () => {
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Toggle Icon: When panel is closed, show hamburger; when open, show back arrow */}
      {!panelOpen ? (
        <button
          onClick={() => setPanelOpen(true)}
          className="fixed top-2 left-4 z-50 p-2 bg-gray-800 text-white rounded focus:outline-none cursor-pointer"
        >
          <FaBars size={24} />
        </button>
      ) : (
        <button
          onClick={() => setPanelOpen(false)}
          className="fixed top-2 left-4 z-50 p-2 bg-gray-800 text-white rounded focus:outline-none cursor-pointer"
        >
          <FaArrowLeft size={24} />
        </button>
      )}

      {/* Left Side Header Panel */}
      {panelOpen && (
        <div
          ref={panelRef}
          className="fixed top-0 left-0 w-64 h-full bg-gradient-to-b from-[var(--geo-bg-dark)] to-[var(--geo-bg-light)] text-[var(--geo-text-light)] shadow-lg z-40 transform transition-transform duration-300"
        >
          <div className="p-6 mt-10">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer text-[var(--geo-accent)] transition duration-300">
              <span className="text-2xl font-extrabold tracking-wide">
                GeoInsightAI
              </span>
            </div>

            {/* Navigation Links */}
            <div className="relative mt-6">
              <div className="flex items-center space-x-2 cursor-pointer group">
                <FaUser
                  size={24}
                  className="text-white group-hover:text-[var(--geo-accent)] transition duration-300"
                />
                <span className="text-white group-hover:text-[var(--geo-accent)] transition duration-300">
                  Profile
                </span>
              </div>

              <div className="flex items-center mt-5 space-x-2 cursor-pointer group">
                <FaRobot
                  size={24}
                  className="text-white group-hover:text-[var(--geo-accent)] transition duration-300"
                />
                <span className="text-white group-hover:text-[var(--geo-accent)] transition duration-300">
                  Chatbot
                </span>
              </div>

              <div className="flex items-center mt-5 space-x-2 cursor-pointer group">
                <FaTachometerAlt
                  size={24}
                  className="text-white group-hover:text-[var(--geo-accent)] transition duration-300"
                />
                <span className="text-white group-hover:text-[var(--geo-accent)] transition duration-300">
                  Dashboard
                </span>
              </div>

              <div className="flex items-center mt-5 space-x-2 cursor-pointer group">
                <FaHistory
                  size={24}
                  className="text-white group-hover:text-[var(--geo-accent)] transition duration-300"
                />
                <span className="text-white group-hover:text-[var(--geo-accent)] transition duration-300">
                  History
                </span>
              </div>

              <div className="flex items-center mt-5 space-x-2 cursor-pointer group">
                <FaSignOutAlt
                  size={24}
                  className="text-white group-hover:text-[var(--geo-accent)] transition duration-300"
                />
                <span className="text-white group-hover:text-[var(--geo-accent)] transition duration-300">
                  Logout
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;