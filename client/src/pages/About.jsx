import { Link } from "react-router-dom";

function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="max-w-4xl mx-auto px-8">
        <header className="text-center py-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent">
            About Overlook
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            A modern collaborative code editor built for the future of
            programming
          </p>
        </header>

        <div className="space-y-12">
          <section className="bg-gray-800 p-8 rounded-2xl border border-gray-700">
            <h2 className="text-blue-500 text-3xl mb-6 font-semibold">
              What is Overlook?
            </h2>
            <p className="text-gray-300 leading-relaxed">
              Overlook is a real-time collaborative code editor that brings
              developers together to build amazing projects. With AI-powered
              code generation and seamless real-time synchronization, it's
              designed to enhance productivity and foster collaboration.
            </p>
          </section>

          <section className="bg-gray-800 p-8 rounded-2xl border border-gray-700">
            <h2 className="text-blue-500 text-3xl mb-6 font-semibold">
              Key Features
            </h2>
            <ul className="space-y-4">
              <li className="pb-4 border-b border-gray-700 text-gray-300">
                <strong className="text-emerald-500">
                  Real-time Collaboration:
                </strong>{" "}
                See changes from other participants instantly
              </li>
              <li className="pb-4 border-b border-gray-700 text-gray-300">
                <strong className="text-emerald-500">AI Code Assistant:</strong>{" "}
                Generate code using natural language prompts
              </li>
              <li className="pb-4 border-b border-gray-700 text-gray-300">
                <strong className="text-emerald-500">Monaco Editor:</strong>{" "}
                Professional code editor with syntax highlighting
              </li>
              <li className="pb-4 border-b border-gray-700 text-gray-300">
                <strong className="text-emerald-500">
                  Multi-language Support:
                </strong>{" "}
                JavaScript, TypeScript, Python, Java, C++, and more
              </li>
              <li className="pb-4 border-b border-gray-700 text-gray-300">
                <strong className="text-emerald-500">Room-based System:</strong>{" "}
                Create or join rooms with up to 3 participants
              </li>
              <li className="text-gray-300">
                <strong className="text-emerald-500">
                  WebSocket Technology:
                </strong>{" "}
                Low-latency real-time communication
              </li>
            </ul>
          </section>

          <section className="bg-gray-800 p-8 rounded-2xl border border-gray-700">
            <h2 className="text-blue-500 text-3xl mb-6 font-semibold">
              How It Works
            </h2>
            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-white text-xl mb-2 font-semibold">
                    Create or Join a Room
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    Start a new collaborative session or join an existing one
                    with a room ID.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-white text-xl mb-2 font-semibold">
                    Collaborate in Real-time
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    Write code together with instant synchronization across all
                    participants.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-white text-xl mb-2 font-semibold">
                    Use AI Assistant
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    Generate code using natural language prompts and see results
                    instantly.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-gray-800 p-8 rounded-2xl border border-gray-700">
            <h2 className="text-blue-500 text-3xl mb-6 font-semibold">
              Technology Stack
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-900 p-6 rounded-xl border border-gray-600">
                <h3 className="text-emerald-500 text-xl mb-4 font-semibold">
                  Frontend
                </h3>
                <ul className="space-y-2">
                  <li className="text-gray-300 pb-2 border-b border-gray-700">
                    React 19
                  </li>
                  <li className="text-gray-300 pb-2 border-b border-gray-700">
                    React Router DOM
                  </li>
                  <li className="text-gray-300 pb-2 border-b border-gray-700">
                    Monaco Editor
                  </li>
                  <li className="text-gray-300 pb-2 border-b border-gray-700">
                    Socket.IO Client
                  </li>
                  <li className="text-gray-300">Axios</li>
                </ul>
              </div>
              <div className="bg-gray-900 p-6 rounded-xl border border-gray-600">
                <h3 className="text-emerald-500 text-xl mb-4 font-semibold">
                  Backend
                </h3>
                <ul className="space-y-2">
                  <li className="text-gray-300 pb-2 border-b border-gray-700">
                    Node.js
                  </li>
                  <li className="text-gray-300 pb-2 border-b border-gray-700">
                    Express.js
                  </li>
                  <li className="text-gray-300 pb-2 border-b border-gray-700">
                    Socket.IO
                  </li>
                  <li className="text-gray-300 pb-2 border-b border-gray-700">
                    MongoDB
                  </li>
                  <li className="text-gray-300">JWT Authentication</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        <div className="text-center mt-12 py-8">
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/dashboard"
              className="px-8 py-4 bg-blue-600 text-white rounded-xl text-lg font-semibold transition-all duration-300 border-2 border-transparent hover:bg-blue-700 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/30"
            >
              Start Coding Now
            </Link>
            <Link
              to="/"
              className="px-8 py-4 bg-transparent text-white rounded-xl text-lg font-semibold transition-all duration-300 border-2 border-gray-600 hover:bg-gray-600 hover:-translate-y-1"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
