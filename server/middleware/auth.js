const jwt = require("jsonwebtoken");
const User = require("../model/User");

// JWT Authentication middleware for WebSocket connections
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    // Allow mock token for testing (your teammate will remove this)
    if (token === "mock-token") {
      socket.userId = "mock-user-123";
      socket.username = "TestUser";
      socket.name = "TestUser";
      socket.email = "test@example.com";
      return next();
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    // Find user in database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new Error("User not found"));
    }

    // Attach user info to socket
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

// Regular HTTP authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "your-secret-key",
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
