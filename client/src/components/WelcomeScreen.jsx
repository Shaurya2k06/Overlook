import React, { useState } from "react";
import { useFileSystem } from "../contexts/useFileSystem";

const WelcomeScreen = () => {
  const { actions } = useFileSystem();
  const [showFileDialog, setShowFileDialog] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleCreateFile = () => {
    setShowFileDialog(true);
    setInputValue("");
  };

  const handleCreateFolder = () => {
    setShowFolderDialog(true);
    setInputValue("");
  };

  const handleFileDialogSubmit = () => {
    if (inputValue.trim()) {
      actions.createFile("root", inputValue.trim());
      setShowFileDialog(false);
      setInputValue("");
    }
  };

  const handleFolderDialogSubmit = () => {
    if (inputValue.trim()) {
      actions.createFolder("root", inputValue.trim());
      setShowFolderDialog(false);
      setInputValue("");
    }
  };

  const handleDialogCancel = () => {
    setShowFileDialog(false);
    setShowFolderDialog(false);
    setInputValue("");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (showFileDialog) {
        handleFileDialogSubmit();
      } else if (showFolderDialog) {
        handleFolderDialogSubmit();
      }
    } else if (e.key === 'Escape') {
      handleDialogCancel();
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
    <>
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="max-w-2xl mx-auto text-center px-8" style={{ fontFamily: "'Courier New', Consolas, Monaco, monospace" }}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-green-400 mb-4">
              Welcome to Your Workspace
            </h1>
            <p className="text-green-400/60 text-lg">
              Start coding by creating files and folders. Your workspace is ready to use!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-black border border-green-400/30 p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-3">
                Create Files & Folders
              </h3>
              <p className="text-green-400/60 mb-4">
                Use the buttons in the explorer or right-click to create new files and folders.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateFile}
                  className="px-4 py-2 bg-green-400 text-black hover:bg-green-300 transition-colors font-bold"
                >
                  [NEW_FILE]
                </button>
                <button
                  onClick={handleCreateFolder}
                  className="px-4 py-2 bg-green-400/20 text-green-400 border border-green-400/30 hover:bg-green-400/30 transition-colors font-bold"
                >
                  [NEW_FOLDER]
                </button>
              </div>
            </div>

            <div className="bg-black border border-green-400/30 p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-3">
                Quick Start
              </h3>
              <p className="text-green-400/60 mb-4">
                Create common files to get started quickly.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {quickStartFiles.map((file) => (
                  <button
                    key={file.name}
                    onClick={() => createQuickStartFile(file)}
                    className="px-3 py-2 bg-green-400/10 text-green-400 border border-green-400/20 hover:bg-green-400/20 transition-colors text-sm font-mono"
                  >
                    {file.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="text-green-400/40 text-sm">
            <p>
              [TIP] Files are automatically saved as you type. Use tabs to work with multiple files.
            </p>
          </div>
        </div>
      </div>

      {/* Terminal-style File Creation Dialog */}
      {showFileDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-black border border-green-400 p-6 min-w-96" style={{ fontFamily: "'Courier New', Consolas, Monaco, monospace" }}>
            <div className="text-green-400 mb-4">
              <div className="text-sm mb-2">[SYSTEM] CREATE_NEW_FILE</div>
              <div className="text-green-400/60 text-xs">Enter file name (e.g., script.js, style.css, index.html):</div>
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="filename.ext"
              className="w-full bg-black border border-green-400/50 text-green-400 px-3 py-2 focus:outline-none focus:border-green-400 placeholder-green-400/40"
              style={{ fontFamily: "'Courier New', Consolas, Monaco, monospace" }}
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleFileDialogSubmit}
                className="px-4 py-2 bg-green-400 text-black hover:bg-green-300 transition-colors font-bold"
              >
                [CREATE]
              </button>
              <button
                onClick={handleDialogCancel}
                className="px-4 py-2 bg-red-400/20 text-red-400 border border-red-400/30 hover:bg-red-400/30 transition-colors font-bold"
              >
                [CANCEL]
              </button>
            </div>
            <div className="text-green-400/40 text-xs mt-2">
              Press Enter to create • Press Escape to cancel
            </div>
          </div>
        </div>
      )}

      {/* Terminal-style Folder Creation Dialog */}
      {showFolderDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-black border border-green-400 p-6 min-w-96" style={{ fontFamily: "'Courier New', Consolas, Monaco, monospace" }}>
            <div className="text-green-400 mb-4">
              <div className="text-sm mb-2">[SYSTEM] CREATE_NEW_FOLDER</div>
              <div className="text-green-400/60 text-xs">Enter folder name:</div>
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="folder_name"
              className="w-full bg-black border border-green-400/50 text-green-400 px-3 py-2 focus:outline-none focus:border-green-400 placeholder-green-400/40"
              style={{ fontFamily: "'Courier New', Consolas, Monaco, monospace" }}
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleFolderDialogSubmit}
                className="px-4 py-2 bg-green-400 text-black hover:bg-green-300 transition-colors font-bold"
              >
                [CREATE]
              </button>
              <button
                onClick={handleDialogCancel}
                className="px-4 py-2 bg-red-400/20 text-red-400 border border-red-400/30 hover:bg-red-400/30 transition-colors font-bold"
              >
                [CANCEL]
              </button>
            </div>
            <div className="text-green-400/40 text-xs mt-2">
              Press Enter to create • Press Escape to cancel
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WelcomeScreen;
