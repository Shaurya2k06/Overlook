import { useState, useRef } from "react";
import Editor from "@monaco-editor/react";

const CodeEditor = ({ code, language, onChange, onLanguageChange }) => {
  const editorRef = useRef(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

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

  const handleEditorChange = (value) => {
    if (onChange && value !== undefined) {
      onChange(value);
    }
  };

  const languageOptions = [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "csharp", label: "C#" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "json", label: "JSON" },
    { value: "markdown", label: "Markdown" },
  ];

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
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
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
          language={language}
          value={code}
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
