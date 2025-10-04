import React, { useReducer, useCallback, useEffect } from "react";
import { ActionTypes } from "./FileSystemTypes";
import { FileSystemContext } from "./FileSystemContextInstance";

// File system data structure - starts empty with just main.js
const initialState = {
  files: {
    root: {
      id: "root",
      name: "Workspace",
      type: "folder",
      children: [
        {
          id: "main.js",
          name: "main.js",
          type: "file",
          content: "",
          language: "javascript",
        },
      ],
    },
  },
  openTabs: [],
  activeTab: null,
  expandedFolders: new Set(["root"]),
  selectedFolder: null, // For targeted file creation
};

// Utility functions
const generateId = () =>
  `file_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

// Language detection based on file extension
const getLanguageFromExtension = (filename) => {
  const extension = filename.split(".").pop()?.toLowerCase();
  const languageMap = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    html: "html",
    htm: "html",
    css: "css",
    scss: "scss",
    sass: "sass",
    json: "json",
    md: "markdown",
    java: "java",
    cpp: "cpp",
    c: "c",
    cs: "csharp",
    go: "go",
    rs: "rust",
    php: "php",
    rb: "ruby",
    sql: "sql",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    sh: "shell",
    bash: "shell",
    zsh: "shell",
  };
  return languageMap[extension] || "javascript";
};

const findNode = (files, targetId, currentPath = []) => {
  // First check the root node and its children
  if (files.root) {
    if (files.root.id === targetId) {
      return { node: files.root, path: [...currentPath, "root"] };
    }
    if (files.root.type === "folder" && files.root.children) {
      for (const child of files.root.children) {
        const result = findNode({ [child.id]: child }, targetId, [
          ...currentPath,
          "root",
        ]);
        if (result) return result;
      }
    }
  }

  // Then check any standalone folders
  for (const [id, node] of Object.entries(files)) {
    if (id === "root") continue; // Already checked above

    if (id === targetId) {
      return { node, path: [...currentPath, id] };
    }
    if (node.type === "folder" && node.children) {
      for (const child of node.children) {
        const result = findNode({ [child.id]: child }, targetId, [
          ...currentPath,
          id,
        ]);
        if (result) return result;
      }
    }
  }
  return null;
};

const updateNodeInTree = (files, targetId, updateFn) => {
  const newFiles = { ...files };

  const updateRecursive = (node) => {
    if (node.id === targetId) {
      return updateFn(node);
    }
    if (node.type === "folder" && node.children) {
      return {
        ...node,
        children: node.children.map(updateRecursive),
      };
    }
    return node;
  };

  // Update the root node and all its children recursively
  if (newFiles.root) {
    newFiles.root = updateRecursive(newFiles.root);
  }

  // Also update any standalone folders that might exist
  for (const [id, node] of Object.entries(newFiles)) {
    if (id !== "root" && node.type === "folder") {
      newFiles[id] = updateRecursive(node);
    }
  }

  return newFiles;
};

// Reducer
const fileSystemReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.CREATE_FILE: {
      const {
        parentId,
        name,
        content = "",
        language,
        autoOpen = true,
      } = action.payload;
      const detectedLanguage = language || getLanguageFromExtension(name);
      const newFile = {
        id: generateId(),
        name,
        type: "file",
        content,
        language: detectedLanguage,
      };

      const newFiles = updateNodeInTree(state.files, parentId, (parent) => ({
        ...parent,
        children: [...(parent.children || []), newFile],
      }));

      let newOpenTabs = state.openTabs;
      let newActiveTab = state.activeTab;

      // Auto-open file for the creator if requested
      if (autoOpen) {
        const existingTabIndex = state.openTabs.findIndex(
          (tab) => tab.id === newFile.id
        );
        if (existingTabIndex >= 0) {
          newOpenTabs = [...state.openTabs];
        } else {
          newOpenTabs = [
            ...state.openTabs,
            {
              id: newFile.id,
              name: newFile.name,
              content: newFile.content,
              language: newFile.language,
              hasUnsavedChanges: false,
            },
          ];
        }
        newActiveTab = newFile.id;
      }

      return {
        ...state,
        files: newFiles,
        openTabs: newOpenTabs,
        activeTab: newActiveTab,
      };
    }

    case ActionTypes.CREATE_FOLDER: {
      const { parentId, name } = action.payload;
      const newFolder = {
        id: generateId(),
        name,
        type: "folder",
        children: [],
      };

      const newFiles = updateNodeInTree(state.files, parentId, (parent) => ({
        ...parent,
        children: [...(parent.children || []), newFolder],
      }));

      return {
        ...state,
        files: newFiles,
      };
    }

    case ActionTypes.DELETE_FILE:
    case ActionTypes.DELETE_FOLDER: {
      const { fileId, parentId } = action.payload;

      const newFiles = updateNodeInTree(state.files, parentId, (parent) => ({
        ...parent,
        children: (parent.children || []).filter(
          (child) => child.id !== fileId
        ),
      }));

      const newOpenTabs = state.openTabs.filter((tab) => tab.id !== fileId);
      const newActiveTab =
        state.activeTab === fileId
          ? newOpenTabs.length > 0
            ? newOpenTabs[0].id
            : null
          : state.activeTab;

      return {
        ...state,
        files: newFiles,
        openTabs: newOpenTabs,
        activeTab: newActiveTab,
      };
    }

    case ActionTypes.RENAME_FILE:
    case ActionTypes.RENAME_FOLDER: {
      const { fileId, newName } = action.payload;

      const newFiles = updateNodeInTree(state.files, fileId, (node) => ({
        ...node,
        name: newName,
      }));

      const newOpenTabs = state.openTabs.map((tab) =>
        tab.id === fileId ? { ...tab, name: newName } : tab
      );

      return {
        ...state,
        files: newFiles,
        openTabs: newOpenTabs,
      };
    }

    case ActionTypes.UPDATE_FILE_CONTENT: {
      const { fileId, content, language } = action.payload;

      const newFiles = updateNodeInTree(state.files, fileId, (node) => ({
        ...node,
        content,
        // Only update language if it's provided, otherwise preserve existing
        ...(language && { language }),
      }));

      const newOpenTabs = state.openTabs.map((tab) =>
        tab.id === fileId
          ? {
              ...tab,
              content,
              hasUnsavedChanges: true,
              // Only update language if provided, otherwise preserve existing
              ...(language && { language }),
            }
          : tab
      );

      return {
        ...state,
        files: newFiles,
        openTabs: newOpenTabs,
      };
    }

    case ActionTypes.OPEN_FILE: {
      const { fileId } = action.payload;
      const result = findNode(state.files, fileId);

      if (!result) return state;

      const { node } = result;
      const existingTabIndex = state.openTabs.findIndex(
        (tab) => tab.id === fileId
      );

      let newOpenTabs;
      if (existingTabIndex >= 0) {
        newOpenTabs = [...state.openTabs];
      } else {
        newOpenTabs = [
          ...state.openTabs,
          {
            id: node.id,
            name: node.name,
            content: node.content,
            language: node.language,
            hasUnsavedChanges: false,
          },
        ];
      }

      return {
        ...state,
        openTabs: newOpenTabs,
        activeTab: fileId,
      };
    }

    case ActionTypes.CLOSE_FILE: {
      const { fileId } = action.payload;
      const newOpenTabs = state.openTabs.filter((tab) => tab.id !== fileId);
      const newActiveTab =
        state.activeTab === fileId
          ? newOpenTabs.length > 0
            ? newOpenTabs[newOpenTabs.length - 1].id
            : null
          : state.activeTab;

      return {
        ...state,
        openTabs: newOpenTabs,
        activeTab: newActiveTab,
      };
    }

    case ActionTypes.SET_ACTIVE_TAB: {
      return {
        ...state,
        activeTab: action.payload.tabId,
      };
    }

    case ActionTypes.TOGGLE_FOLDER: {
      const { folderId } = action.payload;
      const newExpandedFolders = new Set(state.expandedFolders);

      if (newExpandedFolders.has(folderId)) {
        newExpandedFolders.delete(folderId);
      } else {
        newExpandedFolders.add(folderId);
      }

      return {
        ...state,
        expandedFolders: newExpandedFolders,
      };
    }

    case ActionTypes.SET_EXPANDED_FOLDERS: {
      return {
        ...state,
        expandedFolders: new Set(action.payload.folderIds),
      };
    }

    case ActionTypes.SET_SELECTED_FOLDER: {
      return {
        ...state,
        selectedFolder: action.payload.folderId,
      };
    }

    case ActionTypes.SYNC_FILE_CREATED: {
      const { fileData, autoOpen = false } = action.payload;

      // Check if file already exists to avoid duplicates
      const existingFile = findNode(state.files, fileData.id);
      if (existingFile) {
        return state; // File already exists, don't add again
      }

      // Ensure parentId is set correctly
      const parentId = fileData.parentId || "root";

      const newFiles = updateNodeInTree(state.files, parentId, (parent) => ({
        ...parent,
        children: [...(parent.children || []), fileData],
      }));

      let newOpenTabs = state.openTabs;
      let newActiveTab = state.activeTab;

      // Auto-open file for the creator only
      if (autoOpen) {
        const existingTabIndex = state.openTabs.findIndex(
          (tab) => tab.id === fileData.id
        );
        if (existingTabIndex >= 0) {
          newOpenTabs = [...state.openTabs];
        } else {
          newOpenTabs = [
            ...state.openTabs,
            {
              id: fileData.id,
              name: fileData.name,
              content: fileData.content,
              language: fileData.language,
              hasUnsavedChanges: false,
            },
          ];
        }
        newActiveTab = fileData.id;
      }

      return {
        ...state,
        files: newFiles,
        openTabs: newOpenTabs,
        activeTab: newActiveTab,
      };
    }

    case ActionTypes.SYNC_FOLDER_CREATED: {
      const { folderData } = action.payload;

      // Check if folder already exists to avoid duplicates
      const existingFolder = findNode(state.files, folderData.id);
      if (existingFolder) {
        return state; // Folder already exists, don't add again
      }

      // Ensure parentId is set correctly
      const parentId = folderData.parentId || "root";

      const newFiles = updateNodeInTree(state.files, parentId, (parent) => ({
        ...parent,
        children: [...(parent.children || []), folderData],
      }));

      return {
        ...state,
        files: newFiles,
      };
    }

    case ActionTypes.SYNC_FILE_DELETED:
    case ActionTypes.SYNC_FOLDER_DELETED: {
      const { fileId, parentId } = action.payload;

      const newFiles = updateNodeInTree(state.files, parentId, (parent) => ({
        ...parent,
        children: (parent.children || []).filter(
          (child) => child.id !== fileId
        ),
      }));

      const newOpenTabs = state.openTabs.filter((tab) => tab.id !== fileId);
      const newActiveTab =
        state.activeTab === fileId
          ? newOpenTabs.length > 0
            ? newOpenTabs[0].id
            : null
          : state.activeTab;

      return {
        ...state,
        files: newFiles,
        openTabs: newOpenTabs,
        activeTab: newActiveTab,
      };
    }

    case ActionTypes.SYNC_FILE_RENAMED:
    case ActionTypes.SYNC_FOLDER_RENAMED: {
      const { fileId, newName } = action.payload;

      const newFiles = updateNodeInTree(state.files, fileId, (node) => ({
        ...node,
        name: newName,
      }));

      const newOpenTabs = state.openTabs.map((tab) =>
        tab.id === fileId ? { ...tab, name: newName } : tab
      );

      return {
        ...state,
        files: newFiles,
        openTabs: newOpenTabs,
      };
    }

    case ActionTypes.SYNC_FILE_CONTENT_UPDATED: {
      const { fileId, content, language } = action.payload;

      const newFiles = updateNodeInTree(state.files, fileId, (node) => ({
        ...node,
        content,
        // Only update language if it's provided, otherwise preserve existing
        ...(language && { language }),
      }));

      const newOpenTabs = state.openTabs.map((tab) =>
        tab.id === fileId
          ? {
              ...tab,
              content,
              hasUnsavedChanges: false, // Mark as synced, not unsaved
              // Only update language if provided, otherwise preserve existing
              ...(language && { language }),
            }
          : tab
      );

      return {
        ...state,
        files: newFiles,
        openTabs: newOpenTabs,
      };
    }

    case ActionTypes.SYNC_ROOM_DATA: {
      const { files, folders } = action.payload;

      // Rebuild the file system from room data
      let newFiles = { ...initialState.files };

      // First, create all folders with empty children arrays
      if (folders && folders.length > 0) {
        folders.forEach((folder) => {
          newFiles[folder.id] = {
            ...folder,
            children: [],
          };
        });
      }

      // Then, add folders to their respective parent folders (folders first to establish hierarchy)
      if (folders && folders.length > 0) {
        folders.forEach((folder) => {
          const parentId = folder.parentId || "root";

          if (parentId === "root") {
            // Add to root folder
            if (newFiles.root && newFiles.root.children) {
              newFiles.root.children.push(newFiles[folder.id]);
            }
          } else {
            // Add to specific parent folder
            if (newFiles[parentId] && newFiles[parentId].children) {
              newFiles[parentId].children.push(newFiles[folder.id]);
            }
          }
        });
      }

      // Finally, add files to their respective parent folders
      if (files && files.length > 0) {
        files.forEach((file) => {
          const parentId = file.parentId || "root";

          if (parentId === "root") {
            // Add to root folder
            if (newFiles.root && newFiles.root.children) {
              newFiles.root.children.push(file);
            }
          } else {
            // Add to specific parent folder
            if (newFiles[parentId] && newFiles[parentId].children) {
              newFiles[parentId].children.push(file);
            }
          }
        });
      }

      return {
        ...state,
        files: newFiles,
      };
    }

    default:
      return state;
  }
};

// Provider
export const FileSystemProvider = ({
  children,
  socket = null,
  user = null,
}) => {
  const [state, dispatch] = useReducer(fileSystemReducer, initialState);

  // Auto-open main.js file on workspace load
  useEffect(() => {
    if (state.files.root.children.length > 0) {
      const mainJs = state.files.root.children.find(
        (child) => child.id === "main.js"
      );
      if (mainJs && state.openTabs.length === 0) {
        dispatch({
          type: ActionTypes.OPEN_FILE,
          payload: { fileId: "main.js" },
        });
      }
    }
  }, [state.files.root.children, state.openTabs.length]);

  // WebSocket event listeners for file system synchronization
  useEffect(() => {
    if (!socket) return;

    const handleFileCreated = (data) => {
      console.log("File created event received:", data);
      // Only sync if the file was created by another user
      if (data.createdByUserId !== user?.id) {
        console.log(
          "Syncing file created by another user:",
          data.fileData.name
        );
        dispatch({
          type: ActionTypes.SYNC_FILE_CREATED,
          payload: { fileData: data.fileData, autoOpen: false }, // Never auto-open for other users
        });
      }
    };

    const handleFolderCreated = (data) => {
      console.log("Folder created event received:", data);
      // Only sync if the folder was created by another user
      if (data.createdByUserId !== user?.id) {
        console.log(
          "Syncing folder created by another user:",
          data.folderData.name
        );
        dispatch({
          type: ActionTypes.SYNC_FOLDER_CREATED,
          payload: { folderData: data.folderData },
        });
      }
    };

    const handleFileDeleted = (data) => {
      dispatch({
        type: ActionTypes.SYNC_FILE_DELETED,
        payload: { fileId: data.fileId, parentId: data.parentId },
      });
    };

    const handleFolderDeleted = (data) => {
      dispatch({
        type: ActionTypes.SYNC_FOLDER_DELETED,
        payload: { fileId: data.folderId, parentId: data.parentId },
      });
    };

    const handleFileRenamed = (data) => {
      dispatch({
        type: ActionTypes.SYNC_FILE_RENAMED,
        payload: { fileId: data.fileId, newName: data.newName },
      });
    };

    const handleFolderRenamed = (data) => {
      dispatch({
        type: ActionTypes.SYNC_FOLDER_RENAMED,
        payload: { fileId: data.folderId, newName: data.newName },
      });
    };

    const handleFileContentUpdated = (data) => {
      console.log("File content updated event received:", data);
      // Only update if the content change is from another user
      if (data.updatedByUserId !== user?.id) {
        console.log(
          "Syncing content update from another user for file:",
          data.fileId
        );
        dispatch({
          type: ActionTypes.SYNC_FILE_CONTENT_UPDATED,
          payload: {
            fileId: data.fileId,
            content: data.content,
            language: data.language,
          },
        });
      }
    };

    socket.on("file-created", handleFileCreated);
    socket.on("folder-created", handleFolderCreated);
    socket.on("file-deleted", handleFileDeleted);
    socket.on("folder-deleted", handleFolderDeleted);
    socket.on("file-renamed", handleFileRenamed);
    socket.on("folder-renamed", handleFolderRenamed);
    socket.on("file-content-updated", handleFileContentUpdated);

    return () => {
      socket.off("file-created", handleFileCreated);
      socket.off("folder-created", handleFolderCreated);
      socket.off("file-deleted", handleFileDeleted);
      socket.off("folder-deleted", handleFolderDeleted);
      socket.off("file-renamed", handleFileRenamed);
      socket.off("folder-renamed", handleFolderRenamed);
      socket.off("file-content-updated", handleFileContentUpdated);
    };
  }, [socket, user?.id]);

  // Handle room sync data when joining
  useEffect(() => {
    if (window.roomSyncData) {
      const { files, folders } = window.roomSyncData;
      dispatch({
        type: ActionTypes.SYNC_ROOM_DATA,
        payload: { files, folders },
      });
      // Clear the sync data after using it
      window.roomSyncData = null;
    }
  }, []);

  const actions = {
    createFile: useCallback(
      (parentId, name, content = "", language = null, autoOpen = true) => {
        const fileId = generateId();
        const detectedLanguage = language || getLanguageFromExtension(name);

        const fileData = {
          id: fileId,
          name,
          type: "file",
          content,
          language: detectedLanguage,
          parentId, // Add parentId to fileData for server sync
        };

        // Emit WebSocket event for file creation
        if (socket && user) {
          socket.emit("file-created", {
            fileData,
            parentId,
            autoOpen,
          });
        }

        dispatch({
          type: ActionTypes.CREATE_FILE,
          payload: {
            parentId,
            name,
            content,
            language: detectedLanguage,
            autoOpen,
          },
        });
      },
      [socket, user]
    ),

    createFolder: useCallback(
      (parentId, name) => {
        const folderId = generateId();

        const folderData = {
          id: folderId,
          name,
          type: "folder",
          children: [],
          parentId, // Add parentId to folderData for server sync
        };

        // Emit WebSocket event for folder creation
        if (socket && user) {
          socket.emit("folder-created", {
            folderData,
            parentId,
          });
        }

        dispatch({
          type: ActionTypes.CREATE_FOLDER,
          payload: { parentId, name },
        });
      },
      [socket, user]
    ),

    deleteFile: useCallback(
      (fileId, parentId) => {
        // Emit WebSocket event for file deletion
        if (socket && user) {
          socket.emit("file-deleted", {
            fileId,
            parentId,
          });
        }

        dispatch({
          type: ActionTypes.DELETE_FILE,
          payload: { fileId, parentId },
        });
      },
      [socket, user]
    ),

    deleteFolder: useCallback(
      (folderId, parentId) => {
        // Emit WebSocket event for folder deletion
        if (socket && user) {
          socket.emit("folder-deleted", {
            folderId,
            parentId,
          });
        }

        dispatch({
          type: ActionTypes.DELETE_FOLDER,
          payload: { fileId: folderId, parentId },
        });
      },
      [socket, user]
    ),

    renameFile: useCallback(
      (fileId, newName) => {
        // Emit WebSocket event for file rename
        if (socket && user) {
          socket.emit("file-renamed", {
            fileId,
            newName,
          });
        }

        dispatch({
          type: ActionTypes.RENAME_FILE,
          payload: { fileId, newName },
        });
      },
      [socket, user]
    ),

    renameFolder: useCallback(
      (folderId, newName) => {
        // Emit WebSocket event for folder rename
        if (socket && user) {
          socket.emit("folder-renamed", {
            folderId,
            newName,
          });
        }

        dispatch({
          type: ActionTypes.RENAME_FOLDER,
          payload: { fileId: folderId, newName },
        });
      },
      [socket, user]
    ),

    updateFileContent: useCallback((fileId, content, language) => {
      dispatch({
        type: ActionTypes.UPDATE_FILE_CONTENT,
        payload: { fileId, content, language },
      });
    }, []),

    updateFileContentWithSync: useCallback(
      (fileId, content, language) => {
        // Update local state
        dispatch({
          type: ActionTypes.UPDATE_FILE_CONTENT,
          payload: { fileId, content, language },
        });

        // Emit WebSocket event for real-time content sharing
        if (socket && user) {
          socket.emit("file-content-updated", {
            fileId,
            content,
            language,
            updatedBy: user.username,
            updatedByUserId: user.id,
          });
        }
      },
      [socket, user]
    ),

    openFile: useCallback((fileId) => {
      dispatch({
        type: ActionTypes.OPEN_FILE,
        payload: { fileId },
      });
    }, []),

    closeFile: useCallback((fileId) => {
      dispatch({
        type: ActionTypes.CLOSE_FILE,
        payload: { fileId },
      });
    }, []),

    setActiveTab: useCallback((tabId) => {
      dispatch({
        type: ActionTypes.SET_ACTIVE_TAB,
        payload: { tabId },
      });
    }, []),

    toggleFolder: useCallback((folderId) => {
      dispatch({
        type: ActionTypes.TOGGLE_FOLDER,
        payload: { folderId },
      });
    }, []),

    setExpandedFolders: useCallback((folderIds) => {
      dispatch({
        type: ActionTypes.SET_EXPANDED_FOLDERS,
        payload: { folderIds },
      });
    }, []),

    setSelectedFolder: useCallback((folderId) => {
      dispatch({
        type: ActionTypes.SET_SELECTED_FOLDER,
        payload: { folderId },
      });
    }, []),

    findNode: useCallback(
      (targetId) => {
        return findNode(state.files, targetId);
      },
      [state.files]
    ),

    getActiveFileContent: useCallback(() => {
      if (!state.activeTab) return { content: "", language: "javascript" };

      const result = findNode(state.files, state.activeTab);
      if (!result) return { content: "", language: "javascript" };

      return {
        content: result.node.content || "",
        language: result.node.language || "javascript",
      };
    }, [state.files, state.activeTab]),

    syncRoomData: useCallback((files, folders) => {
      dispatch({
        type: ActionTypes.SYNC_ROOM_DATA,
        payload: { files, folders },
      });
    }, []),
  };

  return (
    <FileSystemContext.Provider value={{ state, actions, socket, user }}>
      {children}
    </FileSystemContext.Provider>
  );
};
