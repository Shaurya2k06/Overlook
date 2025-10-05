const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
require("dotenv").config();
const URL = process.env.URL; // importing our mongo uri from env (atlas)

// Import our modules
const { connectMongoDB } = require("./db/connection");
const { setupSocketHandlers, getRoomStats } = require("./websocket/sockets");
const { authenticateSocket } = require("./middleware/auth");
const roomRoutes = require("./routes/roomRoutes");
const RoomsRouter = require("./routes/RoomsRouter");
const UserRouter = require("./routes/UserRouter");
const AIRouter = require("./routes/AIRouter");
const hybridRoomRoutes = require("./routes/hybridRoomRoutes");
const roomSyncRoutes = require("./routes/roomSyncRoutes");

const { connect } = require("http2");

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const allowedOrigins = [
  "http://localhost:5173", // Development
  "https://overlook-6yrs.onrender.com", // Production frontend
  "https://overlooksecurity.vercel.app",
  "http://localhost:3000", // Alternative dev port
];

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`CORS blocked request from origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
  exposedHeaders: ["Access-Control-Allow-Origin"],
  optionsSuccessStatus: 200, // For legacy browser support
  preflightContinue: false,
};

connectMongoDB(URL)
  .then(() => console.log("MongoDB Connected!!"))
  .catch((err) => console.log("Error, Can't connect to DB", err));

// Configure CORS properly for credentials
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"], // Allow both common dev ports
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Connect to MongoDB

// Socket.IO authentication middleware
io.use(authenticateSocket);

// Setup Socket.IO handlers
setupSocketHandlers(io);

// API routes
app.use("/api/rooms", roomRoutes);
app.use("/api/Rooms", RoomsRouter); // Add the RoomsRouter for room creation
app.use("/api/ai", AIRouter); // AI pipeline endpoints
app.use("/api/hybrid-rooms", hybridRoomRoutes); // Add hybrid room routes
app.use("/api/room-sync", roomSyncRoutes); // Add rapid sync routes

// Basic API routes
app.get("/", (req, res) => {
  res.json({
    message: "Overlook Collaborative Code Editor",
    activeRooms: getRoomStats().length,
    status: "running",
  });
});

// CORS test endpoint
app.get("/api/cors-test", (req, res) => {
  res.json({
    message: "CORS test successful",
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
    headers: req.headers,
  });
});

// Test endpoint for hybrid rooms
app.get("/api/hybrid-rooms/test", (req, res) => {
  res.json({
    message: "Hybrid rooms endpoint accessible",
    timestamp: new Date().toISOString(),
  });
});

app.use("/public", UserRouter);
app.use("/rooms", roomRoutes);
app.use("/Room", RoomsRouter);

app.get("/api/rooms", (req, res) => {
  const rooms = getRoomStats();
  res.json({ rooms });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready for connections`);
  console.log(`Authentication enabled for WebSocket connections`);
});

// Warn if critical env vars are missing
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set. Authentication and token generation will fail. Check your .env file.');
}

// 404 handler for unmatched routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// Global error handler - logs and returns JSON helpful in development
app.use((err, req, res, next) => {
  console.error('Unhandled error in express:', err && err.stack ? err.stack : err);
  res.status(err && err.status ? err.status : 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : (err && err.message) || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : (err && err.stack),
  });
});

// Security testing routes
const securityRoutes = require("./routes/securityRoutes");
app.use("/api/security", securityRoutes);
