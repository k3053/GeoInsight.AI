// src/components/ChatInput.js
export default function ChatInput() {
  return (
    <footer className="bg-black text-white px-4 py-3 flex items-center gap-3 shadow-inner z-20">
      <input
        type="text"
        placeholder="Ask me anything"
        className="flex-1 bg-transparent text-white outline-none placeholder-gray-400"
      />
      <button className="text-xl hover:text-gray-300 transition-colors">
        ↑
      </button>
    </footer>
  );
}