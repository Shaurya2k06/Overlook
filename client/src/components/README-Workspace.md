# IDE Workspace Components

This directory contains the components that transform the single-file Monaco editor into a full IDE-like workspace interface.

## Components Overview

### 1. FileSystemContext (`contexts/FileSystemContext.jsx`)

- **Purpose**: Manages the virtual file system state and operations
- **Features**:
  - Tree-based file/folder structure
  - File operations (create, rename, delete)
  - Tab management (open, close, switch)
  - Content tracking with unsaved changes
  - Folder expansion/collapse state

### 2. FileExplorer (`components/FileExplorer.jsx`)

- **Purpose**: Sidebar file tree explorer
- **Features**:
  - Hierarchical folder/file display
  - Right-click context menus
  - Inline rename functionality
  - File type icons with color coding
  - Expand/collapse folder functionality

### 3. TabSystem (`components/TabSystem.jsx`)

- **Purpose**: Tab bar for managing open files
- **Features**:
  - Multiple file tabs
  - Active tab highlighting
  - Unsaved changes indicator (orange dot)
  - Close tab functionality
  - File type icons

### 4. CodeEditor (`components/CodeEditor.jsx`) - Updated

- **Purpose**: Monaco editor integrated with file system
- **Features**:
  - Automatic content loading from file system
  - Language detection per file
  - Real-time content updates
  - Language selector integration

### 5. StatusBar (`components/StatusBar.jsx`)

- **Purpose**: Bottom status bar with file information
- **Features**:
  - Current file name and language
  - Line count display
  - Unsaved changes indicator
  - Open files count

## Usage

The workspace starts with a clean, empty structure containing only a single `main.js` file:

```
Workspace/
└── main.js (JavaScript - empty content)
```

The `main.js` file is automatically opened when the workspace loads, providing an immediate starting point for coding.

## File Operations

### Creating Files/Folders

- Use the **New File** and **New Folder** buttons in the explorer header
- Right-click on any folder in the explorer and select "New File" or "New Folder"
- Use the **Quick Start** buttons in the welcome screen to create common files
- Enter the name when prompted (file extensions are automatically detected for syntax highlighting)

### Renaming

- Right-click on any file/folder
- Select "Rename"
- Edit inline or use the context menu

### Deleting

- Right-click on any file/folder
- Select "Delete"
- Confirm the deletion

### Opening Files

- Click on any file in the explorer
- File opens in a new tab
- Content loads in the Monaco editor
- The `main.js` file is automatically opened when the workspace loads

## Integration Notes

- The workspace integrates with the existing real-time collaboration features
- File system state is managed in memory (can be extended to persist to backend)
- All components are responsive and work with the existing dark theme
- The Monaco editor automatically detects file types and applies syntax highlighting

## Future Enhancements

- File persistence to backend storage
- File upload/download functionality
- Search across files
- Git integration
- File watching and auto-save
- Drag-and-drop file operations
