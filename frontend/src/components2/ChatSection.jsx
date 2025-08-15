import { AiOutlineSend } from "react-icons/ai";
const ChatSection = () => (
  <div className="p-4 bg-white shadow rounded flex flex-col gap-2">
    <div className="flex">
      <input
        type="text"
        placeholder="Ask me anything"
        className="flex-1 p-2 border rounded-l"
      />
      <button className="bg-blue-500 text-white px-4 rounded-r">
        <AiOutlineSend />
      </button>
    </div>
    <div className="flex gap-2 flex-wrap">
      <button className="bg-gray-100 p-2 rounded">General Query</button>
      <button className="bg-gray-100 p-2 rounded">Ask about location</button>
      <button className="bg-gray-100 p-2 rounded">Create a Dashboard</button>
      <button className="bg-gray-100 p-2 rounded">
        Give me analysis of X location with Y features
      </button>
    </div>
  </div>
);

export default ChatSection;