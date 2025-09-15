# Developer Guide

This guide provides comprehensive information for developers who want to contribute to AI Tab Organiser, understand the codebase, or build upon the project.

## 🏗️ Project Architecture

### Overview

AI Tab Organiser is a browser extension built with vanilla JavaScript that uses machine learning for intelligent tab grouping. The extension follows the Manifest V3 specification and supports both Chrome and Firefox browsers.

### Core Components

```
aiTabOrganiser/
├── manifest.json          # Extension manifest (main)
├── manifest.chrome.json   # Chrome-specific manifest
├── manifest.firefox.json  # Firefox-specific manifest
├── background.js          # Service worker
├── popup.js              # Main popup interface
├── popup.html            # Popup UI
├── sandbox.js            # Sandboxing functionality
├── sandbox.html          # Sandbox UI
├── ml-model.js           # Machine learning algorithms
├── settings.js           # Settings management
├── settings.html         # Settings page
├── utils/                # Utility modules
│   ├── browserAPI.js     # Cross-browser API abstraction
│   ├── tabUtils.js       # Tab manipulation utilities
│   ├── workspaceUtils.js # Workspace management
│   ├── groupUtils.js     # Tab grouping utilities
│   ├── preview.js        # Tab preview functionality
│   └── onboarding.js     # User onboarding flow
├── build/                # Build configuration
├── dist/                 # Built extension files
└── docs/                 # Documentation
```

### Architecture Patterns

#### Service Worker (background.js)
- Handles cross-tab communication
- Manages workspace persistence
- Coordinates ML analysis
- Browser API integration

#### Content Scripts
- Minimal content script injection
- Focused on tab content analysis
- Privacy-preserving data extraction

#### Cross-Browser Compatibility
- Unified API abstraction layer
- Browser-specific manifests
- Feature detection and fallbacks

## 🚀 Development Setup

### Prerequisites

- **Node.js**: Version 16 or higher
- **npm**: Version 8 or higher
- **Git**: For version control
- **Chrome/Firefox**: For testing

### Initial Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/masterK0927/aiTabOrganiser.git
   cd aiTabOrganiser
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Verify Setup**
   ```bash
   npm run build
   ```

### Development Workflow

#### Building the Extension

```bash
# Build for Chrome
npm run build:chrome

# Build for Firefox
npm run build:firefox

# Build for both browsers
npm run build

# Clean build artifacts
npm run clean
```

#### Loading in Development

**Chrome:**
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `dist/chrome` folder

**Firefox:**
1. Open `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select `dist/firefox/manifest.json`

#### Development Scripts

```bash
# Package for distribution
npm run package

# Generate signing key
npm run key:generate

# Build and package
./build.sh all
./build.sh chrome
./build.sh firefox
```

## 🔧 Core Systems

### Machine Learning Engine

Location: `ml-model.js`

#### Tab Analysis Algorithm

The ML system analyzes tabs using multiple factors:

```javascript
// Core analysis function
async function analyzeTabSimilarity(tabs) {
  const features = tabs.map(extractFeatures);
  const similarities = calculateSimilarityMatrix(features);
  return clusterBySimilarity(similarities, tabs);
}

// Feature extraction
function extractFeatures(tab) {
  return {
    url: analyzeURL(tab.url),
    title: analyzeTitle(tab.title),
    domain: extractDomain(tab.url),
    contentType: detectContentType(tab)
  };
}
```

#### Similarity Scoring

The system uses multiple similarity metrics:

1. **URL Similarity**: Domain, path, and parameter analysis
2. **Title Similarity**: Semantic text comparison
3. **Content Type**: Document type classification
4. **Temporal Factors**: Open time and session context

#### Clustering Algorithm

```javascript
function clusterBySimilarity(similarityMatrix, tabs) {
  // Use hierarchical clustering
  const clusters = hierarchicalClustering(similarityMatrix);
  return formatWorkspaces(clusters, tabs);
}
```

### Browser API Abstraction

Location: `utils/browserAPI.js`

#### Cross-Browser Compatibility

```javascript
// Unified API interface
export const browserAPI = {
  tabs: isFirefox ? browser.tabs : chrome.tabs,
  storage: isFirefox ? browser.storage : chrome.storage,
  windows: isFirefox ? browser.windows : chrome.windows
};

// Promisified API calls
export async function queryTabs(queryInfo) {
  return new Promise((resolve) => {
    browserAPI.tabs.query(queryInfo, resolve);
  });
}
```

#### Permission Management

```javascript
// Check and request permissions
async function ensurePermissions() {
  const permissions = ['tabs', 'storage'];
  return browserAPI.permissions.request({ permissions });
}
```

### Workspace Management

Location: `utils/workspaceUtils.js`

#### Data Structure

```javascript
const workspace = {
  id: 'uuid-string',
  name: 'Generated Name',
  tabs: [
    {
      id: 'tab-id',
      url: 'https://example.com',
      title: 'Page Title',
      favIconUrl: 'https://example.com/favicon.ico'
    }
  ],
  createdAt: Date.now(),
  lastAccessed: Date.now()
};
```

#### Storage Operations

```javascript
// Save workspace
export async function saveWorkspace(workspace) {
  const workspaces = await loadWorkspaces();
  workspaces[workspace.id] = workspace;
  return setStorage('workspaces', workspaces);
}

// Load all workspaces
export async function loadWorkspaces() {
  return getStorage('workspaces').then(data => data.workspaces || {});
}
```

### Tab Grouping System

Location: `utils/groupUtils.js`

#### Group Creation

```javascript
export async function createTabGroup(tabs, groupName) {
  if (!chrome.tabGroups) {
    // Fallback for browsers without native grouping
    return createVirtualGroup(tabs, groupName);
  }

  const tabIds = tabs.map(tab => tab.id);
  const groupId = await chrome.tabGroups.group({ tabIds });
  await chrome.tabGroups.update(groupId, { title: groupName });
  return groupId;
}
```

## 🎨 UI Components

### Popup Interface

Location: `popup.js`, `popup.html`

#### Component Structure

```javascript
// Main popup controller
class PopupController {
  constructor() {
    this.workspaces = [];
    this.activeWorkspace = null;
    this.initializeEventListeners();
  }

  async loadWorkspaces() {
    this.workspaces = await loadWorkspaces();
    this.renderWorkspaceList();
  }

  renderWorkspaceList() {
    const container = document.getElementById('workspace-list');
    container.innerHTML = this.workspaces
      .map(workspace => this.renderWorkspaceItem(workspace))
      .join('');
  }
}
```

#### Event Handling

```javascript
// Workspace interaction
document.addEventListener('click', (event) => {
  if (event.target.matches('.workspace-item')) {
    handleWorkspaceClick(event.target.dataset.workspaceId);
  }

  if (event.target.matches('.analyze-button')) {
    handleAnalyzeClick();
  }
});
```

### Settings Interface

Location: `settings.js`, `settings.html`

#### Settings Management

```javascript
class SettingsManager {
  async loadSettings() {
    return getStorage([
      'tab_source',
      'theme',
      'grouping_sensitivity',
      'auto_group'
    ]);
  }

  async saveSettings(settings) {
    return setStorage(settings);
  }
}
```

## 🧪 Testing

### Manual Testing

#### Test Scenarios

1. **Basic Functionality**
   ```bash
   # Open diverse tabs
   # Run analysis
   # Verify grouping accuracy
   # Test workspace operations
   ```

2. **Cross-Browser Testing**
   ```bash
   # Test in Chrome
   # Test in Firefox
   # Verify feature parity
   # Check performance differences
   ```

3. **Edge Cases**
   ```bash
   # Single tab analysis
   # Duplicate tabs
   # Invalid URLs
   # Permission denied scenarios
   ```

### Automated Testing Setup

Create `test/` directory for future test implementation:

```javascript
// Example test structure
describe('Tab Analysis', () => {
  it('should group similar tabs', async () => {
    const tabs = createMockTabs();
    const workspaces = await analyzeTabSimilarity(tabs);
    expect(workspaces.length).toBeGreaterThan(0);
  });
});
```

## 📦 Build System

### Build Configuration

Location: `build/build.js`

#### Build Process

```javascript
const buildProcess = {
  1. 'Clean dist directory',
  2. 'Copy source files',
  3. 'Select browser-specific manifest',
  4. 'Process conditional code',
  5. 'Optimize assets',
  6. 'Generate package'
};
```

#### Browser-Specific Builds

```javascript
// Chrome build
if (browserTarget === 'chrome') {
  // Use chrome.* APIs
  // Include Chrome-specific features
  copyManifest('manifest.chrome.json');
}

// Firefox build
if (browserTarget === 'firefox') {
  // Use browser.* APIs
  // Include Firefox-specific features
  copyManifest('manifest.firefox.json');
}
```

### Packaging

```bash
# Create distribution packages
npm run package:chrome    # Creates .crx file
npm run package:firefox   # Creates .xpi file
```

## 🔍 Debugging

### Development Tools

#### Extension Debugging

**Chrome:**
1. Go to `chrome://extensions/`
2. Click "Inspect views: service worker"
3. Use DevTools for debugging

**Firefox:**
1. Go to `about:debugging`
2. Click "Inspect" next to your extension
3. Use Browser Toolbox for debugging

#### Common Debug Points

```javascript
// Service Worker debugging
console.log('Background script loaded');

// Popup debugging
console.log('Popup opened', { workspaces, activeTab });

// ML debugging
console.log('Analysis result', { clusters, confidence });
```

### Logging System

```javascript
// Centralized logging
const logger = {
  debug: (message, data) => console.log(`[DEBUG] ${message}`, data),
  info: (message, data) => console.info(`[INFO] ${message}`, data),
  error: (message, error) => console.error(`[ERROR] ${message}`, error)
};
```

## 🚀 Performance Optimization

### Tab Analysis Performance

#### Optimization Strategies

1. **Batch Processing**: Process tabs in chunks
2. **Caching**: Cache analysis results
3. **Lazy Loading**: Load workspaces on demand
4. **Debouncing**: Limit analysis frequency

```javascript
// Debounced analysis
const debouncedAnalyze = debounce(analyzeTabSimilarity, 1000);

// Chunk processing
async function processTabs(tabs) {
  const chunks = chunkArray(tabs, 10);
  const results = [];

  for (const chunk of chunks) {
    const result = await analyzeTabChunk(chunk);
    results.push(...result);
  }

  return results;
}
```

### Memory Management

```javascript
// Clean up old workspaces
async function cleanupOldWorkspaces() {
  const workspaces = await loadWorkspaces();
  const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days

  Object.keys(workspaces).forEach(id => {
    if (workspaces[id].lastAccessed < cutoff) {
      delete workspaces[id];
    }
  });

  await saveWorkspaces(workspaces);
}
```

## 🔐 Security Considerations

### Permission Model

#### Minimal Permissions

```json
{
  "permissions": [
    "tabs",
    "storage"
  ],
  "host_permissions": [
    "<all_urls>"
  ]
}
```

#### Data Privacy

1. **Local Processing**: All analysis done locally
2. **No External Requests**: No data sent to external servers
3. **Minimal Data**: Only URLs and titles processed
4. **User Control**: Users can delete all data

### Content Security Policy

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

## 🌐 Cross-Browser Compatibility

### API Differences

#### Chrome vs Firefox

```javascript
// Chrome API
chrome.tabs.query({}, callback);

// Firefox API
browser.tabs.query({}).then(callback);

// Unified approach
const api = typeof browser !== 'undefined' ? browser : chrome;
```

#### Feature Detection

```javascript
function supportsTabGroups() {
  return typeof chrome !== 'undefined' &&
         chrome.tabGroups !== undefined;
}

function supportsContainers() {
  return typeof browser !== 'undefined' &&
         browser.contextualIdentities !== undefined;
}
```

## 📚 Contributing Guidelines

### Code Style

#### JavaScript Style Guide

```javascript
// Use ES6+ features
const tabs = await queryTabs({ active: true });

// Prefer async/await over Promises
async function loadWorkspaces() {
  try {
    const data = await getStorage('workspaces');
    return data.workspaces || {};
  } catch (error) {
    logger.error('Failed to load workspaces', error);
    return {};
  }
}

// Use descriptive variable names
const activeWorkspaceIndex = 0;
const currentWorkspaces = [];
```

#### File Organization

```
utils/
├── browserAPI.js      # Browser API abstraction
├── tabUtils.js        # Tab manipulation
├── workspaceUtils.js  # Workspace management
├── groupUtils.js      # Tab grouping
├── preview.js         # Preview functionality
└── onboarding.js      # User onboarding
```

### Contribution Process

1. **Fork the Repository**
2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Follow code style guidelines
   - Add tests for new features
   - Update documentation

4. **Test Changes**
   ```bash
   npm run build
   # Test in both Chrome and Firefox
   ```

5. **Submit Pull Request**
   - Describe changes clearly
   - Include screenshots for UI changes
   - Reference any related issues

### Code Review Process

#### Review Checklist

- [ ] Code follows style guidelines
- [ ] Changes are tested in both browsers
- [ ] Documentation is updated
- [ ] No security vulnerabilities introduced
- [ ] Performance impact is acceptable

## 📋 Release Process

### Version Management

#### Semantic Versioning

```
1.5.0
│ │ │
│ │ └── Patch: Bug fixes
│ └──── Minor: New features
└────── Major: Breaking changes
```

#### Release Preparation

1. **Update Version Numbers**
   ```json
   // package.json
   "version": "1.6.0"

   // manifest.json
   "version": "1.6"
   ```

2. **Update Changelog**
   ```markdown
   ## [1.6.0] - 2025-04-20
   ### Added
   - New feature X
   ### Fixed
   - Bug fix Y
   ```

3. **Build and Test**
   ```bash
   npm run build
   npm run package
   ```

4. **Create Release**
   - Tag version in Git
   - Upload packages to GitHub releases
   - Update documentation

### Distribution

#### GitHub Releases
- Upload `.crx` file for Chrome
- Upload `.xpi` file for Firefox
- Include release notes

#### Future: Web Stores
- Chrome Web Store submission
- Firefox Add-ons submission
- Automated update system

## 🛠️ Development Tools

### Recommended Extensions

- **Chrome DevTools**: For debugging
- **Firefox Developer Tools**: For Firefox testing
- **Git**: Version control
- **VSCode**: Recommended editor with extensions:
  - JavaScript (ES6) code snippets
  - Bracket Pair Colorizer
  - GitLens

### Useful Resources

- [Chrome Extension Developer Guide](https://developer.chrome.com/docs/extensions/)
- [Firefox Extension Workshop](https://extensionworkshop.com/)
- [MDN Web Extensions API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)

## 🆘 Getting Help

### Development Support

- **GitHub Issues**: Report bugs and request features
- **GitHub Discussions**: Ask questions and share ideas
- **Email**: masterK0927@protonmail.com

### Documentation

- **User Guide**: [user-guide.md](user-guide.md)
- **API Reference**: [api-reference.md](api-reference.md)
- **Troubleshooting**: [troubleshooting.md](troubleshooting.md)

---

Ready to contribute? Start by exploring the codebase and checking out our [open issues](https://github.com/masterK0927/aiTabOrganiser/issues) for good first contributions!