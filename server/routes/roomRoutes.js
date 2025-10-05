const express = require("express");
const RoomController = require("../controllers/RoomController");
const RoomsController = require("../controllers/RoomsController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.post("/create", RoomController.createRoom);
router.post("/join/:roomId", RoomController.joinRoom);
router.get("/:roomId", RoomController.getRoom);
router.post("/leave/:roomId", RoomController.leaveRoom);
router.get("/", RoomController.getAllRooms);
router.post("/add-files", authenticateToken, RoomsController.addFilesToRoom);

module.exports = router;
