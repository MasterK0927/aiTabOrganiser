# Installation Guide

This guide will help you install AI Tab Organiser on your browser. The extension supports both Chrome/Chromium-based browsers and Firefox.

## 📋 Prerequisites

- **Chrome/Chromium**: Version 88 or higher
- **Firefox**: Version 109 or higher
- **Storage**: ~1MB of disk space
- **Permissions**: Access to tabs and storage (granted during installation)

## 🚀 Installation Methods

### Method 1: From Browser Stores (Recommended)

**Note**: The extension is currently distributed via GitHub releases. Web store submissions are planned for future releases.

### Method 2: From GitHub Releases

1. **Download the Extension**
   - Visit the [Releases page](https://github.com/masterK0927/aiTabOrganiser/releases)
   - Download the latest version for your browser:
     - `ai-tab-manager-chrome.crx` for Chrome/Chromium
     - `ai-tab-manager-firefox.xpi` for Firefox

#### For Chrome/Chromium Browsers

2. **Enable Developer Mode**
   - Open Chrome and navigate to `chrome://extensions/`
   - Toggle "Developer mode" in the top-right corner

3. **Install the Extension**
   - **Option A**: Drag and drop the `.crx` file onto the extensions page
   - **Option B**: Click "Load unpacked" and select the extracted extension folder

4. **Verify Installation**
   - Look for the AI Tab Organiser icon in your browser toolbar
   - Click the icon to open the extension popup

#### For Firefox

2. **Install via Add-ons Manager**
   - Open Firefox and navigate to `about:addons`
   - Click the gear icon (⚙️) in the top-right
   - Select "Install Add-on From File..."
   - Choose the downloaded `.xpi` file

3. **Grant Permissions**
   - Firefox will prompt for permissions
   - Click "Add" to confirm installation

4. **Verify Installation**
   - The extension icon should appear in your toolbar
   - Click to access the extension

### Method 3: Development Installation

For developers who want to install from source:

1. **Clone the Repository**
   ```bash
   git clone https://github.com/masterK0927/aiTabOrganiser.git
   cd aiTabOrganiser
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Extension**
   ```bash
   # For Chrome
   npm run build:chrome

   # For Firefox
   npm run build:firefox

   # For both browsers
   npm run build
   ```

4. **Load in Browser**
   - **Chrome**: Load `dist/chrome` folder as unpacked extension
   - **Firefox**: Load `dist/firefox` folder as temporary add-on

## 🔧 Post-Installation Setup

### First Launch

1. **Click the Extension Icon**
   - Look for the AI Tab Organiser icon in your browser toolbar
   - If not visible, click the extensions menu (puzzle piece icon)

2. **Complete Onboarding**
   - The extension will guide you through a quick setup process
   - Learn about key features and how to use them

3. **Grant Permissions (if prompted)**
   - **Tabs permission**: Required to read and organize your tabs
   - **Storage permission**: Required to save your workspaces

### Initial Configuration

1. **Open Settings**
   - Click the extension icon
   - Click the "Settings" button in the popup

2. **Configure Tab Source**
   - Choose which tabs to analyze:
     - **Current Window**: Only tabs in the active window
     - **All Windows**: Tabs from all browser windows
     - **Specific Window**: Choose a particular window

3. **Customize Preferences**
   - Set your preferred theme (Light/Dark)
   - Configure workspace naming preferences
   - Adjust grouping sensitivity

## ✅ Verify Installation

### Quick Test

1. **Open Multiple Tabs**
   - Open 5-10 tabs with different types of content
   - Mix of work, research, entertainment, etc.

2. **Analyze Tabs**
   - Click the extension icon
   - Click "Analyze Tabs"
   - Wait for processing to complete

3. **Check Results**
   - You should see organized workspaces
   - Each workspace should contain related tabs

### Troubleshooting Installation

#### Extension Not Visible
- **Chrome**: Check if extensions are hidden. Click the puzzle piece icon to see all extensions
- **Firefox**: Check `about:addons` to ensure the extension is enabled

#### Permission Errors
- Ensure you granted all required permissions during installation
- Try disabling and re-enabling the extension

#### Installation Failed
- **Chrome**: Ensure Developer Mode is enabled
- **Firefox**: Try installing in safe mode
- **Both**: Clear browser cache and try again

## 🔄 Updating the Extension

### Automatic Updates
- Browser store versions will update automatically
- GitHub release versions require manual updates

### Manual Updates
1. Download the latest release from GitHub
2. Remove the old version from your browser
3. Install the new version following the installation steps

## 🚫 Uninstallation

### Chrome/Chromium
1. Go to `chrome://extensions/`
2. Find AI Tab Organiser
3. Click "Remove"

### Firefox
1. Go to `about:addons`
2. Find AI Tab Organiser
3. Click "Remove"

### Clean Uninstall
To remove all data:
1. Uninstall the extension
2. Clear browser data for the extension (optional)

## 📞 Need Help?

If you encounter issues during installation:

- **Check the [Troubleshooting Guide](troubleshooting.md)**
- **Report bugs**: [GitHub Issues](https://github.com/masterK0927/aiTabOrganiser/issues)
- **Email support**: masterK0927@protonmail.com

---

**Next Steps**: Once installed, check out the [User Guide](user-guide.md) to learn how to use all the features!