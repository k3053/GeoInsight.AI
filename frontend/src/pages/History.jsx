import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig'; 


const API_BASE_URL = "http://localhost:8000"; 

const ChatTurn = ({ chat }) => (
    <div className="mb-16 border-b border-gray-700 pb-8">
        <div className="text-sm text-gray-400 mb-4">{chat.date || 'Date N/A'}</div>
        
        <h3 className="text-xl font-bold mb-2 text-white">Your Question</h3>
        <div className="mb-4 p-4 rounded-lg bg-gray-800 text-[#64ffda] font-semibold text-base">
            {chat.question}
        </div>
        
        <h3 className="text-xl font-bold mb-2 text-white">GeoInsightAI Answer</h3>
        <div className="mb-4 p-4 rounded-lg bg-gray-900 text-gray-300 text-base">
            {chat.answer}
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
            {(chat.tags || ["GEO", "AI"]).map((tag, i) => (
                <span key={i} className="text-xs font-bold px-2 py-1 rounded bg-[#0a0e17] text-[#4ad5b4] border border-[#222] tracking-wide">
                    {tag}
                </span>
            ))}
        </div>
    </div>
);

// const chatHistory = [
// 	{
// 		date: "September 30, 2025",
// 		question: "What are the advantages of using Next.js?",
// 		answer: "Next.js offers server-side rendering, static site generation, API routes, and fast performance for React apps.",
// 		tags: ["QUESTION", "ANSWER", "NEXT.JS"],
// 	},
// 	{
// 		date: "September 30, 2025",
// 		question: "Write code to demonstrate Dijkstra's algorithm",
// 		answer: "Here's a sample implementation of Dijkstra's algorithm in Python...",
// 		tags: ["QUESTION", "ANSWER", "ALGORITHM"],
// 	},
// ];

export default function History() {
	const navigate = useNavigate();
	const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch history on component mount
    useEffect(() => {
        const fetchHistory = async () => {
            const user = auth.currentUser;
            if (!user) {
                setError("User not authenticated. Please log in.");
                setIsLoading(false);
                return;
            }

            const userId = user.uid;
            
            try {
                // Fetch chat history from the backend endpoint
                const response = await fetch(`${API_BASE_URL}/history/${userId}`);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                
                // Reverse the array so the most recent chats are at the top
                setHistory(data.reverse()); 

            } catch (err) {
                console.error("Failed to fetch chat history:", err);
                setError("Failed to load chat history. Please check the backend connection.");
            } finally {
                setIsLoading(false);
            }
        };

        // We use onAuthStateChanged listener to ensure we have the UID
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                fetchHistory();
            } else {
                setIsLoading(false);
                // Redirecting to login is handled by App.jsx, but we clear data here
                setHistory([]); 
            }
        });

        return () => unsubscribe(); // Cleanup listener
    }, []);

    const renderContent = () => {
        if (isLoading) {
            return <div className="text-center py-10 text-lg text-gray-400">Loading chat history...</div>;
        }

        if (error) {
            return <div className="text-center py-10 text-red-500 text-lg">Error: {error}</div>;
        }

        if (history.length === 0) {
            return <div className="text-center py-10 text-lg text-gray-400">No chat history found for this user.</div>;
        }

        return history.map((chat) => (
            <ChatTurn key={chat.id} chat={chat} />
        ));
    };
	return (
		<div className="min-h-screen bg-[var(--theme-bg)] text-white font-sans">
            {/* Header bar */}
            <header className="bg-[var(--theme-surface)] border-x border-b border-[var(--theme-border)] rounded-b-[1.5rem] p-4 flex items-center gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)] mx-0">
                {/* Back button */}
                <button
                    className="p-2 rounded hover:bg-gray-700 focus:outline-none mr-2"
                    onClick={() => navigate('/')}
                    aria-label="Go back"
                >
                    <span className="block w-6 h-6">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M15 18l-6-6 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>
                </button>
                {/* Logo and title */}
                <h1 className="text-2xl font-bold text-white tracking-wider">
                    GeoInsight<span className="text-[var(--theme-primary)]">AI</span>
                </h1>
                <span className="ml-4 text-lg text-gray-400 font-semibold">Chat History</span>
            </header>

            <div className="max-w-3xl mx-auto px-8 py-12">
                <h2 className="text-2xl font-bold text-[var(--theme-primary)] mb-8">
                    Your Past Conversations
                </h2>

                {renderContent()}

            </div>
        </div>
	);
}
