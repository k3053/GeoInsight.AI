import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MdArrowUpward, MdChat } from "react-icons/md";
import MapSection from "../components/MapSection";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const API_URL = "http://localhost:8000/chat/query";

const suggestedQuestions = [
  "What are the advantages of using Next.js?",
  "Write code to demonstrate Dijkstra's algorithm",
  "Help me write an essay about Silicon Valley",
  "What is the weather in San Francisco?",
];

export default function Chatbot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

   // ✅ extract coords + initial message
  const { initialMessage, coords } = location.state || {};
  const mapCenter = coords || [20.5937, 78.9629]; // fallback to India if none

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Pre-fill initial query if passed from ChatSection
	useEffect(() => {
		if (initialMessage) {
			handleSend(initialMessage);
		}
	}, []); 


    const handleSend = async (text = input) => {
		const messageText = text.trim();
		if (!messageText) return;

		const userMessage = { role: "user", text: messageText };
		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setShowSuggestions(false);
		setIsLoading(true);

		try {
		const response = await fetch(API_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
			message: messageText,
			session_id: "user-session-123", 
			location: coords || null,   // ✅ send coords if available
			}),
		});
		} catch (error) {
		console.error("Failed to fetch from chat API:", error);
		const errorMessage = {
			role: "agent",
			text: "Sorry, I'm having trouble connecting. Please try again later.",
		};
		setMessages((prev) => [...prev, errorMessage]);
		}
	}
  return (
    <div className="min-h-screen bg-[#111] text-white flex relative font-sans">
      {/* Left 50% Map */}
      <div className="w-1/2 h-screen">
        {/* <MapContainer center={[20.5937, 78.9629]} zoom={5} className="w-full h-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        </MapContainer> */}
		<MapSection locationFromChat={mapCenter} />
      </div>

      {/* Right 50% Chat Interface */}
      <div className="w-1/2 flex flex-col relative border-l border-[#222]">
        {/* Header */}
        <header className="bg-[var(--theme-surface)] border-b border-[var(--theme-border)] p-4 flex items-center gap-4 shadow-md">
          <button
            className="p-2 rounded hover:bg-gray-700"
            onClick={() => navigate("/")}
          >
            <svg width="24" height="24" fill="none">
              <path
                d="M15 18l-6-6 6-6"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className="text-xl font-bold">
            GeoInsight<span className="text-[var(--theme-primary)]">AI</span>
          </h1>
          <span className="ml-2 text-gray-400 font-semibold">Chatbot</span>
        </header>

        {/* Chat Area */}
        <div
          ref={chatContainerRef}
          className="flex-1 flex flex-col px-4 py-6 overflow-y-auto"
        >
          {/* Suggestions */}
          {showSuggestions && (
            <div className="flex flex-wrap gap-3 justify-center mb-6">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  className="bg-[#181818] text-white px-6 py-2 rounded-full shadow hover:bg-[#222] transition text-sm"
                  onClick={() => handleSend(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-3 flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-2 rounded-lg max-w-xs md:max-w-md ${
                  msg.role === "user"
                    ? "bg-[#64ffda] text-black"
                    : "bg-gray-700 text-white"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-700 text-white p-3 rounded-lg">
                <span className="animate-pulse">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-[#222] flex items-center gap-2">
          <input
            className="flex-1 bg-[#181818] text-white px-4 py-2 rounded-full border border-[#222] focus:outline-none"
            placeholder="Send a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            className="bg-[#181818] px-4 py-2 rounded-full hover:bg-[#222]"
            onClick={() => handleSend()}
          >
            <MdArrowUpward size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}
