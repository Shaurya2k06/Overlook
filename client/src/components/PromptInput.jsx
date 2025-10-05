import { useState, useEffect, useRef } from "react";
import { Terminal, Send, AlertTriangle, Shield, Zap } from "lucide-react";
import { useFileSystem } from '../contexts/useFileSystem';

// API Base URL configuration
const API_BASE_URL = import.meta.env.MODE === 'production' 
  ? 'https://overlook-6yrs.onrender.com/api'
  : 'http://localhost:3001/api';

const PromptInput = ({ onSubmit, roomId, onLogUpdate }) => {
  const { actions } = useFileSystem(); // Get FileSystem actions for creating files
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processStep, setProcessStep] = useState("");
  const [progress, setProgress] = useState(0);
  const [isSecureMode, setIsSecureMode] = useState(false);
  const [pipelineSteps, setPipelineSteps] = useState([]);
  const [currentAgent, setCurrentAgent] = useState("");
  const [logs, setLogs] = useState([]);
  
  // Mock demo system state
  const [mockLoading, setMockLoading] = useState(false);
  const [currentMockAgent, setCurrentMockAgent] = useState(0);
  
  // Mock agents configuration
  const mockAgents = [
    { name: 'Gemini Flash 1.5', icon: '🔮', task: 'Analyzing prompt and structuring requirements', duration: 3000 },
    { name: 'GPT-4o', icon: '🧠', task: 'Generating core application structure', duration: 4000 },
    { name: 'Mistral Medium', icon: '⚡', task: 'Optimizing code and adding features', duration: 3500 },
    { name: 'Llama 3.3 70B', icon: '🦙', task: 'Security review and finalization', duration: 2500 }
  ];
  
  const outputRef = useRef(null);

  // Auto-scroll for execution flow display
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [progress]);

  // Real-time pipeline progress tracking
  const updatePipelineProgress = (step, agent, progress, log) => {
    setProcessStep(step);
    setCurrentAgent(agent);
    setProgress(progress);
    if (log) {
      const logEntry = { timestamp: Date.now(), message: log };
      setLogs(prev => [...prev, logEntry]);
      
      // Send log to parent component (CodeEditor) for audit logs
      if (onLogUpdate) {
        onLogUpdate({
          timestamp: new Date().toISOString(),
          type: 'info',
          message: log,
          source: 'AI_PIPELINE'
        });
      }
    }
  };

  // Mock loading system
  const startMockDemo = async () => {
    setMockLoading(true);
    setCurrentMockAgent(0);
    setProgress(0);
    setLogs([]);
    
    for (let i = 0; i < mockAgents.length; i++) {
      const agent = mockAgents[i];
      setCurrentMockAgent(i);
      setProcessStep(agent.task);
      setCurrentAgent(agent.name);
      
      // Add log entry
      const logEntry = {
        timestamp: Date.now(),
        message: `${agent.icon} Starting: ${agent.task}`
      };
      setLogs(prev => [...prev, logEntry]);
      
      // Send to parent for audit logs
      if (onLogUpdate) {
        onLogUpdate({
          timestamp: new Date().toISOString(),
          type: 'info',
          message: `${agent.icon} Starting: ${agent.task}`,
          source: 'AI_PIPELINE'
        });
      }
      
      // Simulate progress during this agent's work
      const progressStart = (i / mockAgents.length) * 100;
      const progressEnd = ((i + 1) / mockAgents.length) * 100;
      
      for (let p = progressStart; p <= progressEnd; p += 2) {
        setProgress(p);
        await new Promise(resolve => setTimeout(resolve, agent.duration / ((progressEnd - progressStart) / 2)));
      }
      
      // Agent completion log
      const completionLog = {
        timestamp: Date.now(),
        message: `✅ Completed: ${agent.task}`
      };
      setLogs(prev => [...prev, completionLog]);
      
      // Send to parent for audit logs
      if (onLogUpdate) {
        onLogUpdate({
          timestamp: new Date().toISOString(),
          type: 'success',
          message: `✅ Completed: ${agent.task}`,
          source: 'AI_PIPELINE'
        });
      }
    }
    
    // Final completion
    setProgress(100);
    setProcessStep('Pipeline Complete');
    setCurrentAgent('SYSTEM');
    const finalLog = {
      timestamp: Date.now(),
      message: '🎉 All agents completed successfully! Files would be generated here.'
    };
    setLogs(prev => [...prev, finalLog]);
    
    // Send to parent for audit logs
    if (onLogUpdate) {
      onLogUpdate({
        timestamp: new Date().toISOString(),
        type: 'success',
        message: '🎉 All agents completed successfully! Files would be generated here.',
        source: 'AI_PIPELINE'
      });
    }
    
    setTimeout(() => {
      setMockLoading(false);
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!prompt.trim()) {
      return;
    }

    setIsSubmitting(true);
    setProcessStep("Initializing AI Pipeline...");
    setProgress(0);
    setLogs([]);
    setPipelineSteps([]);

    try {
      const endpoint = isSecureMode ? `${API_BASE_URL}/ai/generate-secure` : `${API_BASE_URL}/ai/generate`;
      
      updatePipelineProgress("Connecting to AI Pipeline...", "GEMINI_AGENT", 10, "Initializing 4-agent pipeline");
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          rid: roomId,  // Backend expects 'rid' not 'roomId'
          includeContext: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.step) {
                updatePipelineProgress(
                  data.step,
                  data.agent || currentAgent,
                  data.progress || progress,
                  data.message
                );
              }
              
              if (data.complete) {
                updatePipelineProgress("Pipeline Complete", "SYSTEM", 100, "All agents completed successfully");
                
                // Create files in the IDE if they were generated
                if (data.files && Array.isArray(data.files)) {
                  console.log(`Creating ${data.files.length} files in IDE:`, data.files.map(f => f.filename));
                  
                  data.files.forEach((file, index) => {
                    actions.createFile(
                      'root', // parentId - create in root directory
                      file.filename,
                      file.code,
                      file.language,
                      index === 0 // autoOpen first file
                    );
                    
                    // Add individual file creation logs
                    if (onLogUpdate) {
                      onLogUpdate({
                        timestamp: new Date().toISOString(),
                        type: 'success',
                        message: `Generated file: ${file.filename}`,
                        source: 'AI_PIPELINE'
                      });
                    }
                  });
                  
                  // Add summary log
                  if (onLogUpdate) {
                    onLogUpdate({
                      timestamp: new Date().toISOString(),
                      type: 'success',
                      message: `✅ Successfully generated ${data.files.length} files`,
                      source: 'AI_PIPELINE'
                    });
                  }
                }
                
                // Call onSubmit with the results
                if (onSubmit) {
                  await onSubmit({
                    prompt: prompt.trim(),
                    result: data.result,
                    files: data.files,
                    roomId: roomId
                  });
                }
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
            }
          }
        }
      }
      
      setPrompt(""); // Clear the input after successful submission
    } catch (error) {
      console.error("Error submitting prompt:", error);
      updatePipelineProgress("Error", "SYSTEM", 0, `Error: ${error.message}`);
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
        setProcessStep("");
        setProgress(0);
      }, 2000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-scroll for execution flow display
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [progress]);

  return (
    <div className="h-full flex flex-col text-green-400" style={{ fontFamily: "'Courier New', Consolas, Monaco, monospace" }}>
    
      

      {/* AI Pipeline Mode Selector */}
      <div className="mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setIsSecureMode(false)}
            className={`flex-1 px-3 py-2 text-xs font-bold border transition-colors ${
              !isSecureMode 
                ? 'bg-green-400 text-black border-green-400' 
                : 'bg-black text-green-400 border-green-400/30 hover:border-green-400'
            }`}
          >
            <Zap className="w-3 h-3 inline mr-1" />
            QUICK_MODE
          </button>
          <button
            onClick={() => setIsSecureMode(true)}
            className={`flex-1 px-3 py-2 text-xs font-bold border transition-colors ${
              isSecureMode 
                ? 'bg-red-500 text-white border-red-500' 
                : 'bg-black text-red-400 border-red-400/30 hover:border-red-400'
            }`}
          >
            <Shield className="w-3 h-3 inline mr-1" />
            SECURE_MODE
          </button>
        </div>
      </div>

      {/* AI Execution Flow Display */}
      <div className="mb-4 flex-1 min-h-0">
        <div className="border border-green-400/30 bg-green-400/5 h-full flex flex-col">
          <div className="border-b border-green-400/30 p-2">
            <span className="text-green-400/80 text-xs">AI_PIPELINE_STATUS:</span>
            {roomId && <span className="text-green-400/60 text-xs ml-2">ROOM: {roomId}</span>}
          </div>
          <div 
            ref={outputRef}
            className="flex-1 p-2 overflow-y-auto text-xs space-y-3"
          >
            {/* Agent Progress */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isSubmitting ? 'bg-green-400 animate-pulse' : 'bg-green-400/50'}`}></div>
                <span className="text-green-400">4-AGENT_PIPELINE</span>
              </div>
              
              {/* Gemini Agent */}
              <div className="ml-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-green-400/80">└─ GEMINI (Prompt Structuring)</span>
                  <span className={`${currentAgent === 'GEMINI_AGENT' ? 'text-yellow-400' : 'text-green-400/60'}`}>
                    {currentAgent === 'GEMINI_AGENT' ? `${progress}%` : progress >= 25 ? '100%' : '0%'}
                  </span>
                </div>
                <div className="w-full bg-green-400/20 h-1">
                  <div className="bg-green-400 h-1 transition-all duration-300" 
                       style={{ width: `${currentAgent === 'GEMINI_AGENT' ? progress : progress >= 25 ? 100 : 0}%` }}></div>
                </div>
              </div>

              {/* GPT-4o Agent */}
              <div className="ml-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-green-400/80">└─ GPT-4o (Code Generation)</span>
                  <span className={`${currentAgent === 'GPT4O_AGENT' ? 'text-yellow-400' : 'text-green-400/60'}`}>
                    {currentAgent === 'GPT4O_AGENT' ? `${progress}%` : progress >= 50 ? '100%' : '0%'}
                  </span>
                </div>
                <div className="w-full bg-green-400/20 h-1">
                  <div className="bg-yellow-400 h-1 transition-all duration-300" 
                       style={{ width: `${currentAgent === 'GPT4O_AGENT' ? progress : progress >= 50 ? 100 : 0}%` }}></div>
                </div>
              </div>

              {/* Mistral Agent */}
              <div className="ml-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-green-400/80">└─ MISTRAL (Debugging)</span>
                  <span className={`${currentAgent === 'MISTRAL_AGENT' ? 'text-yellow-400' : 'text-green-400/60'}`}>
                    {currentAgent === 'MISTRAL_AGENT' ? `${progress}%` : progress >= 75 ? '100%' : '0%'}
                  </span>
                </div>
                <div className="w-full bg-green-400/20 h-1">
                  <div className="bg-orange-400 h-1 transition-all duration-300" 
                       style={{ width: `${currentAgent === 'MISTRAL_AGENT' ? progress : progress >= 75 ? 100 : 0}%` }}></div>
                </div>
              </div>

              {/* Llama Agent */}
              <div className="ml-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-green-400/80">└─ LLAMA 3.3 70B (Security)</span>
                  <span className={`${currentAgent === 'LLAMA_AGENT' ? 'text-yellow-400' : 'text-green-400/60'}`}>
                    {currentAgent === 'LLAMA_AGENT' ? `${progress}%` : progress >= 100 ? '100%' : '0%'}
                  </span>
                </div>
                <div className="w-full bg-green-400/20 h-1">
                  <div className="bg-purple-400 h-1 transition-all duration-300" 
                       style={{ width: `${currentAgent === 'LLAMA_AGENT' ? progress : progress >= 100 ? 100 : 0}%` }}></div>
                </div>
              </div>

              {/* Current Agent */}
              {currentAgent && (
                <div className="mt-2 p-2 border border-green-400/20 bg-green-400/5">
                  <div className="text-green-400/80 text-xs">Active Agent:</div>
                  <div className="text-green-400 text-xs font-mono">{currentAgent}</div>
                </div>
              )}

              {/* Real-time Logs */}
              <div className="space-y-1">
                <div className="text-green-400/60 text-xs">Pipeline Logs:</div>
                {logs.slice(-4).map((log, index) => (
                  <div key={index} className="text-green-400/80 text-xs">
                    ✓ {log.message}
                  </div>
                ))}
                {isSubmitting && processStep && (
                  <div className="text-yellow-400/80 text-xs">⟳ {processStep}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="space-y-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="$ describe_code_generation_task..."
            className="w-full px-3 py-3 border border-green-400/30 bg-black text-green-400 text-xs resize-vertical min-h-[60px] font-mono focus:outline-none focus:border-green-400 placeholder-green-400/40"
            rows={2}
            disabled={isSubmitting}
            style={{ fontFamily: "'Courier New', Consolas, Monaco, monospace" }}
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isSubmitting || mockLoading}
            className="w-full px-4 py-3 bg-green-400 text-black text-xs font-bold hover:bg-green-300 disabled:bg-green-400/30 disabled:text-green-400/60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-3 h-3" />
            {(isSubmitting || mockLoading) ? "[PROCESSING...]" : "[EXECUTE_COMMAND]"}
          </button>
          
          {/* Mock Demo Button */}
          <button
            type="button"
            onClick={startMockDemo}
            disabled={isSubmitting || mockLoading}
            className="w-full px-4 py-2 bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 disabled:bg-purple-600/30 disabled:text-purple-400/60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-2"
          >
            <Zap className="w-3 h-3" />
            {mockLoading ? "[MOCK_DEMO_RUNNING...]" : "[RUN_MOCK_DEMO]"}
          </button>
        </div>
      </form>

      {/* Live Process Monitor */}
      <div className="mb-4">
        <h4 className="text-green-400/80 text-xs mb-3 font-bold">
          PROCESS_MONITOR:
        </h4>
        <div className="space-y-2">
          {(isSubmitting || mockLoading) ? (
            <div className={`border p-3 ${mockLoading ? 'bg-purple-400/10 border-purple-400/30' : 'bg-green-400/10 border-green-400/30'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${mockLoading ? 'bg-purple-400' : 'bg-green-400'}`}></div>
                <span className={`text-xs font-bold ${mockLoading ? 'text-purple-400' : 'text-green-400'}`}>
                  {mockLoading ? 'MOCK_DEMO_ACTIVE' : 'ACTIVE_PROCESS'}
                </span>
              </div>
              
              {/* Mock Agent Progress Indicator */}
              {mockLoading && (
                <div className="mb-3">
                  <div className="text-purple-400/80 text-xs mb-2">
                    Current Agent: {mockAgents[currentMockAgent]?.icon} {mockAgents[currentMockAgent]?.name}
                  </div>
                  <div className="flex space-x-1 mb-2">
                    {mockAgents.map((agent, index) => (
                      <div
                        key={index}
                        className={`w-3 h-3 rounded-full ${
                          index < currentMockAgent 
                            ? 'bg-green-500' 
                            : index === currentMockAgent 
                              ? 'bg-yellow-500 animate-pulse' 
                              : 'bg-gray-600'
                        }`}
                        title={`${agent.icon} ${agent.name}`}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <div className={`text-xs mb-2 ${mockLoading ? 'text-purple-400/80' : 'text-green-400/80'}`}>
                &gt; {processStep}
              </div>
              <div className={`bg-black border p-2 ${mockLoading ? 'border-purple-400/20' : 'border-green-400/20'}`}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={mockLoading ? 'text-purple-400/60' : 'text-green-400/60'}>Progress:</span>
                  <span className={mockLoading ? 'text-purple-400' : 'text-green-400'}>{progress}%</span>
                </div>
                <div className={`w-full h-1 ${mockLoading ? 'bg-purple-400/20' : 'bg-green-400/20'}`}>
                  <div 
                    className={`h-1 transition-all duration-500 ${mockLoading ? 'bg-purple-400' : 'bg-green-400'}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-400/5 border border-green-400/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-400/50 rounded-full"></div>
                <span className="text-green-400/60 text-xs">IDLE</span>
              </div>
              <div className="text-green-400/40 text-xs">
                &gt; Waiting for command input...
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default PromptInput;
