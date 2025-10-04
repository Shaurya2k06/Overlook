# Overlook - Real-time Collaborative Code Editor

A real-time collaborative code editor with AI assistance, built with React, Node.js, and Socket.IO.

## Features

- **Room-based Collaboration**: Create or join rooms with up to 3 participants
- **Real-time Code Synchronization**: See code changes from other participants instantly
- **Monaco Editor**: Professional code editor with syntax highlighting and language support
- **AI Code Generation**: Generate code using natural language prompts
- **Multi-language Support**: JavaScript, TypeScript, Python, Java, C++, and more
- **Clean Architecture**: Separated frontend, backend, and WebSocket layers

## Architecture

```
/project-root
│
├── client/                     # React frontend application
│   ├── src/
│   │   ├── components/         # UI components
│   │   │   ├── CodeEditor.jsx  # Monaco editor wrapper
│   │   │   ├── PromptInput.jsx # AI prompt input
│   │   │   ├── RoomManager.jsx # Room creation/joining
│   │   │   └── ParticipantsList.jsx # Participant display
│   │   ├── pages/              # Page components
│   │   │   ├── Home.jsx        # Landing page
│   │   │   ├── Dashboard.jsx   # Main collaborative editor
│   │   │   └── About.jsx       # About page
│   │   ├── App.jsx            # Main app component with routing
│   │   └── App.css            # Global and page-specific styling
│   └── package.json
│
├── server/                     # Node.js backend
│   ├── controllers/           # API controllers
│   │   ├── RoomController.js  # Room management logic
│   │   └── ModelController.js # AI model integration
│   ├── routes/               # API routes
│   │   └── roomRoutes.js     # Room-related endpoints
│   ├── websocket/            # WebSocket handlers
│   │   └── sockets.js        # Real-time collaboration
│   ├── middleware/           # Authentication middleware
│   ├── model/               # Data models
│   ├── main.js              # Server entry point
│   └── package.json
│
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
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

The application now uses React Router DOM for navigation with the following routes:

- **`/`** - Home page with landing content and feature overview
- **`/dashboard`** - Main collaborative code editor interface
- **`/about`** - About page with detailed information about the application

### Creating a Room

1. Open the application in your browser
2. Enter your username
3. Click "Create Room" to generate a unique room ID
4. Share the room ID with others to invite them

### Joining a Room

1. Enter your username
2. Enter the room ID in the "Join Existing Room" section
3. Click "Join Room"

### Collaborative Editing

- All participants see code changes in real-time
- Use the language selector to change the programming language
- The Monaco editor provides syntax highlighting and IntelliSense

### AI Code Generation

1. Enter a natural language prompt in the AI Assistant panel
2. Click "Generate Code" or press Enter
3. The AI will generate new code and replace the current content
4. All participants will see the updated code

### Example Prompts

- "Create a hello world function"
- "Build a calculator with basic operations"
- "Create an array manipulation example"
- "Write a class for a user object"
- "Create an async function example"

## API Endpoints

### Room Management

- `POST /api/rooms/create` - Create a new room
- `POST /api/rooms/join/:roomId` - Join an existing room
- `GET /api/rooms/:roomId` - Get room information
- `POST /api/rooms/leave/:roomId` - Leave a room
- `GET /api/rooms` - Get all rooms (for debugging)

### AI Code Generation

- `POST /api/rooms/generate-code` - Generate code from prompt

## WebSocket Events

### Client to Server

- `join-room` - Join a room
- `code-change` - Send code changes
- `full-code-update` - Send complete code replacement
- `leave-room` - Leave a room

### Server to Client

- `room-joined` - Confirmation of joining a room
- `code-updated` - Receive code updates
- `user-joined` - New user joined the room
- `user-left` - User left the room
- `error` - Error messages
- `room-full` - Room is at capacity

## Development

### Project Structure

The project follows clean architecture principles:

- **Frontend**: React components with clear separation of concerns
- **Backend**: Express.js with modular controllers and routes
- **WebSocket**: Real-time communication layer
- **API**: RESTful endpoints for room management and AI integration

### Key Features

1. **Room-based System**: Each room supports up to 3 participants
2. **Real-time Synchronization**: WebSocket-based code synchronization
3. **AI Integration**: Mock AI model for code generation (easily replaceable)
4. **Clean UI**: Modern, responsive design with dark theme
5. **Error Handling**: Comprehensive error handling and user feedback

### Customization

- **AI Model**: Replace the mock AI in `ModelController.js` with your preferred AI service
- **Authentication**: Implement proper JWT authentication in `middleware/auth.js`
- **Database**: Add persistent storage for rooms and user data
- **Styling**: Modify `App.css` for custom themes and layouts

## Testing

1. Start both the backend and frontend servers
2. Open multiple browser tabs/windows
3. Create a room in one tab
4. Join the room from another tab using the room ID
5. Test real-time code synchronization
6. Test AI code generation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.
