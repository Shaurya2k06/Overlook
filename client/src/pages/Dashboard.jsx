import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import fetchData from "../../service/backendApi";
import {
  Terminal,
  User,
  Server,
  Shield,
  ChevronRight,
  Hash,
  GitBranch,
  Activity,
  Zap,
  Clock,
  Users,
  Code,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import GlobalTerminal from "../components/GlobalTerminal";

const API_BASE_URL = "https://overlook-6yrs.onrender.com/api";

function Dashboard() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardTerminalOutput, setDashboardTerminalOutput] = useState([]);
  const [showGlobalTerminal, setShowGlobalTerminal] = useState(false);

  // Terminal notification function
  const addTerminalNotification = useCallback((message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp,
    };
    setDashboardTerminalOutput((prev) => [...prev, notification]);

    // Auto-show terminal for notifications
    setShowGlobalTerminal(true);

    // Auto-hide after 5 seconds for non-error messages
    if (type !== "error") {
      setTimeout(() => {
        setShowGlobalTerminal(false);
      }, 5000);
    }
  }, []);

  // Real recent rooms state
  const [recentRooms, setRecentRooms] = useState([]);

  // Load recent rooms from localStorage on component mount
  useEffect(() => {
    const loadRecentRooms = () => {
      const stored = localStorage.getItem("overlook_recent_rooms");
      if (stored) {
        try {
          const rooms = JSON.parse(stored);
          // Sort by lastJoined timestamp and take the 5 most recent
          const sortedRooms = rooms
            .sort((a, b) => new Date(b.lastJoined) - new Date(a.lastJoined))
            .slice(0, 5);
          setRecentRooms(sortedRooms);
        } catch (error) {
          console.error("Error loading recent rooms:", error);
          setRecentRooms([]);
        }
      }
    };

    loadRecentRooms();
  }, []);

  // Function to add a room to recent rooms
  const addToRecentRooms = useCallback((roomData) => {
    const newRoom = {
      id: roomData.id,
      name: roomData.name || `room_${roomData.id}`,
      status: "active",
      participants: roomData.participants || 1,
      created: new Date().toLocaleTimeString("en-US", { hour12: false }),
      lastJoined: new Date().toISOString(),
    };

    setRecentRooms((prev) => {
      // Remove existing room if present and add new one at the beginning
      const filtered = prev.filter((room) => room.id !== newRoom.id);
      const updated = [newRoom, ...filtered].slice(0, 5); // Keep only 5 most recent

      // Save to localStorage
      localStorage.setItem("overlook_recent_rooms", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Get user data from localStorage
  const [user] = useState(() => {
    const savedUser = localStorage.getItem("auth_email");
    if (savedUser) {
      try {
        const userId = localStorage.getItem("auth_user_id");
        return {
          id:
             userId ||
            `user_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          username: savedUser || "guest",
        };
      } catch (error) {
        console.error("Error parsing saved user data:", error);
      }
    }
    console.log(savedUser)
    // Fallback to default user
    return {
      id: `user_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      username: "guest",
    };
  });

  // Create a new room and navigate to it
  const createRoom = useCallback(async () => {
    setIsCreating(true);
    try {
      // Use the hybrid room creation endpoint that stores in DB and initializes websocket
      console.log("Creating hybrid room via API...");
      const response = await fetchData.post("/hybrid-rooms/create");
      console.log("Hybrid room creation response:", response.data);

      const { data } = response.data;
      const createdRoomId = data.roomId;
      console.log("Created room ID:", createdRoomId);

      // Add to recent rooms
      addToRecentRooms({
        id: createdRoomId,
        name: `room_${createdRoomId}`,
        participants: 1,
      });

      addTerminalNotification(
        `Room ${createdRoomId} created successfully`,
        "success"
      );
      console.log("Navigating to room:", `/room/${createdRoomId}`);
      navigate(`/room/${createdRoomId}`);
    } catch (error) {
      console.error("Failed to create room:", error);
      addTerminalNotification("Failed to create room", "error");
    } finally {
      setIsCreating(false);
    }
  }, [navigate, addToRecentRooms, addTerminalNotification]);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle terminal room creation command
  useEffect(() => {
    const handleTerminalCreateRoom = () => {
      createRoom();
    };

    // Add event listener for terminal commands
    window.addEventListener("terminal-create-room", handleTerminalCreateRoom);

    return () => {
      window.removeEventListener(
        "terminal-create-room",
        handleTerminalCreateRoom
      );
    };
  }, [createRoom]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Join an existing room and navigate to it
  const joinRoom = async (roomId) => {
    setIsJoining(true);
    try {
      // Add to recent rooms
      addToRecentRooms({
        id: roomId,
        name: `room_${roomId}`,
        participants: 1,
      });

      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error("Error joining room:", error);
      addTerminalNotification("Failed to join room", "error");
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      addTerminalNotification("Please enter a room ID", "warning");
      return;
    }
    await joinRoom(roomId.trim());
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-green-400";
      case "idle":
        return "text-yellow-400";
      case "completed":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <Activity className="w-3 h-3" />;
      case "idle":
        return <Clock className="w-3 h-3" />;
      case "completed":
        return <CheckCircle className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  return (
    <div
      className="min-h-screen bg-black text-green-400 font-mono overflow-hidden"
      style={{
        fontFamily: "'Courier New', Consolas, Monaco, 'Advercase', monospace",
      }}
    >
      {/* Terminal Header */}
      <div className="border-b border-green-400/30 bg-black">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm">
                OVERLOOK_TERMINAL_v2.1.3
              </span>
            </div>
            <div className="text-green-400/60 text-xs">|</div>
            <div className="text-green-400/60 text-xs">
              {currentTime.toLocaleTimeString("en-US", { hour12: false })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400/80">SECURE_CONNECTION</span>
            </div>
            <button
              onClick={() => navigate("/")}
              className="px-3 py-1 border border-green-400/30 hover:bg-green-400/10 text-green-400 text-xs transition-all"
            >
              [EXIT]
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-60px)]">
        {/* Left Sidebar - Recent Sessions and Terminal */}
        <div className="w-80 border-r border-green-400/30 bg-black/50 p-4 flex flex-col">
          <div className="mb-6">
            <h3 className="text-green-400 text-sm mb-3 flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              RECENT_SESSIONS
            </h3>
            <div className="space-y-2">
              {recentRooms.length > 0 ? (
                recentRooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-2 border border-green-400/20 hover:border-green-400/40 hover:bg-green-400/5 cursor-pointer transition-all text-xs"
                    onClick={() => joinRoom(room.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-green-400 truncate">
                        {room.name}
                      </span>
                      <div
                        className={`flex items-center gap-1 ${getStatusColor(
                          room.status
                        )}`}
                      >
                        {getStatusIcon(room.status)}
                      </div>
                    </div>
                    <div className="flex justify-between text-green-400/60">
                      <span>{room.participants} users</span>
                      <span>{room.created}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-green-400/60 text-xs p-2 border border-green-400/20 text-center">
                  No recent sessions found.
                  <br />
                  Create or join a room to see history.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Dashboard Content */}
          <div className="flex-1 p-6">
            <div
              className={`transition-all duration-1000 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            >
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl text-green-400 mb-2">
                  &#62; Hello, {user.username}
                </h1>
                <p className="text-green-400/60 text-sm">
                  Initialize secure coding environments with real-time
                  vulnerability detection
                </p>
              </div>

              {/* Main Actions Grid */}
              <div className="grid lg:grid-cols-3 gap-6 mb-8">
                {/* Create Room */}
                <div className="border border-green-400/30 bg-green-400/5 p-6 hover:border-green-400/50 hover:bg-green-400/10 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <Hash className="w-5 h-5 text-green-400" />
                    <h3 className="text-green-400 text-lg">
                      CREATE_NEW_SESSION
                    </h3>
                  </div>

                  <p className="text-green-400/60 text-sm mb-6 leading-relaxed">
                    Initialize a new secure collaborative environment with
                    AI-powered security validation and real-time code analysis.
                  </p>

                  <div className="grid grid-cols-3 gap-4 mb-6 text-xs">
                    <div className="text-center p-2 border border-green-400/20">
                      <Code className="w-4 h-4 text-green-400 mx-auto mb-1" />
                      <div className="text-green-400/60">REAL_TIME</div>
                    </div>
                    <div className="text-center p-2 border border-green-400/20">
                      <Shield className="w-4 h-4 text-green-400 mx-auto mb-1" />
                      <div className="text-green-400/60">SECURE</div>
                    </div>
                    <div className="text-center p-2 border border-green-400/20">
                      <Users className="w-4 h-4 text-green-400 mx-auto mb-1" />
                      <div className="text-green-400/60">MAX_3_USERS</div>
                    </div>
                  </div>

                  <button
                    onClick={createRoom}
                    disabled={isCreating}
                    className="w-full py-3 bg-green-400 text-black hover:bg-green-300 disabled:bg-green-400/50 disabled:cursor-not-allowed transition-all text-sm font-bold flex items-center justify-center gap-2"
                  >
                    {isCreating ? (
                      <>INITIALIZING...</>
                    ) : (
                      <>
                        [CREATE_SESSION]
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Join Room */}
                <div className="border border-green-400/30 bg-green-400/5 p-6 hover:border-green-400/50 hover:bg-green-400/10 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <Terminal className="w-5 h-5 text-green-400" />
                    <h3 className="text-green-400 text-lg">
                      JOIN_EXISTING_SESSION
                    </h3>
                  </div>

                  <p className="text-green-400/60 text-sm mb-6 leading-relaxed">
                    Connect to an active collaboration session using the session
                    identifier.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-green-400/80 text-xs mb-2">
                        SESSION_ID:
                      </label>
                      <input
                        type="text"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        placeholder="room_xxxxxxxxxx"
                        className="w-full px-3 py-2 bg-black border border-green-400/30 text-green-400 placeholder-green-400/40 focus:outline-none focus:border-green-400 text-sm font-mono"
                        disabled={isJoining}
                      />
                    </div>

                    <button
                      onClick={handleJoinRoom}
                      disabled={!roomId.trim() || isJoining}
                      className="w-full py-3 bg-transparent border border-green-400 text-green-400 hover:bg-green-400 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-bold flex items-center justify-center gap-2"
                    >
                      {isJoining ? (
                        <>CONNECTING...</>
                      ) : (
                        <>
                          [JOIN_SESSION]
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Attack Simulation */}
                <div className="border border-red-400/30 bg-red-400/5 p-6 hover:border-red-400/50 hover:bg-red-400/10 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-5 h-5 text-red-400" />
                    <h3 className="text-red-400 text-lg">SECURITY_TESTING</h3>
                  </div>

                  <p className="text-red-400/60 text-sm mb-6 leading-relaxed">
                    Simulate various attack vectors against your applications to
                    identify vulnerabilities.
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
                    <div className="text-center p-2 border border-red-400/20">
                      <AlertCircle className="w-4 h-4 text-red-400 mx-auto mb-1" />
                      <div className="text-red-400/60">SQL_INJECTION</div>
                    </div>
                    <div className="text-center p-2 border border-red-400/20">
                      <AlertCircle className="w-4 h-4 text-red-400 mx-auto mb-1" />
                      <div className="text-red-400/60">XSS_ATTACKS</div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate("/security-testing")}
                    className="w-full py-3 bg-red-400 text-black hover:bg-red-300 transition-all text-sm font-bold flex items-center justify-center gap-2"
                  >
                    [LAUNCH_TESTING]
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terminal Toggle Button */}
        <button
          onClick={() => setShowGlobalTerminal(!showGlobalTerminal)}
          className="fixed bottom-4 right-4 z-40 p-3 bg-green-400 text-black hover:bg-green-300 transition-all shadow-lg border border-green-400/50 rounded-none"
          style={{ fontFamily: "'Courier New', Consolas, Monaco, monospace" }}
          title="Toggle Terminal"
        >
          <Terminal className="w-5 h-5" />
        </button>

        {/* Global Terminal */}
        <GlobalTerminal
          onOutput={(output) =>
            setDashboardTerminalOutput((prev) => [...prev, output])
          }
          terminalOutput={dashboardTerminalOutput}
          isVisible={showGlobalTerminal}
          onVisibilityChange={setShowGlobalTerminal}
        />
      </div>
    </div>
  );
}

export default Dashboard;
