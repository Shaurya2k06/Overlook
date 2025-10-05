// Environment configuration for the application
export const config = {
  // API Configuration
  api: {
    baseUrl:
      import.meta.env.VITE_API_BASE_URL ||
      (import.meta.env.MODE === "production"
        ? "https://overlook-6yrs.onrender.com"
        : "http://localhost:3001"),
    endpoints: {
      auth: "/public",
      rooms: "/api/rooms",
      ai: "/api/ai",
      security: "/api/security",
      hybridRooms: "/api/hybrid-rooms",
      roomSync: "/api/room-sync",
    },
  },

  // Socket Configuration
  socket: {
    url:
      import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.MODE === "production"
        ? "https://overlook-6yrs.onrender.com"
        : "http://localhost:3001"),
  },

  // Application Configuration
  app: {
    name: import.meta.env.VITE_APP_NAME || "Overlook",
    version: import.meta.env.VITE_APP_VERSION || "1.0.0",
    environment: import.meta.env.MODE || "development",
  },
};

// Helper functions for easy access
export const getApiUrl = (endpoint = "") => {
  return `${config.api.baseUrl}${endpoint}`;
};

export const getSocketUrl = () => {
  return config.socket.url;
};

export const isProduction = () => {
  return config.app.environment === "production";
};

export default config;
