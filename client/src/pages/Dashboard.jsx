import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import RoomManager from "../components/RoomManager";

const API_BASE_URL = "http://localhost:3001/api";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    // Try to get user data from localStorage, fallback to default
    const savedUser = localStorage.getItem("overlook_user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        return {
          id: `user_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          username: parsedUser.username || "",
        };
      } catch (error) {
        console.error("Error parsing saved user data:", error);
      }
    }
    // Fallback to default user with empty username
    return {
      id: `user_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      username: "",
    };
  });

  // Create a new room and navigate to it
  const createRoom = async () => {
    try {
      // Save username to localStorage before navigating (ID will be generated fresh each session)
      localStorage.setItem(
        "overlook_user",
        JSON.stringify({ username: user.username })
      );

      const response = await axios.post(`${API_BASE_URL}/rooms/create`);
      const { roomId } = response.data;

      // Navigate to the new room
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error("Failed to create room:", error);
      alert("Failed to create room");
    }
  };

  // Join an existing room and navigate to it
  const joinRoom = async (roomId) => {
    // Save username to localStorage before navigating (ID will be generated fresh each session)
    localStorage.setItem(
      "overlook_user",
      JSON.stringify({ username: user.username })
    );

    // Navigate directly to the room - the Editor component will handle joining
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="bg-gray-800 px-8 py-4 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-white">
          Overlook - Collaborative Code Editor
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">
            Create a room or join an existing one to start collaborating
          </span>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <RoomManager
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          user={user}
          onUserChange={setUser}
        />
      </main>
    </div>
  );
}

export default Dashboard;
