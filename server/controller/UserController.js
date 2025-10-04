const User = require("../model/User");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const jwtSecret = process.env.JWT_SECRET;
dotenv.config();



async function login(req, res) {
    try {
        const {email, password} = req.body;
        if (!email || !password) {
            return res.status(400).json({message: "Email and password are required"});
        }
        const user = await User.findOne({email});
        if (!user) {
            return res.status(400).json({message: "Invalid email or password"});
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({message: "Incorrect password"});
        }

        const token = jwt.sign(
            {userId: user._id, email: user.email},
            jwtSecret,
            {expiresIn: '1d'}
        );
        return res.status(200).json({message: "Login successful", token, userId: user._id});
    } catch (err) {
        console.log("error in login users");
        console.log(err);
        return res.status(500).json({message: "Server error"});
    }
}

async function signup(req, res) {
    try {
        const {email, password, name} = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({message: "Name, email and password are required"});
        }

        const existingUser = await User.findOne({email});
        if(existingUser) {
            return res.status(400).json({message: "User already exists"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            name,
            email,
            hashedPassword,
        });

        return res.status(201).json({message: "User signup successful", userId: newUser._id});

    } catch (err) {
        console.log("error in signup users");
        console.log(err);
        return res.status(500).json({message: "Server error"});
    }
}


async function getProfile(req, res) {
    try {
        const userId = req.user.userId;
        if (!userId) {
            return res.status(400).json({error: "Missing userId"});
        }

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({error: "User not found"});
        }
        return res.status(200).json({user});
    } catch (err) {
        console.error("Error fetching user details:", err);
        return res.status(500).json({error: "Server Error"});
    }
}

module.exports = {
    login,
    signup,
    getProfile
};