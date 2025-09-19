import MapSection from "../components2/MapSection";
import DashboardCharts from "../components2/DashboardCharts";

const HomePage = () => (
  <div className="relative flex h-[calc(100vh-64px)] bg-[var(--geo-bg-dark)]">
    {/* Map Section */}
    <div className="flex-[4] relative">
      <MapSection />
    </div>

    {/* Dashboard */}
    <div className="flex-2 p-4 card-glass overflow-y-auto">
      <DashboardCharts />
    </div>

    {/* Chat Section at Bottom */}
    {/* <div className="absolute bottom-0 left-0 w-full card-glass">
      <ChatSection />
    </div> */}
  </div>
);

export default HomePage;
