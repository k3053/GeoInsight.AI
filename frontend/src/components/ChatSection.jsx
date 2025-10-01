import React, { useState, useRef, useEffect } from "react";
import { AiOutlineSend } from "react-icons/ai";

const exampleQueries = [
  "What's the current air quality in Surat?",
  "Show me nearby hospitals in Mumbai.",
  "What is the population density of New Delhi?",
  "Driving time from Delhi airport to Gurgaon?",
];

// Define your backend API endpoint
const API_URL = "http://localhost:8080/chat/query";

const ChatSection = () => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef(null);

  // Automatically scroll to the bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (messageText) => {
    const text = messageText.trim();
    if (!text) return;

    // Add user message to the UI immediately
    const userMessage = { sender: "user", text };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setQuery("");
    setIsLoading(true);

    try {
      // Build the request body
      const requestBody = {
        message: text,
        session_id: "user-session-123", // Ideally, this should come from your auth user.uid
      };
      
      // If coordinates are selected on the map, add them to the request
      if (selectedCoords) {
        requestBody.latitude = selectedCoords.lat;
        requestBody.longitude = selectedCoords.lng;
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Add the agent's text response to the UI
      const agentMessage = { sender: "agent", text: data.answer };
      setMessages((prevMessages) => [...prevMessages, agentMessage]);

      // If the response includes location data, pass it up to HomePage
      if (data.location) {
        onLocationFound(data.location);
      }

    } catch (error) {
      console.error("Failed to fetch from chat API:", error);
      const errorMessage = { sender: "agent", text: "Sorry, I'm having trouble connecting. Please try again later." };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(query);
  };

  const handleExampleClick = (text) => {
    setQuery(text);
    // Optional: automatically send the message on click
    // handleSendMessage(text); 
  };

  return (
    <div className="flex flex-col h-full bg-black/60 text-[14px] backdrop-blur-md border-t border-gray-700">
      {/* Message Display Area */}
      <div ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.sender === 'user' ? 'bg-[#64ffda] text-black' : 'bg-gray-700 text-white'}`}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-white p-3 rounded-lg">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Input Area */}
      <div className="p-3 border-t border-gray-700">
        <div className="mb-2 flex flex-wrap gap-2">
          {exampleQueries.map((ex, idx) => (
            <button
              key={idx}
              onClick={() => handleExampleClick(ex)}
              className="bg-gray-700 text-white px-2 py-1 rounded hover:bg-gray-600 text-xs"
              disabled={isLoading}
            >
              {ex}
            </button>
          ))}
        </div>
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask me anything..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-[var(--geo-accent)]"
            disabled={isLoading}
          />
          <button type="submit" className="btn-primary flex items-center gap-1" disabled={isLoading}>
            <AiOutlineSend />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatSection;