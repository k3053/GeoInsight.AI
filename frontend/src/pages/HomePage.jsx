import React from 'react';
import MapSection from '../components2/MapSection';
import DashboardCharts from '../components2/DashboardCharts';
import ChatSection from '../components2/ChatSection';

const HomePage = () => (
  <div className="relative flex h-[calc(100vh-64px)]">
    {/* Map Section - 2/3 */}
    <div className="relative flex-[2]">
      <MapSection />
    </div>

    {/* Dashboard Section - 1/3 */}
    <div className="flex-1 bg-transparent p-4 flex flex-col gap-4">
      <DashboardCharts />
    </div>

    {/* Chat at Bottom */}
    <div className="absolute bottom-0 left-0 w-full">
      <ChatSection />
    </div>
  </div>
);

export default HomePage;
