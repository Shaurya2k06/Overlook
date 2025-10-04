const express = require("express");
const {
  createRoom,
  addFilesToRoom,
} = require("../controllers/RoomsController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.post("/create", authenticateToken, createRoom);
router.post("/addFilesToRoom", authenticateToken, addFilesToRoom);

module.exports = router;
