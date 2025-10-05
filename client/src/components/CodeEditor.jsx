import React, { useState, useEffect, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useFileSystem } from '../contexts/useFileSystem';

const CodeEditor = () => {
  const { state, actions, socket, user } = useFileSystem();
  const editorRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Get current file content and language
  const currentFile = state.activeTab
    ? actions.getActiveFileContent()
    : {
        content: "// No file selected\n// Open a file from the explorer to start coding",
        language: "javascript",
        filename: "welcome.js"
      };

  const handleEditorChange = (value) => {
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
  };

  if (!currentFile) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-green-400/60">
          <div className="text-2xl mb-4">OVERLOOK_IDE</div>
          <div className="text-sm">Select a file to start editing</div>
          <div className="text-xs mt-2">Or use the AI assistant to generate code</div>
        </div>
      </div>
    );
  }

  return (
    <MonacoEditor
      height="100%"
      language={currentFile.language}
      value={currentFile.content}
      onChange={handleEditorChange}
      theme="vs-dark"
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: 'on',
        fontFamily: "'Courier New', Consolas, Monaco, monospace"
      }}
    />
  );
};

export default CodeEditor;
