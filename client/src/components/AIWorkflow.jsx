import React, { useState, useRef, useEffect } from 'react';
import { Play, Clock, CheckCircle, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { useFileSystem } from '../contexts/useFileSystem';

const AIWorkflow = () => {
  const { actions } = useFileSystem();
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [currentAgent, setCurrentAgent] = useState('');
  const [timeEstimate, setTimeEstimate] = useState('');
  const [logs, setLogs] = useState([]);
  const [generatedFiles, setGeneratedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [includeRedTeam, setIncludeRedTeam] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);
  const [roomId, setRoomId] = useState('');
  
  // Mock loading system state
  const [mockLoading, setMockLoading] = useState(false);
  const [currentMockAgent, setCurrentMockAgent] = useState(0);
  
  // Mock agents configuration
  const mockAgents = [
    { name: 'Gemini Flash 1.5', icon: '🔮', task: 'Analyzing prompt and structuring requirements', duration: 3000 },
    { name: 'GPT-4o', icon: '🧠', task: 'Generating core application structure', duration: 4000 },
    { name: 'Mistral Medium', icon: '⚡', task: 'Optimizing code and adding features', duration: 3500 },
    { name: 'Llama 3.3 70B', icon: '🦙', task: 'Security review and finalization', duration: 2500 }
  ];
  
  // DEBUG: Add a test button to force files
  const addTestFiles = () => {
    const testFiles = [
      {
        filename: 'test.html',
        code: '<html><body>Test</body></html>',
        language: 'html'
      },
      {
        filename: 'test.css',
        code: 'body { color: red; }',
        language: 'css'
      }
    ];
    console.log('Adding test files:', testFiles);
    
    // Create files using FileSystem context
    testFiles.forEach((file, index) => {
      actions.createFile(
        'root',
        file.filename,
        file.code,
        file.language,
        index === 0
      );
    });
    
    setGeneratedFiles(testFiles);
    setSelectedFile(testFiles[0]);
  };
  
  // Mock loading system
  const startMockLoading = async () => {
    setMockLoading(true);
    setCurrentMockAgent(0);
    setProgress(0);
    setLogs([]);
    
    for (let i = 0; i < mockAgents.length; i++) {
      const agent = mockAgents[i];
      setCurrentMockAgent(i);
      setCurrentStep(agent.task);
      setCurrentAgent(agent.name);
      
      // Add log entry
      setLogs(prev => [...prev, {
        type: 'info',
        agent: agent.name,
        message: `${agent.icon} Starting: ${agent.task}`,
        timestamp: new Date().toISOString()
      }]);
      
      // Simulate progress during this agent's work
      const progressStart = (i / mockAgents.length) * 100;
      const progressEnd = ((i + 1) / mockAgents.length) * 100;
      
      for (let p = progressStart; p <= progressEnd; p += 2) {
        setProgress(p);
        await new Promise(resolve => setTimeout(resolve, agent.duration / ((progressEnd - progressStart) / 2)));
      }
      
      // Agent completion log
      setLogs(prev => [...prev, {
        type: 'success',
        agent: agent.name,
        message: `✅ Completed: ${agent.task}`,
        timestamp: new Date().toISOString()
      }]);
    }
    
    // Final completion
    setProgress(100);
    setCurrentStep('Pipeline Complete');
    setCurrentAgent('SYSTEM');
    setLogs(prev => [...prev, {
      type: 'success',
      agent: 'SYSTEM',
      message: '🎉 All agents completed successfully! Files would be generated here.',
      timestamp: new Date().toISOString()
    }]);
    
    setTimeout(() => {
      setMockLoading(false);
    }, 1000);
  };
  
  const eventSourceRef = useRef(null);
  const logsEndRef = useRef(null);

  // Auto scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Debug generatedFiles state changes
  useEffect(() => {
    console.log('generatedFiles state changed:', generatedFiles);
    console.log('generatedFiles length:', generatedFiles.length);
    if (generatedFiles.length > 0) {
      console.log('First file:', generatedFiles[0]);
    }
  }, [generatedFiles]);

  // Debug selectedFile state changes
  useEffect(() => {
    console.log('selectedFile state changed:', selectedFile);
  }, [selectedFile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsProcessing(true);
    setProgress(0);
    setLogs([]);
    setGeneratedFiles([]);
    setSelectedFile(null);
    setProcessingTime(0);
    setRoomId('');

    const API_BASE_URL = process.env.NODE_ENV === 'production' 
      ? 'https://your-production-url.com' 
      : 'http://localhost:3001';

    try {
      // Start Server-Sent Events connection
      eventSourceRef.current = new EventSource(`${API_BASE_URL}/api/ai/generate-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          includeRedTeam: includeRedTeam
        })
      });

      // For POST requests with EventSource, we need to use fetch instead
      const response = await fetch(`${API_BASE_URL}/api/ai/generate-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          includeRedTeam: includeRedTeam
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log('SSE data received:', data);
              handleProgressUpdate(data);
            } catch (e) {
              console.error('Failed to parse SSE data:', e, 'Line:', line);
            }
          }
        }
      }

    } catch (error) {
      console.error('AI Pipeline Error:', error);
      setLogs(prev => [...prev, {
        type: 'error',
        agent: 'SYSTEM',
        message: `Error: ${error.message}`,
        timestamp: new Date().toISOString()
      }]);
      setIsProcessing(false); // Only set false on error
    } finally {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    }
  };

  const handleProgressUpdate = (data) => {
    if (data.error) {
      setLogs(prev => [...prev, {
        type: 'error',
        agent: data.agent || 'SYSTEM',
        message: data.message,
        timestamp: data.timestamp
      }]);
      return;
    }

    if (data.complete) {
      // Final result received
      console.log('Complete data received:', data);
      console.log('Files in data:', data.files);
      console.log('Current generatedFiles state before update:', generatedFiles);
      
      if (data.files && Array.isArray(data.files)) {
        console.log(`Creating ${data.files.length} files in IDE:`, data.files.map(f => f.filename));
        
        // Create files in the FileSystem context (which integrates with WebSocket and IDE)
        data.files.forEach((file, index) => {
          console.log(`Creating file: ${file.filename}`);
          actions.createFile(
            'root', // parentId - create in root folder
            file.filename,
            file.code,
            file.language,
            index === 0 // autoOpen only the first file
          );
        });
        
        // Also update local state for the logs display
        setGeneratedFiles(data.files);
        setSelectedFile(data.files[0] || null);
      } else {
        console.warn('No files found in complete data or files is not an array');
        console.log('data.files type:', typeof data.files, 'data.files value:', data.files);
      }
      
      if (data.roomId) setRoomId(data.roomId);
      if (data.processingTime) setProcessingTime(data.processingTime);
      
      setLogs(prev => [...prev, {
        type: 'success',
        agent: 'SYSTEM',
        message: `✅ Pipeline completed! Generated ${data.files?.length || 0} files in ${data.processingTime}s`,
        timestamp: data.timestamp
      }]);
      
      // Set processing to false when complete
      setIsProcessing(false);
      return;
    }

    // Regular progress update
    if (data.progress !== undefined) setProgress(data.progress);
    if (data.step) setCurrentStep(data.step);
    if (data.agent) setCurrentAgent(data.agent);
    if (data.timeEstimate) setTimeEstimate(data.timeEstimate);

    setLogs(prev => [...prev, {
      type: 'info',
      agent: data.agent,
      message: data.message,
      timeEstimate: data.timeEstimate,
      timestamp: data.timestamp
    }]);
  };

  const getAgentIcon = (agent) => {
    switch (agent) {
      case 'GPT-4o': return '🤖';
      case 'Llama 3.3 70B': return '🦙';
      case 'Mistral': return '🛡️';
      case 'Gemini': return '💎';
      case 'SYSTEM': return '⚙️';
      default: return '🔧';
    }
  };

  const getLanguageClass = (language) => {
    const langMap = {
      'javascript': 'language-javascript',
      'typescript': 'language-typescript',
      'python': 'language-python',
      'java': 'language-java',
      'html': 'language-html',
      'css': 'language-css',
      'json': 'language-json',
      'markdown': 'language-markdown'
    };
    return langMap[language] || 'language-text';
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-300 mb-2">
            🤖 AI Workflow Engine
          </h1>
          <p className="text-green-500">
            Gemini → GPT-4o → Mistral → Llama 3.3 70B Pipeline
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="bg-gray-900 border border-green-600 rounded-lg p-6">
            <label className="block text-green-300 text-lg font-semibold mb-4">
              💭 Describe what you want to build:
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Create a React todo app with local storage, or Build a Node.js API with authentication..."
              className="w-full bg-black border border-green-600 text-green-400 p-4 rounded-lg resize-none focus:outline-none focus:border-green-400"
              rows={4}
              disabled={isProcessing}
            />
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={includeRedTeam}
                    onChange={(e) => setIncludeRedTeam(e.target.checked)}
                    disabled={isProcessing}
                    className="w-4 h-4 text-green-400 bg-black border-green-600 rounded focus:ring-green-400"
                  />
                  <span className="text-green-300">🛡️ Include Security Testing</span>
                </label>
                
                {/* DEBUG: Test button */}
                <button
                  type="button"
                  onClick={addTestFiles}
                  className="px-3 py-1 bg-yellow-600 text-black rounded text-sm"
                >
                  Test Files
                </button>
                
                {/* Mock Demo button */}
                <button
                  type="button"
                  onClick={startMockLoading}
                  disabled={mockLoading}
                  className="px-3 py-1 bg-purple-600 text-white rounded text-sm disabled:opacity-50"
                >
                  Mock Demo
                </button>
              </div>
              
              <button
                type="submit"
                disabled={isProcessing || mockLoading || !prompt.trim()}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                  isProcessing || mockLoading || !prompt.trim()
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-black hover:bg-green-500 active:scale-95'
                }`}
              >
                {(isProcessing || mockLoading) ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{mockLoading ? 'Mock Demo...' : 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>Generate Code</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Progress Section */}
        {(isProcessing || mockLoading) && (
          <div className="bg-gray-900 border border-green-600 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-green-300">
                {getAgentIcon(currentAgent)} {currentStep}
                {mockLoading && <span className="ml-2 text-purple-400">(Mock Demo)</span>}
              </h3>
              {timeEstimate && (
                <div className="flex items-center space-x-2 text-green-500">
                  <Clock className="w-4 h-4" />
                  <span>{timeEstimate}</span>
                </div>
              )}
            </div>
            
            {/* Mock Agent Progress Indicator */}
            {mockLoading && (
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-green-300">Current Agent:</span>
                  <span className="text-white font-semibold">
                    {mockAgents[currentMockAgent]?.icon} {mockAgents[currentMockAgent]?.name}
                  </span>
                </div>
                <div className="flex space-x-1">
                  {mockAgents.map((agent, index) => (
                    <div
                      key={index}
                      className={`w-4 h-4 rounded-full ${
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
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-800 rounded-full h-3 mb-4">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-green-400">{progress}% Complete</p>
          </div>
        )}

        {/* Results Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Logs Panel */}
          <div className="bg-gray-900 border border-green-600 rounded-lg">
            <div className="bg-green-600 text-black px-4 py-2 rounded-t-lg font-semibold">
              📊 Pipeline Logs
            </div>
            <div className="p-4 h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-2 text-sm">
                  <div className="flex items-start space-x-2">
                    <span className="text-green-600">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="font-semibold">
                      {getAgentIcon(log.agent)} {log.agent}:
                    </span>
                  </div>
                  <div className={`ml-4 ${
                    log.type === 'error' ? 'text-red-400' : 
                    log.type === 'success' ? 'text-green-300' : 'text-green-400'
                  }`}>
                    {log.message}
                  </div>
                  {log.timeEstimate && (
                    <div className="ml-4 text-green-600 text-xs">
                      ⏱️ Est: {log.timeEstimate}
                    </div>
                  )}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>

          {/* Generated Files Panel */}
          <div className="bg-gray-900 border border-green-600 rounded-lg">
            <div className="bg-green-600 text-black px-4 py-2 rounded-t-lg font-semibold flex items-center justify-between">
              <span>📁 Generated Files</span>
              {generatedFiles.length > 0 && (
                <span className="text-sm">
                  {generatedFiles.length} files • {processingTime}s • Room: {roomId.slice(-8)}
                </span>
              )}
            </div>
            
            {(() => {
              console.log('Rendering files section. generatedFiles.length:', generatedFiles.length);
              console.log('generatedFiles array:', generatedFiles);
              return generatedFiles.length > 0;
            })() ? (
              <div className="flex flex-col h-96">
                {/* File Tabs */}
                <div className="flex overflow-x-auto bg-gray-800 border-b border-green-600">
                  {generatedFiles.map((file, index) => {
                    console.log(`Rendering tab for file ${index}:`, file.filename);
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedFile(file)}
                        className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-r border-green-600 ${
                          selectedFile?.filename === file.filename
                            ? 'bg-green-600 text-black'
                            : 'text-green-400 hover:bg-gray-700'
                        }`}
                      >
                        <FileText className="w-4 h-4 inline mr-1" />
                        {file.filename}
                      </button>
                    );
                  })}
                </div>
                
                {/* File Content */}
                {selectedFile && (
                  <div className="flex-1 overflow-auto p-4">
                    <pre className="text-green-400 text-sm whitespace-pre-wrap">
                      <code className={getLanguageClass(selectedFile.language)}>
                        {selectedFile.code}
                      </code>
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-green-600">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Generated files will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Success Summary */}
        {generatedFiles.length > 0 && !isProcessing && (
          <div className="bg-green-900 border border-green-500 rounded-lg p-6 mt-8">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <h3 className="text-xl font-semibold text-green-300">
                ✅ Pipeline Completed Successfully!
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-green-500">Files Generated:</p>
                <p className="text-green-300 font-semibold">{generatedFiles.length}</p>
              </div>
              <div>
                <p className="text-green-500">Processing Time:</p>
                <p className="text-green-300 font-semibold">{processingTime}s</p>
              </div>
              <div>
                <p className="text-green-500">Room ID:</p>
                <p className="text-green-300 font-semibold">{roomId}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIWorkflow;