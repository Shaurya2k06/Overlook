const express = require("express");
const RoomController = require("../controllers/RoomController");
const { geminiHandler } = require("../controllers/ModelController");

const router = express.Router();

router.post("/create", RoomController.createRoom);
router.post("/join/:roomId", RoomController.joinRoom);
router.get("/:roomId", RoomController.getRoom);
router.post("/leave/:roomId", RoomController.leaveRoom);
router.get("/", RoomController.getAllRooms);

router.post("/generate-code", geminiHandler);

module.exports = router;
