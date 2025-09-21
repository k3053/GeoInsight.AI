import React, { useState } from 'react';
import Header from "../components/Header";
import MapSection from "../components/MapSection";
import DashboardCharts from "../components/DashboardCharts";
import ChatSection from "../components/ChatSection";

const HomePage = ({ handleLogout }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [locationSelected, setLocationSelected] = useState(false);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setSearchTrigger(prev => prev + 1);
    }
  };
  
  return (
    <div className="flex flex-col h-screen overflow-hidden p-2 lg:p-4 bg-[var(--theme-bg)]">
      <Header 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
        locationSelected={locationSelected}
        handleLogout={handleLogout}
      />
      
      <main className="flex-grow flex flex-col lg:grid lg:grid-cols-2 lg:grid-rows-2 gap-4 p-2 lg:p-4 h-full overflow-y-auto lg:overflow-hidden">
        
        <div className="h-[50vh] lg:h-auto lg:col-start-1 lg:row-start-1 card-floating">
          <MapSection 
            searchQuery={searchQuery}
            searchTrigger={searchTrigger}
            onLocationSelect={() => setLocationSelected(true)}
          />
        </div>

        <div className="h-[60vh] lg:h-auto lg:col-start-1 lg:row-start-2 card-floating overflow-hidden">
          <ChatSection />
        </div>

        {/* Pass the locationSelected state as a prop here */}
        <div className="h-[70vh] lg:h-auto lg:col-start-2 lg:row-start-1 lg:row-span-2 card-floating overflow-hidden">
          <DashboardCharts locationSelected={locationSelected} />
        </div>

      </main>
    </div>
  );
};

export default HomePage;

