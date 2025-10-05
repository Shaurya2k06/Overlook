import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./contexts/AuthContext";
import { FileSystemProvider } from "./contexts/FileSystemContext";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";
import SecurityTesting from "./pages/SecurityTesting";
import AIWorkflow from "./components/AIWorkflow";

//importing fetchData
import fetchData from "../service/backendApi";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    const routineCall = async () => {
      try {
        const response = await fetchData.get("/keep-alive");
        if (response.status === 200)
          console.log("Routine call made at ", response.data.timestamp);
      } catch (err) {
        console.error("Error making routine call: ", err);
      }
    };

    routineCall();

    const interval = setInterval(() => {
      routineCall;
    }, 300000);

    return () => clearInterval(interval);
  }, []);
  return (
    <ErrorBoundary>
      <AuthProvider>
        <FileSystemProvider>
          <Router>
            <div className="min-h-screen flex flex-col bg-gray-900 text-white">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/room/:roomId"
                  element={
                    <ProtectedRoute>
                      <Editor />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/security-testing"
                  element={
                    <ProtectedRoute>
                      <SecurityTesting />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai-workflow"
                  element={
                    <ProtectedRoute>
                      <AIWorkflow />
                    </ProtectedRoute>
                  }
                />
              </Routes>
              <ToastContainer
                position="bottom-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
                toastStyle={{
                  backgroundColor: "#1f2937",
                  color: "#ffffff",
                  border: "1px solid #374151",
                }}
                progressStyle={{
                  background: "#3b82f6",
                }}
              />
            </div>
          </Router>
        </FileSystemProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
