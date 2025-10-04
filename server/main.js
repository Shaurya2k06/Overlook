const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
require("dotenv").config();

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Your React dev server URL
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Store active rooms and their data
const rooms = new Map();

// Room data structure:
// {
//   users: Set of socket IDs,
//   code: string,
//   language: string,
//   messages: array of chat messages
// }

// Helper function to get room data or create new room
function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      users: new Set(),
      code: "",
      language: "javascript",
      messages: [],
    });
  }
  return rooms.get(roomId);
}

// Helper function to broadcast to room except sender
function broadcastToRoom(roomId, event, data, excludeSocketId = null) {
  const room = rooms.get(roomId);
  if (room) {
    room.users.forEach((socketId) => {
      if (socketId !== excludeSocketId) {
        io.to(socketId).emit(event, data);
      }
    });
  }
}

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join room event
  socket.on("join-room", (data) => {
    const { roomId, username } = data;
    const room = getOrCreateRoom(roomId);

    // Check if room is full (max 3 users)
    if (room.users.size >= 3) {
      socket.emit("room-full", {
        message: "Room is full. Maximum 3 users allowed.",
      });
      return;
    }

    // Add user to room
    room.users.add(socket.id);
    socket.join(roomId);

    // Store user info on socket
    socket.roomId = roomId;
    socket.username = username;

    console.log(`${username} joined room ${roomId}`);

    // Send current room state to the new user
    socket.emit("room-joined", {
      roomId,
      code: room.code,
      language: room.language,
      messages: room.messages,
      userCount: room.users.size,
    });

    // Notify other users in the room
    broadcastToRoom(
      roomId,
      "user-joined",
      {
        username,
        userCount: room.users.size,
      },
      socket.id
    );
  });

  // Code change event
  socket.on("code-change", (data) => {
    const { code, language } = data;
    const room = rooms.get(socket.roomId);

    if (room) {
      // Update room's code and language
      room.code = code;
      room.language = language;

      // Broadcast to other users in the room
      broadcastToRoom(
        socket.roomId,
        "code-updated",
        {
          code,
          language,
          updatedBy: socket.username,
        },
        socket.id
      );
    }
  });

  // Chat message event
  socket.on("chat-message", (data) => {
    const { message, type = "user" } = data; // type can be 'user' or 'ai'
    const room = rooms.get(socket.roomId);

    if (room) {
      const chatMessage = {
        id: Date.now(),
        username: socket.username,
        message,
        type,
        timestamp: new Date().toISOString(),
      };

      // Add message to room's message history
      room.messages.push(chatMessage);

      // Broadcast to all users in the room
      io.to(socket.roomId).emit("new-message", chatMessage);
    }
  });

  // AI code generation event (for when AI responds with code)
  socket.on("ai-code-response", (data) => {
    const { code, language, explanation } = data;
    const room = rooms.get(socket.roomId);

    if (room) {
      // Update room's code
      room.code = code;
      room.language = language;

      // Add AI message to chat
      const aiMessage = {
        id: Date.now(),
        username: "AI Assistant",
        message: explanation || "Here's the generated code:",
        type: "ai",
        timestamp: new Date().toISOString(),
      };
      room.messages.push(aiMessage);

      // Broadcast code update and AI message to all users
      io.to(socket.roomId).emit("code-updated", {
        code,
        language,
        updatedBy: "AI Assistant",
      });

      io.to(socket.roomId).emit("new-message", aiMessage);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const roomId = socket.roomId;
    const username = socket.username;

    if (roomId && rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.users.delete(socket.id);

      console.log(`${username} left room ${roomId}`);

      // If room is empty, delete it
      if (room.users.size === 0) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} deleted (empty)`);
      } else {
        // Notify remaining users
        broadcastToRoom(roomId, "user-left", {
          username,
          userCount: room.users.size,
        });
      }
    }
  });
});

// Basic API routes
app.get("/", (req, res) => {
  res.json({
    message: "Overlook WebSocket Server",
    activeRooms: rooms.size,
    status: "running",
  });
});

app.get("/rooms", (req, res) => {
  const roomList = Array.from(rooms.entries()).map(([roomId, room]) => ({
    roomId,
    userCount: room.users.size,
    language: room.language,
  }));
  res.json({ rooms: roomList });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
});
