const express = require("express");
const { register, login, getProfile } = require("../controller/UserController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/profile", authenticateToken, getProfile);

module.exports = router;
