import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import { toast } from "react-toastify";
import { FileSystemProvider } from "../contexts/FileSystemContext";
import CodeEditor from "../components/CodeEditor";
import PromptInput from "../components/PromptInput";
import ParticipantsList from "../components/ParticipantsList";
import FileExplorer from "../components/FileExplorer";
import TabSystem from "../components/TabSystem";
import StatusBar from "../components/StatusBar";

const API_BASE_URL = "http://localhost:3001/api";
const SOCKET_URL = "http://localhost:3001";

function Editor() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [socket, setSocket] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isJoining, setIsJoining] = useState(true);
  const [joinError, setJoinError] = useState(null);
  const [_typingUsers, setTypingUsers] = useState(new Set());
  const [user, setUser] = useState(() => {
    // Try to get user data from localStorage, fallback to default
    const savedUser = localStorage.getItem("overlook_user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Use the same ID across sessions for proper reconnection
        return {
          ...parsedUser,
          id:
            parsedUser.id ||
            `user_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        };
      } catch (error) {
        console.error("Error parsing saved user data:", error);
      }
    }
    // Fallback to default user
    const newUser = {
      id: `user_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      username: `User_${Math.floor(Math.random() * 1000)}`,
    };
    // Save the new user to localStorage
    localStorage.setItem("overlook_user", JSON.stringify(newUser));
    return newUser;
  });

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      auth: {
        token: "mock-token",
      },
      // Add reconnection options for better reliability
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    newSocket.on("connect", () => {
      console.log("Connected to server");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    newSocket.on("reconnect", () => {
      console.log("Reconnected to server");
      setIsConnected(true);
      // Automatically rejoin the room after reconnection
      if (roomId && user.id) {
        console.log("Auto-rejoining room after reconnection");
        newSocket.emit("join-room", {
          roomId: roomId,
          userId: user.id,
          username: user.username,
          token: "mock-token",
        });
      }
    });

    newSocket.on("room-joined", (data) => {
      console.log("Joined room:", data);
      setParticipants(data.users || []);
      setIsJoining(false);
      setJoinError(null);

      // Show success toast
      toast.success(`Successfully joined room ${data.roomId}`, {
        position: "bottom-right",
      });

      // Sync file system data if available
      if (data.files || data.folders) {
        // Store sync data for the FileSystemProvider to use
        window.roomSyncData = {
          files: data.files || [],
          folders: data.folders || [],
        };
      }
    });

    newSocket.on("code-updated", (data) => {
      console.log("Code updated:", data);
      // Note: File system updates will be handled by the context
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

      // Show user joined toast
      toast.info(`${data.username} joined the room`, {
        position: "bottom-right",
      });
    });

    newSocket.on("user-left", (data) => {
      console.log("User left:", data);
      setParticipants((prev) => prev.filter((p) => p.userId !== data.userId));

      // Show user left toast
      toast.warning(`${data.username} left the room`, {
        position: "bottom-right",
      });
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

    // Typing indicator events
    newSocket.on("user-typing", (data) => {
      setTypingUsers((prev) => {
        const newSet = new Set([...prev, data.username]);

        // Show typing toast (only for first time typing)
        if (!prev.has(data.username)) {
          toast.info(`${data.username} is typing...`, {
            position: "bottom-right",
            autoClose: 2000,
          });
        }

        return newSet;
      });
    });

    newSocket.on("user-stopped-typing", (data) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.username);
        return newSet;
      });
    });

    // File operation events with toast notifications
    newSocket.on("file-created", (data) => {
      if (data.createdBy !== user.username) {
        toast.success(`${data.createdBy} created file: ${data.fileData.name}`, {
          position: "bottom-right",
        });
      }
    });

    newSocket.on("folder-created", (data) => {
      if (data.createdBy !== user.username) {
        toast.success(
          `${data.createdBy} created folder: ${data.folderData.name}`,
          {
            position: "bottom-right",
          }
        );
      }
    });

    newSocket.on("file-deleted", (data) => {
      if (data.deletedBy !== user.username) {
        toast.warning(`${data.deletedBy} deleted a file`, {
          position: "bottom-right",
        });
      }
    });

    newSocket.on("folder-deleted", (data) => {
      if (data.deletedBy !== user.username) {
        toast.warning(`${data.deletedBy} deleted a folder`, {
          position: "bottom-right",
        });
      }
    });

    newSocket.on("file-renamed", (data) => {
      if (data.renamedBy !== user.username) {
        toast.info(`${data.renamedBy} renamed a file to: ${data.newName}`, {
          position: "bottom-right",
        });
      }
    });

    newSocket.on("folder-renamed", (data) => {
      if (data.renamedBy !== user.username) {
        toast.info(`${data.renamedBy} renamed a folder to: ${data.newName}`, {
          position: "bottom-right",
        });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [roomId, user.id, user.username]);

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
  }, [roomId, socket, isConnected, joinRoom, user.id, user.username]);

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

  // Handle code changes from editor (now handled by file system context)
  // This function is kept for compatibility with socket events

  // Handle AI code generation
  const handlePromptSubmit = async (prompt) => {
    if (!roomId) {
      alert("No room available");
      return;
    }

    try {
      // Note: This is a simplified approach - in a real app you'd pass current file content through props
      const response = await axios.post(`${API_BASE_URL}/rooms/generate-code`, {
        prompt,
        currentCode: "", // Will be updated when we have access to file system
        roomId: roomId,
      });

      if (response.data.success) {
        const generatedCode = response.data.generatedCode;

        // Send the generated code to WebSocket for broadcasting
        if (socket) {
          socket.emit("full-code-update", {
            code: generatedCode,
            language: "javascript",
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
    // Save updated user data to localStorage (including the persistent ID)
    const userDataForStorage = {
      id: user.id,
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
    <FileSystemProvider socket={socket} user={user}>
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

        <main className="flex-1 flex flex-col bg-gray-900">
          <div className="flex flex-1 min-h-0">
            {/* File Explorer Sidebar */}
            <div className="w-64 bg-gray-900 border-r border-gray-700">
              <FileExplorer />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Tab System */}
              <TabSystem />

              {/* Editor and Sidebar */}
              <div className="flex flex-1 min-h-0">
                <div className="flex-1 flex flex-col">
                  <CodeEditor />
                </div>

                <div className="w-80 p-6 bg-gray-900 overflow-y-auto border-l border-gray-700">
                  <PromptInput onSubmit={handlePromptSubmit} />
                </div>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <StatusBar />
        </main>
      </div>
    </FileSystemProvider>
  );
}

export default Editor;
