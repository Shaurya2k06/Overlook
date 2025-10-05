const User = require("../model/User");
const RoomController = require("../controllers/RoomController");
const HybridRoomController = require("../controllers/HybridRoomController");

// Store active rooms and their data
const rooms = new Map();

// Room data structure:
// {
//   users: Map of userId -> { socketId, username, name, email },
//   code: string,
//   language: string,
//   messages: array of chat messages,
//   files: Map of fileId -> file data,
//   folders: Map of folderId -> folder data
// }

// Helper function to get room data or create new room
function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      users: new Map(), // userId -> user info
      code: "",
      language: "javascript",
      messages: [],
      files: new Map(), // fileId -> file data
      folders: new Map(), // folderId -> folder data
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
  // Cleanup function to remove stale connections
  function cleanupStaleConnections() {
    for (const [roomId, room] of rooms.entries()) {
      const staleUsers = [];

      for (const [userId, userInfo] of room.users.entries()) {
        const socket = io.sockets.sockets.get(userInfo.socketId);
        if (!socket || !socket.connected) {
          staleUsers.push(userId);
        }
      }

      // Remove stale users
      staleUsers.forEach((userId) => {
        const userInfo = room.users.get(userId);
        console.log(
          `Cleaning up stale connection for user ${userId} in room ${roomId}`
        );
        room.users.delete(userId);

        // Notify remaining users
        if (room.users.size > 0) {
          broadcastToRoom(io, roomId, "user-left", {
            userId,
            username: userInfo.username,
            userCount: room.users.size,
          });
        }
      });

      // Delete empty rooms
      if (room.users.size === 0) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} deleted (empty after cleanup)`);
      }
    }
  }

  // Run cleanup every 30 seconds
  setInterval(() => {
    cleanupStaleConnections();
  }, 30000);
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

        // Run cleanup immediately before checking room capacity
        cleanupStaleConnections();

        console.log(
          `Room ${roomId} current users after cleanup:`,
          Array.from(room.users.keys())
        );

        // Check if user is already in the room (but allow reconnection)
        const existingUser = room.users.get(userId);
        if (existingUser) {
          // User is already in room, update their socket ID (reconnection)
          console.log(
            `${user.name} reconnecting to room ${roomId} (old socket: ${existingUser.socketId}, new socket: ${socket.id})`
          );

          // Check if the old socket is still connected and disconnect it
          const oldSocket = io.sockets.sockets.get(existingUser.socketId);
          if (oldSocket && oldSocket.connected) {
            console.log(
              `Disconnecting old socket ${existingUser.socketId} for user ${user.name}`
            );
            oldSocket.disconnect(true);
          }

          existingUser.socketId = socket.id;
          // Ensure userId is preserved
          existingUser.userId = userId;
          room.users.set(userId, existingUser);
        } else {
          // Check if room is full (max 3 users) - only for new users
          if (room.users.size >= 3) {
            console.log(
              `Room ${roomId} is full (${room.users.size} users) - rejecting new user ${user.name}`
            );
            socket.emit("room-full", {
              message: "Room is full. Maximum 3 users allowed.",
            });
            return;
          }

          // Add new user to room
          console.log(`Adding new user ${user.name} to room ${roomId}`);
          room.users.set(userId, {
            userId: userId, // Add the userId field
            socketId: socket.id,
            username: user.name, // Using name as username
            name: user.name,
            email: user.email,
          });
        }

        socket.join(roomId);

        // Store user info on socket
        socket.roomId = roomId;
        socket.userId = userId;
        socket.username = user.name;
        socket.name = user.name;
        socket.email = user.email;

        console.log(`${user.name} (${userId}) joined room ${roomId}`);
        console.log(
          `Room ${roomId} now has ${room.users.size} users:`,
          Array.from(room.users.entries())
        );

        // Send current room state to the new user
        const usersArray = Array.from(room.users.values()).map((user) => ({
          userId: user.userId,
          username: user.username,
          name: user.name,
        }));

        console.log(`Sending users array to client:`, usersArray);

        socket.emit("room-joined", {
          roomId,
          code: room.code,
          language: room.language,
          messages: room.messages,
          userCount: room.users.size,
          users: usersArray,
          files: Array.from(room.files.values()),
          folders: Array.from(room.folders.values()),
        });

        // Send chat history separately for better organization
        if (room.messages.length > 0) {
          socket.emit("chat-history", room.messages);
        }

        // Notify other users in the room (only for new users, not reconnections)
        if (!existingUser) {
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
        } else {
          // For reconnections, just send a reconnection notification
          console.log(`${user.name} reconnected to room ${roomId}`);
          // Also notify other users that this user reconnected (optional)
          broadcastToRoom(
            io,
            roomId,
            "user-reconnected",
            {
              userId,
              username: user.name,
              name: user.name,
              userCount: room.users.size,
            },
            userId
          );
        }
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

        // Update the room code in both systems
        RoomController.updateRoomCode(socket.roomId, code);
        HybridRoomController.updateRoomCode(socket.roomId, code);

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

        // Update the room code in both systems
        RoomController.updateRoomCode(socket.roomId, code);
        HybridRoomController.updateRoomCode(socket.roomId, code);

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

    // Chat message handling
    socket.on("send-chat-message", (data) => {
      const { roomId, message } = data;
      const room = rooms.get(roomId);
      const user = getUserFromSocket(socket);

      if (room && user.userId && message.trim()) {
        const chatMessage = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user.userId,
          username: user.username,
          message: message.trim(),
          timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
        };

        // Add message to room's message history (keep last 100 messages)
        room.messages.push(chatMessage);
        if (room.messages.length > 100) {
          room.messages = room.messages.slice(-100);
        }

        // Broadcast to all users in the room
        io.to(roomId).emit("chat-message", chatMessage);

        console.log(
          `Chat message from ${user.username} in room ${roomId}: ${message}`
        );
      }
    });

    // Legacy chat-message handler (keeping for compatibility)
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

    // File system events
    socket.on("file-created", (data) => {
      const { fileData, parentId, autoOpen } = data;
      const user = getUserFromSocket(socket);

      if (socket.roomId && user.userId) {
        console.log(`${user.username} created file: ${fileData.name}`);

        // Store file data in room with parentId
        const room = rooms.get(socket.roomId);
        if (room) {
          // Store file with parentId for proper hierarchy
          const fileWithParent = {
            ...fileData,
            parentId: parentId || "root",
          };
          room.files.set(fileData.id, fileWithParent);
        }

        // Broadcast to all users in the room (including sender for sync)
        const broadcastData = {
          fileData: {
            ...fileData,
            parentId: parentId || "root",
          },
          parentId: parentId || "root",
          autoOpen,
          createdBy: user.username,
          createdByUserId: user.userId,
        };
        console.log("Broadcasting file-created event:", broadcastData);
        io.to(socket.roomId).emit("file-created", broadcastData);
      }
    });

    socket.on("folder-created", (data) => {
      const { folderData, parentId } = data;
      const user = getUserFromSocket(socket);

      if (socket.roomId && user.userId) {
        console.log(`${user.username} created folder: ${folderData.name}`);

        // Store folder data in room with parentId
        const room = rooms.get(socket.roomId);
        if (room) {
          // Store folder with parentId for proper hierarchy
          const folderWithParent = {
            ...folderData,
            parentId: parentId || "root",
          };
          room.folders.set(folderData.id, folderWithParent);
        }

        // Broadcast to all users in the room (including sender for sync)
        const broadcastData = {
          folderData: {
            ...folderData,
            parentId: parentId || "root",
          },
          parentId: parentId || "root",
          createdBy: user.username,
          createdByUserId: user.userId,
        };
        console.log("Broadcasting folder-created event:", broadcastData);
        io.to(socket.roomId).emit("folder-created", broadcastData);
      }
    });

    socket.on("file-deleted", (data) => {
      const { fileId, parentId } = data;
      const user = getUserFromSocket(socket);

      if (socket.roomId && user.userId) {
        console.log(`${user.username} deleted file: ${fileId}`);

        // Remove file data from room
        const room = rooms.get(socket.roomId);
        if (room) {
          room.files.delete(fileId);
        }

        // Broadcast to all users in the room
        io.to(socket.roomId).emit("file-deleted", {
          fileId,
          parentId,
          deletedBy: user.username,
          deletedByUserId: user.userId,
        });
      }
    });

    socket.on("folder-deleted", (data) => {
      const { folderId, parentId } = data;
      const user = getUserFromSocket(socket);

      if (socket.roomId && user.userId) {
        console.log(`${user.username} deleted folder: ${folderId}`);

        // Remove folder data from room
        const room = rooms.get(socket.roomId);
        if (room) {
          room.folders.delete(folderId);
        }

        // Broadcast to all users in the room
        io.to(socket.roomId).emit("folder-deleted", {
          folderId,
          parentId,
          deletedBy: user.username,
          deletedByUserId: user.userId,
        });
      }
    });

    socket.on("file-renamed", (data) => {
      const { fileId, newName } = data;
      const user = getUserFromSocket(socket);

      if (socket.roomId && user.userId) {
        console.log(`${user.username} renamed file: ${fileId} to ${newName}`);

        // Update file data in room
        const room = rooms.get(socket.roomId);
        if (room && room.files.has(fileId)) {
          const fileData = room.files.get(fileId);
          fileData.name = newName;
          room.files.set(fileId, fileData);
        }

        // Broadcast to all users in the room
        io.to(socket.roomId).emit("file-renamed", {
          fileId,
          newName,
          renamedBy: user.username,
          renamedByUserId: user.userId,
        });
      }
    });

    socket.on("folder-renamed", (data) => {
      const { folderId, newName } = data;
      const user = getUserFromSocket(socket);

      if (socket.roomId && user.userId) {
        console.log(
          `${user.username} renamed folder: ${folderId} to ${newName}`
        );

        // Update folder data in room
        const room = rooms.get(socket.roomId);
        if (room && room.folders.has(folderId)) {
          const folderData = room.folders.get(folderId);
          folderData.name = newName;
          room.folders.set(folderId, folderData);
        }

        // Broadcast to all users in the room
        io.to(socket.roomId).emit("folder-renamed", {
          folderId,
          newName,
          renamedBy: user.username,
          renamedByUserId: user.userId,
        });
      }
    });

    // File content update event - for real-time collaborative editing
    socket.on("file-content-updated", (data) => {
      const { fileId, content, language } = data;
      const user = getUserFromSocket(socket);

      if (socket.roomId && user.userId) {
        console.log(`${user.username} updated file content: ${fileId}`);

        // Update file data in room if it exists, otherwise create it
        const room = rooms.get(socket.roomId);
        if (room) {
          if (room.files.has(fileId)) {
            const fileData = room.files.get(fileId);
            fileData.content = content;
            if (language) {
              fileData.language = language;
            }
            room.files.set(fileId, fileData);
          } else {
            // Create new file entry if it doesn't exist
            const fileData = {
              id: fileId,
              name: fileId, // Use fileId as name for now
              content: content,
              language: language || 'javascript',
              type: 'file'
            };
            room.files.set(fileId, fileData);
            console.log(`Created new file entry in room: ${fileId}`);
          }

          // Save file to database for model feeding
          try {
            HybridRoomController.saveFileToDatabase(socket.roomId, {
              name: fileId,
              content: content,
            });
          } catch (error) {
            console.log('Failed to save to database:', error.message);
          }
        }

        // Always broadcast to all users in the room for real-time sync
        const broadcastData = {
          fileId,
          content,
          language,
          updatedBy: user.username,
          updatedByUserId: user.userId,
        };
        console.log(
          "Broadcasting file-content-updated event to room:",
          socket.roomId,
          "with data:",
          { fileId, contentLength: content.length, language }
        );
        console.log("Room users:", Array.from(room?.users.keys() || []));
        io.to(socket.roomId).emit("file-content-updated", broadcastData);
      } else {
        console.log(
          "Cannot broadcast file update - missing roomId or userId:",
          { roomId: socket.roomId, userId: user.userId }
        );
      }
    });

    // Typing indicator events
    socket.on("user-typing", (data) => {
      if (socket.roomId) {
        broadcastToRoom(
          io,
          socket.roomId,
          "user-typing",
          {
            username: data.username,
          },
          socket.userId
        );
      }
    });

    socket.on("user-stopped-typing", (data) => {
      if (socket.roomId) {
        broadcastToRoom(
          io,
          socket.roomId,
          "user-stopped-typing",
          {
            username: data.username,
          },
          socket.userId
        );
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      const roomId = socket.roomId;
      const userId = socket.userId;
      const username = socket.username;

      if (roomId && rooms.has(roomId) && userId) {
        const room = rooms.get(roomId);

        // Check if this is the same socket that's currently in the room
        const currentUser = room.users.get(userId);
        if (currentUser && currentUser.socketId === socket.id) {
          // Only remove user if this is their current socket
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
        } else if (currentUser) {
          // This is an old socket for a user who's still in the room with a different socket
          console.log(
            `Old socket disconnected for ${username} (${userId}) - user still in room with socket ${currentUser.socketId}`
          );
        } else {
          // User is not in the room anymore, just log it
          console.log(
            `Socket disconnected for ${username} (${userId}) - user not in room`
          );
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
