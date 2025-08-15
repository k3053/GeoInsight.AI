import React, { useState, useEffect, useRef } from 'react';
import { FaUser } from 'react-icons/fa';

const Header = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const profileRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="navbar relative z-50 flex items-center justify-between px-6 py-4 shadow-lg animate-fadeDown">
      {/* Logo */}
      <div className="flex items-center gap-2 cursor-pointer text-[var(--geo-accent)] transition duration-300">
        <span className="text-2xl font-extrabold tracking-wide link-underline">
          GeoInsightAI
        </span>
      </div>

      {/* Profile */}
      <div className="relative" ref={profileRef}>
        <div
          className="flex items-center space-x-2 cursor-pointer group"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <FaUser
            size={24}
            className="text-white group-hover:text-[var(--geo-accent)] transition duration-300"
          />
          <span className="text-white group-hover:text-[var(--geo-accent)] transition duration-300">Profile</span>
        </div>

        {/* Dropdown */}
        {dropdownOpen && (
          <div className="absolute card-glass right-0 mt-3 w-52 text-[var(--geo-accent)] animate-fadeIn">
            {[
              { label: "Dashboard", href: "#dashboard" },
              { label: "Chatbot", href: "#chatbot" },
              { label: "History", href: "#history" },
              { label: "Logout", href: "#logout" }
            ].map((item, idx) => (
              <a
                key={idx}
                href={item.href}
                className="block px-4 py-2 transition duration-300 hover:bg-[var(--geo-text-light)] hover:text-white rounded"
              >
                {item.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
