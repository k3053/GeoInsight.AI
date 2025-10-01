
import React from "react";
import { useNavigate } from 'react-router-dom';

const chatHistory = [
	{
		date: "September 30, 2025",
		question: "What are the advantages of using Next.js?",
		answer: "Next.js offers server-side rendering, static site generation, API routes, and fast performance for React apps.",
		tags: ["QUESTION", "ANSWER", "NEXT.JS"],
	},
	{
		date: "September 30, 2025",
		question: "Write code to demonstrate Dijkstra's algorithm",
		answer: "Here's a sample implementation of Dijkstra's algorithm in Python...",
		tags: ["QUESTION", "ANSWER", "ALGORITHM"],
	},
];

export default function History() {
	const navigate = useNavigate();
	return (
		<div className="min-h-screen bg-[#0a0e17] text-white font-sans">
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
				<div className="text-lg text-gray-400 mb-8">Your previous chatbot conversations</div>
				<hr className="border-[#222] mb-8" />

				{chatHistory.map((chat, idx) => (
					<div key={idx} className="mb-16">
						<div className="text-base text-gray-400 mb-2">{chat.date}</div>
						<div className="flex flex-col md:flex-row md:items-center md:justify-between">
							<div>
								<h2 className="text-xl font-bold mb-2 text-white">User Question</h2>
								<div className="mb-2 text-[#ff007a] font-semibold">{chat.question}</div>
								<h2 className="text-xl font-bold mb-2 text-white">Chatbot Answer</h2>
								<div className="mb-2 text-gray-300">{chat.answer}</div>
								<div className="flex flex-wrap gap-2 mb-2 mt-2">
									{chat.tags.map((tag, i) => (
										<span key={i} className="text-xs font-bold px-2 py-1 rounded bg-[#0a0e17] text-[#ff007a] border border-[#222] tracking-wide">
											{tag}
										</span>
									))}
								</div>
							</div>
						</div>
						<hr className="border-[#222] mt-8" />
					</div>
				))}
			</div>
		</div>
	);
}
