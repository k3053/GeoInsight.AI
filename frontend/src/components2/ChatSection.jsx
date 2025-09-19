import React, { useState } from "react";
import { AiOutlineSend } from "react-icons/ai";

const exampleQueries = [
  "What's the current air quality?",
  "Show nearby hospitals.",
  "What is the population density?",
  "Show nearby Schools.",
];

const ChatSection = () => {
  const [query, setQuery] = useState("");

  const handleExampleClick = (text) => {
    setQuery(text);
  };

  return (
    <div className="p-3 bg-black/60 text-[14px] backdrop-blur-md border-t border-gray-700">
      {/* Example Query Buttons */}
      <div className="mb-2 flex flex-wrap gap-2">
        {exampleQueries.map((ex, idx) => (
          <button
            key={idx}
            onClick={() => handleExampleClick(ex)}
            className="bg-gray-700 text-white px-2 py-1 rounded hover:bg-gray-600"
          >
            {ex}
          </button>
        ))}
      </div>
      {/* Chat Input and Send Button */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Chatbot Interaction: Ask me anything"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-[var(--geo-accent)] "
        />
        <button className="btn-primary flex items-center gap-1">
          <AiOutlineSend />
        </button>
      </div>
    </div>
  );
};

export default ChatSection;