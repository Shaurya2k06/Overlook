const express = require('express');
const RoomSyncController = require('../controllers/RoomSyncController');

const router = express.Router();

// File synchronization routes
router.put('/:roomId/files/:filename', RoomSyncController.updateFileContent);
router.get('/:roomId/files', RoomSyncController.getRoomFiles);
router.get('/:roomId/files/:filename', RoomSyncController.getFileContent);

// User activity tracking
router.post('/:roomId/users/active', RoomSyncController.markUserActive);
router.post('/:roomId/users/inactive', RoomSyncController.markUserInactive);

// Room status
router.get('/:roomId/status', RoomSyncController.getRoomStatus);

module.exports = router;