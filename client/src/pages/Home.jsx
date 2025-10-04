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
  const pipelineRef = useRef(null);
  const [pipelineAutoStarted, setPipelineAutoStarted] = useState(false);
  
  // Number ticker states
  const [displayedSecurityScore, setDisplayedSecurityScore] = useState(0);
  const [displayedVulnFound, setDisplayedVulnFound] = useState(0);
  const [displayedVulnFixed, setDisplayedVulnFixed] = useState(0);
  const [displayedLinesScanned, setDisplayedLinesScanned] = useState(0);
  
  // Section scrolling states
  const [currentSection, setCurrentSection] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollAccumulator, setScrollAccumulator] = useState(0);
  const sections = ['hero', 'pipeline', 'problem', 'solution', 'technology', 'results'];
  const SCROLL_THRESHOLD = 50; // Minimum scroll delta to trigger section change
  
  // Number ticker function
  const animateNumber = (start, end, duration, setter) => {
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.floor(start + (end - start) * progress);
      setter(current);
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };
    tick();
  };
  
  // Scroll to specific section
  const scrollToSection = (sectionIndex) => {
    if (isScrolling || sectionIndex < 0 || sectionIndex >= sections.length) return;
    
    setIsScrolling(true);
    setScrollAccumulator(0); // Reset accumulator when scrolling
    const element = document.getElementById(sections[sectionIndex]);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentSection(sectionIndex);
      
      // Reset scrolling flag after animation (longer timeout for better control)
      setTimeout(() => setIsScrolling(false), 1500);
    }
  };

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

  // Pipeline auto-start on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !pipelineAutoStarted) {
            setPipelineAutoStarted(true);
            setIsProcessing(true);
            setHasPlayedOnce(true);
            
            // Start number animations
            animateNumber(0, securityScore, 2000, setDisplayedSecurityScore);
            animateNumber(0, securityInsights.codeLinesScanned, 2500, setDisplayedLinesScanned);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (pipelineRef.current) {
      observer.observe(pipelineRef.current);
    }

    return () => {
      if (pipelineRef.current) {
        observer.unobserve(pipelineRef.current);
      }
    };
  }, [pipelineAutoStarted, securityScore, securityInsights.codeLinesScanned]);
  
  // Animate vulnerability counters when they change
  useEffect(() => {
    animateNumber(displayedVulnFound, vulnerabilitiesFound, 800, setDisplayedVulnFound);
  }, [vulnerabilitiesFound]);
  
  useEffect(() => {
    animateNumber(displayedVulnFixed, vulnerabilitiesFixed, 800, setDisplayedVulnFixed);
  }, [vulnerabilitiesFixed]);
  
  // Handle wheel scrolling for section navigation
  useEffect(() => {
    let scrollTimeout;
    
    const handleWheel = (e) => {
      e.preventDefault();
      
      if (isScrolling) return;
      
      // Accumulate scroll delta
      setScrollAccumulator(prev => {
        const newAccumulator = prev + e.deltaY;
        
        // Clear previous timeout
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
        
        // Set timeout to reset accumulator if no scrolling for 150ms
        scrollTimeout = setTimeout(() => {
          setScrollAccumulator(0);
        }, 150);
        
        // Check if we've accumulated enough scroll to trigger section change
        if (Math.abs(newAccumulator) >= SCROLL_THRESHOLD) {
          if (newAccumulator > 0 && currentSection < sections.length - 1) {
            // Scroll down
            scrollToSection(currentSection + 1);
            return 0; // Reset accumulator
          } else if (newAccumulator < 0 && currentSection > 0) {
            // Scroll up
            scrollToSection(currentSection - 1);
            return 0; // Reset accumulator
          }
        }
        
        return newAccumulator;
      });
    };
    
    const container = document.querySelector('.scroll-container');
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [currentSection, isScrolling, sections.length, SCROLL_THRESHOLD]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isScrolling) return;
      
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        if (currentSection < sections.length - 1) {
          scrollToSection(currentSection + 1);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        if (currentSection > 0) {
          scrollToSection(currentSection - 1);
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentSection, isScrolling, sections.length]);

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
      input: `// User Input
function login(email, password) {
  // Generate login code
}`,
      output: `// AI Generated Code
function login(email, password) {
  const query = \`SELECT * FROM users 
    WHERE email='\${email}'\`;
  return db.query(query);
}`,
      vulnerabilities: [],
      stage: "Input"
    },
    {
      input: `// AI Generated Code
function login(email, password) {
  const query = \`SELECT * FROM users 
    WHERE email='\${email}'\`;
  return db.query(query);
}`,
      output: `// After Security Scan
function login(email, password) {
  const query = \`SELECT * FROM users 
    WHERE email=?\`;
  const hashedPwd = bcrypt.hash(password);
  return db.query(query, [email]);
}`,
      vulnerabilities: ["SQL Injection", "Password Not Hashed"],
      stage: "Generated Code"
    },
    {
      input: `// After Security Scan
function login(email, password) {
  const query = \`SELECT * FROM users 
    WHERE email=?\`;
  const hashedPwd = bcrypt.hash(password);
  return db.query(query, [email]);
}`,
      output: `// Red Team Fixed
function login(email, password) {
  const query = \`SELECT * FROM users 
    WHERE email=?\`;
  const user = await db.query(query, [email]);
  if (!user) throw new Error('Invalid');
  return bcrypt.compare(password, user.hash);
}`,
      vulnerabilities: ["Error Handling Missing"],
      stage: "After Security Scan"
    },
    {
      input: `// Red Team Fixed
function login(email, password) {
  const query = \`SELECT * FROM users 
    WHERE email=?\`;
  const user = await db.query(query, [email]);
  if (!user) throw new Error('Invalid');
  return bcrypt.compare(password, user.hash);
}`,
      output: `// Final Secure Code
function login(email, password) {
  const query = \`SELECT * FROM users 
    WHERE email=? LIMIT 1\`;
  const user = await db.query(query, [email]);
  if (!user) throw new Error('Invalid credentials');
  const isValid = await bcrypt.compare(password, user.hash);
  if (!isValid) throw new Error('Invalid credentials');
  return { success: true, userId: user.id };
}`,
      vulnerabilities: [],
      stage: "Secure Code"
    }
  ];

  return (
    <div className="scroll-container">
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

      {/* Page Position Indicator */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 space-y-2">
        {sections.map((section, idx) => {
          const isActive = idx === currentSection;
          return (
            <div key={section} className="relative group">
              <div 
                className={`w-1 h-6 transition-all duration-300 cursor-pointer ${
                  isActive ? 'bg-white' : 'bg-white/30 hover:bg-white/50'
                }`}
                onClick={() => {
                  setCurrentSection(idx);
                  document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-black/90 border border-white/20 text-white text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {section.toUpperCase()}
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION 1: HERO */}
      <section id="hero" className="snap-section relative flex items-center justify-center overflow-hidden bg-black text-white">
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
      <section id="pipeline" className="snap-section relative pt-24 pb-4 bg-black border-t border-white/10 text-white" ref={pipelineRef}>
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-5">
          <source src="/Illuminated Jellyfish Video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/80" />
        <div className="container mx-auto px-6 max-w-6xl relative z-10 h-full flex flex-col justify-center">
          
          {/* Header */}
          <div className="mb-2">
            <h2 className="text-2xl font-light mb-1 text-white" style={{ fontFamily: "Advercase, monospace" }}>
              Security Pipeline
            </h2>
            <p className="text-gray-400 text-xs">Multi-agent code security analysis and remediation</p>
          </div>

          {/* Pipeline Process */}
          <div className="space-y-4">
            
            {/* Agent Flow */}
            <div className="border border-white/20 bg-black/50">
              <div className="p-4 border-b border-white/20">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-medium" style={{ fontFamily: "Advercase, monospace" }}>SECURITY AGENTS</span>
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
              
              <div className="p-4">
                <div className="grid grid-cols-4 gap-4">
                  {agents.map((agent, idx) => {
                    const isActive = idx === activeAgent;
                    const isCompleted = idx < activeAgent;
                    
                    return (
                      <div key={idx} className="text-center">
                        <div className={`w-12 h-12 mx-auto mb-2 border-2 flex items-center justify-center transition-all duration-500 ${
                          isActive ? 'border-white bg-white/10' : 
                          isCompleted ? 'border-emerald-400 bg-emerald-400/10' : 
                          'border-white/30'
                        }`}>
                          <div className={`text-xs font-mono ${
                            isActive ? 'text-white' : 
                            isCompleted ? 'text-emerald-400' : 
                            'text-gray-500'
                          }`}>
                            {String(idx + 1).padStart(2, '0')}
                          </div>
                        </div>
                        
                        <div className={`text-xs font-medium mb-1 ${
                          isActive || isCompleted ? 'text-white' : 'text-gray-500'
                        }`} style={{ fontFamily: "Advercase, monospace" }}>
                          {agent.name.toUpperCase()}
                        </div>
                        
                        <div className="text-xs text-gray-400 mb-1 h-8 overflow-hidden">
                          {agent.task}
                        </div>
                        
                        <div className={`text-xs px-1 py-0.5 border ${
                          isCompleted ? 'border-emerald-400/30 text-emerald-400 bg-emerald-400/10' : 
                          isActive ? 'border-white/30 text-white bg-white/10' : 
                          'border-white/20 text-gray-500'
                        }`}>
                          {isCompleted ? 'COMPLETE' : isActive ? 'RUNNING' : 'QUEUED'}
                        </div>
                        
                        {isActive && (
                          <div className="mt-1 w-full h-0.5 bg-white/20">
                            <div className="h-full bg-white transition-all duration-300 animate-pulse" style={{ width: '60%' }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Stats and Terminal Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Stats */}
              <div className="border border-white/20 bg-black/50">
                <div className="p-2 border-b border-white/20">
                  <span className="text-white text-xs font-medium" style={{ fontFamily: "Advercase, monospace" }}>LIVE STATS</span>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs">SECURITY SCORE</span>
                    <span className="text-emerald-400 text-lg font-mono">{displayedSecurityScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10">
                    <div className="h-full bg-emerald-400 transition-all duration-1000" style={{ width: `${displayedSecurityScore}%` }} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="text-center">
                      <div className="text-red-400 text-lg font-mono">{displayedVulnFound}</div>
                      <div className="text-xs text-gray-400">VULNERABILITIES</div>
                    </div>
                    <div className="text-center">
                      <div className="text-emerald-400 text-lg font-mono">{displayedVulnFixed}</div>
                      <div className="text-xs text-gray-400">FIXED</div>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">LINES SCANNED</span>
                      <span className="text-blue-400 font-mono">{displayedLinesScanned.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Terminal Output */}
              <div className="lg:col-span-2 border border-white/20 bg-black/90">
                <div className="p-2 border-b border-white/20">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-xs font-medium" style={{ fontFamily: "Advercase, monospace" }}>SECURITY TERMINAL</span>
                    <div className="text-xs text-gray-500 font-mono">
                      STEP {currentStep + 1}/4 | AGENT: {agents[activeAgent].name.toUpperCase()}
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <div className="font-mono text-xs space-y-0.5 text-gray-300 h-32 overflow-y-auto">
                    <div className="text-gray-500">$ overlook-security --scan --realtime --verbose</div>
                    <div className="text-gray-400">Initializing security pipeline...</div>
                    <div className="text-gray-400">Loading security modules: [Semgrep, ESLint, Custom Rules]</div>
                    <div className="text-white">Pipeline ready. Starting agent workflow...</div>
                    <div className="text-gray-400">---</div>
                    
                    {isProcessing && (
                      <>
                        <div className="text-white">🔄 Running: {agents[activeAgent].name}</div>
                        <div className="text-gray-400">Task: {agents[activeAgent].task}</div>
                        
                        {/* Agent-specific terminal output */}
                        {activeAgent === 0 && (
                          <>
                            <div className="text-blue-400">$ ai-generator --model=gpt-4 --security-mode</div>
                            <div className="text-gray-400">Generating secure code patterns...</div>
                            <div className="text-gray-400">Applying security templates...</div>
                          </>
                        )}
                        
                        {activeAgent === 1 && (
                          <>
                            <div className="text-blue-400">$ debug-agent --trace --memory-check</div>
                            <div className="text-gray-400">Analyzing code flow...</div>
                            <div className="text-gray-400">Checking for logic errors...</div>
                          </>
                        )}
                        
                        {activeAgent === 2 && (
                          <>
                            <div className="text-amber-400">$ semgrep --config=security --sarif-output</div>
                            <div className="text-gray-400">Scanning for OWASP Top 10...</div>
                            <div className="text-gray-400">Running 247 security rules...</div>
                            {vulnerabilitiesFound > 0 && (
                              <>
                                <div className="text-red-400">⚠️  {vulnerabilitiesFound} vulnerabilities detected!</div>
                                {codeSteps[currentStep].vulnerabilities.map((vuln, idx) => (
                                  <div key={idx} className="text-red-400">  └─ {vuln}</div>
                                ))}
                              </>
                            )}
                          </>
                        )}
                        
                        {activeAgent === 3 && (
                          <>
                            <div className="text-red-400">$ red-team-agent --aggressive --exploit-mode</div>
                            <div className="text-red-400">🔴 INITIATING PENETRATION TESTING...</div>
                            <div className="text-red-400">$ sqlmap -u target --batch --level=5 --risk=3</div>
                            <div className="text-red-400">$ nikto -h target -C all -evasion 1234567890AB</div>
                            <div className="text-red-400">$ nmap -sS -sV -O -A --script vuln target</div>
                            <div className="text-red-400">$ hydra -L users.txt -P pass.txt target http-form-post</div>
                            <div className="text-red-400">$ burpsuite --scan --active-scan target</div>
                            <div className="text-red-400">$ zap-baseline.py -t target -J report.json</div>
                            <div className="text-red-400">$ wfuzz -c -z file,payloads.txt target/FUZZ</div>
                            <div className="text-red-400">$ gobuster dir -u target -w /usr/share/wordlists/dirb/common.txt</div>
                            <div className="text-red-400">$ ffuf -w wordlist.txt -u target/FUZZ -mc 200,301,302</div>
                            <div className="text-orange-400">Testing XSS vectors...</div>
                            <div className="text-orange-400">Attempting SQL injection...</div>
                            <div className="text-orange-400">Checking authentication bypass...</div>
                            <div className="text-orange-400">Fuzzing API endpoints...</div>
                            <div className="text-orange-400">Testing CSRF vulnerabilities...</div>
                            <div className="text-yellow-400">🛡️  Attempting exploit mitigation...</div>
                            {vulnerabilitiesFixed > 0 && (
                              <div className="text-emerald-400">✅ {vulnerabilitiesFixed} vulnerabilities patched!</div>
                            )}
                          </>
                        )}
                      </>
                    )}
                    
                    {!isProcessing && hasPlayedOnce && (
                      <>
                        <div className="text-emerald-400">✅ Pipeline execution completed.</div>
                        <div className="text-emerald-400">🔒 Security score: {securityScore}%</div>
                        <div className="text-gray-400">All security agents finished successfully.</div>
                        <div className="text-gray-400">Code is ready for production deployment.</div>
                      </>
                    )}
                    
                    <div className="flex items-center mt-2">
                      <span className="text-gray-500">$ </span>
                      <div className="w-2 h-3 bg-white/50 ml-1 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Code Diff */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Before */}
              <div className="border border-white/20 bg-black/50">
                <div className="p-2 border-b border-white/20">
                  <span className="text-gray-400 text-xs font-medium" style={{ fontFamily: "Advercase, monospace" }}>INPUT CODE</span>
                </div>
                <div className="p-3">
                  <pre className="text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap h-24 overflow-y-auto">
{currentStep === 0 ? codeSteps[0].input : codeSteps[currentStep].input}
                  </pre>
                  {currentStep > 0 && codeSteps[currentStep].vulnerabilities.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="text-red-400 text-xs font-medium">Security Issues:</div>
                      {codeSteps[currentStep].vulnerabilities.map((vuln, idx) => (
                        <div key={idx} className="text-red-400 text-xs flex items-center gap-2">
                          <div className="w-1 h-1 bg-red-400 rounded-full" />
                          {vuln}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* After */}
              <div className="border border-white/20 bg-black/50">
                <div className="p-2 border-b border-white/20">
                  <span className="text-gray-400 text-xs font-medium" style={{ fontFamily: "Advercase, monospace" }}>SECURED CODE</span>
                </div>
                <div className="p-3">
                  <pre className="text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap h-24 overflow-y-auto">
{currentStep === 0 ? '// Processing...' : codeSteps[currentStep].output}
                  </pre>
                  {currentStep > 0 && codeSteps[currentStep].vulnerabilities.length === 0 && (
                    <div className="mt-2">
                      <div className="text-emerald-400 text-xs flex items-center gap-2">
                        <div className="w-1 h-1 bg-emerald-400 rounded-full" />
                        All security issues resolved
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* SECTION 3: THE PROBLEM */}
      <section id="problem" className="snap-section relative py-16 bg-black border-t border-white/10 text-white flex items-center justify-center">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-3">
          <source src="/Illuminated Jellyfish Video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/90" />
        <div className="container mx-auto px-8 max-w-5xl relative z-10">
          
          <div className="mb-8">
            <h3 className="text-3xl font-light mb-2 text-white" style={{ fontFamily: "Advercase, monospace" }}>
              The Problem
            </h3>
            <p className="text-gray-400 text-sm">Traditional AI code generators create vulnerable systems</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Statistics */}
            <div className="space-y-6">
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
              
              {/* Common Vulnerabilities */}
              <div className="border border-white/20 bg-black/50">
                <div className="p-4 border-b border-white/20">
                  <span className="text-white text-sm font-medium" style={{ fontFamily: "Advercase, monospace" }}>COMMON VULNERABILITIES</span>
                </div>
                <div className="p-4 space-y-2">
                  {[
                    { name: 'SQL Injection', severity: 'Critical', percentage: '47%' },
                    { name: 'XSS Attacks', severity: 'High', percentage: '31%' },
                    { name: 'Authentication Bypass', severity: 'Critical', percentage: '28%' },
                    { name: 'Data Exposure', severity: 'High', percentage: '22%' }
                  ].map((vuln, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-gray-300">{vuln.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs ${
                          vuln.severity === 'Critical' ? 'text-red-400 bg-red-400/10' : 'text-orange-400 bg-orange-400/10'
                        }`}>{vuln.severity}</span>
                        <span className="text-white font-mono">{vuln.percentage}</span>
                      </div>
                    </div>
                  ))}
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
                
                <div className="mt-4 space-y-2">
                  <div className="text-xs text-red-400 font-medium">Security Issues Detected:</div>
                  <div className="space-y-1">
                    <div className="text-xs text-red-300 flex items-center gap-2">
                      <div className="w-1 h-1 bg-red-400 rounded-full" />
                      SQL Injection via unsanitized input
                    </div>
                    <div className="text-xs text-red-300 flex items-center gap-2">
                      <div className="w-1 h-1 bg-red-400 rounded-full" />
                      No password verification
                    </div>
                    <div className="text-xs text-red-300 flex items-center gap-2">
                      <div className="w-1 h-1 bg-red-400 rounded-full" />
                      Missing error handling
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* SECTION 4: OUR SOLUTION */}
      <section id="solution" className="snap-section relative py-16 bg-black border-t border-white/10 text-white flex items-center justify-center">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-3">
          <source src="/Illuminated Jellyfish Video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/90" />
        <div className="container mx-auto px-8 max-w-5xl relative z-10">
          
          <div className="mb-8">
            <h3 className="text-3xl font-light mb-2 text-white" style={{ fontFamily: "Advercase, monospace" }}>
              Our Solution
            </h3>
            <p className="text-gray-400 text-sm">Multi-agent security architecture with real-time validation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            
            <div className="border border-white/20 bg-black/50 p-4">
              <div className="mb-3">
                <div className="text-white text-sm font-medium mb-1" style={{ fontFamily: "Advercase, monospace" }}>REAL-TIME VALIDATION</div>
                <div className="text-xs text-gray-400">Every line analyzed using Semgrep and custom patterns</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Detection Rate</span>
                  <span className="text-emerald-400">99.7%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Analysis Speed</span>
                  <span className="text-blue-400">&lt;100ms</span>
                </div>
              </div>
            </div>

            <div className="border border-white/20 bg-black/50 p-4">
              <div className="mb-3">
                <div className="text-white text-sm font-medium mb-1" style={{ fontFamily: "Advercase, monospace" }}>RED TEAM TESTING</div>
                <div className="text-xs text-gray-400">Adversarial agents actively exploit code vulnerabilities</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Attack Vectors</span>
                  <span className="text-red-400">50+</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Success Rate</span>
                  <span className="text-amber-400">94%</span>
                </div>
              </div>
            </div>

            <div className="border border-white/20 bg-black/50 p-4">
              <div className="mb-3">
                <div className="text-white text-sm font-medium mb-1" style={{ fontFamily: "Advercase, monospace" }}>AUTO PATCHING</div>
                <div className="text-xs text-gray-400">Automatic generation of secure code alternatives</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Fix Rate</span>
                  <span className="text-emerald-400">96.2%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Avg Time</span>
                  <span className="text-blue-400">1.2s</span>
                </div>
              </div>
            </div>
            
          </div>

          {/* Architecture Diagram */}
          <div className="border border-white/20 bg-black/80">
            <div className="p-4 border-b border-white/20">
              <span className="text-white text-sm font-medium" style={{ fontFamily: "Advercase, monospace" }}>SECURITY ARCHITECTURE</span>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { step: '01', name: 'CODE INPUT', desc: 'User provides prompt or code' },
                  { step: '02', name: 'AI GENERATION', desc: 'Multiple models generate solutions' },
                  { step: '03', name: 'SECURITY SCAN', desc: 'Real-time vulnerability detection' },
                  { step: '04', name: 'SECURE OUTPUT', desc: 'Validated, patched code delivery' }
                ].map((item, idx) => (
                  <div key={idx} className="text-center">
                    <div className="border border-white/20 p-3 mb-2">
                      <div className="text-xs text-gray-500 mb-1">{item.step}</div>
                      <div className="text-sm text-white font-medium" style={{ fontFamily: "Advercase, monospace" }}>{item.name}</div>
                    </div>
                    <div className="text-xs text-gray-400">{item.desc}</div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 font-mono text-xs text-gray-400 text-center">
                INPUT → GENERATE → VALIDATE → PATCH → SECURE_OUTPUT
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* SECTION 5: TECHNOLOGY */}
      <section 
        id="technology" 
        className="snap-section relative py-16 bg-black border-t border-white/10 text-white flex items-center justify-center"
        ref={techContainerRef}
      >
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-3">
          <source src="/Illuminated Jellyfish Video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/90" />
        <div className="container mx-auto px-8 max-w-5xl relative z-10">
          
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
      <section id="results" className="snap-section relative py-16 bg-black border-t border-white/10 text-white flex items-center justify-center">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-3">
          <source src="/Illuminated Jellyfish Video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/90" />
        <div className="container mx-auto px-8 max-w-5xl relative z-10">
          
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
      <footer className="relative border-t border-white/10 py-8 bg-black">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-2">
          <source src="/Illuminated Jellyfish Video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/95" />
        <div className="container mx-auto px-8 max-w-5xl relative z-10">
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
        * {
          box-sizing: border-box;
        }
        
        html, body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          height: 100vh;
        }
        
        /* Scroll snap container */
        .scroll-container {
          height: 100vh;
          overflow-y: auto;
          scroll-behavior: smooth;
        }
        
        /* Individual sections */
        .snap-section {
          min-height: 100vh;
          position: relative;
          display: flex;
          flex-direction: column;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
        
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