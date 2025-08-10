// src/App.js
import Header from '../components/Header';
import MapSection from '../components/MapSection';
import AnalyticsSidebar from '../components/AnalyticsSidebar';
import ChatInput from '../components/ChatInput';

export default function App() {
  return (
    <div className="w-full h-screen bg-white flex flex-col font-sans">
      <Header />
      <main className="flex flex-1 overflow-hidden">
        <MapSection />
        <AnalyticsSidebar />
      </main>
      <ChatInput />
    </div>
  );
}