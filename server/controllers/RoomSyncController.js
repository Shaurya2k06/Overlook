const Room = require('../model/Rooms');

class RoomSyncController {
  // Update file content in room (rapid storage)
  static async updateFileContent(req, res) {
    try {
      const { roomId } = req.params;
      const { filename, content, language = 'javascript', userId, username } = req.body;

      if (!roomId || !filename || content === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Room ID, filename, and content are required'
        });
      }

      // Find the room
      const room = await Room.findOne({ rid: roomId });
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }

      // Update or create file entry
      const existingFileIndex = room.files.findIndex(f => f.filename === filename);
      
      if (existingFileIndex >= 0) {
        // Update existing file
        room.files[existingFileIndex].content = content;
        room.files[existingFileIndex].language = language;
        room.files[existingFileIndex].lastModified = new Date();
        room.files[existingFileIndex].lastModifiedBy = username || userId || 'unknown';
        room.files[existingFileIndex].version += 1;
      } else {
        // Create new file entry
        room.files.push({
          filename,
          content,
          language,
          lastModified: new Date(),
          lastModifiedBy: username || userId || 'unknown',
          version: 1
        });
      }

      // Update room activity
      room.lastActivity = new Date();
      
      // Add user to active users if not already present
      if (userId && !room.activeUsers.includes(userId)) {
        room.activeUsers.push(userId);
      }

      // Save changes
      await room.save();

      console.log(`File ${filename} updated in room ${roomId} by ${username || userId}`);

      res.json({
        success: true,
        data: {
          filename,
          content,
          language,
          lastModified: room.files[existingFileIndex >= 0 ? existingFileIndex : room.files.length - 1].lastModified,
          version: room.files[existingFileIndex >= 0 ? existingFileIndex : room.files.length - 1].version
        },
        message: 'File updated successfully'
      });

    } catch (error) {
      console.error('Error updating file content:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update file content',
        error: error.message
      });
    }
  }

  // Get all files in room (for synchronization)
  static async getRoomFiles(req, res) {
    try {
      const { roomId } = req.params;

      const room = await Room.findOne({ rid: roomId });
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }

      res.json({
        success: true,
        data: {
          roomId,
          files: room.files,
          lastActivity: room.lastActivity,
          activeUsers: room.activeUsers
        }
      });

    } catch (error) {
      console.error('Error getting room files:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get room files',
        error: error.message
      });
    }
  }

  // Get specific file content
  static async getFileContent(req, res) {
    try {
      const { roomId, filename } = req.params;

      const room = await Room.findOne({ rid: roomId });
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }

      const file = room.files.find(f => f.filename === filename);
      if (!file) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      res.json({
        success: true,
        data: file
      });

    } catch (error) {
      console.error('Error getting file content:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get file content',
        error: error.message
      });
    }
  }

  // Mark user as active in room
  static async markUserActive(req, res) {
    try {
      const { roomId } = req.params;
      const { userId, username } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const room = await Room.findOne({ rid: roomId });
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }

      // Add user to active users if not already present
      if (!room.activeUsers.includes(userId)) {
        room.activeUsers.push(userId);
      }

      room.lastActivity = new Date();
      await room.save();

      res.json({
        success: true,
        data: {
          activeUsers: room.activeUsers,
          userCount: room.activeUsers.length
        }
      });

    } catch (error) {
      console.error('Error marking user active:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark user active',
        error: error.message
      });
    }
  }

  // Remove user from active users
  static async markUserInactive(req, res) {
    try {
      const { roomId } = req.params;
      const { userId } = req.body;

      const room = await Room.findOne({ rid: roomId });
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }

      // Remove user from active users
      room.activeUsers = room.activeUsers.filter(id => id !== userId);
      room.lastActivity = new Date();
      await room.save();

      res.json({
        success: true,
        data: {
          activeUsers: room.activeUsers,
          userCount: room.activeUsers.length
        }
      });

    } catch (error) {
      console.error('Error marking user inactive:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark user inactive',
        error: error.message
      });
    }
  }

  // Get room sync status (for health checks)
  static async getRoomStatus(req, res) {
    try {
      const { roomId } = req.params;

      const room = await Room.findOne({ rid: roomId });
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }

      res.json({
        success: true,
        data: {
          roomId,
          isActive: room.isActive,
          activeUsers: room.activeUsers,
          userCount: room.activeUsers.length,
          fileCount: room.files.length,
          lastActivity: room.lastActivity,
          createdAt: room.createdAt,
          updatedAt: room.updatedAt
        }
      });

    } catch (error) {
      console.error('Error getting room status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get room status',
        error: error.message
      });
    }
  }
}

module.exports = RoomSyncController;