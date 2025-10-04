import { useState } from "react";

const ParticipantsList = ({ participants }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (participants.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 bg-transparent border-none text-gray-400 cursor-pointer px-2 py-1 rounded transition-colors hover:text-white"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className="text-sm font-medium">
          {participants.length} participant
          {participants.length !== 1 ? "s" : ""}
        </span>
        <span
          className={`text-xs transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50 min-w-[250px]">
          <div className="px-4 py-3 border-b border-gray-700">
            <h4 className="text-white text-sm font-semibold">Participants</h4>
          </div>
          <div className="p-2">
            {participants.map((participant, index) => (
              <div
                key={participant.userId || index}
                className="flex items-center gap-3 px-3 py-2 rounded transition-colors hover:bg-gray-700"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-xs">
                  {participant.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">
                    {participant.username || participant.name || "Unknown User"}
                  </div>
                  <div className="text-gray-400 text-xs">
                    ID: {participant.userId}
                  </div>
                </div>
                <div className="text-emerald-500 text-xs">●</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantsList;
