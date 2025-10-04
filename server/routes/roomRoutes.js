const express = require("express");
const RoomController = require("../controllers/RoomController");
const ModelController = require("../controllers/ModelController");

const router = express.Router();

// Room management routes
router.post("/create", RoomController.createRoom);
router.post("/join/:roomId", RoomController.joinRoom);
router.get("/:roomId", RoomController.getRoom);
router.post("/leave/:roomId", RoomController.leaveRoom);
router.get("/", RoomController.getAllRooms);

// Model integration routes
router.post("/generate-code", ModelController.generateCode);

module.exports = router;
