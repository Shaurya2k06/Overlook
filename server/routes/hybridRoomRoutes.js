const express = require("express");
const HybridRoomController = require("../controllers/HybridRoomController");

const router = express.Router();

// Hybrid room routes that use both database and websocket systems
router.post("/create", HybridRoomController.createRoom);
router.post("/join/:roomId", HybridRoomController.joinRoom);
router.get("/:roomId", HybridRoomController.getRoom);
router.post("/leave/:roomId", HybridRoomController.leaveRoom);
router.get("/", HybridRoomController.getAllRooms);

module.exports = router;
