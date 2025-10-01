
import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { MdArrowUpward, MdChat } from 'react-icons/md';

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
	const navigate = useNavigate();

		const handleSend = () => {
			if (input.trim()) {
				setMessages([...messages, { role: "user", text: input }]);
				setInput("");
				setShowSuggestions(false);
			}
		};

	return (
		<div className="min-h-screen bg-[#111] text-white flex flex-col relative font-sans">
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
				<span className="ml-4 text-lg text-gray-400 font-semibold">Chatbot</span>
			</header>

			{/* Main content */}
					<div className="flex-1 flex flex-col items-center justify-center px-4">
						{/* Chatbot icon above greeting */}
						<div className="mt-16 mb-2">
							<MdChat size={48} className="mx-auto text-[var(--theme-primary)]" />
						</div>
						<div className="text-3xl font-bold mb-2 text-white">Hello there!</div>
						<div className="text-xl text-gray-400 mb-10">How can I help you today?</div>

						{/* Suggested questions (hide after message sent) */}
						{showSuggestions && (
							<div className="flex flex-wrap gap-4 justify-center mb-10">
								{suggestedQuestions.map((q, i) => (
									<button
										key={i}
										className="bg-[#181818] text-white px-6 py-3 rounded-full shadow hover:bg-[#222] transition text-base font-medium border border-[#222]"
										onClick={() => setInput(q)}
									>
										{q}
									</button>
								))}
							</div>
						)}

						{/* Chat messages (hidden until used) */}
						{messages.length > 0 && (
							<div className="w-full max-w-2xl mx-auto mb-8">
								{messages.map((msg, idx) => (
									<div key={idx} className={`mb-2 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
										<div className={`px-4 py-2 rounded-lg ${msg.role === "user" ? "bg-[#222] text-white" : "bg-[#333] text-gray-200"}`}>{msg.text}</div>
									</div>
								))}
							</div>
						)}
					</div>

			{/* Input bar */}
			<div className="w-full px-0 py-6 bg-[#111] border-t border-[#222] flex items-center justify-center fixed bottom-0 left-0">
				<div className="w-full max-w-2xl flex items-center gap-2">
					<input
						className="flex-1 bg-[#181818] text-white px-4 py-3 rounded-full border border-[#222] focus:outline-none focus:ring-2 focus:ring-[#333] text-base"
						placeholder="Send a message..."
						value={input}
						onChange={e => setInput(e.target.value)}
						onKeyDown={e => e.key === 'Enter' && handleSend()}
					/>
								<button
									className="bg-[#181818] text-white px-4 py-3 rounded-full font-semibold flex items-center gap-2 hover:bg-[#222] transition"
									onClick={handleSend}
									aria-label="Send message"
								>
									<MdArrowUpward size={24} />
								</button>
				</div>
			</div>
		</div>
	);
}
