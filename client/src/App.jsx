import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FileSystemProvider } from "./contexts/FileSystemContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";
import SecurityTesting from "./pages/SecurityTesting";

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen flex flex-col bg-gray-900 text-white">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/room/:roomId" element={<Editor />} />
            <Route path="/security-testing" element={<SecurityTesting />} />
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
    </ErrorBoundary>
  );
}

export default App;
