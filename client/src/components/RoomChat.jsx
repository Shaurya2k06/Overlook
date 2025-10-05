import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Users } from "lucide-react";

function RoomChat({ socket, user, participants, roomId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for incoming chat messages
    socket.on("chat-message", (messageData) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...messageData,
          timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
        },
      ]);
    });

    // Listen for chat history when joining room
    socket.on("chat-history", (chatHistory) => {
      setMessages(
        chatHistory.map((msg) => ({
          ...msg,
          id:
            msg.id ||
            `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp:
            msg.timestamp ||
            new Date().toLocaleTimeString("en-US", { hour12: false }),
        }))
      );
    });

    return () => {
      socket.off("chat-message");
      socket.off("chat-history");
    };
  }, [socket]);

  // Send message
  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !roomId) return;

    const messageData = {
      roomId,
      userId: user.id,
      username: user.username,
      message: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
    };

    // Emit to server
    socket.emit("send-chat-message", messageData);

    // Clear input
    setNewMessage("");
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  // Focus input when chat becomes visible
  useEffect(() => {
    if (isVisible && chatInputRef.current) {
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
    }
  }, [isVisible]);

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 left-4 z-40 p-3 bg-green-400 text-black hover:bg-green-300 transition-all shadow-lg border border-green-400/50 rounded-none"
        style={{ fontFamily: "'Courier New', Consolas, Monaco, monospace" }}
        title="Toggle Room Chat"
      >
        <MessageSquare className="w-5 h-5" />
        {messages.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-400 text-black text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {messages.length > 99 ? "99+" : messages.length}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      {isVisible && (
        <div
          className="fixed bottom-20 left-4 z-50 w-80 h-96 bg-black border border-green-400/50 shadow-2xl"
          style={{ fontFamily: "'Courier New', Consolas, Monaco, monospace" }}
        >
          {/* Chat Header */}
          <div className="bg-green-400/10 border-b border-green-400/30 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-bold">
                  ROOM_CHAT
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Users className="w-3 h-3 text-green-400/60" />
                <span className="text-green-400/60">
                  {participants.length} ONLINE
                </span>
                <button
                  onClick={() => setIsVisible(false)}
                  className="ml-2 text-green-400/60 hover:text-red-400 transition-colors"
                >
                  [X]
                </button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 h-64 bg-black">
            {messages.length === 0 ? (
              <div className="text-green-400/40 text-xs text-center py-8">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <div>NO_MESSAGES_YET</div>
                <div className="mt-1">Start the conversation...</div>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((msg) => (
                  <div key={msg.id} className="text-xs">
                    <div className="flex items-start gap-2">
                      <span className="text-green-400/60 shrink-0">
                        [{msg.timestamp}]
                      </span>
                      <span
                        className={`shrink-0 font-bold ${
                          msg.userId === user.id
                            ? "text-cyan-400"
                            : "text-green-400"
                        }`}
                      >
                        {msg.username}:
                      </span>
                      <span className="text-green-400 break-words">
                        {msg.message}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="border-t border-green-400/30 p-3">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                ref={chatInputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type message..."
                className="flex-1 bg-black border border-green-400/30 text-green-400 text-xs px-2 py-1 focus:outline-none focus:border-green-400 placeholder-green-400/40"
                style={{
                  fontFamily: "'Courier New', Consolas, Monaco, monospace",
                }}
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-3 py-1 bg-green-400 text-black hover:bg-green-300 disabled:bg-green-400/30 disabled:text-green-400/50 transition-all text-xs font-bold"
              >
                <Send className="w-3 h-3" />
              </button>
            </form>
            <div className="text-green-400/40 text-xs mt-1">
              Press Enter to send • Shift+Enter for new line
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default RoomChat;
