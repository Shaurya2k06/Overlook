import React from "react";
import { useFileSystem } from "../contexts/useFileSystem";

const WelcomeScreen = () => {
  const { actions } = useFileSystem();

  const handleCreateFile = () => {
    const fileName = prompt(
      "Enter file name (e.g., script.js, style.css, index.html):"
    );
    if (fileName) {
      actions.createFile("root", fileName);
    }
  };

  const handleCreateFolder = () => {
    const folderName = prompt("Enter folder name:");
    if (folderName) {
      actions.createFolder("root", folderName);
    }
  };

  const quickStartFiles = [
    {
      name: "index.html",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My App</title>
</head>
<body>
    <h1>Hello, World!</h1>
    <script src="script.js"></script>
</body>
</html>`,
    },
    {
      name: "script.js",
      content: `// Welcome to your workspace!
console.log("Hello from your new file!");

// Try creating more files and folders
// Use the explorer on the left to manage your project`,
    },
    {
      name: "style.css",
      content: `/* Your stylesheet */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

h1 {
    color: #333;
    text-align: center;
}`,
    },
    {
      name: "package.json",
      content: `{
  "name": "my-project",
  "version": "1.0.0",
  "description": "My awesome project",
  "main": "script.js",
  "scripts": {
    "start": "node script.js"
  },
  "dependencies": {}
}`,
    },
  ];

  const createQuickStartFile = (file) => {
    const extension = file.name.split(".").pop();
    let language = "javascript";

    switch (extension) {
      case "html":
        language = "html";
        break;
      case "css":
        language = "css";
        break;
      case "json":
        language = "json";
        break;
      default:
        language = "javascript";
    }

    actions.createFile("root", file.name, file.content, language);
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-900">
      <div className="max-w-2xl mx-auto text-center px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Welcome to Your Workspace
          </h1>
          <p className="text-gray-400 text-lg">
            Start coding by creating files and folders. Your workspace is ready
            to use!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3">
              Create Files & Folders
            </h3>
            <p className="text-gray-400 mb-4">
              Use the buttons in the explorer or right-click to create new files
              and folders.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCreateFile}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                New File
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                New Folder
              </button>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3">
              Quick Start
            </h3>
            <p className="text-gray-400 mb-4">
              Create common files to get started quickly.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickStartFiles.map((file) => (
                <button
                  key={file.name}
                  onClick={() => createQuickStartFile(file)}
                  className="px-3 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors text-sm"
                >
                  {file.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-gray-500 text-sm">
          <p>
            💡 Tip: Files are automatically saved as you type. Use tabs to work
            with multiple files.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
