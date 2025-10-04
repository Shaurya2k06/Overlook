import { useState, useEffect, useRef } from "react";
import { Terminal, Send, AlertTriangle } from "lucide-react";

const PromptInput = ({ onSubmit }) => {
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processStep, setProcessStep] = useState("");
  const [progress, setProgress] = useState(0);
  const outputRef = useRef(null);

  // Auto-scroll for execution flow display
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [progress]);

  // Simulate process steps when submitting
  useEffect(() => {
    if (isSubmitting) {
      const steps = [
        { step: "Analyzing prompt...", progress: 20 },
        { step: "Connecting to AI service...", progress: 40 },
        { step: "Generating code...", progress: 70 },
        { step: "Validating output...", progress: 90 },
        { step: "Complete", progress: 100 }
      ];

      let currentStep = 0;
      const interval = setInterval(() => {
        if (currentStep < steps.length) {
          setProcessStep(steps[currentStep].step);
          setProgress(steps[currentStep].progress);
          currentStep++;
        } else {
          clearInterval(interval);
        }
      }, 800);

      return () => clearInterval(interval);
    }
  }, [isSubmitting]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!prompt.trim()) {
      return;
    }

    setIsSubmitting(true);
    setProcessStep("Initializing...");
    setProgress(0);

    try {
      await onSubmit(prompt.trim());
      setPrompt(""); // Clear the input after successful submission
    } catch (error) {
      console.error("Error submitting prompt:", error);
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
        setProcessStep("");
        setProgress(0);
      }, 1000);
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
    
      

      {/* AI Execution Flow Display */}
      <div className="mb-4 flex-1 min-h-0">
        <div className="border border-green-400/30 bg-green-400/5 h-full flex flex-col">
          <div className="border-b border-green-400/30 p-2">
            <span className="text-green-400/80 text-xs">AI_EXECUTION_FLOW:</span>
          </div>
          <div 
            ref={outputRef}
            className="flex-1 p-2 overflow-y-auto text-xs space-y-3"
          >
            {/* Agent Progress */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400">AI_AGENT_STATUS</span>
              </div>
              
              {/* Code Analysis Phase */}
              <div className="ml-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-green-400/80">└─ Code Analysis</span>
                  <span className="text-green-400">95%</span>
                </div>
                <div className="w-full bg-green-400/20 h-1">
                  <div className="bg-green-400 h-1 w-[95%] transition-all duration-300"></div>
                </div>
              </div>

              {/* Generation Phase */}
              <div className="ml-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-green-400/80">└─ Code Generation</span>
                  <span className="text-yellow-400">78%</span>
                </div>
                <div className="w-full bg-green-400/20 h-1">
                  <div className="bg-yellow-400 h-1 w-[78%] transition-all duration-300"></div>
                </div>
              </div>

              {/* Optimization Phase */}
              <div className="ml-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-green-400/80">└─ Code Optimization</span>
                  <span className="text-green-400/60">12%</span>
                </div>
                <div className="w-full bg-green-400/20 h-1">
                  <div className="bg-green-400/60 h-1 w-[12%] transition-all duration-300"></div>
                </div>
              </div>

              {/* Current Agent */}
              <div className="mt-2 p-2 border border-green-400/20 bg-green-400/5">
                <div className="text-green-400/80 text-xs">Current Agent:</div>
                <div className="text-green-400 text-xs font-mono">SYNTAX_OPTIMIZER_v2.1</div>
              </div>

              {/* Processing Steps */}
              <div className="space-y-1">
                <div className="text-green-400/60 text-xs">Recent Steps:</div>
                <div className="text-green-400/80 text-xs">✓ Parsed user requirements</div>
                <div className="text-green-400/80 text-xs">✓ Analyzed codebase context</div>
                <div className="text-yellow-400/80 text-xs">⟳ Generating optimized code</div>
                <div className="text-green-400/40 text-xs">⧗ Pending validation</div>
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
            disabled={!prompt.trim() || isSubmitting}
            className="w-full px-4 py-3 bg-green-400 text-black text-xs font-bold hover:bg-green-300 disabled:bg-green-400/30 disabled:text-green-400/60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-3 h-3" />
            {isSubmitting ? "[PROCESSING...]" : "[EXECUTE_COMMAND]"}
          </button>
        </div>
      </form>

      {/* Live Process Monitor */}
      <div className="mb-4">
        <h4 className="text-green-400/80 text-xs mb-3 font-bold">
          PROCESS_MONITOR:
        </h4>
        <div className="space-y-2">
          {isSubmitting ? (
            <div className="bg-green-400/10 border border-green-400/30 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-xs font-bold">ACTIVE_PROCESS</span>
              </div>
              <div className="text-green-400/80 text-xs mb-2">
                &gt; {processStep}
              </div>
              <div className="bg-black border border-green-400/20 p-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-green-400/60">Progress:</span>
                  <span className="text-green-400">{progress}%</span>
                </div>
                <div className="w-full bg-green-400/20 h-1">
                  <div 
                    className="bg-green-400 h-1 transition-all duration-500" 
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
