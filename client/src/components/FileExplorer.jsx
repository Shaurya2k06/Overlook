import React, { useState, useRef, useEffect } from "react";
import { useFileSystem } from "../contexts/useFileSystem";
import { Plus, Folder, File } from "lucide-react";

const FileIcon = ({ type, language }) => {
  if (type === "folder") {
    return (
      <svg
        className="w-4 h-4 text-green-400"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      </svg>
    );
  }

  // File type icons based on language
  const iconClass = "w-4 h-4";
  const iconColor = {
    javascript: "text-green-300",
    typescript: "text-green-400",
    python: "text-green-300",
    html: "text-green-400",
    css: "text-green-300",
    scss: "text-green-400",
    sass: "text-green-400",
    json: "text-green-300",
    markdown: "text-green-400/60",
    java: "text-green-400",
    cpp: "text-green-300",
    c: "text-green-300",
    csharp: "text-green-400",
    go: "text-green-300",
    rust: "text-green-400",
    php: "text-green-300",
    ruby: "text-green-400",
    sql: "text-green-300",
    xml: "text-green-400",
    yaml: "text-green-300",
    shell: "text-green-400",
    default: "text-green-400/60",
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

const TreeNode = ({ node, level = 0, parentId = null }) => {
  const { state, actions } = useFileSystem();
  const [isRenaming, setIsRenaming] = useState(false);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newName, setNewName] = useState(node.name);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const inputRef = useRef(null);
  const contextMenuRef = useRef(null);

  const isExpanded = state.expandedFolders.has(node.id);
  const isActive = state.activeTab === node.id;
  const isSelected = state.selectedFolder === node.id;

  useEffect(() => {
    if (
      (isRenaming || isCreatingFile || isCreatingFolder) &&
      inputRef.current
    ) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming, isCreatingFile, isCreatingFolder]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target)
      ) {
        setShowContextMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (node.type === "folder") {
      actions.toggleFolder(node.id);
      actions.setSelectedFolder(node.id);
    } else {
      actions.openFile(node.id);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleRename = () => {
    setIsRenaming(true);
    setNewName(node.name);
    setShowContextMenu(false);
  };

  const handleRenameSubmit = () => {
    if (newName.trim() && newName !== node.name) {
      if (node.type === "folder") {
        actions.renameFolder(node.id, newName.trim());
      } else {
        actions.renameFile(node.id, newName.trim());
      }
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = () => {
    setNewName(node.name);
    setIsRenaming(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (isCreatingFile || isCreatingFolder) {
        handleInlineCreate();
      } else {
        handleRenameSubmit();
      }
    } else if (e.key === "Escape") {
      if (isCreatingFile || isCreatingFolder) {
        handleInlineCancel();
      } else {
        handleRenameCancel();
      }
    }
  };

  const handleDelete = () => {
    // Use a terminal-style confirmation instead of browser alert
    const confirmDelete = confirm(`[SYSTEM] DELETE_CONFIRMATION\nAre you sure you want to delete "${node.name}"?\nThis action cannot be undone.`);
    if (confirmDelete) {
      if (node.type === "folder") {
        actions.deleteFolder(node.id, parentId);
      } else {
        actions.deleteFile(node.id, parentId);
      }
    }
    setShowContextMenu(false);
  };

  const handleCreateFile = () => {
    setIsCreatingFile(true);
    setNewName("");
    setShowContextMenu(false);
  };

  const handleCreateFolder = () => {
    setIsCreatingFolder(true);
    setNewName("");
    setShowContextMenu(false);
  };

  const handleInlineCreate = () => {
    if (newName.trim()) {
      if (isCreatingFile) {
        actions.createFile(node.id, newName.trim());
      } else if (isCreatingFolder) {
        actions.createFolder(node.id, newName.trim());
      }
    }
    setIsCreatingFile(false);
    setIsCreatingFolder(false);
    setNewName(node.name);
  };

  const handleInlineCancel = () => {
    setIsCreatingFile(false);
    setIsCreatingFolder(false);
    setNewName(node.name);
  };

  return (
    <div>
      <div
        className={`flex items-center py-1 px-2 hover:bg-green-400/10 cursor-pointer group ${
          isActive ? "bg-green-400/20 border-l-2 border-green-400" : ""
        } ${
          isSelected && node.type === "folder"
            ? "bg-green-400/10 border-l-2 border-green-400/50"
            : ""
        }`}
        style={{ 
          paddingLeft: `${level * 16 + 8}px`,
          fontFamily: "'Courier New', Consolas, Monaco, monospace"
        }}
        onClick={handleToggle}
        onContextMenu={handleContextMenu}
      >
        {node.type === "folder" && (
          <svg
            className={`w-3 h-3 mr-1 transition-transform text-green-400 ${
              isExpanded ? "rotate-90" : ""
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}

        <FileIcon type={node.type} language={node.language} />

        {isRenaming || isCreatingFile || isCreatingFolder ? (
          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={isRenaming ? handleRenameSubmit : handleInlineCreate}
            onKeyDown={handleKeyDown}
            className="ml-2 bg-black text-green-400 px-1 py-0 text-xs border border-green-400/50 flex-1"
            style={{ fontFamily: "'Courier New', Consolas, Monaco, monospace" }}
            placeholder={
              isCreatingFile
                ? "> file_name"
                : isCreatingFolder
                ? "> folder_name"
                : ""
            }
          />
        ) : (
          <span className="ml-2 text-xs text-green-400/80 select-none">
            {node.name}
          </span>
        )}
      </div>

      {node.type === "folder" && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              parentId={node.id}
            />
          ))}

          {/* Inline file/folder creation inside folders */}
          {(isCreatingFile || isCreatingFolder) && (
            <div
              className="flex items-center py-1 px-2"
              style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
            >
              <FileIcon type={isCreatingFile ? "file" : "folder"} />
              <input
                ref={inputRef}
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleInlineCreate}
                onKeyDown={handleKeyDown}
                className="ml-2 bg-gray-600 text-white px-1 py-0 text-sm border border-blue-500 rounded flex-1"
                placeholder={
                  isCreatingFile ? "Enter file name" : "Enter folder name"
                }
              />
            </div>
          )}
        </div>
      )}

      {showContextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-gray-800 border border-gray-600 rounded shadow-lg py-1 z-50"
          style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
        >
          {node.type === "folder" && (
            <>
              <button
                onClick={handleCreateFile}
                className="w-full px-3 py-1 text-left text-sm text-gray-200 hover:bg-gray-700"
              >
                New File
              </button>
              <button
                onClick={handleCreateFolder}
                className="w-full px-3 py-1 text-left text-sm text-gray-200 hover:bg-gray-700"
              >
                New Folder
              </button>
              <hr className="my-1 border-gray-600" />
            </>
          )}
          <button
            onClick={handleRename}
            className="w-full px-3 py-1 text-left text-sm text-gray-200 hover:bg-gray-700"
          >
            Rename
          </button>
          <button
            onClick={handleDelete}
            className="w-full px-3 py-1 text-left text-sm text-red-400 hover:bg-gray-700"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

const FileExplorer = () => {
  const { state, actions } = useFileSystem();
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newName, setNewName] = useState("");
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const inputRef = useRef(null);
  const contextMenuRef = useRef(null);

  useEffect(() => {
    if ((isCreatingFile || isCreatingFolder) && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreatingFile, isCreatingFolder]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target)
      ) {
        setShowContextMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleCreateFile = () => {
    setIsCreatingFile(true);
    setNewName("");
  };

  const handleCreateFolder = () => {
    setIsCreatingFolder(true);
    setNewName("");
  };

  const handleInlineCreate = () => {
    if (newName.trim()) {
      const parentId = state.selectedFolder || "root";
      if (isCreatingFile) {
        actions.createFile(parentId, newName.trim());
      } else if (isCreatingFolder) {
        actions.createFolder(parentId, newName.trim());
      }
    }
    setIsCreatingFile(false);
    setIsCreatingFolder(false);
    setNewName("");
  };

  const handleInlineCancel = () => {
    setIsCreatingFile(false);
    setIsCreatingFolder(false);
    setNewName("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleInlineCreate();
    } else if (e.key === "Escape") {
      handleInlineCancel();
    }
  };

  return (
    <div className="h-full bg-black flex flex-col text-green-400" style={{ fontFamily: "'Courier New', Consolas, Monaco, monospace" }}>
      {/* File Explorer Header with Controls */}
      <div className="border-b border-green-400/30 p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-green-400">FILE_SYSTEM</h2>
          <div className="flex gap-1">
            <button
              onClick={handleCreateFile}
              className="p-1 hover:bg-green-400/20 border border-green-400/30 text-green-400 hover:text-green-300 transition-colors"
              title="New File"
            >
              <File className="w-3 h-3" />
            </button>
            <button
              onClick={handleCreateFolder}
              className="p-1 hover:bg-green-400/20 border border-green-400/30 text-green-400 hover:text-green-300 transition-colors"
              title="New Folder"
            >
              <Folder className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
      
      <div 
        className="flex-1 overflow-y-auto p-2 relative"
        onContextMenu={handleContextMenu}
      >
        {Object.values(state.files).map((node) => (
          <TreeNode key={node.id} node={node} />
        ))}

        {/* Inline file/folder creation at root level */}
        {(isCreatingFile || isCreatingFolder) && (
          <div
            className="flex items-center py-1 px-2"
            style={{ paddingLeft: "8px" }}
          >
            <FileIcon type={isCreatingFile ? "file" : "folder"} />
            <input
              ref={inputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleInlineCreate}
              onKeyDown={handleKeyDown}
              className="ml-2 bg-black text-green-400 px-1 py-0 text-xs border border-green-400/50 flex-1"
              style={{ fontFamily: "'Courier New', Consolas, Monaco, monospace" }}
              placeholder={
                isCreatingFile ? "> new_file" : "> new_folder"
              }
            />
          </div>
        )}

        {/* Context Menu */}
        {showContextMenu && (
          <div
            ref={contextMenuRef}
            className="fixed bg-black border border-green-400/50 shadow-lg z-50 py-1"
            style={{
              left: contextMenuPos.x,
              top: contextMenuPos.y,
              fontFamily: "'Courier New', Consolas, Monaco, monospace"
            }}
          >
            <button
              onClick={() => {
                handleCreateFile();
                setShowContextMenu(false);
              }}
              className="w-full px-3 py-1 text-left text-xs text-green-400 hover:bg-green-400/20 flex items-center gap-2"
            >
              <File className="w-3 h-3" />
              New File
            </button>
            <button
              onClick={() => {
                handleCreateFolder();
                setShowContextMenu(false);
              }}
              className="w-full px-3 py-1 text-left text-xs text-green-400 hover:bg-green-400/20 flex items-center gap-2"
            >
              <Folder className="w-3 h-3" />
              New Folder
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
