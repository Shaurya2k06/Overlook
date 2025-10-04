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
const hybridRoomRoutes = require("./routes/hybridRoomRoutes");

const { connect } = require("http2");

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const allowedOrigins = [
  "http://localhost:5173", // Development
  "https://overlook-6yrs.onrender.com", // Production frontend
  "https://overlooksecurity.vercel.app",
  "http://localhost:3000" // Alternative dev port
];

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
});

// Middleware
const corsOptions = {
  origin: allowedOrigins,
  credentials: true
};

connectMongoDB(URL)
  .then(() => console.log("MongoDB Connected!!"))
  .catch((err) => console.log("Error, Can't connect to DB", err));
app.use(cors(corsOptions));
app.use(express.json());

// Connect to MongoDB

// Socket.IO authentication middleware
io.use(authenticateSocket);

// Setup Socket.IO handlers
setupSocketHandlers(io);

// API routes
app.use("/api/rooms", roomRoutes);
app.use("/api/Rooms", RoomsRouter); // Add the RoomsRouter for room creation
app.use("/api/hybrid-rooms", hybridRoomRoutes); // Add hybrid room routes

// Basic API routes
app.get("/", (req, res) => {
  res.json({
    message: "Overlook Collaborative Code Editor",
    activeRooms: getRoomStats().length,
    status: "running",
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
