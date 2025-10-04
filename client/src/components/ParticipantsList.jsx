import { useState } from "react";
import { Users, Terminal } from "lucide-react";

const ParticipantsList = ({ participants, terminalStyle = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (participants.length === 0) {
    return null;
  }

  if (terminalStyle) {
    return (
      <div className="relative">
        <button
          className="flex items-center gap-2 bg-transparent border border-green-400/30 text-green-400/80 cursor-pointer px-2 py-1 transition-all hover:bg-green-400/10 text-xs"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          style={{ fontFamily: "'Courier New', Consolas, Monaco, monospace" }}
        >
          <Users className="w-3 h-3" />
          <span>
            [{participants.length}]_USERS
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
          <div className="absolute top-full right-0 mt-2 bg-black border border-green-400/30 shadow-2xl z-50 min-w-[280px]" style={{ fontFamily: "'Courier New', Consolas, Monaco, monospace" }}>
            <div className="px-4 py-3 border-b border-green-400/30 bg-green-400/5">
              <div className="flex items-center gap-2">
                <Terminal className="w-3 h-3 text-green-400" />
                <span className="text-green-400 text-xs font-bold">ACTIVE_PARTICIPANTS</span>
              </div>
            </div>
            <div className="p-2">
              {participants.map((participant, index) => (
                <div
                  key={participant.userId || index}
                  className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-green-400/10"
                >
                  <div className="w-6 h-6 border border-green-400/50 bg-green-400/10 flex items-center justify-center text-green-400 font-bold text-xs">
                    {participant.username?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1">
                    <div className="text-green-400 text-xs font-mono">
                      {participant.username || participant.name || "UNKNOWN_USER"}
                    </div>
                    <div className="text-green-400/50 text-xs">
                      ID: {participant.userId?.slice(0, 8)}...
                    </div>
                  </div>
                  <div className="text-green-400 text-xs animate-pulse">●</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
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
