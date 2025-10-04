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
      <section id="problem" className="relative min-h-screen flex items-center justify-center py-24 bg-black border-t border-white/10 snap-start">
        <div className="container mx-auto px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="text-[#00EFA6] text-sm tracking-widest uppercase mb-4 block">The Problem</span>
                <h3 className="text-4xl font-light mb-6 leading-tight" style={{ fontFamily: "Advercase, monospace" }}>
                  Traditional AI Code Generators Create <span className="text-red-400">Vulnerable Code</span>
                </h3>
                <p className="text-gray-300 text-lg leading-relaxed mb-8">
                  Existing tools treat security as an afterthought, leading to critical vulnerabilities in production systems.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center border border-red-400/30 bg-red-400/10">
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-light text-white">73%</div>
                      <div className="text-sm text-gray-400">Of AI-generated code contains vulnerabilities</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center border border-orange-400/30 bg-orange-400/10">
                      <AlertTriangle className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-light text-white">$45B+</div>
                      <div className="text-sm text-gray-400">Annual cost of security breaches</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="bg-black border border-red-400/30 p-6 font-mono text-sm">
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/20">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-gray-400 text-xs ml-4">vulnerable_code.js</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-gray-400">// AI Generated Code</div>
                    <div className="text-white">app.post('/login', (req, res) =&gt; {'{'}</div>
                    <div className="text-white pl-4">const query = <span className="text-red-400">`SELECT * FROM users</span></div>
                    <div className="text-white pl-8"><span className="text-red-400">WHERE email='$&#123;req.body.email&#125;'`</span>;</div>
                    <div className="text-white">{'}'});</div>
                  </div>
                  <div className="absolute -right-2 -top-2 bg-red-500 text-white text-xs px-3 py-1 uppercase tracking-wide">
                    SQL Injection
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: OUR SOLUTION */}
      <section id="solution" className="relative min-h-screen flex items-center justify-center py-24 bg-black border-t border-white/10 snap-start">
        <div className="container mx-auto px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-[#00EFA6] text-sm tracking-widest uppercase mb-4 block">Our Solution</span>
              <h3 className="text-4xl font-light mb-6" style={{ fontFamily: "Advercase, monospace" }}>
                <TextAnimate animation="slideUp" by="word">Security-First Architecture</TextAnimate>
              </h3>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Four specialized AI agents working together to generate, validate, and secure your code in real-time.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group p-8 bg-white/5 hover:border-[#00EFA6]/50 transition-all duration-500 hover:bg-white/10">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 border border-[#00EFA6]/30 group-hover:border-[#00EFA6]/60 transition-colors">
                    <Shield className="w-6 h-6 text-[#00EFA6]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white mb-2">Real-time Security Validation</h4>
                    <p className="text-gray-300 leading-relaxed text-sm">
                      Every line of generated code is instantly analyzed using Semgrep and custom vulnerability patterns.
                    </p>
                  </div>
                </div>
              </div>

              <div className="group p-8 bg-white/5 hover:border-[#00EFA6]/50 transition-all duration-500 hover:bg-white/10">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 border border-[#00EFA6]/30 group-hover:border-[#00EFA6]/60 transition-colors">
                    <AlertTriangle className="w-6 h-6 text-[#00EFA6]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white mb-2">Adversarial Red Team Testing</h4>
                    <p className="text-gray-300 leading-relaxed text-sm">
                      Our Red Team Agent actively tries to exploit your code, simulating real-world attacks.
                    </p>
                  </div>
                </div>
              </div>

              <div className="group p-8 bg-white/5 hover:border-[#00EFA6]/50 transition-all duration-500 hover:bg-white/10">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 border border-[#00EFA6]/30 group-hover:border-[#00EFA6]/60 transition-colors">
                    <GitBranch className="w-6 h-6 text-[#00EFA6]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white mb-2">Multi-Agent Collaboration</h4>
                    <p className="text-gray-300 leading-relaxed text-sm">
                      Watch as Generation, Debugging, Security, and Red Team agents collaborate to secure your code.
                    </p>
                  </div>
                </div>
              </div>

              <div className="group p-8 bg-white/5 hover:border-[#00EFA6]/50 transition-all duration-500 hover:bg-white/10">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 border border-[#00EFA6]/30 group-hover:border-[#00EFA6]/60 transition-colors">
                    <Zap className="w-6 h-6 text-[#00EFA6]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white mb-2">Automated Patch Generation</h4>
                    <p className="text-gray-300 leading-relaxed text-sm">
                      When vulnerabilities are detected, our system automatically generates secure alternatives.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: TECHNOLOGY */}
      <section 
        id="technology" 
        className="relative min-h-screen flex items-center justify-center py-24 bg-black snap-start"
        ref={techContainerRef}
      >
        <div className="container mx-auto px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-[#00EFA6] text-sm tracking-widest uppercase mb-4 block" style={{ fontFamily: "Advercase, monospace" }}>Technology</span>
              <h3 className="text-4xl font-light mb-6" style={{ fontFamily: "Advercase, monospace" }}>
                <TextAnimate animation="slideUp" by="word">How Agents Use Overlook</TextAnimate>
              </h3>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Watch how different AI agents connect through Overlook to secure your code.
              </p>
            </div>

            {/* Central Overlook Hub with Custom Connections */}
            <div className="relative mb-16">
              {/* Flowing connection lines */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-96 h-96">
                  {/* Diagonal connection lines */}
                  {[0, 1, 2, 3].map(idx => (
                    <div
                      key={idx}
                      className="absolute w-0.5 bg-gradient-to-br from-transparent via-[#00EFA6]/30 to-transparent animate-pulse"
                      style={{
                        height: '120px',
                        transformOrigin: 'center',
                        transform: `rotate(${idx * 90 + 45}deg)`,
                        left: '50%',
                        top: '50%',
                        marginLeft: '-1px',
                        marginTop: '-60px'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-center mb-8 relative z-10">
                <div className="w-32 h-32 flex items-center justify-center relative">
                  <img 
                    src="/logo.png" 
                    alt="Overlook Logo" 
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute -bottom-8 text-center">
                    <div className="text-lg font-bold text-white" style={{ fontFamily: "Advercase, monospace" }}>OVERLOOK</div>
                    <div className="text-xs text-gray-400">Security Hub</div>
                  </div>
                </div>
              </div>

              {/* AI Models around Overlook */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
                {[
                  { name: "GPT-4o", desc: "Code Generation", color: "#00EFA6" },
                  { name: "Claude 3.5", desc: "Security Analysis", color: "#60A5FA" },
                  { name: "Groq Llama", desc: "Fast Debugging", color: "#F59E0B" },
                  { name: "Ollama", desc: "Red Team Testing", color: "#EF4444" },
                ].map((tech, idx) => {
                  return (
                    <div 
                      key={idx}
                      className="group p-6 bg-white/5 hover:bg-white/10 text-center rounded-lg transition-all duration-500 hover:scale-105"
                    >
                      <div 
                        className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${tech.color}20` }}
                      >
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tech.color }} />
                      </div>
                      <h4 className="text-lg font-medium text-white mb-2" style={{ fontFamily: "Advercase, monospace" }}>{tech.name}</h4>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">{tech.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-8 bg-white/5 rounded-lg">
              <div className="text-center mb-6">
                <h4 className="text-sm uppercase tracking-widest text-gray-400 mb-2">Integrated Security Tools</h4>
              </div>
              <div className="flex flex-wrap justify-center gap-6">
                {["Semgrep", "ESLint Security", "npm audit", "Custom Patterns"].map((tool, idx) => (
                  <div key={idx} className="px-4 py-2 bg-white/5 text-sm text-white rounded">
                    {tool}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: RESULTS */}
      <section id="results" className="relative min-h-screen flex items-center justify-center py-32 bg-black border-t border-white/10 snap-start">
        <div className="container mx-auto px-8 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-[#00EFA6] text-sm tracking-widest uppercase mb-4 block" style={{ fontFamily: "Advercase, monospace" }}>Results</span>
              <h3 className="text-4xl font-light mb-6" style={{ fontFamily: "Advercase, monospace" }}>
                <TextAnimate animation="slideUp" by="word">Measurable Security Improvement</TextAnimate>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="text-center p-8 bg-white/5">
                <div className="text-5xl font-light text-[#00EFA6] mb-4" style={{ fontFamily: "Advercase, monospace" }}>80%+</div>
                <div className="text-white mb-2" style={{ fontFamily: "Advercase, monospace" }}>Vulnerability Reduction</div>
                <div className="text-sm text-gray-400" style={{ fontFamily: "Advercase, monospace" }}>Compared to standard AI code generation</div>
              </div>

              <div className="text-center p-8 bg-white/5">
                <div className="text-5xl font-light text-[#00EFA6] mb-4">2.3s</div>
                <div className="text-white mb-2">Average Analysis Time</div>
                <div className="text-sm text-gray-400">Complete security validation in seconds</div>
              </div>

              <div className="text-center p-8 bg-white/5">
                <div className="text-5xl font-light text-[#00EFA6] mb-4">100%</div>
                <div className="text-white mb-2">Coverage</div>
                <div className="text-sm text-gray-400">Every line of code is security validated</div>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-3xl font-light mb-6 leading-tight" style={{ fontFamily: "Advercase, monospace" }}>
                <TextAnimate animation="slideUp" by="word">Ready to generate secure code?</TextAnimate>
              </h3>
              <p className="text-gray-300 text-lg mb-10 leading-relaxed max-w-2xl mx-auto">
                Join the future of AI-powered development with built-in security validation.
              </p>
              
              <div className="flex items-center justify-center gap-6 flex-col sm:flex-row mb-12">
                <button 
                  onClick={() => setShowLogin(true)}
                  className="group px-14 py-5 bg-white text-black hover:bg-gray-200 transition-all duration-300 text-lg uppercase tracking-widest"
                  style={{ fontFamily: "Advercase, monospace" }}
                >
                  <span className="flex items-center gap-2">
                    Get Started
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </div>

              
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/10 py-12">
        <div className="container mx-auto px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-gray-400 text-sm">© {new Date().getFullYear()} Overlook. All rights reserved.</div>
            <div className="text-gray-400 text-sm">Built with React & WebSocket</div>
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