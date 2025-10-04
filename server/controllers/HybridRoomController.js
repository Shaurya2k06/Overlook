const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const Rooms = require("../model/Rooms");

// Import websocket rooms after they're initialized
let websocketRooms;
try {
  const wsModule = require("../websocket/sockets");
  websocketRooms = wsModule.rooms;
} catch (error) {
  console.warn("WebSocket module not available yet, will initialize later");
  websocketRooms = new Map();
}

class HybridRoomController {
  // Create room in both database and websocket system
  static async createRoom(req, res) {
    try {
      const roomId = uuidv4();

      // Create room in database
      const dbRoom = await Rooms.create({
        rid: roomId,
        owner: req.userId || new mongoose.Types.ObjectId(), // Use provided userId or create new ObjectId
        files: [], // Initialize empty files array
      });

      // Note: Websocket room will be created when first user joins via websocket
      console.log(`Database room created: ${roomId} (DB: ${dbRoom._id})`);

      console.log(`Created hybrid room: ${roomId} (DB: ${dbRoom._id})`);

      res.json({
        success: true,
        data: { roomId },
        message: "Room created successfully",
      });
    } catch (error) {
      console.error("Failed to create hybrid room:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create room",
        error: error.message,
      });
    }
  }

  // Join room - sync between database and websocket
  static async joinRoom(req, res) {
    try {
      const { roomId } = req.params;
      const { userId, username } = req.body;

      if (!roomId || !userId || !username) {
        return res.status(400).json({
          success: false,
          message: "Room ID, user ID, and username are required",
        });
      }

      // Check if room exists in database
      const dbRoom = await Rooms.findOne({ rid: roomId });
      if (!dbRoom) {
        return res.status(404).json({
          success: false,
          message: "Room not found in database",
        });
      }

      console.log(`User ${username} validated for hybrid room: ${roomId}`);

      res.json({
        success: true,
        roomId,
        code: "",
        participants: [],
        files: dbRoom.files || [],
        message: "Successfully joined room",
      });
    } catch (error) {
      console.error("Failed to join hybrid room:", error);
      res.status(500).json({
        success: false,
        message: "Failed to join room",
        error: error.message,
      });
    }
  }

  // Get room information from both systems
  static async getRoom(req, res) {
    try {
      const { roomId } = req.params;

      // Get database room
      const dbRoom = await Rooms.findOne({ rid: roomId });
      if (!dbRoom) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }

      res.json({
        success: true,
        room: {
          id: roomId,
          dbRoomId: dbRoom._id,
          code: "",
          participants: [],
          files: dbRoom.files || [],
          createdAt: dbRoom.createdAt,
          maxParticipants: 3,
        },
      });
    } catch (error) {
      console.error("Failed to get hybrid room:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get room information",
        error: error.message,
      });
    }
  }

  // Leave room - sync between systems
  static async leaveRoom(req, res) {
    try {
      const { roomId } = req.params;
      const { userId } = req.body;

      console.log(`User ${userId} left hybrid room: ${roomId}`);

      res.json({
        success: true,
        message: "Successfully left room",
      });
    } catch (error) {
      console.error("Failed to leave hybrid room:", error);
      res.status(500).json({
        success: false,
        message: "Failed to leave room",
        error: error.message,
      });
    }
  }

  // Update room code - save to database for model feeding
  static async updateRoomCode(roomId, newCode) {
    try {
      // Update database room (for model feeding)
      const dbRoom = await Rooms.findOne({ rid: roomId });
      if (dbRoom) {
        // Find or create main code file
        const mainFile =
          dbRoom.files.find((f) => f.filename === "main.js") ||
          dbRoom.files.find((f) => f.filename === "index.js") ||
          dbRoom.files[0];

        if (mainFile) {
          mainFile.code = newCode;
        } else if (dbRoom.files.length === 0) {
          // Create main file if none exists
          dbRoom.files.push({
            filename: "main.js",
            code: newCode,
          });
        }

        await dbRoom.save();
        console.log(`Updated code in database for room: ${roomId}`);
      }

      return true;
    } catch (error) {
      console.error("Failed to update room code:", error);
      return false;
    }
  }

  // Save file to database
  static async saveFileToDatabase(roomId, fileData) {
    try {
      const dbRoom = await Rooms.findOne({ rid: roomId });
      if (!dbRoom) {
        console.error(`Database room not found for: ${roomId}`);
        return false;
      }

      // Find existing file or add new one
      const existingFileIndex = dbRoom.files.findIndex(
        (f) => f.filename === fileData.name
      );
      if (existingFileIndex >= 0) {
        dbRoom.files[existingFileIndex].code = fileData.content;
      } else {
        dbRoom.files.push({
          filename: fileData.name,
          code: fileData.content,
        });
      }

      await dbRoom.save();
      console.log(
        `Saved file ${fileData.name} to database for room: ${roomId}`
      );
      return true;
    } catch (error) {
      console.error("Failed to save file to database:", error);
      return false;
    }
  }

  // Get all rooms for model feeding
  static async getAllRooms(req, res) {
    try {
      const dbRooms = await Rooms.find({});

      res.json({
        success: true,
        rooms: dbRooms.map((room) => ({
          id: room.rid,
          dbId: room._id,
          owner: room.owner,
          files: room.files,
          createdAt: room.createdAt,
        })),
      });
    } catch (error) {
      console.error("Failed to get all rooms:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get rooms",
        error: error.message,
      });
    }
  }
}

module.exports = HybridRoomController;
