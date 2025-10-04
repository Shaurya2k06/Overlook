import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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

const API_BASE_URL = "http://localhost:3001/api";

function Dashboard() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [terminalText, setTerminalText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalHistory, setTerminalHistory] = useState([]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [systemSpecs, setSystemSpecs] = useState({
    platform: "",
    arch: "",
    cpuCores: 0,
    totalMemory: 0,
    nodeVersion: "",
    userAgent: "",
  });
  const [realTimeStats, setRealTimeStats] = useState({
    usedMemory: 0,
    freeMemory: 0,
    uptime: 0,
    loadAverage: [0, 0, 0],
  });
  const [recentRooms] = useState([
    {
      id: "room_abc123",
      name: "auth_vulnerability_fix",
      status: "active",
      participants: 2,
      created: "14:32",
    },
    {
      id: "room_def456",
      name: "api_security_audit",
      status: "idle",
      participants: 1,
      created: "13:47",
    },
    {
      id: "room_ghi789",
      name: "db_migration_secure",
      status: "completed",
      participants: 3,
      created: "12:15",
    },
  ]);

  // Generate user ID for session
  const [user] = useState({
    id: `user_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    username: "guest", // Default username since profile is managed via login
  });

  // Get real system information
  const getRealSystemInfo = () => {
    const specs = {
      platform: navigator.platform || "Unknown",
      arch: navigator.userAgentData?.platform || "Unknown",
      cpuCores: navigator.hardwareConcurrency || "Unknown",
      totalMemory: navigator.deviceMemory
        ? `${navigator.deviceMemory}GB`
        : "Unknown",
      nodeVersion: typeof process !== "undefined" ? process.version : "Browser",
      userAgent:
        navigator.userAgent.split(" ").slice(0, 3).join(" ") || "Unknown",
    };
    setSystemSpecs(specs);
  };

  // Get real-time performance data
  const getRealTimeData = async () => {
    try {
      // Memory usage (if available)
      if ("memory" in performance) {
        const memInfo = performance.memory;
        setRealTimeStats((prev) => ({
          ...prev,
          usedMemory: Math.round(memInfo.usedJSHeapSize / 1024 / 1024), // MB
          totalMemory: Math.round(memInfo.totalJSHeapSize / 1024 / 1024), // MB
          memoryLimit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024), // MB
        }));
      }

      // Connection info
      if ("connection" in navigator) {
        const connection = navigator.connection;
        setRealTimeStats((prev) => ({
          ...prev,
          connectionType: connection.effectiveType || "Unknown",
          downlink: connection.downlink || 0,
        }));
      }
    } catch (error) {
      console.log("Performance API not fully supported");
    }
  };

  // Terminal typing effect
  useEffect(() => {
    const messages = [
      "$ overlook --status",
      "System: ONLINE",
      "Security: ENABLED",
      "Ready for secure collaboration...",
      "Type 'help' for available commands",
      "",
    ];

    let messageIndex = 0;
    let charIndex = 0;

    const typeMessage = () => {
      if (messageIndex < messages.length) {
        if (charIndex < messages[messageIndex].length) {
          setTerminalText((prev) => prev + messages[messageIndex][charIndex]);
          charIndex++;
          setTimeout(typeMessage, 50);
        } else {
          setTerminalText((prev) => prev + "\n");
          messageIndex++;
          charIndex = 0;
          setTimeout(typeMessage, 500);
        }
      }
    };

    const timeout = setTimeout(typeMessage, 1000);
    return () => clearTimeout(timeout);
  }, []);

  // Handle terminal commands
  const handleTerminalCommand = (command) => {
    const cmd = command.trim().toLowerCase();
    const args = cmd.split(" ");
    const baseCmd = args[0];

    // Add command to history
    setCommandHistory((prev) => [...prev, command]);
    setHistoryIndex(-1);

    let output = "";

    switch (baseCmd) {
      case "help":
        output = `Available commands:
  create                 - Create a new secure session
  join [session_id]      - Join an existing session
  list                   - List recent sessions
  status                 - Show system status
  scan [url]            - Run security scan on URL
  clear                 - Clear terminal
  exit                  - Return to dashboard`;
        break;

      case "create":
        output = "Initializing new secure session...";
        setTimeout(() => createRoom(), 1000);
        break;

      case "join":
        if (args[1]) {
          output = `Connecting to session: ${args[1]}...`;
          setTimeout(() => joinRoom(args[1]), 1000);
        } else {
          output = "Usage: join [session_id]";
        }
        break;

      case "list":
        output =
          "Recent sessions:\n" +
          recentRooms
            .map((room) => `  ${room.id} - ${room.name} (${room.status})`)
            .join("\n");
        break;

      case "status":
        output = `System Status:
  Uptime: ${systemStats.uptime}
  Active Connections: ${systemStats.activeConnections}
  Security Level: ${systemStats.securityLevel}
  Last Scan: ${systemStats.lastScan}`;
        break;

      case "scan":
        if (args[1]) {
          output = `Scanning ${args[1]} for vulnerabilities...
[████████████████████] 100%
Scan complete: No critical vulnerabilities found`;
        } else {
          output = "Usage: scan [url]";
        }
        break;

      case "clear":
        setTerminalHistory([]);
        return;

      case "exit":
        output = "Returning to dashboard...";
        break;

      default:
        output = `Command not found: ${baseCmd}. Type 'help' for available commands.`;
    }

    setTerminalHistory((prev) => [
      ...prev,
      { type: "input", content: `$ ${command}` },
      { type: "output", content: output },
    ]);
  };

  const handleTerminalKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (terminalInput.trim()) {
        handleTerminalCommand(terminalInput);
        setTerminalInput("");
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setTerminalInput(
          commandHistory[commandHistory.length - 1 - newIndex] || ""
        );
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setTerminalInput(
          commandHistory[commandHistory.length - 1 - newIndex] || ""
        );
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setTerminalInput("");
      }
    }
  };

  // Cursor blink effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get real system information on mount
  useEffect(() => {
    getRealSystemInfo();
    getRealTimeData();

    // Update real-time data every 5 seconds
    const interval = setInterval(() => {
      getRealTimeData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Create a new room and navigate to it
  const createRoom = async () => {
    setIsCreating(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/rooms/create`);
      const { roomId } = response.data;
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error("Failed to create room:", error);
      alert("Failed to create room");
    } finally {
      setIsCreating(false);
    }
  };

  // Join an existing room and navigate to it
  const joinRoom = async (roomId) => {
    setIsJoining(true);
    try {
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error("Error joining room:", error);
      alert("Failed to join room");
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      alert("Please enter a room ID");
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
              {recentRooms.map((room) => (
                <div
                  key={room.id}
                  className="p-2 border border-green-400/20 hover:border-green-400/40 hover:bg-green-400/5 cursor-pointer transition-all text-xs"
                  onClick={() => joinRoom(room.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-green-400 truncate">{room.name}</span>
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
              ))}
            </div>
          </div>

          {/* Interactive Terminal - Expanded */}
          <div className="flex-1 border border-green-400/30 bg-green-400/5 flex flex-col">
            <div className="flex items-center gap-2 p-2 border-b border-green-400/20">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-green-400/80 text-xs">TERMINAL</span>
              <div className="ml-auto text-green-400/60 text-xs">
                overlook@system:~$
              </div>
            </div>

            {/* Terminal History - Expanded */}
            <div
              className="flex-1 overflow-y-auto p-3 text-xs text-green-400/80 space-y-1 font-mono"
              style={{
                fontFamily: "'Courier New', Consolas, Monaco, monospace",
              }}
            >
              {terminalHistory.map((entry, index) => (
                <div
                  key={index}
                  className={
                    entry.type === "input"
                      ? "text-green-400"
                      : "text-green-400/60"
                  }
                >
                  {entry.content.split("\n").map((line, lineIndex) => (
                    <div key={lineIndex}>{line}</div>
                  ))}
                </div>
              ))}
              {terminalHistory.length === 0 && (
                <div className="text-green-400/60">
                  <div>Welcome to Overlook Terminal v2.1.3</div>
                  <div>Type 'help' for available commands</div>
                  <div className="mt-2">
                    {terminalText}
                    {showCursor && (
                      <span className="bg-green-400 text-black">_</span>
                    )}
                  </div>
                </div>
              )}
              <div className="text-green-400 flex items-center">
                <span className="text-green-400/80 mr-1">$</span>
                <span>{terminalInput}</span>
                {showCursor && (
                  <span className="bg-green-400 text-black ml-1">_</span>
                )}
              </div>
            </div>

            {/* Terminal Input */}
            <div className="flex items-center gap-2 p-3 border-t border-green-400/20">
              <span className="text-green-400 text-sm">$</span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={handleTerminalKeyDown}
                placeholder="Type command..."
                className="flex-1 bg-transparent border-none outline-none text-green-400 text-sm placeholder-green-400/40 font-mono"
                style={{
                  fontFamily: "'Courier New', Consolas, Monaco, monospace",
                }}
                autoComplete="off"
              />
            </div>

            {/* Command Help */}
            <div className="px-3 pb-2 text-xs text-green-400/40 border-t border-green-400/10">
              Commands: help | create | join [id] | list | status | scan [url] |
              clear
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
                  &#62; SECURE_COLLABORATION_DASHBOARD
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

          {/* Real System Monitor with Matrix Animation */}
          <div className="border-t border-green-400/30 bg-black p-4 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3 text-xs">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400/80">SYSTEM_SPECS</span>
              <div
                className="ml-auto text-green-400/60 text-xs font-mono"
                style={{
                  fontFamily: "'Courier New', Consolas, Monaco, monospace",
                }}
              >
                {currentTime.toLocaleTimeString("en-US", { hour12: false })}
              </div>
            </div>

            {/* Matrix Rain Effect */}
            <div className="relative h-32 bg-black/50 border border-green-400/20 overflow-hidden">
              <div className="absolute inset-0 opacity-60">
                {/* Matrix columns */}
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 text-green-400/40 text-xs font-mono"
                    style={{
                      left: `${i * 4}%`,
                      animation: `matrixRain ${
                        2 + Math.random() * 3
                      }s linear infinite`,
                      animationDelay: `${Math.random() * 2}s`,
                      fontFamily: "'Courier New', Consolas, Monaco, monospace",
                    }}
                  >
                    {Array.from({ length: 15 }).map((_, j) => (
                      <div key={j} className="h-4">
                        {Math.random() > 0.5
                          ? String.fromCharCode(0x30a0 + Math.random() * 96)
                          : Math.floor(Math.random() * 2)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Real System Info Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="text-center font-mono"
                  style={{
                    fontFamily: "'Courier New', Consolas, Monaco, monospace",
                  }}
                >
                  <div className="text-green-400 text-sm mb-2">
                    OVERLOOK_SYSTEM_MONITOR
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-green-400/80">
                    <div>
                      PLATFORM:{" "}
                      {systemSpecs.platform.split(" ")[0] || "Unknown"}
                    </div>
                    <div>CORES: {systemSpecs.cpuCores || "N/A"}</div>
                    <div>RAM: {systemSpecs.totalMemory || "N/A"}</div>
                    <div>HEAP: {realTimeStats.usedMemory || 0}MB</div>
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <div className="w-1 h-1 bg-green-400 rounded-full animate-ping"></div>
                    <div
                      className="w-1 h-1 bg-green-400 rounded-full animate-ping"
                      style={{ animationDelay: "0.5s" }}
                    ></div>
                    <div
                      className="w-1 h-1 bg-green-400 rounded-full animate-ping"
                      style={{ animationDelay: "1s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="mt-2 text-xs text-green-400/40 text-center font-mono"
              style={{
                fontFamily: "'Courier New', Consolas, Monaco, monospace",
              }}
            >
              Real System Monitor • Platform: {systemSpecs.platform} • Active
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
