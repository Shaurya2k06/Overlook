import { Link } from "react-router-dom";
import { Code, Users, Sparkles, Lock, Shield, Zap, Terminal, GitBranch, Activity, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import AOS from 'aos';
import 'aos/dist/aos.css';

function Home() {
  const [activeAgent, setActiveAgent] = useState(0);
  const [securityScore, setSecurityScore] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Initialize AOS
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out',
      offset: 100,
    });

    setIsVisible(true);
    
    // Animate security score
    const scoreInterval = setInterval(() => {
      setSecurityScore(prev => {
        if (prev < 98) return prev + 1;
        clearInterval(scoreInterval);
        return prev;
      });
    }, 20);

    // Cycle through agents
    const agentInterval = setInterval(() => {
      setActiveAgent(prev => (prev + 1) % 4);
    }, 3000);

    return () => {
      clearInterval(scoreInterval);
      clearInterval(agentInterval);
    };
  }, []);

  const agents = [
    { name: "Generation Agent", icon: Code, color: "#00EFA6", status: "Generating secure code..." },
    { name: "Debugging Agent", icon: Terminal, color: "#60A5FA", status: "Analyzing for errors..." },
    { name: "Security Agent", icon: Shield, color: "#F59E0B", status: "Scanning vulnerabilities..." },
    { name: "Red Team Agent", icon: AlertTriangle, color: "#EF4444", status: "Testing exploits..." }
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-white relative overflow-hidden">
      {/* Animated Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div 
          className="absolute inset-0 animate-[grid_20s_linear_infinite]" 
          style={{
            backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} 
        />
      </div>

      {/* Animated Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00EFA6]/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00EFA6]/[0.02] to-transparent pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/5">
        <div className="container mx-auto px-8">
          <div className="h-20 flex items-center justify-between">
            <h1 className="text-3xl font-light tracking-tight text-white/90">
              overlook
            </h1>
            <Link
              to="/dashboard"
              className="px-6 py-2 bg-transparent hover:bg-[#00EFA6] border border-[#00EFA6] text-[#00EFA6] hover:text-black transition-all duration-300 text-sm uppercase tracking-widest"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="container mx-auto px-8">
          <div className="max-w-7xl mx-auto">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="text-center mb-12">

                
                <h1 className="text-6xl sm:text-7xl lg:text-8xl font-light tracking-tight text-white/90 mb-8 leading-tight">
                  <span className="block">Generate</span>
                  <span className="block mt-2 bg-gradient-to-r from-[#00EFA6] to-blue-400 bg-clip-text text-transparent">Secure Code</span>
                  <span className="block mt-2">By Default</span>
                </h1>
                
                <p className="text-xl text-white/60 leading-relaxed max-w-3xl mx-auto mb-12">
                  The first AI code generation platform with built-in security validation. 
                  <span className="text-[#00EFA6]"> Reduce vulnerabilities by 80%+</span> through 
                  real-time multi-agent security analysis and adversarial testing.
                </p>

                <div className="flex items-center justify-center gap-6 flex-col sm:flex-row mb-16">
                  <Link
                    to="/dashboard"
                    className="group relative px-12 py-5 bg-[#00EFA6] text-black hover:bg-[#00EFA6]/90 transition-all duration-300 text-sm uppercase tracking-widest overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Try Live Demo
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                  <button
                    className="px-12 py-5 bg-transparent hover:bg-white/5 border border-white/10 text-white transition-all duration-300 text-sm uppercase tracking-widest"
                  >
                    Watch Demo
                  </button>
                </div>

                {/* Live Agent Visualization */}
                <div className="max-w-5xl mx-auto">
                  <div className="bg-black/40 border border-white/10 backdrop-blur-sm p-8 relative overflow-hidden">
                    {/* Animated border effect */}
                    <div className="absolute inset-0 border-t-2 border-[#00EFA6] animate-[border-flow_3s_linear_infinite]" style={{ width: '30%' }} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Agent Pipeline */}
                      <div>
                        <h3 className="text-sm uppercase tracking-widest text-white/60 mb-6">Multi-Agent Pipeline</h3>
                        <div className="space-y-4">
                          {agents.map((agent, idx) => {
                            const Icon = agent.icon;
                            const isActive = idx === activeAgent;
                            const isCompleted = idx < activeAgent;
                            
                            return (
                              <div 
                                key={idx}
                                className={`flex items-center gap-4 p-4 border transition-all duration-500 ${
                                  isActive 
                                    ? 'border-[#00EFA6] bg-[#00EFA6]/5 scale-105' 
                                    : isCompleted
                                    ? 'border-white/10 bg-white/[0.02]'
                                    : 'border-white/5 bg-transparent opacity-50'
                                }`}
                              >
                                <div className={`p-2 border transition-all duration-500 ${
                                  isActive ? 'border-[#00EFA6]' : 'border-white/10'
                                }`}>
                                  <Icon 
                                    className={`w-5 h-5 transition-colors duration-500`} 
                                    style={{ color: isActive || isCompleted ? agent.color : '#666' }}
                                  />
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-white/90">{agent.name}</div>
                                  {isActive && (
                                    <div className="text-xs text-white/60 mt-1">{agent.status}</div>
                                  )}
                                </div>
                                {isCompleted && (
                                  <CheckCircle className="w-5 h-5 text-[#00EFA6]" />
                                )}
                                {isActive && (
                                  <Activity className="w-5 h-5 text-[#00EFA6] animate-pulse" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Security Dashboard */}
                      <div>
                        <h3 className="text-sm uppercase tracking-widest text-white/60 mb-6">Security Score</h3>
                        <div className="space-y-6">
                          {/* Score Display */}
                          <div className="relative">
                            <div className="text-center p-8 border border-[#00EFA6]/20 bg-[#00EFA6]/5">
                              <div className="text-7xl font-light text-[#00EFA6] mb-2">
                                {securityScore}
                              </div>
                              <div className="text-sm text-white/60 uppercase tracking-wider">Security Rating</div>
                            </div>
                            {/* Animated border */}
                            <div className="absolute inset-0 border-2 border-[#00EFA6]/0 animate-[pulse-border_2s_ease-in-out_infinite]" />
                          </div>

                          {/* Security Metrics */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 border border-white/10 bg-white/[0.02]">
                              <div className="flex items-center gap-2 mb-2">
                                <Shield className="w-4 h-4 text-[#00EFA6]" />
                                <div className="text-xs text-white/60 uppercase">Vulnerabilities</div>
                              </div>
                              <div className="text-2xl font-light text-white">0</div>
                            </div>
                            <div className="p-4 border border-white/10 bg-white/[0.02]">
                              <div className="flex items-center gap-2 mb-2">
                                <Zap className="w-4 h-4 text-blue-400" />
                                <div className="text-xs text-white/60 uppercase">Speed</div>
                              </div>
                              <div className="text-2xl font-light text-white">2.3s</div>
                            </div>
                          </div>

                          {/* Status Indicator */}
                          <div className="flex items-center gap-2 p-4 border border-[#00EFA6]/20 bg-[#00EFA6]/5">
                            <CheckCircle className="w-5 h-5 text-[#00EFA6]" />
                            <span className="text-sm text-white/90">All security checks passed</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement Section */}
      <section className="relative py-24 border-t border-white/5" data-aos="fade-up">
        <div className="container mx-auto px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div data-aos="fade-right" data-aos-delay="100">
                <span className="text-[#00EFA6] text-sm tracking-widest uppercase mb-4 block">
                  The Problem
                </span>
                <h3 className="text-4xl font-light mb-6 leading-tight">
                  Traditional AI Code Generators Create <span className="text-red-400">Vulnerable Code</span>
                </h3>
                <p className="text-white/60 text-lg leading-relaxed mb-8">
                  Existing tools treat security as an afterthought, leading to critical vulnerabilities 
                  in production systems. Developers spend hours manually auditing AI-generated code.
                </p>
                
                {/* Statistics */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center border border-red-400/20 bg-red-400/5">
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-light text-white">73%</div>
                      <div className="text-sm text-white/60">Of AI-generated code contains vulnerabilities</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center border border-orange-400/20 bg-orange-400/5">
                      <AlertTriangle className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-light text-white">$45B+</div>
                      <div className="text-sm text-white/60">Annual cost of security breaches</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Code Example */}
              <div className="relative" data-aos="fade-left" data-aos-delay="200">
                <div className="bg-black border border-red-400/20 p-6 font-mono text-sm">
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-white/40 text-xs ml-4">vulnerable_code.js</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-white/40">// AI Generated Code</div>
                    <div className="text-white/80">app.post('/login', (req, res) =&gt; {'{'}</div>
                    <div className="text-white/80 pl-4">const query = <span className="text-red-400">`SELECT * FROM users</span></div>
                    <div className="text-white/80 pl-8"><span className="text-red-400">WHERE email='$&#123;req.body.email&#125;'`</span>;</div>
                    <div className="text-white/80">{'}'});</div>
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

      {/* Features Section */}
      <section className="relative py-24 border-t border-white/5" data-aos="fade-up">
        <div className="container mx-auto px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-[#00EFA6] text-sm tracking-widest uppercase mb-4 block">
                Our Solution
              </span>
              <h3 className="text-4xl font-light mb-6">Security-First Architecture</h3>
              <p className="text-white/60 text-lg max-w-2xl mx-auto">
                Four specialized AI agents working together to generate, validate, 
                and secure your code in real-time.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Feature Card 1 */}
              <div className="group p-8 border border-white/10 hover:border-[#00EFA6]/30 transition-all duration-500 bg-white/[0.02] hover:bg-white/[0.04]" data-aos="zoom-in" data-aos-delay="100">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 border border-[#00EFA6]/20 group-hover:border-[#00EFA6]/40 transition-colors">
                    <Shield className="w-6 h-6 text-[#00EFA6]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white mb-2">Real-time Security Validation</h4>
                    <p className="text-white/60 leading-relaxed text-sm">
                      Every line of generated code is instantly analyzed by our Security Agent using 
                      Semgrep and custom vulnerability patterns. Catch issues before they ship.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature Card 2 */}
              <div className="group p-8 border border-white/10 hover:border-[#00EFA6]/30 transition-all duration-500 bg-white/[0.02] hover:bg-white/[0.04]" data-aos="zoom-in" data-aos-delay="200">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 border border-[#00EFA6]/20 group-hover:border-[#00EFA6]/40 transition-colors">
                    <AlertTriangle className="w-6 h-6 text-[#00EFA6]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white mb-2">Adversarial Red Team Testing</h4>
                    <p className="text-white/60 leading-relaxed text-sm">
                      Our Red Team Agent actively tries to exploit your code, simulating real-world 
                      attacks. See actual vulnerability demonstrations before deployment.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature Card 3 */}
              <div className="group p-8 border border-white/10 hover:border-[#00EFA6]/30 transition-all duration-500 bg-white/[0.02] hover:bg-white/[0.04]" data-aos="zoom-in" data-aos-delay="300">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 border border-[#00EFA6]/20 group-hover:border-[#00EFA6]/40 transition-colors">
                    <GitBranch className="w-6 h-6 text-[#00EFA6]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white mb-2">Multi-Agent Collaboration</h4>
                    <p className="text-white/60 leading-relaxed text-sm">
                      Watch as Generation, Debugging, Security, and Red Team agents engage in 
                      collaborative dialogues to refine and secure your code automatically.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature Card 4 */}
              <div className="group p-8 border border-white/10 hover:border-[#00EFA6]/30 transition-all duration-500 bg-white/[0.02] hover:bg-white/[0.04]" data-aos="zoom-in" data-aos-delay="400">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 border border-[#00EFA6]/20 group-hover:border-[#00EFA6]/40 transition-colors">
                    <Zap className="w-6 h-6 text-[#00EFA6]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white mb-2">Automated Patch Generation</h4>
                    <p className="text-white/60 leading-relaxed text-sm">
                      When vulnerabilities are detected, our system automatically generates secure 
                      alternatives with detailed explanations of the security improvements.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="relative py-24 border-t border-white/5" data-aos="fade-up">
        <div className="container mx-auto px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-[#00EFA6] text-sm tracking-widest uppercase mb-4 block">
                Technology
              </span>
              <h3 className="text-4xl font-light mb-6">Powered By Industry Leaders</h3>
              <p className="text-white/60 text-lg max-w-2xl mx-auto">
                Built with cutting-edge AI models and battle-tested security tools.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Tech Card */}
              {[
                { name: "GPT-4o", desc: "Code Generation", color: "#00EFA6" },
                { name: "Claude 3.5", desc: "Security Analysis", color: "#60A5FA" },
                { name: "Groq Llama", desc: "Fast Debugging", color: "#F59E0B" },
                { name: "Ollama", desc: "Red Team Testing", color: "#EF4444" },
              ].map((tech, idx) => (
                <div 
                  key={idx}
                  className="group p-6 border border-white/10 hover:border-[#00EFA6]/30 transition-all duration-500 bg-white/[0.02] hover:bg-white/[0.04] text-center"
                >
                  <div 
                    className="w-12 h-12 mx-auto mb-4 flex items-center justify-center border transition-colors"
                    style={{ borderColor: `${tech.color}40` }}
                  >
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tech.color }}
                    />
                  </div>
                  <h4 className="text-lg font-medium text-white mb-2">{tech.name}</h4>
                  <p className="text-xs text-white/60 uppercase tracking-wider">{tech.desc}</p>
                </div>
              ))}
            </div>

            {/* Security Tools */}
            <div className="mt-12 p-8 border border-white/10 bg-white/[0.02]">
              <div className="text-center mb-6">
                <h4 className="text-sm uppercase tracking-widest text-white/60 mb-2">Integrated Security Tools</h4>
              </div>
              <div className="flex flex-wrap justify-center gap-6">
                {["Semgrep", "ESLint Security", "npm audit", "Custom Patterns"].map((tool, idx) => (
                  <div key={idx} className="px-4 py-2 border border-white/10 bg-white/[0.02] text-sm text-white/80">
                    {tool}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="relative py-24 border-t border-white/5" data-aos="fade-up">
        <div className="container mx-auto px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-[#00EFA6] text-sm tracking-widest uppercase mb-4 block">
                Results
              </span>
              <h3 className="text-4xl font-light mb-6">Measurable Security Improvement</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-8 border border-white/10 bg-white/[0.02]" data-aos="flip-up" data-aos-delay="100">
                <div className="text-5xl font-light text-[#00EFA6] mb-4">80%+</div>
                <div className="text-white/90 mb-2">Vulnerability Reduction</div>
                <div className="text-sm text-white/60">Compared to standard AI code generation</div>
              </div>

              <div className="text-center p-8 border border-white/10 bg-white/[0.02]" data-aos="flip-up" data-aos-delay="200">
                <div className="text-5xl font-light text-[#00EFA6] mb-4">2.3s</div>
                <div className="text-white/90 mb-2">Average Analysis Time</div>
                <div className="text-sm text-white/60">Complete security validation in seconds</div>
              </div>

              <div className="text-center p-8 border border-white/10 bg-white/[0.02]" data-aos="flip-up" data-aos-delay="300">
                <div className="text-5xl font-light text-[#00EFA6] mb-4">100%</div>
                <div className="text-white/90 mb-2">Coverage</div>
                <div className="text-sm text-white/60">Every line of code is security validated</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 border-t border-white/5 overflow-hidden" data-aos="zoom-in">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00EFA6]/10 via-blue-500/10 to-[#00EFA6]/10 animate-gradient-x" />
        </div>
        
        <div className="container mx-auto px-8 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-5xl sm:text-6xl font-light mb-6 leading-tight">
                Generate Secure Code <br />
                <span className="text-[#00EFA6]">In Seconds</span>
              </h3>
              <p className="text-white/60 text-xl mb-10 leading-relaxed max-w-2xl mx-auto">
                Join the future of AI-powered development with built-in security validation. 
                Try our live demo and see the difference.
              </p>
              
              <div className="flex items-center justify-center gap-6 flex-col sm:flex-row mb-12">
                <Link
                  to="/dashboard"
                  className="group px-14 py-5 bg-[#00EFA6] text-black hover:bg-[#00EFA6]/90 transition-all duration-300 text-sm uppercase tracking-widest relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Try Live Demo
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </Link>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-14 py-5 bg-transparent hover:bg-white/5 border border-white/10 text-white transition-all duration-300 text-sm uppercase tracking-widest"
                >
                  View on GitHub
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-8 pt-8 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#00EFA6]" />
                  <span className="text-sm text-white/60">No Credit Card Required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#00EFA6]" />
                  <span className="text-sm text-white/60">Free for Developers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#00EFA6]" />
                  <span className="text-sm text-white/60">Open Source</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/5 py-12">
        <div className="container mx-auto px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-white/40 text-sm">
              © {new Date().getFullYear()} Overlook. All rights reserved.
            </div>
            <div className="text-white/40 text-sm">
              Built with React & WebSocket
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
