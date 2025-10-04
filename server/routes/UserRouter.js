const express = require('express');
const { login, register, getProfile } = require('../controllers/UserController');
const { authenticateToken } = require("../middleware/auth");


const router = express.Router();

router.post("/login", login);

router.post("/signup", register);

router.get("/profile", authenticateToken,  getProfile);

module.exports = router;