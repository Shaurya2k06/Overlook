import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TextAnimate } from "../components/ui/text-animate";
import BusinessLogin from "../components/BusinessLogin";
import BusinessSignup from "../components/BusinessSignup";
import { Code, Users, Sparkles, Lock, Shield, Zap, Terminal, GitBranch, Activity, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";

function Home() {
  const navigate = useNavigate();
  const [activeAgent, setActiveAgent] = useState(0);
  const [securityScore, setSecurityScore] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(true);
  const [currentCode, setCurrentCode] = useState('');
  const [vulnerabilitiesFound, setVulnerabilitiesFound] = useState(0);
  const [vulnerabilitiesFixed, setVulnerabilitiesFixed] = useState(0);

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
              
              // Update vulnerabilities counters
              if (nextStep === 1) {
                setVulnerabilitiesFound(2);
                setVulnerabilitiesFixed(0);
              } else if (nextStep === 2) {
                setVulnerabilitiesFixed(1);
              } else if (nextStep === 3) {
                setVulnerabilitiesFixed(2);
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

  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/80 backdrop-blur-sm">
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
                <button className="px-14 py-5 bg-transparent hover:bg-white/10 border-2 border-white text-white transition-all duration-300 text-lg uppercase tracking-widest" style={{ fontFamily: "Advercase, monospace" }}>
                  Watch Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: INTERACTIVE MULTI-AGENT PIPELINE */}
      <section id="pipeline" className="relative min-h-screen flex items-center justify-center py-24 bg-black border-t border-white/10 snap-start">
        <div className="container mx-auto px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-light mb-16 text-center" style={{ fontFamily: "Advercase, monospace" }}>
              <TextAnimate animation="slideUp" by="word">Interactive Security Pipeline</TextAnimate>
            </h2>
            
            {/* Pipeline Controls */}
            <div className="flex justify-center mb-12">
              <div className="flex items-center gap-4 px-6 py-3 border-2 border-white/20 bg-black/60">
                <button
                  onClick={() => setIsProcessing(!isProcessing)}
                  className={`px-4 py-2 border-2 transition-all ${
                    isProcessing 
                      ? 'border-orange-400 text-orange-400 hover:bg-orange-400/10' 
                      : 'border-[#00EFA6] text-[#00EFA6] hover:bg-[#00EFA6]/10'
                  }`}
                  style={{ fontFamily: "Advercase, monospace" }}
                >
                  {isProcessing ? 'PAUSE' : 'PLAY'}
                </button>
                <button
                  onClick={() => {
                    setCurrentStep(0);
                    setActiveAgent(0);
                    setVulnerabilitiesFound(0);
                    setVulnerabilitiesFixed(0);
                    agents.forEach(agent => agent.progress = 0);
                  }}
                  className="px-4 py-2 border-2 border-white/20 text-white hover:bg-white/10 transition-all"
                  style={{ fontFamily: "Advercase, monospace" }}
                >
                  RESTART
                </button>
                <div className="flex items-center gap-2 ml-4">
                  <div className="text-xs text-gray-400 uppercase">Step:</div>
                  <div className="text-sm text-[#00EFA6]" style={{ fontFamily: "Advercase, monospace" }}>
                    {currentStep + 1}/4
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Code Flow Visualization */}
              <div className="lg:col-span-2">
                <h3 className="text-sm uppercase tracking-widest text-gray-400 mb-6" style={{ fontFamily: "Advercase, monospace" }}>
                  Live Code Processing
                </h3>
                
                {/* Code Display */}
                <div className="bg-black border-2 border-white/20 p-6 mb-6 relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/20">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-gray-400 text-xs ml-4">secure_login.js</span>
                    <div className="ml-auto flex items-center gap-2">
                      <div className="text-xs text-gray-400">{codeSteps[currentStep].stage}</div>
                      {isProcessing && <div className="w-2 h-2 bg-[#00EFA6] rounded-full animate-pulse" />}
                    </div>
                  </div>
                  
                  <pre className="text-sm text-white font-mono leading-relaxed">
                    {codeSteps[currentStep].input}
                  </pre>
                  
                  {/* Vulnerability Indicators */}
                  {codeSteps[currentStep].vulnerabilities.length > 0 && (
                    <div className="absolute top-4 right-4 space-y-1">
                      {codeSteps[currentStep].vulnerabilities.map((vuln, idx) => (
                        <div key={idx} className="bg-red-500 text-white text-xs px-2 py-1 uppercase tracking-wide animate-pulse">
                          ⚠ {vuln}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Success Indicator */}
                  {codeSteps[currentStep].vulnerabilities.length === 0 && currentStep > 0 && (
                    <div className="absolute top-4 right-4 bg-[#00EFA6] text-black text-xs px-3 py-1 uppercase tracking-wide">
                      ✓ SECURE
                    </div>
                  )}
                </div>

                {/* Process Flow Diagram */}
                <div className="relative">
                  <h4 className="text-xs text-gray-400 uppercase mb-4">Agent Processing Flow</h4>
                  <div className="flex items-center justify-between">
                    {agents.map((agent, idx) => {
                      const Icon = agent.icon;
                      const isActive = idx === activeAgent;
                      const isCompleted = idx < activeAgent || (idx === activeAgent && agents[idx].progress === 100);
                      
                      return (
                        <div key={idx} className="flex flex-col items-center relative">
                          {/* Connection Line */}
                          {idx < agents.length - 1 && (
                            <div className="absolute top-8 left-full w-full h-0.5 bg-white/20">
                              <div 
                                className="h-full bg-[#00EFA6] transition-all duration-500"
                                style={{ 
                                  width: isCompleted ? '100%' : isActive ? '50%' : '0%' 
                                }}
                              />
                            </div>
                          )}
                          
                          {/* Agent Node */}
                          <div className={`w-16 h-16 border-2 flex items-center justify-center transition-all duration-500 ${
                            isActive 
                              ? 'border-[#00EFA6] bg-[#00EFA6]/20 scale-110' 
                              : isCompleted 
                                ? 'border-[#00EFA6] bg-[#00EFA6]/10' 
                                : 'border-white/20 bg-black'
                          }`}>
                            <Icon 
                              className="w-8 h-8" 
                              style={{ color: isActive || isCompleted ? agent.color : '#666' }} 
                            />
                          </div>
                          
                          {/* Agent Info */}
                          <div className="mt-3 text-center max-w-24">
                            <div className="text-xs text-white mb-1">{agent.name.split(' ')[0]}</div>
                            {isActive && (
                              <div className="text-xs text-gray-400">{agent.task}</div>
                            )}
                          </div>
                          
                          {/* Progress Bar */}
                          {isActive && (
                            <div className="mt-2 w-20 h-1 bg-white/20">
                              <div 
                                className="h-full bg-[#00EFA6] transition-all duration-300"
                                style={{ width: `${agents[idx].progress}%` }}
                              />
                            </div>
                          )}
                          
                          {/* Completion Check */}
                          {isCompleted && (
                            <CheckCircle className="w-4 h-4 text-[#00EFA6] mt-2" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Live Security Dashboard */}
              <div>
                <h3 className="text-sm uppercase tracking-widest text-gray-400 mb-6" style={{ fontFamily: "Advercase, monospace" }}>
                  Security Dashboard
                </h3>
                
                {/* Real-time Security Score */}
                <div className="text-center p-6 border-2 border-[#00EFA6]/30 bg-[#00EFA6]/10 mb-6">
                  <div className="text-5xl font-light text-[#00EFA6] mb-2">{securityScore}</div>
                  <div className="text-sm text-gray-400 uppercase">Security Score</div>
                  <div className="mt-2 h-2 bg-black/50">
                    <div 
                      className="h-full bg-[#00EFA6] transition-all duration-500"
                      style={{ width: `${securityScore}%` }}
                    />
                  </div>
                </div>

                {/* Vulnerability Tracking */}
                <div className="space-y-4 mb-6">
                  <div className="p-4 border-2 border-red-400/30 bg-red-400/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-gray-400 uppercase">Vulnerabilities Found</div>
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="text-2xl font-light text-red-400">{vulnerabilitiesFound}</div>
                  </div>
                  
                  <div className="p-4 border-2 border-[#00EFA6]/30 bg-[#00EFA6]/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-gray-400 uppercase">Vulnerabilities Fixed</div>
                      <Shield className="w-4 h-4 text-[#00EFA6]" />
                    </div>
                    <div className="text-2xl font-light text-[#00EFA6]">{vulnerabilitiesFixed}</div>
                  </div>
                </div>

                {/* Processing Stats */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-3 border-2 border-white/20 bg-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-3 h-3 text-blue-400" />
                      <div className="text-xs text-gray-400 uppercase">Processing Speed</div>
                    </div>
                    <div className="text-lg font-light text-white">1.2s</div>
                  </div>
                  
                  <div className="p-3 border-2 border-white/20 bg-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="w-3 h-3 text-green-400" />
                      <div className="text-xs text-gray-400 uppercase">Lines Analyzed</div>
                    </div>
                    <div className="text-lg font-light text-white">{(currentStep + 1) * 156}</div>
                  </div>
                </div>

                {/* Agent Status */}
                <div className="mt-6">
                  <h4 className="text-xs text-gray-400 uppercase mb-3">Current Agent Status</h4>
                  <div className="p-4 border-2 border-white/20 bg-black/40">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-[#00EFA6] animate-pulse" />
                      <div>
                        <div className="text-sm text-white">{agents[activeAgent].name}</div>
                        <div className="text-xs text-gray-400">{agents[activeAgent].status}</div>
                      </div>
                    </div>
                  </div>
                </div>
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
                    <div className="w-12 h-12 flex items-center justify-center border-2 border-red-400/30 bg-red-400/10">
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-light text-white">73%</div>
                      <div className="text-sm text-gray-400">Of AI-generated code contains vulnerabilities</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center border-2 border-orange-400/30 bg-orange-400/10">
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
                <div className="bg-black border-2 border-red-400/30 p-6 font-mono text-sm">
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
              <div className="group p-8 border-2 border-white/20 hover:border-[#00EFA6]/50 transition-all duration-500 bg-white/5 hover:bg-white/10">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 border-2 border-[#00EFA6]/30 group-hover:border-[#00EFA6]/60 transition-colors">
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

              <div className="group p-8 border-2 border-white/20 hover:border-[#00EFA6]/50 transition-all duration-500 bg-white/5 hover:bg-white/10">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 border-2 border-[#00EFA6]/30 group-hover:border-[#00EFA6]/60 transition-colors">
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

              <div className="group p-8 border-2 border-white/20 hover:border-[#00EFA6]/50 transition-all duration-500 bg-white/5 hover:bg-white/10">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 border-2 border-[#00EFA6]/30 group-hover:border-[#00EFA6]/60 transition-colors">
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

              <div className="group p-8 border-2 border-white/20 hover:border-[#00EFA6]/50 transition-all duration-500 bg-white/5 hover:bg-white/10">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 border-2 border-[#00EFA6]/30 group-hover:border-[#00EFA6]/60 transition-colors">
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
      <section id="technology" className="relative min-h-screen flex items-center justify-center py-24 bg-black border-t border-white/10 snap-start">
        <div className="container mx-auto px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-[#00EFA6] text-sm tracking-widest uppercase mb-4 block" style={{ fontFamily: "Advercase, monospace" }}>Technology</span>
              <h3 className="text-4xl font-light mb-6" style={{ fontFamily: "Advercase, monospace" }}>
                <TextAnimate animation="slideUp" by="word">Powered By Industry Leaders</TextAnimate>
              </h3>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Built with cutting-edge AI models and battle-tested security tools.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              {[
                { name: "GPT-4o", desc: "Code Generation", color: "#00EFA6" },
                { name: "Claude 3.5", desc: "Security Analysis", color: "#60A5FA" },
                { name: "Groq Llama", desc: "Fast Debugging", color: "#F59E0B" },
                { name: "Ollama", desc: "Red Team Testing", color: "#EF4444" },
              ].map((tech, idx) => (
                <div 
                  key={idx}
                  className="group p-6 border-2 border-white/20 hover:border-[#00EFA6]/50 transition-all duration-500 bg-white/5 hover:bg-white/10 text-center"
                >
                  <div 
                    className="w-12 h-12 mx-auto mb-4 flex items-center justify-center border-2 transition-colors"
                    style={{ borderColor: `${tech.color}60` }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tech.color }} />
                  </div>
                  <h4 className="text-lg font-medium text-white mb-2" style={{ fontFamily: "Advercase, monospace" }}>{tech.name}</h4>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">{tech.desc}</p>
                </div>
              ))}
            </div>

            <div className="p-8 border-2 border-white/20 bg-white/5">
              <div className="text-center mb-6">
                <h4 className="text-sm uppercase tracking-widest text-gray-400 mb-2">Integrated Security Tools</h4>
              </div>
              <div className="flex flex-wrap justify-center gap-6">
                {["Semgrep", "ESLint Security", "npm audit", "Custom Patterns"].map((tool, idx) => (
                  <div key={idx} className="px-4 py-2 border-2 border-white/20 bg-white/5 text-sm text-white">
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
              <div className="text-center p-8 border-2 border-white/20 bg-white/5">
                <div className="text-5xl font-light text-[#00EFA6] mb-4" style={{ fontFamily: "Advercase, monospace" }}>80%+</div>
                <div className="text-white mb-2" style={{ fontFamily: "Advercase, monospace" }}>Vulnerability Reduction</div>
                <div className="text-sm text-gray-400" style={{ fontFamily: "Advercase, monospace" }}>Compared to standard AI code generation</div>
              </div>

              <div className="text-center p-8 border-2 border-white/20 bg-white/5">
                <div className="text-5xl font-light text-[#00EFA6] mb-4">2.3s</div>
                <div className="text-white mb-2">Average Analysis Time</div>
                <div className="text-sm text-gray-400">Complete security validation in seconds</div>
              </div>

              <div className="text-center p-8 border-2 border-white/20 bg-white/5">
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