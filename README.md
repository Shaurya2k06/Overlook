# Overlook - Secure Collaborative Coding Platform

A real-time collaborative code editor with terminal aesthetics, AI assistance, and security testing capabilities. Built with React, Node.js, and Socket.IO for secure, hacker-themed collaborative development.

## Features

- **Room-based Collaboration**: Create or join secure rooms with real-time participant management
- **Terminal-Themed Interface**: Hacker aesthetic with global terminal system for navigation and commands
- **Real-time Code Synchronization**: Instant code changes across all participants with conflict resolution
- **Advanced File System**: Integrated file explorer with create, edit, and delete operations
- **Global Terminal System**: Command-line interface for site navigation, room management, and system commands
- **Audit Logs**: Real-time monitoring and logging of all system activities and user actions
- **AI Code Generation**: Generate code using natural language prompts with execution flow visualization
- **Security Testing Suite**: Built-in security testing tools and vulnerability assessment
- **Recent Rooms Persistence**: Local storage of recent collaborative sessions for quick access
- **Multi-language Support**: JavaScript, TypeScript, Python, Java, C++, and more with syntax highlighting
- **Responsive Design**: Clean, modern interface optimized for collaborative coding sessions

## Architecture

```
/project-root
│
├── client/                          # React frontend application (Vite)
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── components/              # UI components
│   │   │   ├── CodeEditor.jsx       # Monaco editor integration
│   │   │   ├── FileExplorer.jsx     # File system management
│   │   │   ├── GlobalTerminal.jsx   # Command-line interface
│   │   │   ├── PromptInput.jsx      # AI code generation input
│   │   │   ├── RoomManager.jsx      # Room creation/joining
│   │   │   ├── ParticipantsList.jsx # Real-time participant display
│   │   │   ├── TabSystem.jsx        # Multi-file tab management
│   │   │   ├── StatusBar.jsx        # Editor status and info
│   │   │   └── ui/                  # Reusable UI components
│   │   ├── contexts/                # React context providers
│   │   │   ├── FileSystemContext.jsx # File system state management
│   │   │   └── useFileSystem.js     # File system hooks
│   │   ├── pages/                   # Page components
│   │   │   ├── Home.jsx             # Landing page
│   │   │   ├── Dashboard.jsx        # Main hub with recent rooms
│   │   │   ├── Editor.jsx           # Collaborative editor interface
│   │   │   └── SecurityTesting.jsx  # Security testing tools
│   │   ├── App.jsx                  # Main app with routing
│   │   └── main.jsx                 # Application entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Node.js backend (Express)
│   ├── controllers/                 # API controllers
│   │   ├── RoomController.js        # Room management logic
│   │   ├── UserController.js        # User authentication
│   │   └── ModelController.js       # AI model integration
│   ├── routes/                      # API routes
│   │   ├── roomRoutes.js            # Room-related endpoints
│   │   ├── userRoutes.js            # User management endpoints
│   │   └── AIRouter.js              # AI code generation routes
│   ├── websocket/                   # WebSocket handlers
│   │   └── sockets.js               # Real-time collaboration
│   ├── middleware/                  # Express middleware
│   │   └── auth.js                  # Authentication middleware
│   ├── model/                       # Data models
│   │   ├── Rooms.js                 # Room data structure
│   │   └── User.js                  # User data structure
│   ├── db/                          # Database configuration
│   │   └── connection.js            # Database connection setup
│   ├── utils/                       # Utility functions
│   ├── main.js                      # Server entry point
│   └── package.json
│
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the server directory:
   ```env
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/overlook
   JWT_SECRET=your-secret-key
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will run on `http://localhost:5173`

## Usage

### Navigation

The application uses React Router DOM for navigation with the following routes:

- **`/`** - Home page with landing content and feature overview
- **`/dashboard`** - Main hub with recent rooms and terminal interface
- **`/editor`** - Collaborative code editor with real-time features
- **`/security-testing`** - Security testing tools and vulnerability assessment

### Terminal Commands

The global terminal system provides command-line navigation and room management:

- `help` - Display available commands
- `home` - Navigate to home page
- `dashboard` - Navigate to dashboard
- `editor` - Navigate to editor
- `security` - Navigate to security testing
- `create-room` - Create a new collaborative room
- `join-room <room-id>` - Join an existing room
- `list-rooms` - Display available rooms
- `clear` - Clear terminal output

### Creating a Room

1. Open the application in your browser
2. Use the terminal command `create-room` or click "Create Room" in the dashboard
3. A unique room ID will be generated and displayed
4. Share the room ID with collaborators

### Joining a Room

1. Use the terminal command `join-room <room-id>` or enter the room ID in the dashboard
2. The system will connect you to the collaborative session
3. All participants will be notified of your arrival

### Collaborative Editing

- Code changes sync in real-time across all participants
- Use the file explorer to create and manage project files
- The Monaco editor provides syntax highlighting, IntelliSense, and multi-language support
- Audit logs track all activities and changes in the session

### File System Management

- Create new files and folders through the file explorer
- Edit files with full syntax highlighting
- Tab-based interface for managing multiple open files
- All file operations sync across participants

### AI Code Generation

1. Enter a natural language prompt in the AI assistant panel
2. Click "Generate Code" or press Enter
3. View the execution flow and progress in the prompt input area
4. Generated code appears in the editor and syncs to all participants

### Security Testing

1. Navigate to the security testing page
2. Use built-in tools to scan for vulnerabilities
3. Review security reports and recommendations
4. Terminal-themed interface maintains consistent aesthetic

### Recent Rooms

- Recently accessed rooms are automatically saved to local storage
- Quick access from the dashboard for resuming previous sessions
- Persistent across browser sessions

## API Endpoints

### Room Management

- `POST /api/rooms/create` - Create a new collaborative room
- `POST /api/rooms/join/:roomId` - Join an existing room
- `GET /api/rooms/:roomId` - Get room information and participants
- `POST /api/rooms/leave/:roomId` - Leave a room
- `GET /api/rooms` - Get all active rooms

### User Management

- `POST /api/users/login` - User authentication
- `POST /api/users/register` - User registration
- `GET /api/users/profile` - Get user profile information

### AI Code Generation

- `POST /api/ai/generate` - Generate code from natural language prompts

### File System

- `GET /api/files/:roomId` - Get room file structure
- `POST /api/files/:roomId` - Create or update files
- `DELETE /api/files/:roomId/:filePath` - Delete files

## WebSocket Events

### Client to Server

- `join-room` - Join a collaborative room
- `leave-room` - Leave current room
- `code-change` - Send incremental code changes
- `file-operation` - File system operations (create, edit, delete)
- `terminal-command` - Execute terminal commands
- `audit-log` - Send audit log entries

### Server to Client

- `room-joined` - Confirmation of room join with participant list
- `room-left` - Confirmation of room departure
- `code-updated` - Receive code synchronization updates
- `file-updated` - File system change notifications
- `user-joined` - New participant joined notification
- `user-left` - Participant departure notification
- `terminal-output` - Terminal command responses
- `audit-update` - Real-time audit log updates
- `error` - Error messages and notifications

## Development

### Project Structure

The project follows clean architecture with clear separation of concerns:

- **Frontend**: React 18 with Vite, featuring component-based architecture and context providers
- **Backend**: Express.js with modular controllers, routes, and middleware
- **WebSocket**: Socket.IO for real-time bidirectional communication
- **File System**: Context-based state management for collaborative file operations
- **Terminal System**: Command-line interface integrated throughout the application
- **Security**: Built-in security testing and audit logging capabilities

### Key Features Implementation

1. **Real-time Collaboration**: WebSocket-based synchronization with operational transformation
2. **Terminal Integration**: Global command system with navigation and room management
3. **File System Context**: React context for managing collaborative file operations
4. **Audit Logging**: Comprehensive activity tracking and real-time monitoring
5. **Security Testing**: Integrated security assessment tools
6. **Persistent Sessions**: Local storage for recent rooms and user preferences

### Customization

- **AI Integration**: Replace mock AI in `ModelController.js` with preferred AI service
- **Authentication**: Enhance JWT implementation in `middleware/auth.js`
- **Database**: Implement persistent storage for rooms, users, and file data
- **Security Tools**: Extend security testing capabilities in `SecurityTesting.jsx`
- **Terminal Commands**: Add custom commands in `GlobalTerminal.jsx`
- **Themes**: Modify Tailwind configuration for custom terminal aesthetics

## Testing

### Manual Testing

1. Start both backend and frontend servers
2. Open multiple browser tabs/windows
3. Test terminal commands: `help`, `create-room`, `join-room`
4. Create a room and verify real-time synchronization
5. Test file operations in the file explorer
6. Verify audit logs display system activities
7. Test AI code generation and execution flow
8. Use security testing tools

### Development Testing

- Run `npm test` in both client and server directories
- Test WebSocket connections and real-time features
- Verify file system operations across multiple clients
- Test terminal command parsing and execution
- Validate audit log accuracy and real-time updates
