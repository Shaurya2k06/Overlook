import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import { toast } from "react-toastify";
import { 
  Terminal, 
  Shield, 
  Activity, 
  Users, 
  Server, 
  Clock, 
  Wifi, 
  WifiOff,
  Copy,
  LogOut,
  Eye,
  Code
} from "lucide-react";
import { FileSystemProvider } from "../contexts/FileSystemContext";
import CodeEditor from "../components/CodeEditor";
import GlobalTerminal from "../components/GlobalTerminal";
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemSpecs, setSystemSpecs] = useState({
    platform: '',
    cpuCores: 0,
    totalMemory: 0
  });
  const [realTimeStats, setRealTimeStats] = useState({
    usedMemory: 0,
    connectionLatency: 0,
    downlink: 0,
    effectiveType: 'unknown'
  });
  const [wifiSpeed, setWifiSpeed] = useState({
    download: 0,
    upload: 0,
    ping: 0
  });
  const [showCursor, setShowCursor] = useState(true);
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [isTerminalVisible, setIsTerminalVisible] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
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

  // Get real system information
  const getRealSystemInfo = () => {
    const specs = {
      platform: navigator.platform || 'Unknown',
      cpuCores: navigator.hardwareConcurrency || 'Unknown',
      totalMemory: navigator.deviceMemory ? `${navigator.deviceMemory}GB` : 'Unknown'
    };
    setSystemSpecs(specs);
  };

  // Get real-time performance data
  const getRealTimeData = () => {
    try {
      if ('memory' in performance) {
        const memInfo = performance.memory;
        setRealTimeStats(prev => ({
          ...prev,
          usedMemory: Math.round(memInfo.usedJSHeapSize / 1024 / 1024)
        }));
      }

      // Get network connection info
      if ('connection' in navigator) {
        const connection = navigator.connection;
        setRealTimeStats(prev => ({
          ...prev,
          downlink: connection.downlink || 0,
          effectiveType: connection.effectiveType || 'unknown'
        }));
      }
    } catch (error) {
      console.log('Performance API not supported');
    }
  };

  // Simulate WiFi speed monitoring
  const getWifiSpeed = () => {
    if (navigator.connection) {
      const connection = navigator.connection;
      setWifiSpeed({
        download: Math.round((connection.downlink || Math.random() * 100) * 10) / 10,
        upload: Math.round((connection.downlink || Math.random() * 50) * 0.8 * 10) / 10,
        ping: Math.round(20 + Math.random() * 30)
      });
    } else {
      // Fallback simulation
      setWifiSpeed({
        download: Math.round((50 + Math.random() * 100) * 10) / 10,
        upload: Math.round((20 + Math.random() * 50) * 10) / 10,
        ping: Math.round(15 + Math.random() * 25)
      });
    }
  };

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
      addToAuditLog("WebSocket connection established", 'success');
      addToAuditLog("Encryption protocol activated", 'info');
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
      addToAuditLog("Connection lost - attempting reconnection", 'warning');
    });

    newSocket.on("reconnect", () => {
      console.log("Reconnected to server");
      addToAuditLog("Connection restored successfully", 'success');
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

      // Show success notification in terminal
      addTerminalNotification(`Successfully joined room ${data.roomId}`, 'success');

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

      // Show user joined notification in terminal
      addTerminalNotification(`${data.username} joined the room`, 'info');
    });

    newSocket.on("user-left", (data) => {
      console.log("User left:", data);
      setParticipants((prev) => prev.filter((p) => p.userId !== data.userId));

      // Show user left notification in terminal
      addTerminalNotification(`${data.username} left the room`, 'warning');
    });

    newSocket.on("user-reconnected", (data) => {
      console.log("User reconnected:", data);
      // Update participants list to reflect reconnection
      setParticipants((prev) => {
        const existingIndex = prev.findIndex((p) => p.userId === data.userId);
        if (existingIndex >= 0) {
          // Update existing participant
          const updated = [...prev];
          updated[existingIndex] = {
            userId: data.userId,
            username: data.username,
            name: data.name,
          };
          return updated;
        } else {
          // Add participant if not found (shouldn't happen but just in case)
          return [
            ...prev,
            {
              userId: data.userId,
              username: data.username,
              name: data.name,
            },
          ];
        }
      });

      // Show user reconnected notification in terminal
      addTerminalNotification(`${data.username} reconnected to the room`, 'info');
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

        // Show typing notification in terminal (only for first time typing)
        if (!prev.has(data.username)) {
          addTerminalNotification(`${data.username} is typing...`, 'info');
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

    // File operation events with terminal notifications
    newSocket.on("file-created", (data) => {
      if (data.createdBy !== user.username) {
        addTerminalNotification(`${data.createdBy} created file: ${data.fileData.name}`, 'success');
      }
    });

    newSocket.on("folder-created", (data) => {
      if (data.createdBy !== user.username) {
        addTerminalNotification(`${data.createdBy} created folder: ${data.folderData.name}`, 'success');
      }
    });

    newSocket.on("file-deleted", (data) => {
      if (data.deletedBy !== user.username) {
        addTerminalNotification(`${data.deletedBy} deleted a file`, 'warning');
      }
    });

    newSocket.on("folder-deleted", (data) => {
      if (data.deletedBy !== user.username) {
        addTerminalNotification(`${data.deletedBy} deleted a folder`, 'warning');
      }
    });

    newSocket.on("file-renamed", (data) => {
      if (data.renamedBy !== user.username) {
        addTerminalNotification(`${data.renamedBy} renamed a file to: ${data.newName}`, 'info');
      }
    });

    newSocket.on("folder-renamed", (data) => {
      if (data.renamedBy !== user.username) {
        addTerminalNotification(`${data.renamedBy} renamed a folder to: ${data.newName}`, 'info');
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [roomId, user.id, user.username]);

  // Add real-time monitoring
  useEffect(() => {
    getRealSystemInfo();
    getRealTimeData();
    getWifiSpeed();

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Update system stats every 5 seconds
    const statsInterval = setInterval(() => {
      getRealTimeData();
      getWifiSpeed();
    }, 5000);

    // Cursor blink effect
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => {
      clearInterval(timeInterval);
      clearInterval(statsInterval);
      clearInterval(cursorInterval);
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
      setTerminalOutput(prev => [...prev, { 
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'error', 
        message: 'No room available', 
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
      }]);
      return;
    }

    setTerminalOutput(prev => [...prev, { 
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'command', 
      message: `Generating code: ${prompt}`, 
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
    }]);

    try {
      // Note: This is a simplified approach - in a real app you'd pass current file content through props
      const response = await axios.post(`${API_BASE_URL}/rooms/generate-code`, {
        prompt,
        currentCode: "", // Will be updated when we have access to file system
        roomId: roomId,
      });

      if (response.data.success) {
        const generatedCode = response.data.generatedCode;
        setTerminalOutput(prev => [...prev, { 
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'success', 
          message: 'Code generated successfully', 
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
        }]);

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
      setTerminalOutput(prev => [...prev, { 
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'error', 
        message: `Failed to generate code: ${error.response?.data?.message || error.message}`, 
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
      }]);
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
      setTerminalOutput(prev => [...prev, { 
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'success', 
        message: 'Room URL copied to clipboard!', 
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
      }]);
    });
  };

  // Handle terminal output from global terminal
  const handleTerminalOutput = (output) => {
    setTerminalOutput(prev => [...prev, output]);
  };

  // Add terminal notification helper
  const addTerminalNotification = (message, type = 'info') => {
    const notification = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message,
      type,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
    };
    setTerminalOutput(prev => [...prev, notification]);
    setIsTerminalVisible(true);
    
    // Also add to audit logs for system output
    addToAuditLog(message, type);
    
    // Auto-close after 5 seconds for non-error messages
    if (type !== 'error') {
      setTimeout(() => {
        setIsTerminalVisible(false);
      }, 5000);
    }
  };

  // Add system output to audit logs
  const addToAuditLog = (message, type = 'info') => {
    const logEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message,
      type,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
    };
    setAuditLogs(prev => [...prev.slice(-50), logEntry]); // Keep last 50 entries
  };

  // Loading state
  if (isJoining) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center" style={{ fontFamily: "'Courier New', Consolas, Monaco, monospace" }}>
        <div className="text-center">
          <div className="mb-4">
            <Terminal className="w-12 h-12 text-green-400 mx-auto mb-4 animate-pulse" />
          </div>
          <div className="text-lg mb-2">INITIALIZING SECURE CONNECTION...</div>
          <div className="text-green-400/60 text-sm">Establishing encrypted tunnel to room {roomId}</div>
          <div className="flex items-center justify-center gap-1 mt-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (joinError) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center" style={{ fontFamily: "'Courier New', Consolas, Monaco, monospace" }}>
        <div className="text-center border border-red-400/30 bg-red-400/5 p-8">
          <div className="mb-4">
            <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          </div>
          <div className="text-red-400 text-lg mb-2">CONNECTION_FAILED</div>
          <div className="text-red-400/60 text-sm mb-6">
            Error: {joinError}
          </div>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-green-400 text-black hover:bg-green-300 transition-all text-sm font-bold"
            >
              [RETRY_CONNECTION]
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full px-6 py-3 bg-red-400 text-black hover:bg-red-300 transition-all text-sm font-bold"
            >
              [RETURN_TO_DASHBOARD]
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FileSystemProvider socket={socket} user={user}>
      <div className="min-h-screen bg-black text-green-400 font-mono flex flex-col" style={{ fontFamily: "'Courier New', Consolas, Monaco, monospace" }}>
        {/* Terminal Header */}
        <header className="border-b border-green-400/30 bg-black/50">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm">OVERLOOK_SECURE_SESSION</span>
              </div>
              <div className="text-green-400/60 text-xs">|</div>
              <div className="text-green-400/60 text-xs">
                ROOM: {roomId}
              </div>
              <div className="text-green-400/60 text-xs">|</div>
              <div className="text-green-400/60 text-xs">
                {currentTime.toLocaleTimeString('en-US', { hour12: false })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs">
                {isConnected ? (
                  <>
                    <Wifi className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">
                      {realTimeStats.downlink > 0 ? `${realTimeStats.downlink}Mbps` : 'CONNECTED'}
                      {realTimeStats.effectiveType && realTimeStats.effectiveType !== 'unknown' && (
                        <span className="text-green-400/60 ml-1">({realTimeStats.effectiveType.toUpperCase()})</span>
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-red-400" />
                    <span className="text-red-400">DISCONNECTED</span>
                  </>
                )}
              </div>
              <button
                onClick={copyRoomUrl}
                className="px-3 py-1 border border-green-400/30 hover:bg-green-400/10 text-green-400 text-xs transition-all flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                [COPY_LINK]
              </button>
              <button
                onClick={leaveRoom}
                className="px-3 py-1 border border-red-400/30 hover:bg-red-400/10 text-red-400 text-xs transition-all flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                [EXIT_SESSION]
              </button>
            </div>
          </div>
        </header>

        {/* System Status Bar */}
        <div className="border-b border-green-400/30 bg-green-400/5 px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3 text-green-400" />
                <span className="text-green-400/80">PARTICIPANTS: {participants.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Server className="w-3 h-3 text-green-400" />
                <span className="text-green-400/80">PLATFORM: {systemSpecs.platform}</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-green-400" />
                <span className="text-green-400/80">HEAP: {realTimeStats.usedMemory}MB</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ParticipantsList participants={participants} terminalStyle={true} />
            </div>
          </div>
        </div>

        <main className="flex-1 flex flex-col bg-black">
          <div className="flex flex-1 min-h-0">
            {/* File Explorer Sidebar */}
            <div className="w-64 bg-black border-r border-green-400/30">
              <div className="border-b border-green-400/30 p-3">
                <div className="flex items-center gap-2 text-xs">
                  <Code className="w-3 h-3 text-green-400" />
                  <span className="text-green-400/80">FILE_SYSTEM</span>
                </div>
              </div>
              <FileExplorer />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Tab System */}
              <div className="border-b border-green-400/30">
                <TabSystem />
              </div>

              {/* Editor and Sidebar */}
              <div className="flex flex-1 min-h-0">
                <div className="flex-1 flex flex-col">
                  {/* Code Editor */}
                  <div className="flex-1">
                    <CodeEditor />
                  </div>
                  
                  {/* Audit Logs - Bottom Middle */}
                  <div className="h-32 border-t border-green-400/30 bg-green-400/5">
                    <div className="border-b border-green-400/30 p-2">
                      <div className="flex items-center gap-2">
                        <Activity className="w-3 h-3 text-green-400" />
                        <span className="text-green-400/80 text-xs font-bold">AUDIT_LOG</span>
                        <div className="ml-auto text-green-400/60 text-xs">
                          {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                        </div>
                      </div>
                    </div>
                    <div 
                      className="p-2 overflow-y-auto h-24 text-xs space-y-1"
                      style={{ fontFamily: "'Courier New', Consolas, Monaco, monospace" }}
                    >
                      {/* System initialization log */}
                      <div className="text-green-400/60">
                        [{new Date().toLocaleTimeString('en-US', { hour12: false })}] SYSTEM_INITIALIZED - Room: {roomId}
                      </div>
                      
                      {/* Real audit logs from system output */}
                      {auditLogs.slice(-10).map((log) => (
                        <div 
                          key={log.id} 
                          className={`${
                            log.type === 'error' ? 'text-red-400' :
                            log.type === 'warning' ? 'text-yellow-400' :
                            log.type === 'success' ? 'text-green-400' :
                            'text-green-400/60'
                          }`}
                        >
                          [{log.timestamp}] {log.message}
                        </div>
                      ))}
                      
                      {/* Connection status */}
                      <div className="text-green-400/60">
                        [{currentTime.toLocaleTimeString('en-US', { hour12: false })}] CONNECTION_STATUS: {isConnected ? 'SECURE' : 'DISCONNECTED'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-80 bg-black border-l border-green-400/30">
                  <div className="border-b border-green-400/30 p-3">
                    <div className="flex items-center gap-2 text-xs">
                      <Terminal className="w-3 h-3 text-green-400" />
                      <span className="text-green-400/80">AI_ASSISTANT</span>
                    </div>
                  </div>
                  <div className="p-6 overflow-y-auto h-full">
                    <PromptInput onSubmit={handlePromptSubmit} />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </main>
        
        {/* Terminal Toggle Button */}
        <button
          onClick={() => setIsTerminalVisible(!isTerminalVisible)}
          className="fixed bottom-4 right-4 z-40 p-3 bg-green-400 text-black hover:bg-green-300 transition-all shadow-lg border border-green-400/50 rounded-none"
          style={{ fontFamily: "'Courier New', Consolas, Monaco, monospace" }}
          title="Toggle Terminal"
        >
          <Terminal className="w-5 h-5" />
        </button>
        
        {/* Global Terminal */}
        <GlobalTerminal 
          onOutput={handleTerminalOutput} 
          terminalOutput={terminalOutput}
          isVisible={isTerminalVisible}
          onVisibilityChange={setIsTerminalVisible}
        />
      </div>
    </FileSystemProvider>
  );
}

export default Editor;
