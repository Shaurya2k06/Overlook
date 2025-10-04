import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { TextAnimate } from "../components/ui/text-animate";
import BusinessLogin from "../components/BusinessLogin";
import BusinessSignup from "../components/BusinessSignup";
import { Code, Users, Sparkles, Lock, Shield, Zap, Terminal, GitBranch, Activity, AlertTriangle, CheckCircle, ArrowRight, Eye, Brain, Search } from "lucide-react";

function Home() {
  const navigate = useNavigate();
  const [activeAgent, setActiveAgent] = useState(0);
  const [securityScore, setSecurityScore] = useState(85);
  const [isVisible, setIsVisible] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentCode, setCurrentCode] = useState(
    `// User Input\nfunction login(email, password) {\n  // Generate login code\n}`
  );
  const [vulnerabilitiesFound, setVulnerabilitiesFound] = useState(0);
  const [vulnerabilitiesFixed, setVulnerabilitiesFixed] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const [securityInsights, setSecurityInsights] = useState({
    threatsBlocked: 0,
    codeLinesScanned: 0,
    vulnerabilitiesFound: 0,
    complianceScore: 0
  });
  
  const [selectedTab, setSelectedTab] = useState('overview');
  const techContainerRef = useRef(null);

  // Load Advercase font
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @font-face {
        font-family: 'Advercase';
        src: url('/Advercase Font.otf') format('opentype');
        font-weight: normal;
        font-style: normal;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  useEffect(() => {
    setIsVisible(true);
    
    // Scroll listener for navbar
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Security insights animation
    const insightsInterval = setInterval(() => {
      setSecurityInsights(prev => ({
        threatsBlocked: prev.threatsBlocked + Math.floor(Math.random() * 3),
        codeLinesScanned: prev.codeLinesScanned + Math.floor(Math.random() * 50) + 10,
        vulnerabilitiesFixed: prev.vulnerabilitiesFixed + (Math.random() > 0.7 ? 1 : 0),
        activeScans: Math.floor(Math.random() * 5) + 1
      }));
    }, 2000);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(insightsInterval);
    };
  }, []);

  useEffect(() => {
    
    const scoreInterval = setInterval(() => {
      setSecurityScore(prev => {
        if (prev < 98) return prev + 1;
        clearInterval(scoreInterval);
        return prev;
      });
    }, 20);

    // Enhanced pipeline simulation
    const pipelineInterval = setInterval(() => {
      if (isProcessing) {
        setActiveAgent(prev => {
          const next = (prev + 1) % 4;
          
          // Update progress for current agent
          agents[prev].progress = Math.min(agents[prev].progress + 25, 100);
          
          // Update step when completing full cycle
          if (next === 0) {
            setCurrentStep(prevStep => {
              const nextStep = (prevStep + 1) % codeSteps.length;
              
              // Update current code display immediately
              setCurrentCode(codeSteps[nextStep].input);
              
              // Update vulnerabilities counters
              if (nextStep === 1) {
                setVulnerabilitiesFound(2);
                setVulnerabilitiesFixed(0);
              } else if (nextStep === 2) {
                setVulnerabilitiesFixed(1);
              } else if (nextStep === 3) {
                setVulnerabilitiesFixed(2);
              }
              
              // Stop after one complete cycle if it has played once
              if (nextStep === 0 && hasPlayedOnce) {
                setIsProcessing(false);
                return 0; // Reset to beginning
              }
              
              return nextStep;
            });
          }
          
          return next;
        });
        
        setPipelineProgress(prev => (prev + 1) % 100);
      }
    }, 1500);

    return () => {
      clearInterval(scoreInterval);
      clearInterval(pipelineInterval);
    };
  }, [isProcessing]);

  const agents = [
    { 
      name: "Generation Agent", 
      icon: Code, 
      color: "#00EFA6", 
      status: "Generating secure code...",
      progress: 0,
      task: "Creating authentication function"
    },
    { 
      name: "Debugging Agent", 
      icon: Terminal, 
      color: "#60A5FA", 
      status: "Analyzing for errors...",
      progress: 0,
      task: "Scanning syntax & logic errors"
    },
    { 
      name: "Security Agent", 
      icon: Shield, 
      color: "#F59E0B", 
      status: "Scanning vulnerabilities...",
      progress: 0,
      task: "Detecting SQL injection risks"
    },
    { 
      name: "Red Team Agent", 
      icon: AlertTriangle, 
      color: "#EF4444", 
      status: "Testing exploits...",
      progress: 0,
      task: "Simulating attack vectors"
    }
  ];

  const codeSteps = [
    {
      input: `// User Input\nfunction login(email, password) {\n  // Generate login code\n}`,
      vulnerabilities: [],
      stage: "Input"
    },
    {
      input: `function login(email, password) {\n  const query = \`SELECT * FROM users \n    WHERE email='\${email}'\`;\n  return db.query(query);\n}`,
      vulnerabilities: ["SQL Injection", "Password Not Hashed"],
      stage: "Generated Code"
    },
    {
      input: `function login(email, password) {\n  const query = \`SELECT * FROM users \n    WHERE email=?\`;\n  const hashedPwd = bcrypt.hash(password);\n  return db.query(query, [email]);\n}`,
      vulnerabilities: ["Password Verification Missing"],
      stage: "After Security Scan"
    },
    {
      input: `function login(email, password) {\n  const query = \`SELECT * FROM users \n    WHERE email=?\`;\n  const user = await db.query(query, [email]);\n  return bcrypt.compare(password, user.hash);\n}`,
      vulnerabilities: [],
      stage: "Secure Code"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-black/90 backdrop-blur-md border-b border-white/10' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-8">
          <div className="h-20 flex items-center justify-between">
            <h1 className="text-3xl font-light tracking-tight text-white" style={{ fontFamily: "Advercase, monospace" }}>
              overlook
            </h1>
            <button 
              onClick={() => setShowLogin(true)}
              className="px-8 py-3 bg-white text-black hover:bg-gray-200 transition-all duration-300 text-sm uppercase tracking-widest"
              style={{ fontFamily: "Advercase, monospace" }}
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* SECTION 1: HERO */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden snap-start">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-30">
          <source src="/Illuminated Jellyfish Video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/60" />
        
        <div className="container mx-auto px-8 relative z-10">
          <div className="max-w-7xl mx-auto text-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

              
              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-light tracking-tight mb-12 leading-tight" style={{ fontFamily: "Advercase, monospace" }}>
                <div className="block text-white mb-4">
                  <TextAnimate animation="slideUp" by="word">Generate</TextAnimate>
                </div>
                <div className="block mb-4 bg-gradient-to-r from-[#00EFA6] to-blue-400 bg-clip-text  mix-blend-difference">
                  <TextAnimate animation="slideUp" by="word">Secure Code</TextAnimate>
                </div>
                <div className="block text-white">
                  <TextAnimate animation="slideUp" by="word">By Default</TextAnimate>
                </div>
              </h1>
              
              <p className="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto mb-16">
                The first AI code generation platform with built-in security validation. 
                <span className="text-[#00EFA6]"> Reduce vulnerabilities by 80%+</span> through 
                real-time multi-agent security analysis.
              </p>

              <div className="flex items-center justify-center gap-8 flex-col sm:flex-row">
                <button 
                  onClick={() => setShowLogin(true)}
                  className="group px-14 py-5 bg-white text-black hover:bg-gray-200 transition-all duration-300 text-lg uppercase tracking-widest"
                  style={{ fontFamily: "Advercase, monospace" }}
                >
                  <span className="flex items-center gap-3">
                    Get Started
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
                <button className="px-14 py-5 bg-transparent hover:bg-white/10 border border-white/50 text-white transition-all duration-300 text-lg uppercase tracking-widest hover:border-white rounded-lg" style={{ fontFamily: "Advercase, monospace" }}>
                  Watch Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: SECURITY PIPELINE */}
      <section id="pipeline" className="relative min-h-screen py-16 bg-black border-t border-white/10 snap-start">
        <div className="container mx-auto px-8 max-w-5xl">
          
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-light mb-2 text-white" style={{ fontFamily: "Advercase, monospace" }}>
              Security Pipeline
            </h2>
            <p className="text-gray-400 text-sm">Multi-agent code security analysis and remediation</p>
          </div>

          {/* Pipeline Process */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Process Steps */}
            <div className="lg:col-span-2">
              <div className="border border-white/20 bg-black/50">
                <div className="p-4 border-b border-white/20">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-medium" style={{ fontFamily: "Advercase, monospace" }}>PROCESS</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setIsProcessing(!isProcessing);
                          if (!isProcessing) setHasPlayedOnce(true);
                        }}
                        className="px-3 py-1 border border-white/30 text-white text-xs hover:bg-white/5 transition-colors"
                        style={{ fontFamily: "Advercase, monospace" }}
                      >
                        {isProcessing ? 'PAUSE' : 'START'}
                      </button>
                      <button
                        onClick={() => {
                          setCurrentStep(0);
                          setActiveAgent(0);
                          setVulnerabilitiesFound(0);
                          setVulnerabilitiesFixed(0);
                        }}
                        className="px-3 py-1 border border-white/30 text-white text-xs hover:bg-white/5 transition-colors"
                        style={{ fontFamily: "Advercase, monospace" }}
                      >
                        RESET
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  {agents.map((agent, idx) => {
                    const isActive = idx === activeAgent;
                    const isCompleted = idx < activeAgent;
                    
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-6 text-xs text-gray-500 font-mono text-right">
                          {String(idx + 1).padStart(2, '0')}
                        </div>
                        <div className={`w-2 h-2 border ${
                          isCompleted ? 'bg-white border-white' : 
                          isActive ? 'bg-white/50 border-white animate-pulse' : 
                          'border-white/30'
                        }`} />
                        <div className="flex-1">
                          <div className={`text-sm ${isActive || isCompleted ? 'text-white' : 'text-gray-500'}`}>
                            {agent.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {agent.task}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {isCompleted ? 'DONE' : isActive ? 'PROC' : 'WAIT'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-6">
              <div className="border border-white/20 bg-black/50">
                <div className="p-4 border-b border-white/20">
                  <span className="text-white text-sm font-medium" style={{ fontFamily: "Advercase, monospace" }}>STATS</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs">SECURITY SCORE</span>
                    <span className="text-white text-sm font-mono">{securityScore}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs">VULNERABILITIES</span>
                    <span className="text-white text-sm font-mono">{vulnerabilitiesFound}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs">FIXED</span>
                    <span className="text-white text-sm font-mono">{vulnerabilitiesFixed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs">LINES SCANNED</span>
                    <span className="text-white text-sm font-mono">{securityInsights.codeLinesScanned.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terminal Output */}
          <div className="border border-white/20 bg-black/80">
            <div className="p-4 border-b border-white/20">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-medium" style={{ fontFamily: "Advercase, monospace" }}>TERMINAL</span>
                <div className="text-xs text-gray-500 font-mono">
                  STEP {currentStep + 1}/4
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="font-mono text-xs space-y-1 text-gray-300 min-h-[200px]">
                <div className="text-gray-500">$ overlook-security --scan --realtime</div>
                <div className="text-gray-400">Initializing security pipeline...</div>
                <div className="text-gray-400">Loading agents: [Scanner, Analyzer, Fixer, Validator]</div>
                <div className="text-white">Pipeline ready.</div>
                <div className="text-gray-400">---</div>
                
                {isProcessing && (
                  <>
                    <div className="text-white">Running: {agents[activeAgent].name}</div>
                    <div className="text-gray-400">Task: {agents[activeAgent].task}</div>
                    <div className="text-gray-400">Status: {agents[activeAgent].status}</div>
                    
                    {vulnerabilitiesFound > 0 && (
                      <>
                        <div className="text-yellow-400">Warning: {vulnerabilitiesFound} vulnerabilities detected</div>
                        {codeSteps[currentStep].vulnerabilities.map((vuln, idx) => (
                          <div key={idx} className="text-red-400">  - {vuln}</div>
                        ))}
                      </>
                    )}
                    
                    {vulnerabilitiesFixed > 0 && (
                      <div className="text-white">Info: {vulnerabilitiesFixed} vulnerabilities remediated</div>
                    )}
                    
                    <div className="text-gray-400">Processing time: 1.2s</div>
                    <div className="text-gray-400">Memory usage: 24.1MB</div>
                    <div className="text-gray-400">CPU: 12.3%</div>
                  </>
                )}
                
                {!isProcessing && hasPlayedOnce && (
                  <>
                    <div className="text-white">Pipeline execution completed.</div>
                    <div className="text-white">Security score: {securityScore}%</div>
                    <div className="text-gray-400">All agents finished successfully.</div>
                  </>
                )}
                
                <div className="flex items-center mt-2">
                  <span className="text-gray-500">$ </span>
                  <div className="w-2 h-4 bg-white/50 ml-1 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Code Diff */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Before */}
            <div className="border border-white/20 bg-black/50">
              <div className="p-3 border-b border-white/20">
                <span className="text-gray-400 text-xs font-medium" style={{ fontFamily: "Advercase, monospace" }}>BEFORE</span>
              </div>
              <div className="p-4">
                <pre className="text-xs font-mono text-gray-300 overflow-x-auto">
{currentStep === 0 ? codeSteps[0].input : codeSteps[Math.max(0, currentStep - 1)].input}
                </pre>
              </div>
            </div>
            
            {/* After */}
            <div className="border border-white/20 bg-black/50">
              <div className="p-3 border-b border-white/20">
                <span className="text-gray-400 text-xs font-medium" style={{ fontFamily: "Advercase, monospace" }}>AFTER</span>
              </div>
              <div className="p-4">
                <pre className="text-xs font-mono text-gray-300 overflow-x-auto">
{codeSteps[currentStep].input}
                </pre>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* SECTION 3: THE PROBLEM */}
      <section id="problem" className="relative py-16 bg-black border-t border-white/10 snap-start">
        <div className="container mx-auto px-8 max-w-5xl">
          
          <div className="mb-8">
            <h3 className="text-3xl font-light mb-2 text-white" style={{ fontFamily: "Advercase, monospace" }}>
              The Problem
            </h3>
            <p className="text-gray-400 text-sm">Traditional AI code generators create vulnerable systems</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Statistics */}
            <div className="border border-white/20 bg-black/50">
              <div className="p-4 border-b border-white/20">
                <span className="text-white text-sm font-medium" style={{ fontFamily: "Advercase, monospace" }}>SECURITY STATISTICS</span>
              </div>
              <div className="p-4 space-y-4">
                <div className="border-l-2 border-white/30 pl-4">
                  <div className="text-2xl font-mono text-white">73%</div>
                  <div className="text-xs text-gray-400">OF AI-GENERATED CODE CONTAINS VULNERABILITIES</div>
                </div>
                <div className="border-l-2 border-white/30 pl-4">
                  <div className="text-2xl font-mono text-white">$45B+</div>
                  <div className="text-xs text-gray-400">ANNUAL COST OF SECURITY BREACHES</div>
                </div>
                <div className="border-l-2 border-white/30 pl-4">
                  <div className="text-2xl font-mono text-white">2.3x</div>
                  <div className="text-xs text-gray-400">INCREASE IN AI CODE VULNERABILITIES</div>
                </div>
              </div>
            </div>

            {/* Code Example */}
            <div className="border border-white/20 bg-black/80">
              <div className="p-3 border-b border-white/20">
                <span className="text-gray-400 text-xs font-medium" style={{ fontFamily: "Advercase, monospace" }}>VULNERABLE_CODE.JS</span>
              </div>
              <div className="p-4">
                <pre className="text-xs font-mono text-gray-300 space-y-1">
                  <div className="text-gray-500">// Typical AI-generated code</div>
                  <div>app.post('/login', (req, res) =&gt; {'{'}</div>
                  <div className="pl-2">const query = `SELECT * FROM users</div>
                  <div className="pl-4">WHERE email='${'${req.body.email}'}'`;</div>
                  <div className="pl-2">db.query(query);</div>
                  <div>{'}'});</div>
                  <div className="text-gray-500 mt-2">// -&gt; SQL Injection vulnerability</div>
                </pre>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* SECTION 4: OUR SOLUTION */}
      <section id="solution" className="relative py-16 bg-black border-t border-white/10 snap-start">
        <div className="container mx-auto px-8 max-w-5xl">
          
          <div className="mb-8">
            <h3 className="text-3xl font-light mb-2 text-white" style={{ fontFamily: "Advercase, monospace" }}>
              Our Solution
            </h3>
            <p className="text-gray-400 text-sm">Multi-agent security architecture with real-time validation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="border border-white/20 bg-black/50 p-4">
              <div className="mb-3">
                <div className="text-white text-sm font-medium mb-1" style={{ fontFamily: "Advercase, monospace" }}>REAL-TIME VALIDATION</div>
                <div className="text-xs text-gray-400">Every line analyzed using Semgrep and custom patterns</div>
              </div>
            </div>

            <div className="border border-white/20 bg-black/50 p-4">
              <div className="mb-3">
                <div className="text-white text-sm font-medium mb-1" style={{ fontFamily: "Advercase, monospace" }}>RED TEAM TESTING</div>
                <div className="text-xs text-gray-400">Adversarial agents actively exploit code vulnerabilities</div>
              </div>
            </div>

            <div className="border border-white/20 bg-black/50 p-4">
              <div className="mb-3">
                <div className="text-white text-sm font-medium mb-1" style={{ fontFamily: "Advercase, monospace" }}>MULTI-AGENT COLLABORATION</div>
                <div className="text-xs text-gray-400">Generation, debugging, security, and testing agents</div>
              </div>
            </div>

            <div className="border border-white/20 bg-black/50 p-4">
              <div className="mb-3">
                <div className="text-white text-sm font-medium mb-1" style={{ fontFamily: "Advercase, monospace" }}>AUTOMATED PATCHING</div>
                <div className="text-xs text-gray-400">Automatic generation of secure code alternatives</div>
              </div>
            </div>
            
          </div>

          {/* Architecture Diagram */}
          <div className="mt-8 border border-white/20 bg-black/80">
            <div className="p-4 border-b border-white/20">
              <span className="text-white text-sm font-medium" style={{ fontFamily: "Advercase, monospace" }}>ARCHITECTURE</span>
            </div>
            <div className="p-4">
              <div className="font-mono text-xs text-gray-300 space-y-1">
                <div>INPUT → GENERATION_AGENT → SECURITY_AGENT → RED_TEAM → OUTPUT</div>
                <div className="text-gray-500">       ↓              ↓             ↓        ↓</div>
                <div className="text-gray-500">    [CODE]      [VALIDATE]   [EXPLOIT]  [PATCH]</div>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* SECTION 5: TECHNOLOGY */}
      <section 
        id="technology" 
        className="relative py-16 bg-black border-t border-white/10 snap-start"
        ref={techContainerRef}
      >
        <div className="container mx-auto px-8 max-w-5xl">
          
          <div className="mb-8">
            <h3 className="text-3xl font-light mb-2 text-white" style={{ fontFamily: "Advercase, monospace" }}>
              Technology Stack
            </h3>
            <p className="text-gray-400 text-sm">AI models and security tools integrated into Overlook</p>
          </div>

          {/* AI Models */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
            <div className="border border-white/20 bg-black/50">
              <div className="p-4 border-b border-white/20">
                <span className="text-white text-sm font-medium" style={{ fontFamily: "Advercase, monospace" }}>AI MODELS</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">GPT-4O</span>
                  <span className="text-white text-xs">CODE GENERATION</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">CLAUDE 3.5</span>
                  <span className="text-white text-xs">SECURITY ANALYSIS</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">GROQ LLAMA</span>
                  <span className="text-white text-xs">FAST DEBUGGING</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">OLLAMA</span>
                  <span className="text-white text-xs">RED TEAM TESTING</span>
                </div>
              </div>
            </div>

            <div className="border border-white/20 bg-black/50">
              <div className="p-4 border-b border-white/20">
                <span className="text-white text-sm font-medium" style={{ fontFamily: "Advercase, monospace" }}>SECURITY TOOLS</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">SEMGREP</span>
                  <span className="text-white text-xs">STATIC ANALYSIS</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">ESLINT SECURITY</span>
                  <span className="text-white text-xs">JS VULNERABILITIES</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">NPM AUDIT</span>
                  <span className="text-white text-xs">DEPENDENCY SCAN</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">CUSTOM PATTERNS</span>
                  <span className="text-white text-xs">PROPRIETARY RULES</span>
                </div>
              </div>
            </div>
            
          </div>

          {/* Data Flow */}
          <div className="border border-white/20 bg-black/80">
            <div className="p-4 border-b border-white/20">
              <span className="text-white text-sm font-medium" style={{ fontFamily: "Advercase, monospace" }}>DATA FLOW</span>
            </div>
            <div className="p-4">
              <div className="font-mono text-xs text-gray-300 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div className="border border-white/20 p-2">
                    <div className="text-white text-xs mb-1">INPUT</div>
                    <div className="text-gray-400 text-xs">User prompt</div>
                  </div>
                  <div className="border border-white/20 p-2">
                    <div className="text-white text-xs mb-1">GENERATE</div>
                    <div className="text-gray-400 text-xs">AI models</div>
                  </div>
                  <div className="border border-white/20 p-2">
                    <div className="text-white text-xs mb-1">VALIDATE</div>
                    <div className="text-gray-400 text-xs">Security scan</div>
                  </div>
                  <div className="border border-white/20 p-2">
                    <div className="text-white text-xs mb-1">OUTPUT</div>
                    <div className="text-gray-400 text-xs">Secure code</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* SECTION 6: RESULTS */}
      <section id="results" className="relative py-16 bg-black border-t border-white/10 snap-start">
        <div className="container mx-auto px-8 max-w-5xl">
          
          <div className="mb-8">
            <h3 className="text-3xl font-light mb-2 text-white" style={{ fontFamily: "Advercase, monospace" }}>
              Performance Metrics
            </h3>
            <p className="text-gray-400 text-sm">Measurable security improvements with Overlook</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            
            <div className="border border-white/20 bg-black/50 p-4">
              <div className="text-3xl font-mono text-white mb-2">80%+</div>
              <div className="text-sm text-white mb-1" style={{ fontFamily: "Advercase, monospace" }}>VULNERABILITY REDUCTION</div>
              <div className="text-xs text-gray-400">Compared to standard AI generation</div>
            </div>

            <div className="border border-white/20 bg-black/50 p-4">
              <div className="text-3xl font-mono text-white mb-2">2.3s</div>
              <div className="text-sm text-white mb-1" style={{ fontFamily: "Advercase, monospace" }}>AVERAGE ANALYSIS TIME</div>
              <div className="text-xs text-gray-400">Complete security validation</div>
            </div>

            <div className="border border-white/20 bg-black/50 p-4">
              <div className="text-3xl font-mono text-white mb-2">100%</div>
              <div className="text-sm text-white mb-1" style={{ fontFamily: "Advercase, monospace" }}>CODE COVERAGE</div>
              <div className="text-xs text-gray-400">Every line security validated</div>
            </div>
            
          </div>

          {/* Call to Action */}
          <div className="border border-white/20 bg-black/80 p-6 text-center">
            <div className="mb-4">
              <h4 className="text-xl font-light text-white mb-2" style={{ fontFamily: "Advercase, monospace" }}>
                Ready to generate secure code?
              </h4>
              <p className="text-gray-400 text-sm">
                Join the future of AI-powered development with built-in security validation.
              </p>
            </div>
            
            <button 
              onClick={() => setShowLogin(true)}
              className="px-8 py-3 border border-white/30 text-white hover:bg-white/5 transition-colors text-sm"
              style={{ fontFamily: "Advercase, monospace" }}
            >
              GET STARTED
            </button>
          </div>
          
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 bg-black">
        <div className="container mx-auto px-8 max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <div style={{ fontFamily: "Advercase, monospace" }}>© {new Date().getFullYear()} OVERLOOK. ALL RIGHTS RESERVED.</div>
            <div style={{ fontFamily: "Advercase, monospace" }}>BUILT WITH REACT & WEBSOCKET</div>
          </div>
        </div>
      </footer>

      {/* Login/Signup Modals */}
      <BusinessLogin 
        isOpen={showLogin} 
        onClose={() => setShowLogin(false)}
        onSwitchToSignup={() => {
          setShowLogin(false);
          setShowSignup(true);
        }}
      />
      
      <BusinessSignup 
        isOpen={showSignup} 
        onClose={() => setShowSignup(false)}
        onSwitchToLogin={() => {
          setShowSignup(false);
          setShowLogin(true);
        }}
      />

      <style>{`
        html { scroll-snap-type: y mandatory; scroll-behavior: smooth; }
        .mix-blend-header { mix-blend-mode: screen; }
        @keyframes border-flow {
          0% { transform: translateX(0); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    
    </div>
  );
}

export default Home;