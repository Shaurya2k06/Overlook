import { useState, useRef, useEffect } from 'react';
import { Terminal, X, Minus } from 'lucide-react';

const GlobalTerminal = ({ onOutput, terminalOutput = [], isVisible = false, onVisibilityChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new output is added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  // Auto-expand when notifications come in
  useEffect(() => {
    if (isVisible && terminalOutput.length > 0) {
      setIsExpanded(true);
    }
  }, [isVisible, terminalOutput]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    const command = input.trim();

    // Add to history
    setHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    // Send command output
    if (onOutput) {
      onOutput({
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: `$ ${command}`,
        type: 'command',
        timestamp
      });

      // Process terminal commands
      let response = '';
      const parts = command.toLowerCase().split(' ');
      const cmd = parts[0];
      const args = parts.slice(1);

      switch (cmd) {
        case 'help':
          response = `Available commands:
  help                    - Show this help
  clear                   - Clear terminal
  status                  - Show system status
  dashboard               - Navigate to dashboard
  create                  - Create new room
  join <room_id>          - Join existing room
  rooms                   - List recent rooms
  whoami                  - Show current user
  pwd                     - Show current location
  exit                    - Close terminal`;
          break;
        
        case 'clear':
          // Clear will be handled by parent component
          response = 'Terminal cleared';
          break;
          
        case 'status':
          response = `OVERLOOK SYSTEM STATUS:
  Status: OPERATIONAL
  Encryption: AES-256
  Connection: SECURE
  Uptime: ${Math.floor(Date.now() / 1000)}s`;
          break;
          
        case 'dashboard':
          response = 'Navigating to dashboard...';
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
          break;
          
        case 'create':
          response = 'Creating new room...';
          setTimeout(() => {
            // Trigger room creation
            const event = new CustomEvent('terminal-create-room');
            window.dispatchEvent(event);
          }, 1000);
          break;
          
        case 'join':
          if (args.length > 0) {
            const roomId = args[0];
            response = `Joining room: ${roomId}...`;
            setTimeout(() => {
              window.location.href = `/room/${roomId}`;
            }, 1000);
          } else {
            response = 'Usage: join <room_id>';
          }
          break;
          
        case 'rooms':
          const recentRooms = JSON.parse(localStorage.getItem('overlook_recent_rooms') || '[]');
          if (recentRooms.length > 0) {
            response = `Recent rooms:\n${recentRooms.map(room => 
              `  ${room.id} - ${room.name} (${room.participants} users)`
            ).join('\n')}`;
          } else {
            response = 'No recent rooms found.';
          }
          break;
          
        case 'whoami':
          const userData = JSON.parse(localStorage.getItem('overlook_user') || '{}');
          response = `Current user: ${userData.username || 'guest'} (${userData.id || 'unknown'})`;
          break;
          
        case 'pwd':
          response = `Current location: ${window.location.pathname}`;
          break;
          
        case 'exit':
          setIsExpanded(false);
          if (onVisibilityChange) onVisibilityChange(false);
          response = 'Terminal minimized';
          break;
          
        default:
          response = `Command not found: ${command}\nType 'help' for available commands`;
      }

      if (response) {
        onOutput({
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_response`,
          message: response,
          type: 'output',
          timestamp
        });
      }
    }

    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  };

  const closeTerminal = () => {
    setIsExpanded(false);
    if (onVisibilityChange) onVisibilityChange(false);
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 bg-black border border-green-400/50 shadow-2xl"
      style={{ fontFamily: "'Courier New', Consolas, Monaco, monospace" }}
    >
      {/* Terminal Header */}
      <div className="flex items-center justify-between bg-green-400/10 border-b border-green-400/30 px-3 py-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-green-400" />
          <span className="text-green-400 text-xs font-bold">SYSTEM_TERMINAL</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleExpanded}
            className="p-1 hover:bg-green-400/20 text-green-400 transition-colors"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={closeTerminal}
            className="p-1 hover:bg-red-400/20 text-red-400 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      {isExpanded && (
        <div className="w-96 h-64 flex flex-col">
          {/* Output */}
          <div 
            ref={terminalRef}
            className="flex-1 overflow-y-auto p-3 bg-black text-green-400 text-xs space-y-1"
          >
            {terminalOutput.map((output) => (
              <div 
                key={output.id} 
                className={`flex items-start gap-2 ${
                  output.type === 'error' ? 'text-red-400' :
                  output.type === 'warning' ? 'text-yellow-400' :
                  output.type === 'success' ? 'text-green-400' :
                  output.type === 'command' ? 'text-green-300' :
                  'text-green-400/80'
                }`}
              >
                <span className="text-green-400/60 text-xs shrink-0">
                  [{output.timestamp}]
                </span>
                <span className="break-words">{output.message}</span>
              </div>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-green-400/30 p-2">
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-xs">$</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type command..."
                className="flex-1 bg-transparent border-none outline-none text-green-400 text-xs placeholder-green-400/40"
                autoComplete="off"
              />
            </div>
          </form>
        </div>
      )}

      {/* Minimized state - show latest notification */}
      {!isExpanded && terminalOutput.length > 0 && (
        <div 
          className="w-80 p-3 cursor-pointer hover:bg-green-400/5"
          onClick={toggleExpanded}
        >
          <div className="text-green-400 text-xs">
            Latest: {terminalOutput[terminalOutput.length - 1]?.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalTerminal;