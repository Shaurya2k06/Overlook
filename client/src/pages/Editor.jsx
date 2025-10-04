import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import CodeEditor from "../components/CodeEditor";
import PromptInput from "../components/PromptInput";
import ParticipantsList from "../components/ParticipantsList";

const API_BASE_URL = "http://localhost:3001/api";
const SOCKET_URL = "http://localhost:3001";

function Editor() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [socket, setSocket] = useState(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [participants, setParticipants] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isJoining, setIsJoining] = useState(true);
  const [joinError, setJoinError] = useState(null);
  const [user, setUser] = useState(() => {
    // Try to get user data from localStorage, fallback to default
    const savedUser = localStorage.getItem("overlook_user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Generate a new ID for each new session to avoid conflicts
        return {
          ...parsedUser,
          id: `user_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        };
      } catch (error) {
        console.error("Error parsing saved user data:", error);
      }
    }
    // Fallback to default user
    return {
      id: `user_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      username: `User_${Math.floor(Math.random() * 1000)}`,
    };
  });

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      auth: {
        token: "mock-token",
      },
    });

    newSocket.on("connect", () => {
      console.log("Connected to server");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    newSocket.on("room-joined", (data) => {
      console.log("Joined room:", data);
      setCode(data.code || "");
      setLanguage(data.language || "javascript");
      setParticipants(data.users || []);
      setIsJoining(false);
      setJoinError(null);
    });

    newSocket.on("code-updated", (data) => {
      console.log("Code updated:", data);
      setCode(data.code);
      setLanguage(data.language);
    });

    newSocket.on("user-joined", (data) => {
      console.log("User joined:", data);
      setParticipants((prev) => [
        ...prev,
        {
          userId: data.userId,
          username: data.username,
          name: data.name,
        },
      ]);
    });

    newSocket.on("user-left", (data) => {
      console.log("User left:", data);
      setParticipants((prev) => prev.filter((p) => p.userId !== data.userId));
    });

    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
      setJoinError(error.message);
      setIsJoining(false);
    });

    newSocket.on("room-full", (error) => {
      console.error("Room full:", error);
      setJoinError(`Room is full: ${error.message}`);
      setIsJoining(false);
    });

    newSocket.on("room-not-found", (error) => {
      console.error("Room not found:", error);
      setJoinError(`Room not found: ${error.message}`);
      setIsJoining(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Join room function
  const joinRoom = useCallback(
    async (roomIdToJoin) => {
      try {
        setIsJoining(true);
        setJoinError(null);

        const response = await axios.post(
          `${API_BASE_URL}/rooms/join/${roomIdToJoin}`,
          {
            userId: user.id,
            username: user.username,
          }
        );

        if (response.data.success && socket) {
          socket.emit("join-room", {
            roomId: roomIdToJoin,
            userId: user.id,
            username: user.username,
            token: "mock-token",
          });
        }
      } catch (error) {
        console.error("Failed to join room:", error);
        setJoinError(
          error.response?.data?.message ||
            error.message ||
            "Failed to join room"
        );
        setIsJoining(false);
      }
    },
    [user.id, user.username, socket]
  );

  // Auto-join room when component mounts
  useEffect(() => {
    if (roomId && socket && isConnected) {
      joinRoom(roomId);
    }
  }, [roomId, socket, isConnected, joinRoom]);

  // Leave room
  const leaveRoom = async () => {
    if (roomId && socket) {
      try {
        await axios.post(`${API_BASE_URL}/rooms/leave/${roomId}`, {
          userId: user.id,
        });

        socket.emit("leave-room", { roomId });
        navigate("/dashboard");
      } catch (error) {
        console.error("Failed to leave room:", error);
        // Still navigate even if API call fails
        navigate("/dashboard");
      }
    }
  };

  // Handle code changes from editor
  const handleCodeChange = (newCode) => {
    setCode(newCode);

    if (socket && roomId) {
      socket.emit("code-change", {
        code: newCode,
        language: language,
      });
    }
  };

  // Handle AI code generation
  const handlePromptSubmit = async (prompt) => {
    if (!roomId) {
      alert("No room available");
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/rooms/generate-code`, {
        prompt,
        currentCode: code,
        roomId: roomId,
      });

      if (response.data.success) {
        const generatedCode = response.data.generatedCode;

        // Send the generated code to WebSocket for broadcasting
        if (socket) {
          socket.emit("full-code-update", {
            code: generatedCode,
            language: language,
            updatedBy: "AI Assistant",
          });
        }
      }
    } catch (error) {
      console.error("Failed to generate code:", error);
      alert(
        `Failed to generate code: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  // Update username
  const handleUsernameChange = (e) => {
    const updatedUser = {
      ...user,
      username: e.target.value,
    };
    setUser(updatedUser);
    // Save updated user data to localStorage (without the session-specific ID)
    const userDataForStorage = {
      username: e.target.value,
    };
    localStorage.setItem("overlook_user", JSON.stringify(userDataForStorage));
  };

  // Copy room URL to clipboard
  const copyRoomUrl = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert("Room URL copied to clipboard!");
    });
  };

  // Loading state
  if (isJoining) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Joining Room...</h2>
          <p className="text-gray-400">
            Please wait while we connect you to the room.
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (joinError) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-red-400 mb-2">
              Unable to Join Room
            </h2>
            <p className="text-gray-300 mb-4">{joinError}</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="bg-gray-800 px-8 py-4 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-white">
            Overlook - Room {roomId}
          </h1>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isConnected
                  ? "bg-emerald-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={copyRoomUrl}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Copy Link
          </button>
          <button
            onClick={leaveRoom}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            Leave Room
          </button>
        </div>
      </header>

      {/* Username input overlay */}
      <div className="bg-gray-800 border-b border-gray-700 px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label
              htmlFor="username"
              className="text-sm font-medium text-gray-300"
            >
              Username:
            </label>
            <input
              id="username"
              type="text"
              value={user.username}
              onChange={handleUsernameChange}
              className="px-3 py-1 border border-gray-600 rounded bg-gray-700 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <ParticipantsList participants={participants} />
        </div>
      </div>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <div className="h-[calc(100vh-200px)] flex flex-col bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          <div className="flex flex-1 min-h-0">
            <div className="flex-1 flex flex-col border-r border-gray-700">
              <CodeEditor
                code={code}
                language={language}
                onChange={handleCodeChange}
                onLanguageChange={setLanguage}
              />
            </div>

            <div className="w-80 p-6 bg-gray-900 overflow-y-auto">
              <PromptInput onSubmit={handlePromptSubmit} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Editor;
