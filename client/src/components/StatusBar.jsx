import React from "react";
import { useFileSystem } from "../contexts/useFileSystem";

const StatusBar = () => {
  const { state } = useFileSystem();

  const getActiveFileInfo = () => {
    if (!state.activeTab) {
      return { name: "No file selected", language: "", lineCount: 0 };
    }

    const activeTab = state.openTabs.find((tab) => tab.id === state.activeTab);
    if (!activeTab) {
      return { name: "No file selected", language: "", lineCount: 0 };
    }

    const lineCount = activeTab.content
      ? activeTab.content.split("\n").length
      : 0;

    return {
      name: activeTab.name,
      language: activeTab.language,
      lineCount,
      hasUnsavedChanges: activeTab.hasUnsavedChanges,
    };
  };

  const fileInfo = getActiveFileInfo();

  return (
    <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-sm text-gray-300">
      <div className="flex items-center gap-4">
        <span className="text-gray-400">
          {fileInfo.name}
          {fileInfo.hasUnsavedChanges && (
            <span className="text-orange-400 ml-1">●</span>
          )}
        </span>
        {fileInfo.language && (
          <span className="text-gray-400">
            {fileInfo.language.toUpperCase()}
          </span>
        )}
        <span className="text-gray-400">{fileInfo.lineCount} lines</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-gray-400">
          {state.openTabs.length} file{state.openTabs.length !== 1 ? "s" : ""}{" "}
          open
        </span>
      </div>
    </div>
  );
};

export default StatusBar;
