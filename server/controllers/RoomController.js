const { v4: uuidv4 } = require("uuid");

const rooms = new Map();

class RoomController {
  static createRoom(req, res) {
    try {
      const roomId = uuidv4();
      const room = {
        id: roomId,
        code: "",
        participants: [],
        createdAt: new Date(),
        maxParticipants: 3,
      };

      rooms.set(roomId, room);

      res.json({
        success: true,
        data: { roomId },
        message: "Room created successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create room",
        error: error.message,
      });
    }
  }

  static joinRoom(req, res) {
    try {
      const { roomId } = req.params;
      const { userId, username } = req.body;

      if (!roomId || !userId || !username) {
        return res.status(400).json({
          success: false,
          message: "Room ID, user ID, and username are required",
        });
      }

      const room = rooms.get(roomId);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }

      if (room.participants.length >= room.maxParticipants) {
        return res.status(400).json({
          success: false,
          message: "Room is full (maximum 3 participants)",
        });
      }

      // Check if user is already in the room
      const existingParticipant = room.participants.find(
        (p) => p.userId === userId
      );
      if (existingParticipant) {
        return res.json({
          success: true,
          roomId,
          code: room.code,
          participants: room.participants,
          message: "User already in room",
        });
      }

      // Add user to room
      const participant = {
        userId,
        username,
        joinedAt: new Date(),
      };
      room.participants.push(participant);

      res.json({
        success: true,
        roomId,
        code: room.code,
        participants: room.participants,
        message: "Successfully joined room",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to join room",
        error: error.message,
      });
    }
  }

  // Get room information
  static getRoom(req, res) {
    try {
      const { roomId } = req.params;
      const room = rooms.get(roomId);

      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }

      res.json({
        success: true,
        room: {
          id: room.id,
          code: room.code,
          participants: room.participants,
          createdAt: room.createdAt,
          maxParticipants: room.maxParticipants,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get room information",
        error: error.message,
      });
    }
  }

  // Leave room
  static leaveRoom(req, res) {
    try {
      const { roomId } = req.params;
      const { userId } = req.body;

      const room = rooms.get(roomId);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }

      // Remove user from room
      room.participants = room.participants.filter((p) => p.userId !== userId);

      // If room is empty, delete it
      if (room.participants.length === 0) {
        rooms.delete(roomId);
      }

      res.json({
        success: true,
        message: "Successfully left room",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to leave room",
        error: error.message,
      });
    }
  }

  // Get all rooms (for debugging)
  static getAllRooms(req, res) {
    try {
      const roomList = Array.from(rooms.values()).map((room) => ({
        id: room.id,
        participantCount: room.participants.length,
        maxParticipants: room.maxParticipants,
        createdAt: room.createdAt,
      }));

      res.json({
        success: true,
        rooms: roomList,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get rooms",
        error: error.message,
      });
    }
  }

  // Update room code (called by WebSocket handlers)
  static updateRoomCode(roomId, newCode) {
    const room = rooms.get(roomId);
    if (room) {
      room.code = newCode;
      return true;
    }
    return false;
  }

  // Get room code
  static getRoomCode(roomId) {
    const room = rooms.get(roomId);
    return room ? room.code : null;
  }

  // Get room participants
  static getRoomParticipants(roomId) {
    const room = rooms.get(roomId);
    return room ? room.participants : [];
  }
}

module.exports = RoomController;
module.exports.rooms = rooms;
