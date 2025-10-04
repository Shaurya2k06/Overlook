const User = require("../model/User");
const RoomController = require("../controllers/RoomController");

// Store active rooms and their data
const rooms = new Map();

// Room data structure:
// {
//   users: Map of userId -> { socketId, username, name, email },
//   code: string,
//   language: string,
//   messages: array of chat messages
// }

// Helper function to get room data or create new room
function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      users: new Map(), // userId -> user info
      code: "",
      language: "javascript",
      messages: [],
    });
  }
  return rooms.get(roomId);
}

// Helper function to broadcast to room except sender
function broadcastToRoom(io, roomId, event, data, excludeUserId = null) {
  const room = rooms.get(roomId);
  if (room) {
    room.users.forEach((userInfo, userId) => {
      if (userId !== excludeUserId) {
        io.to(userInfo.socketId).emit(event, data);
      }
    });
  }
}

// Helper function to get user info from socket
function getUserFromSocket(socket) {
  return {
    userId: socket.userId,
    username: socket.username,
    name: socket.name,
    email: socket.email,
  };
}

// Socket.IO connection handling
function setupSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join room event - simplified for testing without full auth
    socket.on("join-room", async (data) => {
      try {
        const { roomId, userId, token } = data;

        // For now, create a mock user object for testing
        // Your teammate will replace this with proper JWT verification
        let user;
        if (token === "mock-token") {
          // Mock user for testing
          user = {
            _id: userId,
            name: data.username || "TestUser",
            email: `${data.username || "test"}@example.com`,
          };
        } else {
          // Try to find real user in database
          user = await User.findById(userId);
          if (!user) {
            socket.emit("error", { message: "User not found" });
            return;
          }
        }

        const room = getOrCreateRoom(roomId);

        // Check if room is full (max 3 users)
        if (room.users.size >= 3) {
          socket.emit("room-full", {
            message: "Room is full. Maximum 3 users allowed.",
          });
          return;
        }

        // Check if user is already in the room
        if (room.users.has(userId)) {
          socket.emit("error", { message: "User already in room" });
          return;
        }

        // Add user to room
        room.users.set(userId, {
          socketId: socket.id,
          username: user.name, // Using name as username
          name: user.name,
          email: user.email,
        });

        socket.join(roomId);

        // Store user info on socket
        socket.roomId = roomId;
        socket.userId = userId;
        socket.username = user.name;
        socket.name = user.name;
        socket.email = user.email;

        console.log(`${user.name} (${userId}) joined room ${roomId}`);

        // Send current room state to the new user
        socket.emit("room-joined", {
          roomId,
          code: room.code,
          language: room.language,
          messages: room.messages,
          userCount: room.users.size,
          users: Array.from(room.users.values()).map((user) => ({
            userId: user.userId,
            username: user.username,
            name: user.name,
          })),
        });

        // Notify other users in the room
        broadcastToRoom(
          io,
          roomId,
          "user-joined",
          {
            userId,
            username: user.name,
            name: user.name,
            userCount: room.users.size,
          },
          userId
        );
      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // Code change event - for real-time collaborative editing
    socket.on("code-change", (data) => {
      const { code, language } = data;
      const room = rooms.get(socket.roomId);
      const user = getUserFromSocket(socket);

      if (room && user.userId) {
        // Update room's code and language
        room.code = code;
        room.language = language;

        // Update the room code in RoomController
        RoomController.updateRoomCode(socket.roomId, code);

        // Broadcast to other users in the room
        broadcastToRoom(
          io,
          socket.roomId,
          "code-updated",
          {
            code,
            language,
            updatedBy: user.username,
            updatedByUserId: user.userId,
          },
          user.userId
        );
      }
    });

    // Full code update event - for AI-generated code updates
    socket.on("full-code-update", (data) => {
      const { code, language, updatedBy } = data;
      const room = rooms.get(socket.roomId);
      const user = getUserFromSocket(socket);

      if (room && user.userId) {
        // Update room's code and language
        room.code = code;
        room.language = language;

        // Update the room code in RoomController
        RoomController.updateRoomCode(socket.roomId, code);

        // Broadcast to all users in the room (including sender)
        io.to(socket.roomId).emit("code-updated", {
          code,
          language,
          updatedBy: updatedBy || user.username,
          updatedByUserId: user.userId,
          isFullUpdate: true,
        });
      }
    });

    // Chat message event
    socket.on("chat-message", (data) => {
      const { message, type = "user" } = data;
      const room = rooms.get(socket.roomId);
      const user = getUserFromSocket(socket);

      if (room && user.userId) {
        const chatMessage = {
          id: Date.now(),
          userId: user.userId,
          username: user.username,
          name: user.name,
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
          userId: "ai",
          username: "AI Assistant",
          name: "AI Assistant",
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
          updatedByUserId: "ai",
        });

        io.to(socket.roomId).emit("new-message", aiMessage);
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      const roomId = socket.roomId;
      const userId = socket.userId;
      const username = socket.username;

      if (roomId && rooms.has(roomId) && userId) {
        const room = rooms.get(roomId);
        room.users.delete(userId);

        console.log(`${username} (${userId}) left room ${roomId}`);

        // If room is empty, delete it
        if (room.users.size === 0) {
          rooms.delete(roomId);
          console.log(`Room ${roomId} deleted (empty)`);
        } else {
          // Notify remaining users
          broadcastToRoom(io, roomId, "user-left", {
            userId,
            username,
            userCount: room.users.size,
          });
        }
      }
    });
  });
}

// Helper function to get room statistics
function getRoomStats() {
  const roomList = Array.from(rooms.entries()).map(([roomId, room]) => ({
    roomId,
    userCount: room.users.size,
    language: room.language,
    users: Array.from(room.users.values()).map((user) => ({
      userId: user.userId,
      username: user.username,
      name: user.name,
    })),
  }));
  return roomList;
}

// Helper function to get user's current room
function getUserRoom(userId) {
  for (const [roomId, room] of rooms.entries()) {
    if (room.users.has(userId)) {
      return roomId;
    }
  }
  return null;
}

module.exports = {
  setupSocketHandlers,
  getRoomStats,
  getUserRoom,
  rooms,
};
