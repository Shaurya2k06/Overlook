const express = require('express');
const { login, signup, getProfile } = require('../controller/UserController');

const router = express.Router();

router.post("/login", login);

router.post("/signup", signup);

router.get("/profile", getProfile);

module.exports = router;