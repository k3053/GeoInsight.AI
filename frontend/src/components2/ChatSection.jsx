import React, { useState, useRef, useEffect } from "react";
import { AiOutlineSend } from "react-icons/ai";
import { FaRobot, FaUser } from 'react-icons/fa';

const exampleQueries = [
  "What's the current air quality in Surat?",
  "Show nearby hospitals in Mumbai.",
  "What is the population density of New Delhi?",
  "Show nearby Schools in Bangalore.",
];

const ChatSection = () => {
  // State for the current input
  const [query, setQuery] = useState("");
  // State to hold the entire conversation history
  const [messages, setMessages] = useState([]);
  // State to track if we're waiting for a response
  const [isLoading, setIsLoading] = useState(false);
  // Ref for the chat container to enable auto-scrolling
  const chatContainerRef = useRef(null);

  // Effect to scroll to the bottom of the chat container whenever a new message is added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Sets the input field text when an example query is clicked
  const handleExampleClick = (text) => {
    setQuery(text);
  };

  // Handles the form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Prevent sending empty messages or sending while the assistant is already thinking
    if (!query.trim() || isLoading) return;

    // 1. Add the user's message to the chat history
    const userMessage = { sender: 'user', text: query };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    // 2. Clear the input field and set loading state to true
    const currentQuery = query;
    setQuery("");
    setIsLoading(true);

    try {
      // 3. Send the request to the FastAPI backend
      const response = await fetch('http://localhost:8080/chat/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: currentQuery }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // 4. Parse the JSON response and add the assistant's message to the history
      const data = await response.json();
      const assistantMessage = { sender: 'assistant', text: data.answer };
      setMessages(prevMessages => [...prevMessages, assistantMessage]);

    } catch (error) {
      console.error("Failed to fetch from backend:", error);
      // 5. If an error occurs, add an error message to the chat
      const errorMessage = { sender: 'assistant', text: "Sorry, I'm having trouble connecting to the server. Please check if the backend is running and try again." };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      // 6. Set loading state back to false regardless of success or failure
      setIsLoading(false);
    }
  };

  return (
    <div className="p-3 bg-black/60 text-[14px] backdrop-blur-md border-t border-gray-700 flex flex-col h-full">
      {/* Message Display Area */}
      <div ref={chatContainerRef} className="flex-grow p-2 overflow-y-auto text-white space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex items-start gap-3 my-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
            {msg.sender === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--geo-accent)] flex items-center justify-center">
                <FaRobot className="text-black" />
              </div>
            )}
            <div className={`p-3 rounded-lg max-w-md break-words ${msg.sender === 'user' ? 'bg-gray-700' : 'bg-gray-800'}`}>
              <p className="text-sm">{msg.text}</p>
            </div>
            {msg.sender === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                <FaUser />
              </div>
            )}
          </div>
        ))}
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3 my-2">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--geo-accent)] flex items-center justify-center">
              <FaRobot className="text-black" />
            </div>
            <div className="p-3 rounded-lg bg-gray-800">
              <p className="text-sm italic">Assistant is thinking...</p>
            </div>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="mt-auto pt-2">
        {/* Example Query Buttons */}
        <div className="mb-2 flex flex-wrap gap-2">
          {exampleQueries.map((ex, idx) => (
            <button
              key={idx}
              onClick={() => handleExampleClick(ex)}
              className="bg-gray-700 text-white px-2 py-1 rounded hover:bg-gray-600 text-xs"
            >
              {ex}
            </button>
          ))}
        </div>
        
        {/* Chat Input and Send Button Form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Chatbot Interaction: Ask me anything"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                handleSubmit(e);
              }
            }}
            className="flex-1 bg-transparent text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-[var(--geo-accent)]"
          />
          <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
            <AiOutlineSend />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatSection;
