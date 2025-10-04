import React from "react";
import { useFileSystem } from "../contexts/useFileSystem";

const TabSystem = () => {
  const { state, actions } = useFileSystem();

  const handleTabClick = (tabId) => {
    actions.setActiveTab(tabId);
  };

  const handleTabClose = (e, tabId) => {
    e.stopPropagation();
    actions.closeFile(tabId);
  };

  const getFileIcon = (language) => {
    const iconClass = "w-4 h-4";
    const iconColor = {
      javascript: "text-yellow-400",
      typescript: "text-blue-400",
      python: "text-green-400",
      html: "text-orange-400",
      css: "text-blue-300",
      scss: "text-pink-400",
      sass: "text-pink-400",
      json: "text-yellow-300",
      markdown: "text-gray-400",
      java: "text-red-400",
      cpp: "text-blue-500",
      c: "text-blue-500",
      csharp: "text-purple-400",
      go: "text-cyan-400",
      rust: "text-orange-600",
      php: "text-purple-500",
      ruby: "text-red-500",
      sql: "text-blue-400",
      xml: "text-orange-500",
      yaml: "text-red-300",
      shell: "text-green-300",
      default: "text-gray-400",
    };

    const color = iconColor[language] || iconColor.default;

    return (
      <svg
        className={`${iconClass} ${color}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  if (state.openTabs.length === 0) {
    return (
      <div className="bg-black border-b border-green-400/30 px-4 py-2" style={{ fontFamily: "'Courier New', Consolas, Monaco, monospace" }}>
        <div className="text-green-400/60 text-sm">NO_FILES_OPEN</div>
      </div>
    );
  }

  return (
    <div className="bg-black border-b border-green-400/30" style={{ fontFamily: "'Courier New', Consolas, Monaco, monospace" }}>
      <div className="flex overflow-x-auto">
        {state.openTabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center px-3 py-2 border-r border-green-400/30 cursor-pointer group min-w-0 ${
              state.activeTab === tab.id
                ? "bg-green-400/10 text-green-400 border-b-2 border-green-400"
                : "bg-black text-green-400/70 hover:bg-green-400/5"
            }`}
            onClick={() => handleTabClick(tab.id)}
          >
            <div className="flex items-center min-w-0 flex-1">
              {getFileIcon(tab.language)}
              <span className="ml-2 text-xs truncate max-w-32">{tab.name}</span>
              {tab.hasUnsavedChanges && (
                <div className="w-2 h-2 bg-orange-400 rounded-full ml-2 flex-shrink-0 animate-pulse"></div>
              )}
            </div>

            <button
              onClick={(e) => handleTabClose(e, tab.id)}
              className="ml-2 opacity-0 group-hover:opacity-100 hover:bg-green-400/20 rounded p-1 transition-opacity text-red-400"
              title="Close tab"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabSystem;
