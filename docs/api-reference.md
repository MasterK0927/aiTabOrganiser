# API Reference

This document provides comprehensive reference information for configuring AI Tab Organiser, understanding its internal APIs, and integrating with browser extension APIs.

## 📋 Table of Contents

- [Configuration Settings](#configuration-settings)
- [Storage API](#storage-api)
- [Browser API Abstraction](#browser-api-abstraction)
- [Machine Learning Configuration](#machine-learning-configuration)
- [Workspace Data Structure](#workspace-data-structure)
- [Event System](#event-system)
- [Extension Messaging](#extension-messaging)

## ⚙️ Configuration Settings

### Default Settings

The extension uses the following default configuration:

```javascript
const DEFAULT_SETTINGS = {
  // ML Algorithm Parameters
  similarityThreshold: 0.5,      // Minimum similarity for grouping (0.0-1.0)
  domainWeight: 0.6,             // Weight for domain similarity (0.0-1.0)
  pathWeight: 0.3,               // Weight for URL path similarity (0.0-1.0)
  titleWeight: 0.1,              // Weight for title similarity (0.0-1.0)

  // Workspace Management
  autoGroupTabs: true,           // Automatically group tabs
  minWorkspaceSize: 2,           // Minimum tabs per workspace
  namingStrategy: 'domain-word', // Workspace naming strategy

  // UI Configuration
  previewMode: 'auto',           // Tab preview mode
  theme: 'auto',                 // UI theme preference

  // Tab Source Configuration
  tab_source: 'current-window',  // Tab analysis source
  specific_window_id: null       // Specific window ID (if applicable)
};
```

### Setting Descriptions

#### Machine Learning Parameters

| Setting | Type | Range | Description |
|---------|------|-------|-------------|
| `similarityThreshold` | float | 0.0-1.0 | Minimum similarity score for grouping tabs together |
| `domainWeight` | float | 0.0-1.0 | Importance of domain similarity in analysis |
| `pathWeight` | float | 0.0-1.0 | Importance of URL path similarity |
| `titleWeight` | float | 0.0-1.0 | Importance of page title similarity |

#### Workspace Configuration

| Setting | Type | Options | Description |
|---------|------|---------|-------------|
| `autoGroupTabs` | boolean | true/false | Enable automatic tab grouping |
| `minWorkspaceSize` | integer | 2+ | Minimum number of tabs required for a workspace |
| `namingStrategy` | string | See below | How to generate workspace names |

#### Naming Strategies

- `domain-word`: Use domain name and descriptive word
- `content-based`: Use content analysis for naming
- `manual`: User provides all names
- `hybrid`: AI suggests, user can edit

#### Tab Source Options

| Option | Description |
|--------|-------------|
| `current-window` | Analyze tabs only in the active window |
| `all-windows` | Analyze tabs across all browser windows |
| `specific-window` | Analyze tabs in a user-specified window |

### Settings API

#### Reading Settings

```javascript
// Load all settings
async function loadSettings() {
  return new Promise((resolve) => {
    const storage = getStorage();
    storage.get([
      'similarityThreshold',
      'autoGroupTabs',
      'tab_source',
      'theme'
    ], (result) => {
      const settings = { ...DEFAULT_SETTINGS, ...result };
      resolve(settings);
    });
  });
}

// Load specific setting
async function getSetting(key) {
  return new Promise((resolve) => {
    const storage = getStorage();
    storage.get([key], (result) => {
      resolve(result[key] || DEFAULT_SETTINGS[key]);
    });
  });
}
```

#### Saving Settings

```javascript
// Save multiple settings
async function saveSettings(settings) {
  return new Promise((resolve) => {
    const storage = getStorage();
    storage.set(settings, () => {
      resolve();
    });
  });
}

// Save single setting
async function setSetting(key, value) {
  return new Promise((resolve) => {
    const storage = getStorage();
    storage.set({ [key]: value }, () => {
      resolve();
    });
  });
}
```

## 💾 Storage API

### Data Schema

The extension stores data in the following structure:

```javascript
{
  // Workspaces
  "workspaces": {
    "workspace-id-1": {
      "id": "workspace-id-1",
      "name": "Development",
      "tabs": [...],
      "createdAt": 1673456789000,
      "lastAccessed": 1673456789000
    }
  },

  // Settings
  "similarityThreshold": 0.5,
  "autoGroupTabs": true,
  "tab_source": "current-window",

  // Onboarding State
  "onboarding_completed": true,
  "settings_onboarding_completed": true,

  // User Preferences
  "theme": "dark",
  "previewMode": "auto"
}
```

### Workspace Data Structure

```typescript
interface Workspace {
  id: string;              // Unique identifier
  name: string;            // User-friendly name
  tabs: Tab[];             // Array of tab objects
  createdAt: number;       // Creation timestamp
  lastAccessed: number;    // Last access timestamp
  color?: string;          // Optional color theme
  icon?: string;           // Optional icon identifier
}

interface Tab {
  id: string;              // Browser tab ID
  url: string;             // Full URL
  title: string;           // Page title
  favIconUrl?: string;     // Favicon URL
  windowId: number;        // Window identifier
  index: number;           // Tab position
  pinned: boolean;         // Pin status
  active: boolean;         // Active status
}
```

### Storage Operations

#### Workspace Management

```javascript
// Load all workspaces
export async function loadWorkspaces() {
  return new Promise((resolve) => {
    const storage = getStorage();
    storage.get(['workspaces'], (result) => {
      resolve(result.workspaces || {});
    });
  });
}

// Save workspace
export async function saveWorkspace(workspace) {
  const workspaces = await loadWorkspaces();
  workspaces[workspace.id] = workspace;

  return new Promise((resolve) => {
    const storage = getStorage();
    storage.set({ workspaces }, () => {
      resolve();
    });
  });
}

// Delete workspace
export async function deleteWorkspace(workspaceId) {
  const workspaces = await loadWorkspaces();
  delete workspaces[workspaceId];

  return new Promise((resolve) => {
    const storage = getStorage();
    storage.set({ workspaces }, () => {
      resolve();
    });
  });
}
```

#### Bulk Operations

```javascript
// Export all data
export async function exportData() {
  return new Promise((resolve) => {
    const storage = getStorage();
    storage.get(null, (result) => {
      resolve(result);
    });
  });
}

// Import data
export async function importData(data) {
  return new Promise((resolve) => {
    const storage = getStorage();
    storage.set(data, () => {
      resolve();
    });
  });
}

// Clear all data
export async function clearAllData() {
  return new Promise((resolve) => {
    const storage = getStorage();
    storage.clear(() => {
      resolve();
    });
  });
}
```

## 🌐 Browser API Abstraction

### Cross-Browser Compatibility Layer

```javascript
// Browser detection
export const isFirefox = typeof browser !== 'undefined';
export const isChrome = typeof chrome !== 'undefined';
export const browserAPI = isFirefox ? browser : chrome;

// Unified storage interface
export function getStorage() {
  if (isFirefox && browser.storage) {
    return browser.storage.local;
  } else if (isChrome && chrome.storage) {
    return chrome.storage.local;
  }
  throw new Error('No storage API available');
}
```

### Tab API Abstraction

```javascript
// Query tabs with unified interface
export async function queryTabs(queryInfo = {}) {
  return new Promise((resolve) => {
    browserAPI.tabs.query(queryInfo, (tabs) => {
      resolve(tabs || []);
    });
  });
}

// Create new tab
export async function createTab(createProperties) {
  return new Promise((resolve) => {
    browserAPI.tabs.create(createProperties, (tab) => {
      resolve(tab);
    });
  });
}

// Remove tabs
export async function removeTabs(tabIds) {
  return new Promise((resolve) => {
    browserAPI.tabs.remove(tabIds, () => {
      resolve();
    });
  });
}

// Update tab
export async function updateTab(tabId, updateProperties) {
  return new Promise((resolve) => {
    browserAPI.tabs.update(tabId, updateProperties, (tab) => {
      resolve(tab);
    });
  });
}
```

### Window API Abstraction

```javascript
// Get current window
export async function getCurrentWindow() {
  return new Promise((resolve) => {
    browserAPI.windows.getCurrent((window) => {
      resolve(window);
    });
  });
}

// Get all windows
export async function getAllWindows() {
  return new Promise((resolve) => {
    browserAPI.windows.getAll({ populate: true }, (windows) => {
      resolve(windows);
    });
  });
}

// Create new window
export async function createWindow(createData) {
  return new Promise((resolve) => {
    browserAPI.windows.create(createData, (window) => {
      resolve(window);
    });
  });
}
```

## 🤖 Machine Learning Configuration

### Algorithm Parameters

#### Similarity Calculation

```javascript
// Configure similarity weights
const SIMILARITY_CONFIG = {
  domain: {
    weight: 0.6,           // Domain similarity importance
    exact_match: 1.0,      // Exact domain match score
    subdomain_match: 0.8,  // Subdomain match score
    different_domain: 0.0  // Different domain score
  },

  path: {
    weight: 0.3,           // URL path importance
    exact_match: 1.0,      // Exact path match
    partial_match: 0.6,    // Partial path overlap
    different_path: 0.0    // No path similarity
  },

  title: {
    weight: 0.1,           // Title similarity importance
    word_overlap: 0.8,     // Common words bonus
    semantic_similarity: 0.6 // Semantic analysis score
  }
};
```

#### Clustering Configuration

```javascript
const CLUSTERING_CONFIG = {
  algorithm: 'hierarchical',  // Clustering algorithm
  linkage: 'average',         // Linkage method
  min_cluster_size: 2,        // Minimum cluster size
  max_clusters: 10,           // Maximum number of clusters
  similarity_threshold: 0.5   // Minimum similarity for grouping
};
```

### Feature Extraction

```javascript
// URL feature extraction
function extractURLFeatures(url) {
  const parsed = new URL(url);
  return {
    protocol: parsed.protocol,
    hostname: parsed.hostname,
    pathname: parsed.pathname,
    search: parsed.search,
    domain_parts: parsed.hostname.split('.'),
    path_parts: parsed.pathname.split('/').filter(Boolean)
  };
}

// Title feature extraction
function extractTitleFeatures(title) {
  return {
    words: title.toLowerCase().split(/\s+/),
    word_count: title.split(/\s+/).length,
    character_count: title.length,
    has_numbers: /\d/.test(title),
    has_special_chars: /[^\w\s]/.test(title)
  };
}
```

### Custom Similarity Functions

```javascript
// Domain similarity calculation
function calculateDomainSimilarity(url1, url2) {
  const domain1 = new URL(url1).hostname;
  const domain2 = new URL(url2).hostname;

  if (domain1 === domain2) return 1.0;

  const parts1 = domain1.split('.').reverse();
  const parts2 = domain2.split('.').reverse();

  let similarity = 0;
  const maxLength = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < Math.min(parts1.length, parts2.length); i++) {
    if (parts1[i] === parts2[i]) {
      similarity += 1 / maxLength;
    } else {
      break;
    }
  }

  return similarity;
}

// Title similarity using word overlap
function calculateTitleSimilarity(title1, title2) {
  const words1 = new Set(title1.toLowerCase().split(/\s+/));
  const words2 = new Set(title2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size; // Jaccard similarity
}
```

## 📡 Event System

### Internal Events

The extension uses a custom event system for internal communication:

```javascript
// Event emitter
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }

  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }
}

// Global event emitter instance
const eventEmitter = new EventEmitter();
```

### Available Events

```javascript
// Workspace events
eventEmitter.on('workspace:created', (workspace) => {
  console.log('New workspace created:', workspace.name);
});

eventEmitter.on('workspace:deleted', (workspaceId) => {
  console.log('Workspace deleted:', workspaceId);
});

eventEmitter.on('workspace:opened', (workspace) => {
  console.log('Workspace opened:', workspace.name);
});

// Analysis events
eventEmitter.on('analysis:started', () => {
  console.log('Tab analysis started');
});

eventEmitter.on('analysis:completed', (workspaces) => {
  console.log('Analysis completed, found workspaces:', workspaces.length);
});

eventEmitter.on('analysis:failed', (error) => {
  console.error('Analysis failed:', error);
});

// Settings events
eventEmitter.on('settings:changed', (settings) => {
  console.log('Settings updated:', settings);
});
```

## 📨 Extension Messaging

### Message Types

The extension uses structured messaging between components:

```javascript
// Message structure
interface Message {
  action: string;          // Action identifier
  data?: any;             // Optional data payload
  requestId?: string;     // Optional request ID for responses
}

// Response structure
interface Response {
  success: boolean;       // Operation success status
  data?: any;            // Response data
  error?: string;        // Error message if failed
  requestId?: string;    // Matching request ID
}
```

### Background Script Messages

```javascript
// Analyze tabs
const analyzeMessage = {
  action: 'analyze_tabs',
  data: {
    windowId: 123,         // Optional window ID
    tabSource: 'current-window'
  }
};

// Save workspace
const saveMessage = {
  action: 'save_workspace',
  data: {
    workspace: workspaceObject
  }
};

// Load workspaces
const loadMessage = {
  action: 'load_workspaces'
};
```

### Popup to Background Communication

```javascript
// Send message to background script
export async function sendMessage(message) {
  return new Promise((resolve) => {
    browserAPI.runtime.sendMessage(message, (response) => {
      if (browserAPI.runtime.lastError) {
        console.error('Message error:', browserAPI.runtime.lastError);
        resolve({ success: false, error: browserAPI.runtime.lastError.message });
      } else {
        resolve(response || { success: true });
      }
    });
  });
}

// Usage example
async function analyzeCurrentTabs() {
  const response = await sendMessage({
    action: 'analyze_tabs',
    data: { tabSource: 'current-window' }
  });

  if (response.success) {
    console.log('Analysis successful:', response.data);
  } else {
    console.error('Analysis failed:', response.error);
  }
}
```

### Message Handlers

```javascript
// Background script message handler
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'analyze_tabs':
      handleAnalyzeTabs(message.data)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Indicates async response

    case 'save_workspace':
      handleSaveWorkspace(message.data)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'load_workspaces':
      handleLoadWorkspaces()
        .then(workspaces => sendResponse({ success: true, data: workspaces }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});
```

## 🔧 Utility Functions

### Common Utilities

```javascript
// Generate unique ID
export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// Debounce function
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Deep clone object
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Format timestamp
export function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString();
}
```

### Tab Utilities

```javascript
// Ensure array format
export function ensureArray(possibleArray) {
  if (!possibleArray) return [];
  if (Array.isArray(possibleArray)) return possibleArray;
  if (typeof possibleArray === "object") return Object.values(possibleArray);
  return [possibleArray];
}

// Filter valid tabs
export function filterValidTabs(tabs) {
  return tabs.filter(tab =>
    tab.url &&
    !tab.url.startsWith("chrome://") &&
    !tab.url.startsWith("chrome-extension://") &&
    !tab.url.startsWith("moz-extension://") &&
    !tab.url.startsWith("about:")
  );
}

// Group tabs by window
export function groupTabsByWindow(tabs) {
  return tabs.reduce((groups, tab) => {
    const windowId = tab.windowId;
    if (!groups[windowId]) {
      groups[windowId] = [];
    }
    groups[windowId].push(tab);
    return groups;
  }, {});
}
```

## 🚨 Error Handling

### Error Types

```javascript
// Custom error classes
class TabAnalysisError extends Error {
  constructor(message, tabs = []) {
    super(message);
    this.name = 'TabAnalysisError';
    this.tabs = tabs;
  }
}

class WorkspaceError extends Error {
  constructor(message, workspaceId = null) {
    super(message);
    this.name = 'WorkspaceError';
    this.workspaceId = workspaceId;
  }
}

class StorageError extends Error {
  constructor(message, operation = null) {
    super(message);
    this.name = 'StorageError';
    this.operation = operation;
  }
}
```

### Error Handling Patterns

```javascript
// Async operation with error handling
async function safeOperation(operation) {
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    console.error('Operation failed:', error);
    return { success: false, error: error.message };
  }
}

// Usage example
const result = await safeOperation(async () => {
  return await analyzeTabSimilarity(tabs);
});

if (result.success) {
  console.log('Analysis result:', result.data);
} else {
  showErrorMessage(result.error);
}
```

---

This API reference provides the foundation for understanding and extending AI Tab Organiser. For implementation examples, see the [Developer Guide](developer-guide.md).