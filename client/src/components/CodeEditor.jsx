import { useState, useRef, useCallback, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useFileSystem } from "../contexts/useFileSystem";
import WelcomeScreen from "./WelcomeScreen";

const CodeEditor = ({ onLanguageChange }) => {
  const { state, actions, socket, user } = useFileSystem();
  const editorRef = useRef(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    setIsEditorReady(true);

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: "on",
      lineNumbers: "on",
      folding: true,
      bracketPairColorization: { enabled: true },
    });
  };

  // Get current file content and language
  const currentFile = state.activeTab
    ? actions.getActiveFileContent()
    : {
        content:
          "// No file selected\n// Open a file from the explorer to start coding",
        language: "javascript",
      };

  const handleEditorChange = useCallback(
    (value) => {
      if (value !== undefined && state.activeTab) {
        // Use the sync function to update content and share with other users
        actions.updateFileContentWithSync(
          state.activeTab,
          value,
          currentFile.language
        );

        // Handle typing indicator
        if (socket && user) {
          // Emit typing event
          socket.emit("user-typing", { username: user.username });

          // Clear existing timeout
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }

          // Set timeout to stop typing indicator
          typingTimeoutRef.current = setTimeout(() => {
            socket.emit("user-stopped-typing", { username: user.username });
          }, 1000);
        }
      }
    },
    [state.activeTab, actions, socket, user, currentFile.language]
  );

  const languageOptions = [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "c", label: "C" },
    { value: "csharp", label: "C#" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" },
    { value: "php", label: "PHP" },
    { value: "ruby", label: "Ruby" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "scss", label: "SCSS" },
    { value: "sass", label: "Sass" },
    { value: "json", label: "JSON" },
    { value: "markdown", label: "Markdown" },
    { value: "sql", label: "SQL" },
    { value: "xml", label: "XML" },
    { value: "yaml", label: "YAML" },
    { value: "shell", label: "Shell" },
  ];

  // Show welcome screen if no file is selected
  if (!state.activeTab) {
    return <WelcomeScreen />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <label
            htmlFor="language-select"
            className="text-gray-400 text-sm font-medium"
          >
            Language:
          </label>
          <select
            id="language-select"
            value={currentFile.language}
            onChange={(e) => {
              if (state.activeTab) {
                actions.updateFileContentWithSync(
                  state.activeTab,
                  currentFile.content,
                  e.target.value
                );
              }
              if (onLanguageChange) {
                onLanguageChange(e.target.value);
              }
            }}
            className="px-2 py-1 bg-gray-800 text-white border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
          >
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="text-gray-400 text-sm">
          {isEditorReady && <span>Ready</span>}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={currentFile.language}
          value={currentFile.content}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            selectOnLineNumbers: true,
            roundedSelection: false,
            readOnly: false,
            cursorStyle: "line",
            automaticLayout: true,
            mouseWheelZoom: true,
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
