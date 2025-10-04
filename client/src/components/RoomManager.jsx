import { useState } from "react";

const RoomManager = ({ onCreateRoom, onJoinRoom, user, onUserChange }) => {
  const [roomId, setRoomId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState(null);

  const handleCreateRoom = async () => {
    setIsCreating(true);
    try {
      await onCreateRoom();
    } catch (error) {
      console.error("Error creating room:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const copyRoomUrl = (roomId) => {
    const url = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        alert("Room URL copied to clipboard!");
      })
      .catch(() => {
        alert("Failed to copy URL. Please copy manually: " + url);
      });
  };

  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      alert("Please enter a room ID");
      return;
    }

    setIsJoining(true);
    try {
      await onJoinRoom(roomId.trim());
    } catch (error) {
      console.error("Error joining room:", error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleUsernameChange = (e) => {
    onUserChange({
      ...user,
      username: e.target.value,
    });
  };

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          Welcome to Overlook
        </h2>
        <p className="text-gray-400">
          Collaborative Code Editor with AI Assistant
        </p>
      </div>

      <div className="mb-8">
        <div className="flex flex-col items-center gap-2">
          <label htmlFor="username" className="font-medium text-white">
            Your Username:
          </label>
          <input
            id="username"
            type="text"
            value={user.username}
            onChange={handleUsernameChange}
            placeholder="Enter your username"
            className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white text-base w-80 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-8 mb-8">
        <div className="p-6 border border-gray-700 rounded-xl bg-gray-800">
          <h3 className="text-white text-lg mb-2">Create New Room</h3>
          <p className="text-gray-400 mb-4">
            Start a new collaborative coding session
          </p>
          <button
            onClick={handleCreateRoom}
            disabled={isCreating || isJoining || !user.username.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating ? "Creating..." : "Create Room"}
          </button>
          {!user.username.trim() && (
            <p className="text-red-400 text-sm mt-2">
              Please enter a username to create a room
            </p>
          )}
        </div>

        <div className="flex items-center justify-center relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative bg-gray-900 px-4">
            <span className="text-gray-400 font-medium">OR</span>
          </div>
        </div>

        <div className="p-6 border border-gray-700 rounded-xl bg-gray-800">
          <h3 className="text-white text-lg mb-2">Join Existing Room</h3>
          <p className="text-gray-400 mb-4">
            Enter a room ID to join an existing session
          </p>
          <div className="flex gap-2 justify-center">
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room ID"
              className="px-4 py-3 border border-gray-600 rounded-lg bg-gray-900 text-white text-base w-48 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={isCreating || isJoining}
            />
            <button
              onClick={handleJoinRoom}
              disabled={
                !roomId.trim() ||
                isCreating ||
                isJoining ||
                !user.username.trim()
              }
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {isJoining ? "Joining..." : "Join Room"}
            </button>
          </div>
          {!user.username.trim() && (
            <p className="text-red-400 text-sm mt-2 text-center">
              Please enter a username to join a room
            </p>
          )}
        </div>
      </div>

      <div className="text-left bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h4 className="text-white text-lg mb-4 font-medium">How it works:</h4>
        <ul className="space-y-2 text-gray-400">
          <li>• Create a room to start a new collaborative session</li>
          <li>• Share the room ID with others to invite them</li>
          <li>• Up to 3 participants can join each room</li>
          <li>• Code changes are synchronized in real-time</li>
          <li>• Use the AI assistant to generate code from prompts</li>
        </ul>
      </div>
    </div>
  );
};

export default RoomManager;
