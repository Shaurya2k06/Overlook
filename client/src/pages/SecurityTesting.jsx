import { useState, useEffect } from "react";
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
  Database
} from "lucide-react";
import GlobalTerminal from "../components/GlobalTerminal";

const SecurityTesting = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVisible, setIsVisible] = useState(false);
  const [showGlobalTerminal, setShowGlobalTerminal] = useState(false);
  const [dashboardTerminalOutput, setDashboardTerminalOutput] = useState([]);
  const [securityTests, setSecurityTests] = useState([
    {
      id: "pen_test_001",
      name: "SQL Injection Scan",
      type: "Database Security",
      status: "running",
      progress: 67,
      severity: "high",
      findings: 2,
      duration: "00:03:45"
    },
    {
      id: "pen_test_002", 
      name: "XSS Vulnerability Check",
      type: "Web Application",
      status: "completed",
      progress: 100,
      severity: "medium",
      findings: 1,
      duration: "00:02:15"
    },
    {
      id: "pen_test_003",
      name: "Authentication Bypass",
      type: "Access Control",
      status: "pending",
      progress: 0,
      severity: "critical",
      findings: 0,
      duration: "00:00:00"
    },
    {
      id: "pen_test_004",
      name: "Network Port Scan",
      type: "Infrastructure",
      status: "completed",
      progress: 100,
      severity: "low",
      findings: 0,
      duration: "00:01:30"
    }
  ]);

  const [systemMetrics, setSystemMetrics] = useState({
    threatsDetected: 3,
    vulnerabilitiesFound: 12,
    securityScore: 78,
    lastScanTime: "14:32:15"
  });

  // Add terminal notification helper
  const addTerminalNotification = (message, type = 'info') => {
    const notification = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message,
      type,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
    };
    setDashboardTerminalOutput(prev => [...prev, notification]);
    setShowGlobalTerminal(true);
    
    // Auto-close after 5 seconds for non-error messages
    if (type !== 'error') {
      setTimeout(() => {
        setShowGlobalTerminal(false);
      }, 5000);
    }
  };

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setIsVisible(true);
  }, []);

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

  const startSecurityTest = (testId) => {
    setSecurityTests(prev =>
      prev.map(test =>
        test.id === testId
          ? { ...test, status: "running", progress: 0 }
          : test
      )
    );
    addTerminalNotification(`Security test initiated: ${testId}`, 'info');
  };

  const stopSecurityTest = (testId) => {
    setSecurityTests(prev =>
      prev.map(test =>
        test.id === testId
          ? { ...test, status: "pending", progress: 0 }
          : test
      )
    );
    addTerminalNotification(`Security test stopped: ${testId}`, 'warning');
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
              <h1 className="text-green-400 text-lg font-bold">SECURITY_TESTING_LAB</h1>
            </div>
            <div className="text-green-400/60 text-xs">
              {currentTime.toLocaleTimeString("en-US", { hour12: false })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400/80">PENETRATION_TESTING_ACTIVE</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-60px)]">
        {/* Left Sidebar - Security Metrics */}
        <div className="w-80 border-r border-green-400/30 bg-black/50 p-4 flex flex-col">
          <div className="mb-6">
            <h3 className="text-green-400 text-sm mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              SECURITY_METRICS
            </h3>
            <div className="space-y-3">
              <div className="p-3 border border-green-400/20 bg-green-400/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-400/80 text-xs">Security Score</span>
                  <span className="text-green-400 font-bold">{systemMetrics.securityScore}%</span>
                </div>
                <div className="w-full bg-green-400/20 h-2">
                  <div 
                    className="bg-green-400 h-2 transition-all duration-300"
                    style={{ width: `${systemMetrics.securityScore}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 border border-red-400/30 bg-red-400/5">
                  <div className="text-red-400 text-xs">Threats</div>
                  <div className="text-red-400 font-bold text-lg">{systemMetrics.threatsDetected}</div>
                </div>
                <div className="p-2 border border-yellow-400/30 bg-yellow-400/5">
                  <div className="text-yellow-400 text-xs">Vulnerabilities</div>
                  <div className="text-yellow-400 font-bold text-lg">{systemMetrics.vulnerabilitiesFound}</div>
                </div>
              </div>

              <div className="p-3 border border-green-400/20 bg-green-400/5">
                <div className="text-green-400/80 text-xs mb-1">Last Full Scan</div>
                <div className="text-green-400 text-sm">{systemMetrics.lastScanTime}</div>
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
              <button className="w-full p-2 border border-green-400/30 hover:bg-green-400/10 text-green-400 text-xs transition-all text-left">
                [RUN] Full Security Scan
              </button>
              <button className="w-full p-2 border border-green-400/30 hover:bg-green-400/10 text-green-400 text-xs transition-all text-left">
                [ANALYZE] Vulnerability Report
              </button>
              <button className="w-full p-2 border border-green-400/30 hover:bg-green-400/10 text-green-400 text-xs transition-all text-left">
                [EXPORT] Security Audit Log
              </button>
              <button className="w-full p-2 border border-green-400/30 hover:bg-green-400/10 text-green-400 text-xs transition-all text-left">
                [CONFIG] Testing Parameters
              </button>
            </div>
          </div>
        </div>

        {/* Main Content - Security Tests */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-green-400 text-lg font-bold">ACTIVE_PENETRATION_TESTS</h2>
                <button className="px-4 py-2 border border-green-400/30 hover:bg-green-400/10 text-green-400 text-xs transition-all">
                  [NEW_TEST]
                </button>
              </div>

              {/* Security Tests Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {securityTests.map((test) => (
                  <div
                    key={test.id}
                    className="border border-green-400/30 bg-green-400/5 p-4 hover:bg-green-400/10 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1 ${getStatusColor(test.status)}`}>
                          {getStatusIcon(test.status)}
                        </div>
                        <span className="text-green-400 font-bold text-sm">{test.name}</span>
                      </div>
                      <div className={`px-2 py-1 text-xs rounded ${getSeverityColor(test.severity)}`}>
                        {test.severity.toUpperCase()}
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-green-400/80">Type:</span>
                        <span className="text-green-400">{test.type}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-green-400/80">Progress:</span>
                        <span className="text-green-400">{test.progress}%</span>
                      </div>
                      <div className="w-full bg-green-400/20 h-1">
                        <div 
                          className="bg-green-400 h-1 transition-all duration-300"
                          style={{ width: `${test.progress}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-green-400/80">Findings:</span>
                        <span className={test.findings > 0 ? "text-red-400" : "text-green-400"}>
                          {test.findings}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-green-400/80">Duration:</span>
                        <span className="text-green-400">{test.duration}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {test.status === "pending" && (
                        <button
                          onClick={() => startSecurityTest(test.id)}
                          className="flex-1 px-3 py-1 border border-green-400/30 hover:bg-green-400/10 text-green-400 text-xs transition-all"
                        >
                          [START]
                        </button>
                      )}
                      {test.status === "running" && (
                        <button
                          onClick={() => stopSecurityTest(test.id)}
                          className="flex-1 px-3 py-1 border border-red-400/30 hover:bg-red-400/10 text-red-400 text-xs transition-all"
                        >
                          [STOP]
                        </button>
                      )}
                      {test.status === "completed" && (
                        <button className="flex-1 px-3 py-1 border border-green-400/30 hover:bg-green-400/10 text-green-400 text-xs transition-all">
                          [VIEW_REPORT]
                        </button>
                      )}
                      <button className="px-3 py-1 border border-green-400/30 hover:bg-green-400/10 text-green-400 text-xs transition-all">
                        [CONFIG]
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="border border-green-400/30 bg-green-400/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-bold text-sm">DATABASE_SECURITY</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-green-400/80">SQL Injection Tests:</span>
                    <span className="text-green-400">67%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400/80">Access Control:</span>
                    <span className="text-red-400">VULNERABLE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400/80">Encryption:</span>
                    <span className="text-green-400">SECURE</span>
                  </div>
                </div>
              </div>

              <div className="border border-green-400/30 bg-green-400/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Network className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-bold text-sm">NETWORK_SECURITY</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-green-400/80">Open Ports:</span>
                    <span className="text-yellow-400">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400/80">Firewall Status:</span>
                    <span className="text-green-400">ACTIVE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400/80">SSL/TLS:</span>
                    <span className="text-green-400">VALID</span>
                  </div>
                </div>
              </div>

              <div className="border border-green-400/30 bg-green-400/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-bold text-sm">APPLICATION_SECURITY</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-green-400/80">XSS Protection:</span>
                    <span className="text-yellow-400">PARTIAL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400/80">CSRF Tokens:</span>
                    <span className="text-green-400">ENABLED</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400/80">Input Validation:</span>
                    <span className="text-red-400">WEAK</span>
                  </div>
                </div>
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
        onOutput={(output) => setDashboardTerminalOutput(prev => [...prev, output])}
        terminalOutput={dashboardTerminalOutput}
        isVisible={showGlobalTerminal}
        onVisibilityChange={setShowGlobalTerminal}
      />
    </div>
  );
};

export default SecurityTesting;