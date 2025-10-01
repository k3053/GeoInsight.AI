import React, { useState } from 'react';
import Header from "../components/Header";
import MapSection from "../components/MapSection";
import DashboardCharts from "../components/DashboardCharts";
import ChatSection from "../components/ChatSection";

const HomePage = ({ handleLogout }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [locationSelected, setLocationSelected] = useState(false);
  

  // State for coordinates selected on the map (Map -> Chat)
  const [selectedCoords, setSelectedCoords] = useState(null);
  
  // State for location data coming from the chat (Chat -> Map)
  const [locationFromChat, setLocationFromChat] = useState(null);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setSearchTrigger(prev => prev + 1);
    }
  };
  
  return (
    // Main container with padding
    <div className="flex flex-col h-screen overflow-hidden p-4 bg-[var(--theme-bg)] gap-4">
      {/* Header now sits outside the main grid */}
      <Header 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
        locationSelected={locationSelected}
        handleLogout={handleLogout} 
      />
      
      {/* Main content grid takes the remaining space */}
      <main className="flex-grow grid grid-cols-1 pt-4 gap-4 h-full overflow-y-auto lg:overflow-hidden lg:grid-cols-[60%_40%] lg:grid-rows-2">
        {/* Box 1: Map (Top-Left on Desktop) */}
        <div className="h-[60%] lg:h-auto lg:col-start-1 lg:row-start-1 card-floating">
          <MapSection 
            searchQuery={searchQuery}
            searchTrigger={searchTrigger}
            // onLocationSelect={() => setLocationSelected(true)}
            onLocationSelect={(coords) => {
              setSelectedCoords(coords);
              setLocationSelected(true);
            }}
            // Pass the location from chat to update the map view
            locationFromChat={locationFromChat}
          />
        </div>

        {/* Box 3: Chat (Bottom-Left on Desktop) */}
        <div className="h-[40%] lg:h-auto lg:col-start-1 lg:row-start-2 card-floating overflow-hidden">
           <ChatSection 
           // Pass the selected coordinates for chat context
             selectedCoords={selectedCoords}
             // Pass the setter to update map when chat finds a location
             onLocationFound={setLocationFromChat}
             />
        </div>

        {/* Box 2 & 4: Dashboard (Entire Right Column on Desktop) */}
        <div className="h-[70vh] lg:h-auto lg:col-start-2 lg:row-start-1 lg:row-span-2 card-floating overflow-hidden">
          <DashboardCharts locationSelected={locationSelected} />
        </div>
      </main>
    </div>
  );
};

export default HomePage;

