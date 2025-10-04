import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="max-w-6xl mx-auto px-8">
        <div className="text-center py-16">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent">
            Welcome to Overlook
          </h1>
          <p className="text-2xl text-gray-300 mb-6 font-medium">
            Real-time Collaborative Code Editor with AI Assistant
          </p>
          <p className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Create rooms, invite collaborators, and build amazing projects
            together. Use AI to generate code and collaborate in real-time.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/dashboard"
              className="px-8 py-4 bg-blue-600 text-white rounded-xl text-lg font-semibold transition-all duration-300 border-2 border-transparent hover:bg-blue-700 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/30"
            >
              Start Coding
            </Link>
            <Link
              to="/about"
              className="px-8 py-4 bg-transparent text-white rounded-xl text-lg font-semibold transition-all duration-300 border-2 border-gray-600 hover:bg-gray-600 hover:-translate-y-1"
            >
              Learn More
            </Link>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-400 mb-4">
              Or share a room URL with friends for instant collaboration:
            </p>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 max-w-md mx-auto">
              <p className="text-sm text-gray-300 mb-2">Room URL format:</p>
              <code className="text-emerald-400 text-sm bg-gray-900 px-2 py-1 rounded">
                yourdomain.com/room/ROOM_ID
              </code>
            </div>
          </div>
        </div>

        <div className="mt-24">
          <h2 className="text-4xl text-center mb-12 text-white font-bold">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/30">
              <h3 className="text-blue-500 text-xl mb-4 font-semibold">
                Real-time Collaboration
              </h3>
              <p className="text-gray-300 leading-relaxed">
                See code changes from other participants instantly with
                WebSocket technology.
              </p>
            </div>
            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/30">
              <h3 className="text-blue-500 text-xl mb-4 font-semibold">
                AI Code Generation
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Generate code using natural language prompts with our AI
                assistant.
              </p>
            </div>
            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/30">
              <h3 className="text-blue-500 text-xl mb-4 font-semibold">
                Multi-language Support
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Support for JavaScript, TypeScript, Python, Java, C++, and more.
              </p>
            </div>
            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/30">
              <h3 className="text-blue-500 text-xl mb-4 font-semibold">
                Room-based System
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Create or join rooms with up to 3 participants for focused
                collaboration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
