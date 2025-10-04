const express = require('express');
const { login, getProfile, signup} = require('../controllers/UserController');
const { authenticateToken } = require("../middleware/auth");


const router = express.Router();

router.post("/login", login);

router.post("/signup", signup);

router.get("/profile", authenticateToken,  getProfile);

module.exports = router;