const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const User = require("../model/User");
dotenv.config();

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    // Allow mock token for testing
    if (token === "mock-token") {
      socket.userId = "mock-user-123";
      socket.username = "TestUser";
      socket.name = "TestUser";
      socket.email = "test@example.com";
      return next();
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new Error("User not found"));
    }

    socket.userId = user._id.toString();
    socket.username = user.name;
    socket.name = user.name;
    socket.email = user.email;

    next();
  } catch (error) {
    console.error("Socket authentication error:", error);
    next(new Error("Authentication failed"));
  }
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET,
    (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
      }

      req.userId = decoded.userId;
      next();
    }
  );
};

module.exports = {
  authenticateSocket,
  authenticateToken,
};
