import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Terminal,
  Shield,
  AlertTriangle,
  Activity,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Target,
  Lock,
  Eye,
  Cpu,
  Network,
  Database,
  Upload,
  FileText,
  Play,
  Pause,
  Download,
  Trash2,
  RefreshCw,
  Settings,
  BarChart3,
  AlertCircle,
  Globe,
  Server,
  Code,
  Search,
  X,
} from "lucide-react";
import GlobalTerminal from "../components/GlobalTerminal";
import { getApiUrl } from "../config/environment.js";
const API_BASE_URL = "http://localhost:3001/api/security";

const SecurityTesting = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVisible, setIsVisible] = useState(false);
  const [showGlobalTerminal, setShowGlobalTerminal] = useState(false);
  const [dashboardTerminalOutput, setDashboardTerminalOutput] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Backend integration state
  const [apiStatus, setApiStatus] = useState("disconnected");
  const [availableExploits, setAvailableExploits] = useState([]);
  const [securityStats, setSecurityStats] = useState({});
  const [scanResults, setScanResults] = useState([]);
  const [activeScans, setActiveScans] = useState(new Set());

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedTarget, setSelectedTarget] = useState("");
  const [selectedExploits, setSelectedExploits] = useState([]);
  const [scanConfig, setScanConfig] = useState({
    timeout: 10000,

    maxDepth: 2,
    aggressive: false,
  });

  const API_BASE_URL = getApiUrl("/api/security");

  // Initialize and fetch data
  useEffect(() => {
    setIsVisible(true);
    checkApiStatus();
    fetchAvailableExploits();
    fetchSecurityStats();
    fetchScanResults();
    fetchUploadedFiles();
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      if (apiStatus === "connected") {
        fetchSecurityStats();
        fetchScanResults();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [apiStatus]);

  // API Functions
  const checkApiStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        setApiStatus("connected");
        addTerminalNotification(
          "Security API connected successfully",
          "success"
        );
      } else {
        setApiStatus("error");
        addTerminalNotification("Security API connection failed", "error");
      }
    } catch (error) {
      setApiStatus("error");
      addTerminalNotification("Unable to connect to Security API", "error");
    }
  };

  const fetchAvailableExploits = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/exploits`);
      if (response.ok) {
        const data = await response.json();
        setAvailableExploits(data.data.exploits);
        addTerminalNotification(
          `Loaded ${data.data.exploits.length} security exploits`,
          "info"
        );
      }
    } catch (error) {
      addTerminalNotification("Failed to fetch available exploits", "error");
    }
  };

  const fetchSecurityStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`);
      if (response.ok) {
        const data = await response.json();
        setSecurityStats(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch security stats:", error);
    }
  };

  const fetchScanResults = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/results`);
      if (response.ok) {
        const data = await response.json();
        setScanResults(data.data.results || []);
      }
    } catch (error) {
      console.error("Failed to fetch scan results:", error);
    }
  };

  const fetchUploadedFiles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/files`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.files) {
          const files = data.data.files.map((file) => ({
            id: file.id,
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.uploadTime).getTime(),
            uploaded: true,
          }));
          setUploadedFiles(files);
          if (files.length > 0) {
            addTerminalNotification(
              `Found ${files.length} previously uploaded files`,
              "info"
            );
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch uploaded files:", error);
    }
  };

  const runSingleExploit = async (exploitName, target) => {
    if (!target) {
      addTerminalNotification(
        "Please specify a target URL or upload files",
        "error"
      );
      return;
    }

    const scanId = `scan_${Date.now()}`;
    setActiveScans((prev) => new Set(prev).add(scanId));

    // Clear previous results when starting a new single exploit
    setScanResults([]);
    addTerminalNotification(
      "Cleared previous results - starting fresh scan",
      "info"
    );
    addTerminalNotification(
      `Starting ${exploitName} scan on ${target}`,
      "info"
    );

    try {
      const response = await fetch(`${API_BASE_URL}/${exploitName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target,
          options: scanConfig,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        addTerminalNotification(
          `${exploitName} scan completed - ${
            data.data.vulnerabilities?.length || 0
          } vulnerabilities found`,
          "success"
        );
        fetchScanResults();
      } else {
        addTerminalNotification(
          `${exploitName} scan failed: ${data.error}`,
          "error"
        );
      }
    } catch (error) {
      addTerminalNotification(
        `${exploitName} scan error: ${error.message}`,
        "error"
      );
    } finally {
      setActiveScans((prev) => {
        const newSet = new Set(prev);
        newSet.delete(scanId);
        return newSet;
      });
    }
  };

  const runSecuritySuite = async () => {
    if (!selectedTarget && uploadedFiles.length === 0) {
      addTerminalNotification(
        "Please specify a target URL or upload files",
        "error"
      );
      return;
    }

    if (selectedExploits.length === 0) {
      addTerminalNotification(
        "Please select at least one exploit to run",
        "error"
      );
      return;
    }

    const suiteId = `suite_${Date.now()}`;
    setActiveScans((prev) => new Set(prev).add(suiteId));

    // Clear previous results when starting a new scan
    setScanResults([]);
    addTerminalNotification(
      "Cleared previous results - starting fresh scan",
      "info"
    );

    try {
      let response, data;

      if (uploadedFiles.length > 0) {
        // Use file scanning endpoint for uploaded files
        addTerminalNotification(
          `Starting file scan with ${selectedExploits.length} exploits on ${uploadedFiles.length} files`,
          "info"
        );

        response = await fetch(`${API_BASE_URL}/scan-files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selectedExploits,
            options: scanConfig,
          }),
        });
      } else {
        // Use URL scanning endpoint for target URLs
        addTerminalNotification(
          `Starting URL scan with ${selectedExploits.length} exploits on ${selectedTarget}`,
          "info"
        );

        response = await fetch(`${API_BASE_URL}/suite`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target: selectedTarget,
            selectedExploits,
            options: scanConfig,
          }),
        });
      }

      data = await response.json();

      if (response.ok && data.success) {
        const totalVulns =
          data.data.results?.reduce(
            (sum, result) => sum + (result.vulnerabilities?.length || 0),
            0
          ) || 0;
        addTerminalNotification(
          `Security suite completed - ${totalVulns} total vulnerabilities found`,
          "success"
        );
        fetchScanResults();
      } else {
        addTerminalNotification(
          `Security suite failed: ${data.error}`,
          "error"
        );
      }
    } catch (error) {
      addTerminalNotification(
        `Security suite error: ${error.message}`,
        "error"
      );
    } finally {
      setActiveScans((prev) => {
        const newSet = new Set(prev);
        newSet.delete(suiteId);
        return newSet;
      });
    }
  };

  // File upload functions
  const handleFileUpload = async (files) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const newFiles = data.data.files.map((file) => ({
          id: file.id,
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: new Date().getTime(),
          uploaded: true,
        }));

        setUploadedFiles((prev) => [...prev, ...newFiles]);
        // Clear previous results when new files are uploaded
        setScanResults([]);
        addTerminalNotification(
          `Uploaded ${newFiles.length} file(s) for security testing`,
          "success"
        );
        addTerminalNotification(
          "Previous results cleared - ready for new scan",
          "info"
        );
      } else {
        addTerminalNotification(`Upload failed: ${data.error}`, "error");
      }
    } catch (error) {
      addTerminalNotification(`Upload error: ${error.message}`, "error");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const removeFile = async (fileId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
        addTerminalNotification("File removed from testing queue", "info");
      } else {
        addTerminalNotification("Failed to remove file", "error");
      }
    } catch (error) {
      addTerminalNotification(`Error removing file: ${error.message}`, "error");
    }
  };

  // Clear all results function
  const clearAllResults = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/results`, {
        method: "DELETE",
      });

      if (response.ok) {
        setScanResults([]);
        addTerminalNotification(
          "All scan results cleared from server",
          "success"
        );
      } else {
        addTerminalNotification("Failed to clear results from server", "error");
      }
    } catch (error) {
      addTerminalNotification(
        `Error clearing results: ${error.message}`,
        "error"
      );
    }
  };

  // Terminal notification helper
  const addTerminalNotification = (message, type = "info") => {
    const notification = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message,
      type,
      timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
    };
    setDashboardTerminalOutput((prev) => [...prev, notification]);

    if (type === "error") {
      setShowGlobalTerminal(true);
    }
  };

  // UI Helper functions
  const getStatusColor = (status) => {
    switch (status) {
      case "running":
        return "text-yellow-400";
      case "completed":
        return "text-green-400";
      case "failed":
        return "text-red-400";
      case "pending":
        return "text-green-400/60";
      default:
        return "text-green-400/80";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "running":
        return <Activity className="w-3 h-3 animate-pulse" />;
      case "completed":
        return <CheckCircle className="w-3 h-3" />;
      case "failed":
        return <XCircle className="w-3 h-3" />;
      case "pending":
        return <Clock className="w-3 h-3" />;
      default:
        return <Activity className="w-3 h-3" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "text-red-400 bg-red-400/20";
      case "high":
        return "text-orange-400 bg-orange-400/20";
      case "medium":
        return "text-yellow-400 bg-yellow-400/20";
      case "low":
        return "text-green-400 bg-green-400/20";
      default:
        return "text-green-400/60 bg-green-400/10";
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div
      className={`min-h-screen bg-black text-green-400 transition-opacity duration-1000 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      style={{ fontFamily: "'Courier New', Consolas, Monaco, monospace" }}
    >
      {/* Header */}
      <div className="border-b border-green-400/30 bg-black/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs">DASHBOARD</span>
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              <h1 className="text-green-400 text-lg font-bold">
                SECURITY_TESTING_LAB
              </h1>
            </div>
            <div className="text-green-400/60 text-xs">
              {currentTime.toLocaleTimeString("en-US", { hour12: false })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <div
                className={`w-2 h-2 rounded-full ${
                  apiStatus === "connected"
                    ? "bg-green-400 animate-pulse"
                    : apiStatus === "error"
                    ? "bg-red-400"
                    : "bg-yellow-400"
                }`}
              ></div>
              <span className="text-green-400/80">
                {apiStatus === "connected"
                  ? "API_CONNECTED"
                  : apiStatus === "error"
                  ? "API_ERROR"
                  : "CONNECTING..."}
              </span>
            </div>
            <button
              onClick={checkApiStatus}
              className="p-2 border border-green-400/30 hover:bg-green-400/10 text-green-400 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-green-400/30">
          {[
            { id: "dashboard", label: "DASHBOARD", icon: BarChart3 },
            { id: "exploits", label: "EXPLOITS", icon: Zap },
            { id: "files", label: "FILE_UPLOAD", icon: Upload },
            { id: "results", label: "RESULTS", icon: FileText },
            { id: "config", label: "CONFIG", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs border-r border-green-400/30 transition-all ${
                activeTab === tab.id
                  ? "bg-green-400/20 text-green-400"
                  : "text-green-400/60 hover:text-green-400 hover:bg-green-400/10"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Left Sidebar - Metrics */}
        <div className="w-80 border-r border-green-400/30 bg-black/50 p-4 flex flex-col">
          <div className="mb-6">
            <h3 className="text-green-400 text-sm mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              SECURITY_METRICS
            </h3>
            <div className="space-y-3">
              <div className="p-3 border border-green-400/20 bg-green-400/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-400/80 text-xs">
                    Security Score
                  </span>
                  <span className="text-green-400 font-bold">
                    {Math.round(
                      (scanResults.filter(
                        (r) => r.vulnerabilities?.length === 0
                      ).length /
                        Math.max(scanResults.length, 1)) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div className="w-full bg-green-400/20 h-2">
                  <div
                    className="bg-green-400 h-2 transition-all duration-300"
                    style={{
                      width: `${Math.round(
                        (scanResults.filter(
                          (r) => r.vulnerabilities?.length === 0
                        ).length /
                          Math.max(scanResults.length, 1)) *
                          100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 border border-red-400/30 bg-red-400/5">
                  <div className="text-red-400 text-xs">Active Scans</div>
                  <div className="text-red-400 font-bold text-lg">
                    {activeScans.size}
                  </div>
                </div>
                <div className="p-2 border border-yellow-400/30 bg-yellow-400/5">
                  <div className="text-yellow-400 text-xs">Exploits</div>
                  <div className="text-yellow-400 font-bold text-lg">
                    {availableExploits.length}
                  </div>
                </div>
              </div>

              <div className="p-3 border border-green-400/20 bg-green-400/5">
                <div className="text-green-400/80 text-xs mb-1">
                  Total Scans
                </div>
                <div className="text-green-400 text-sm">
                  {scanResults.length}
                </div>
              </div>

              <div className="p-3 border border-green-400/20 bg-green-400/5">
                <div className="text-green-400/80 text-xs mb-1">
                  Uploaded Files
                </div>
                <div className="text-green-400 text-sm">
                  {uploadedFiles.length}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <h3 className="text-green-400 text-sm mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              QUICK_ACTIONS
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab("exploits")}
                className="w-full p-2 border border-green-400/30 hover:bg-green-400/10 text-green-400 text-xs transition-all text-left"
              >
                [RUN] Security Exploits
              </button>
              <button
                onClick={() => setActiveTab("files")}
                className="w-full p-2 border border-green-400/30 hover:bg-green-400/10 text-green-400 text-xs transition-all text-left"
              >
                [UPLOAD] Test Files
              </button>
              <button
                onClick={() => setActiveTab("results")}
                className="w-full p-2 border border-green-400/30 hover:bg-green-400/10 text-green-400 text-xs transition-all text-left"
              >
                [VIEW] Scan Results
              </button>
              <button
                onClick={fetchScanResults}
                className="w-full p-2 border border-green-400/30 hover:bg-green-400/10 text-green-400 text-xs transition-all text-left"
              >
                [REFRESH] Data
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-green-400 text-lg font-bold">
                  SECURITY_DASHBOARD
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={runSecuritySuite}
                    disabled={activeScans.size > 0}
                    className="px-4 py-2 border border-green-400/30 hover:bg-green-400/10 text-green-400 text-xs transition-all disabled:opacity-50"
                  >
                    {activeScans.size > 0 ? "[SCANNING...]" : "[RUN_SUITE]"}
                  </button>
                </div>
              </div>

              {/* Recent Scans */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {scanResults.slice(0, 4).map((result, index) => (
                  <div
                    key={result.scanId || index}
                    className="border border-green-400/30 bg-green-400/5 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-green-400 font-bold text-sm">
                        {result.exploitName}
                      </span>
                      <div
                        className={`px-2 py-1 text-xs rounded ${getSeverityColor(
                          result.vulnerabilities?.length > 5
                            ? "critical"
                            : result.vulnerabilities?.length > 2
                            ? "high"
                            : result.vulnerabilities?.length > 0
                            ? "medium"
                            : "low"
                        )}`}
                      >
                        {result.vulnerabilities?.length || 0} VULNS
                      </div>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-green-400/80">Target:</span>
                        <span className="text-green-400 truncate ml-2">
                          {result.target}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-400/80">Scan Time:</span>
                        <span className="text-green-400">
                          {result.timestamp
                            ? new Date(result.timestamp).toLocaleTimeString()
                            : "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Security Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="border border-green-400/30 bg-green-400/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Database className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-bold text-sm">
                      DATABASE_SECURITY
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-green-400/80">SQL Injection:</span>
                      <span className="text-green-400">
                        {
                          scanResults.filter(
                            (r) => r.exploitName === "sqlInjection"
                          ).length
                        }{" "}
                        TESTS
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-400/80">
                        Vulnerabilities:
                      </span>
                      <span
                        className={
                          scanResults.filter(
                            (r) =>
                              r.exploitName === "sqlInjection" &&
                              r.vulnerabilities?.length > 0
                          ).length > 0
                            ? "text-red-400"
                            : "text-green-400"
                        }
                      >
                        {scanResults.filter(
                          (r) =>
                            r.exploitName === "sqlInjection" &&
                            r.vulnerabilities?.length > 0
                        ).length > 0
                          ? "FOUND"
                          : "NONE"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border border-green-400/30 bg-green-400/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Network className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-bold text-sm">
                      NETWORK_SECURITY
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-green-400/80">Port Scans:</span>
                      <span className="text-green-400">
                        {
                          scanResults.filter(
                            (r) => r.exploitName === "networkScanner"
                          ).length
                        }{" "}
                        TESTS
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-400/80">SSL Analysis:</span>
                      <span className="text-green-400">
                        {
                          scanResults.filter(
                            (r) => r.exploitName === "sslAnalyzer"
                          ).length
                        }{" "}
                        TESTS
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border border-green-400/30 bg-green-400/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-bold text-sm">
                      WEB_SECURITY
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-green-400/80">XSS Tests:</span>
                      <span className="text-green-400">
                        {
                          scanResults.filter((r) => r.exploitName === "xss")
                            .length
                        }{" "}
                        TESTS
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-400/80">CSRF Tests:</span>
                      <span className="text-green-400">
                        {
                          scanResults.filter((r) => r.exploitName === "csrf")
                            .length
                        }{" "}
                        TESTS
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Exploits Tab */}
          {activeTab === "exploits" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-green-400 text-lg font-bold">
                  SECURITY_EXPLOITS
                </h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Target URL (e.g., http://testphp.vulnweb.com)"
                    value={selectedTarget}
                    onChange={(e) => setSelectedTarget(e.target.value)}
                    className="px-3 py-2 bg-black border border-green-400/30 text-green-400 text-xs placeholder-green-400/50 focus:border-green-400 w-80"
                  />
                  <button
                    onClick={() => {
                      setSelectedExploits(availableExploits.map((e) => e.name));
                      addTerminalNotification(
                        "Selected all exploits for testing",
                        "info"
                      );
                    }}
                    className="px-4 py-2 border border-green-400/30 hover:bg-green-400/10 text-green-400 text-xs transition-all"
                  >
                    [SELECT_ALL]
                  </button>
                </div>
              </div>

              {/* User Guidance */}
              {uploadedFiles.length > 0 && selectedExploits.length === 0 && (
                <div className="border border-yellow-400/30 bg-yellow-400/5 p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 font-bold text-sm">
                      SELECT EXPLOITS TO TEST YOUR FILES
                    </span>
                  </div>
                  <div className="text-yellow-400/80 text-xs">
                    You have {uploadedFiles.length} file(s) uploaded. Click on
                    the exploits below to select them for testing, then run the
                    scan.
                  </div>
                  <div className="text-yellow-400/60 text-xs mt-2">
                    💡 New scans will automatically clear previous results to
                    show only current file vulnerabilities.
                  </div>
                </div>
              )}

              {selectedTarget && selectedExploits.length === 0 && (
                <div className="border border-blue-400/30 bg-blue-400/5 p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400 font-bold text-sm">
                      TARGET SET - SELECT EXPLOITS
                    </span>
                  </div>
                  <div className="text-blue-400/80 text-xs">
                    Target URL: {selectedTarget}. Select exploits below to test
                    this target.
                  </div>
                </div>
              )}

              {!selectedTarget && uploadedFiles.length === 0 && (
                <div className="border border-green-400/30 bg-green-400/5 p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-bold text-sm">
                      READY FOR TESTING
                    </span>
                  </div>
                  <div className="text-green-400/80 text-xs">
                    Enter a target URL above or upload files in the FILE_UPLOAD
                    tab, then select exploits to run.
                  </div>
                </div>
              )}

              {/* Exploit Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {availableExploits.map((exploit) => (
                  <div
                    key={exploit.name}
                    className={`border p-4 transition-all cursor-pointer ${
                      selectedExploits.includes(exploit.name)
                        ? "border-green-400 bg-green-400/10"
                        : "border-green-400/30 bg-green-400/5 hover:bg-green-400/10"
                    }`}
                    onClick={() => {
                      setSelectedExploits((prev) =>
                        prev.includes(exploit.name)
                          ? prev.filter((e) => e !== exploit.name)
                          : [...prev, exploit.name]
                      );
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-green-400 font-bold text-sm">
                        {exploit.displayName}
                      </span>
                      <div
                        className={`px-2 py-1 text-xs rounded ${getSeverityColor(
                          exploit.severity
                        )}`}
                      >
                        {exploit.severity.toUpperCase()}
                      </div>
                    </div>
                    <div className="space-y-1 text-xs mb-3">
                      <div className="text-green-400/80">
                        Category: {exploit.category}
                      </div>
                      <div className="text-green-400/80">
                        Type: {exploit.name}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          runSingleExploit(
                            exploit.name
                              .replace(/([A-Z])/g, "-$1")
                              .toLowerCase()
                              .replace(/^-/, ""),
                            selectedTarget
                          );
                        }}
                        disabled={!selectedTarget || activeScans.size > 0}
                        className="flex-1 px-3 py-1 border border-green-400/30 hover:bg-green-400/10 text-green-400 text-xs transition-all disabled:opacity-50"
                      >
                        [RUN]
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Show exploit info
                          addTerminalNotification(
                            `${exploit.displayName}: ${exploit.category} security test`,
                            "info"
                          );
                        }}
                        className="px-3 py-1 border border-green-400/30 hover:bg-green-400/10 text-green-400 text-xs transition-all"
                      >
                        [INFO]
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {selectedExploits.length > 0 && (
                <div className="border border-green-400/30 bg-green-400/5 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-green-400 font-bold">
                      Selected Exploits ({selectedExploits.length})
                    </span>
                    <button
                      onClick={runSecuritySuite}
                      disabled={
                        (!selectedTarget && uploadedFiles.length === 0) ||
                        activeScans.size > 0
                      }
                      className="px-4 py-2 border border-green-400/30 hover:bg-green-400/10 text-green-400 text-xs transition-all disabled:opacity-50"
                    >
                      {activeScans.size > 0 ? "[RUNNING...]" : "[RUN_SELECTED]"}
                    </button>
                  </div>

                  {!selectedTarget && uploadedFiles.length === 0 && (
                    <div className="mb-3 p-2 bg-red-400/10 border border-red-400/30 text-red-400 text-xs">
                      ⚠️ Please set a target URL above or upload files in
                      FILE_UPLOAD tab before running exploits.
                    </div>
                  )}

                  <div className="mb-3 text-xs text-green-400/80">
                    {uploadedFiles.length > 0 &&
                      `Testing ${uploadedFiles.length} uploaded file(s)`}
                    {selectedTarget && `Testing target: ${selectedTarget}`}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedExploits.map((exploit) => (
                      <span
                        key={exploit}
                        className="px-2 py-1 bg-green-400/20 text-green-400 text-xs"
                      >
                        {availableExploits.find((e) => e.name === exploit)
                          ?.displayName || exploit}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Files Tab */}
          {activeTab === "files" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-green-400 text-lg font-bold">
                  FILE_UPLOAD_TESTING
                </h2>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 border border-green-400/30 hover:bg-green-400/10 text-green-400 text-xs transition-all"
                >
                  [BROWSE_FILES]
                </button>
              </div>

              {/* File Drop Zone */}
              <div
                className={`border-2 border-dashed p-8 text-center transition-all ${
                  dragActive
                    ? "border-green-400 bg-green-400/10"
                    : "border-green-400/30 bg-green-400/5 hover:bg-green-400/10"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <div className="text-green-400 mb-2">
                  Drop files here or click to browse
                </div>
                <div className="text-green-400/60 text-xs">
                  Supported: .js, .php, .html, .css, .json, .xml, .sql, .py,
                  .java, .cpp
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                accept=".js,.php,.html,.css,.json,.xml,.sql,.py,.java,.cpp,.c,.h,.cs,.go,.rb,.ts,.jsx,.tsx,.vue,.asp,.aspx"
              />

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-green-400 font-bold">
                      UPLOADED_FILES ({uploadedFiles.length})
                    </h3>
                    <button
                      onClick={async () => {
                        // Delete all files from server
                        for (const file of uploadedFiles) {
                          try {
                            await fetch(`${API_BASE_URL}/files/${file.id}`, {
                              method: "DELETE",
                            });
                          } catch (error) {
                            console.error("Error deleting file:", error);
                          }
                        }
                        setUploadedFiles([]);
                        addTerminalNotification(
                          "Cleared all uploaded files",
                          "info"
                        );
                      }}
                      className="px-3 py-1 border border-red-400/30 hover:bg-red-400/10 text-red-400 text-xs transition-all"
                    >
                      [CLEAR_ALL]
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="border border-green-400/30 bg-green-400/5 p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <FileText className="w-4 h-4 text-green-400" />
                          <button
                            onClick={() => removeFile(file.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="text-green-400 font-bold truncate">
                            {file.name}
                          </div>
                          <div className="text-green-400/80">
                            Size: {formatFileSize(file.size)}
                          </div>
                          <div className="text-green-400/80">
                            Type: {file.type || "Unknown"}
                          </div>
                          <div className="text-green-400/80">
                            Modified:{" "}
                            {new Date(file.lastModified).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border border-green-400/30 bg-green-400/5 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-green-400 font-bold">
                        FILE_TESTING_OPTIONS
                      </span>
                      <button
                        onClick={() => {
                          if (selectedExploits.length === 0) {
                            addTerminalNotification(
                              "Please select exploits first in the EXPLOITS tab",
                              "error"
                            );
                            setActiveTab("exploits");
                            return;
                          }
                          runSecuritySuite();
                        }}
                        disabled={activeScans.size > 0}
                        className="px-4 py-2 border border-green-400/30 hover:bg-green-400/10 text-green-400 text-xs transition-all disabled:opacity-50"
                      >
                        {activeScans.size > 0
                          ? "[SCANNING_FILES...]"
                          : "[TEST_FILES]"}
                      </button>
                    </div>
                    <div className="text-xs text-green-400/80">
                      Files will be analyzed for common vulnerabilities
                      including: XSS, SQL Injection, Path Traversal, Code
                      Injection, and more.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results Tab */}
          {activeTab === "results" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-green-400 text-lg font-bold">
                  SCAN_RESULTS
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={fetchScanResults}
                    className="px-4 py-2 border border-green-400/30 hover:bg-green-400/10 text-green-400 text-xs transition-all"
                  >
                    [REFRESH]
                  </button>
                  <button
                    onClick={clearAllResults}
                    className="px-4 py-2 border border-red-400/30 hover:bg-red-400/10 text-red-400 text-xs transition-all"
                    title="Clear all scan results (new scans auto-clear previous results)"
                  >
                    [CLEAR_RESULTS]
                  </button>
                  <button
                    onClick={() => {
                      const csvData = scanResults.map((result) => ({
                        exploitName: result.exploitName,
                        target: result.target,
                        vulnerabilities: result.vulnerabilities?.length || 0,
                        timestamp: result.timestamp,
                      }));
                      const csv = [
                        Object.keys(csvData[0] || {}).join(","),
                        ...csvData.map((row) => Object.values(row).join(",")),
                      ].join("\n");

                      const blob = new Blob([csv], { type: "text/csv" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "security_scan_results.csv";
                      a.click();
                      URL.revokeObjectURL(url);

                      addTerminalNotification(
                        "Exported scan results to CSV",
                        "success"
                      );
                    }}
                    disabled={scanResults.length === 0}
                    className="px-4 py-2 border border-green-400/30 hover:bg-green-400/10 text-green-400 text-xs transition-all disabled:opacity-50"
                  >
                    [EXPORT_CSV]
                  </button>
                </div>
              </div>

              {scanResults.length === 0 ? (
                <div className="border border-green-400/30 bg-green-400/5 p-8 text-center">
                  <Search className="w-12 h-12 text-green-400/50 mx-auto mb-4" />
                  <div className="text-green-400/80">
                    No scan results available
                  </div>
                  <div className="text-green-400/60 text-xs mt-2">
                    Run some security exploits to see results here
                  </div>
                  <div className="text-green-400/40 text-xs mt-3 border-t border-green-400/20 pt-3">
                    🔄 Results are isolated per scan session - each new scan
                    clears previous results
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border border-blue-400/30 bg-blue-400/5 p-3 mb-4">
                    <div className="flex items-center gap-2 text-xs text-blue-400">
                      <RefreshCw className="w-3 h-3" />
                      <span>
                        Showing results for current scan session only - previous
                        results automatically cleared
                      </span>
                    </div>
                  </div>
                  {scanResults.map((result, index) => (
                    <div
                      key={result.scanId || index}
                      className="border border-green-400/30 bg-green-400/5 p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-green-400 font-bold">
                            {result.exploitName}
                          </span>
                          <div
                            className={`px-2 py-1 text-xs rounded ${getSeverityColor(
                              result.vulnerabilities?.length > 5
                                ? "critical"
                                : result.vulnerabilities?.length > 2
                                ? "high"
                                : result.vulnerabilities?.length > 0
                                ? "medium"
                                : "low"
                            )}`}
                          >
                            {result.vulnerabilities?.length || 0}{" "}
                            VULNERABILITIES
                          </div>
                        </div>
                        <div className="text-green-400/60 text-xs">
                          {result.timestamp
                            ? new Date(result.timestamp).toLocaleString()
                            : "Unknown time"}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-green-400/80">Target:</span>
                            <span className="text-green-400 truncate ml-2">
                              {result.target}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-400/80">Duration:</span>
                            <span className="text-green-400">
                              {result.duration || "N/A"}ms
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-green-400/80">Scan ID:</span>
                            <span className="text-green-400 font-mono">
                              {result.scanId || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-400/80">Status:</span>
                            <span className="text-green-400">COMPLETED</span>
                          </div>
                        </div>
                      </div>

                      {result.vulnerabilities &&
                        result.vulnerabilities.length > 0 && (
                          <div className="border-t border-green-400/20 pt-3">
                            <div className="text-green-400/80 text-xs mb-2">
                              VULNERABILITIES FOUND:
                            </div>
                            <div className="space-y-2">
                              {result.vulnerabilities
                                .slice(0, 3)
                                .map((vuln, vIndex) => (
                                  <div
                                    key={vIndex}
                                    className="bg-red-400/10 border border-red-400/30 p-2"
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-red-400 text-xs font-bold">
                                        {vuln.type}
                                      </span>
                                      <span
                                        className={`px-1 py-0.5 text-xs rounded ${getSeverityColor(
                                          vuln.severity
                                        )}`}
                                      >
                                        {vuln.severity?.toUpperCase()}
                                      </span>
                                    </div>
                                    <div className="text-xs space-y-1">
                                      {vuln.location && (
                                        <div className="text-green-400/80">
                                          Location: {vuln.location}
                                        </div>
                                      )}
                                      {vuln.payload && (
                                        <div className="text-green-400/80">
                                          Payload:{" "}
                                          <code className="text-green-400">
                                            {vuln.payload}
                                          </code>
                                        </div>
                                      )}
                                      {vuln.evidence && (
                                        <div className="text-green-400/80">
                                          Evidence: {vuln.evidence}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              {result.vulnerabilities.length > 3 && (
                                <div className="text-green-400/60 text-xs text-center">
                                  ... and {result.vulnerabilities.length - 3}{" "}
                                  more vulnerabilities
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Config Tab */}
          {activeTab === "config" && (
            <div className="space-y-6">
              <h2 className="text-green-400 text-lg font-bold">
                SECURITY_CONFIGURATION
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border border-green-400/30 bg-green-400/5 p-4">
                  <h3 className="text-green-400 font-bold mb-4">
                    SCAN_SETTINGS
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-green-400/80 text-xs mb-2">
                        Timeout (ms)
                      </label>
                      <input
                        type="number"
                        value={scanConfig.timeout}
                        onChange={(e) =>
                          setScanConfig((prev) => ({
                            ...prev,
                            timeout: parseInt(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 bg-black border border-green-400/30 text-green-400 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-green-400/80 text-xs mb-2">
                        Max Depth
                      </label>
                      <input
                        type="number"
                        value={scanConfig.maxDepth}
                        onChange={(e) =>
                          setScanConfig((prev) => ({
                            ...prev,
                            maxDepth: parseInt(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 bg-black border border-green-400/30 text-green-400 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="aggressive"
                        checked={scanConfig.aggressive}
                        onChange={(e) =>
                          setScanConfig((prev) => ({
                            ...prev,
                            aggressive: e.target.checked,
                          }))
                        }
                        className="text-green-400"
                      />
                      <label
                        htmlFor="aggressive"
                        className="text-green-400/80 text-xs"
                      >
                        Aggressive Scanning
                      </label>
                    </div>
                  </div>
                </div>

                <div className="border border-green-400/30 bg-green-400/5 p-4">
                  <h3 className="text-green-400 font-bold mb-4">API_STATUS</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-green-400/80">Connection:</span>
                      <span
                        className={`${
                          apiStatus === "connected"
                            ? "text-green-400"
                            : apiStatus === "error"
                            ? "text-red-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {apiStatus.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-400/80">
                        Exploits Loaded:
                      </span>
                      <span className="text-green-400">
                        {availableExploits.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-400/80">Active Scans:</span>
                      <span className="text-green-400">{activeScans.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-400/80">Total Results:</span>
                      <span className="text-green-400">
                        {scanResults.length}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={checkApiStatus}
                    className="w-full mt-4 px-4 py-2 border border-green-400/30 hover:bg-green-400/10 text-green-400 text-xs transition-all"
                  >
                    [RECONNECT_API]
                  </button>
                </div>
              </div>
            </div>
          )}
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
  );
};

export default SecurityTesting;
