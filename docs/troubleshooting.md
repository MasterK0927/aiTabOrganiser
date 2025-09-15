# Troubleshooting Guide

This guide helps you resolve common issues with AI Tab Organiser. If you can't find a solution here, please check our [GitHub Issues](https://github.com/masterK0927/aiTabOrganiser/issues) or contact support.

## 🔍 Quick Diagnostics

### Before You Start

1. **Check Browser Compatibility**
   - Chrome/Chromium: Version 88+
   - Firefox: Version 109+

2. **Verify Extension Installation**
   - Extension icon visible in toolbar
   - Extension enabled in browser settings
   - All permissions granted

3. **Check Extension Status**
   - Go to browser's extension management page
   - Ensure AI Tab Organiser is enabled
   - Look for any error messages

## 🚨 Common Issues

### Installation Issues

#### Extension Won't Install

**Symptoms:**
- Installation fails with error message
- Extension doesn't appear after installation
- Permission denied errors

**Solutions:**

1. **Check Browser Compatibility**
   ```
   Chrome: chrome://version/
   Firefox: about:support
   ```
   Ensure your browser version is supported.

2. **Enable Developer Mode (Chrome)**
   - Go to `chrome://extensions/`
   - Toggle "Developer mode" in top-right
   - Try installing again

3. **Clear Browser Cache**
   ```bash
   # Clear browser data
   - Cookies and site data
   - Cached images and files
   - Extension data (optional)
   ```

4. **Download Fresh Copy**
   - Redownload extension from GitHub releases
   - Verify file integrity
   - Try installation again

#### Extension Not Visible

**Symptoms:**
- Extension installed but icon not visible
- Can't access extension popup

**Solutions:**

1. **Check Extension Visibility**
   - Click browser's extension menu (puzzle piece icon)
   - Look for AI Tab Organiser
   - Pin extension to toolbar if needed

2. **Restart Browser**
   - Close all browser windows
   - Restart browser application
   - Check if extension appears

3. **Reinstall Extension**
   - Remove current installation
   - Clear browser data (optional)
   - Reinstall from fresh download

### Permission Issues

#### Permission Denied

**Symptoms:**
- "Permission denied" errors
- Extension can't access tabs
- Storage operations fail

**Solutions:**

1. **Grant Required Permissions**
   - Go to extension management page
   - Click on AI Tab Organiser
   - Ensure all permissions are granted:
     - Tabs access
     - Storage access
     - Host permissions (all URLs)

2. **Reset Permissions**
   - Disable extension
   - Re-enable extension
   - Grant permissions when prompted

3. **Check Browser Security Settings**
   - Disable strict security modes temporarily
   - Check if corporate policies block extensions
   - Try in incognito/private mode

#### Host Permission Errors

**Symptoms:**
- Can't analyze tabs from certain websites
- "Host permission required" errors

**Solutions:**

1. **Grant Host Permissions**
   - Extension settings → Permissions
   - Allow access to all sites
   - Or grant per-site permissions

2. **Verify Manifest Permissions**
   ```json
   "host_permissions": ["<all_urls>"]
   ```

### Functionality Issues

#### No Workspaces Created

**Symptoms:**
- "Analyze Tabs" completes but no workspaces appear
- "No workspaces found" message
- Analysis seems to run but produces no results

**Possible Causes & Solutions:**

1. **Insufficient Tabs**
   - **Problem**: Need at least 3-4 tabs for meaningful grouping
   - **Solution**: Open more diverse tabs before analysis

2. **Similar Content**
   - **Problem**: All tabs too similar to create distinct groups
   - **Solution**: Mix different types of content (work, research, entertainment)

3. **Invalid Tab URLs**
   - **Problem**: Too many system tabs (chrome://, about:)
   - **Solution**: Open regular web pages before analysis

4. **Permission Issues**
   - **Problem**: Extension can't read tab content
   - **Solution**: Check permissions as described above

5. **Settings Configuration**
   - **Problem**: Similarity threshold too high
   - **Solution**:
     ```
     Settings → Grouping Sensitivity → Lower threshold
     Or reset to defaults
     ```

#### Incorrect Tab Grouping

**Symptoms:**
- Unrelated tabs grouped together
- Related tabs in different workspaces
- Poor workspace organization

**Solutions:**

1. **Adjust Similarity Settings**
   ```
   Settings → Advanced → ML Parameters
   - Increase similarity threshold for fewer, larger groups
   - Decrease threshold for more, smaller groups
   ```

2. **Configure Weights**
   ```
   Domain Weight: 0.6 (default)
   Path Weight: 0.3 (default)
   Title Weight: 0.1 (default)
   ```

3. **Improve Input Quality**
   - Use descriptive page titles
   - Keep related tabs in same session
   - Remove irrelevant tabs before analysis

4. **Try Different Analysis Scope**
   ```
   Settings → Tab Source
   - Current Window Only
   - All Windows
   - Specific Window
   ```

#### Workspaces Won't Open

**Symptoms:**
- Clicking workspace does nothing
- Tabs don't open in new window
- Error messages when opening workspaces

**Solutions:**

1. **Check Popup Blocker**
   - Browser may be blocking new windows
   - Allow popups for the extension
   - Try using Ctrl+Click instead

2. **Browser Tab Limits**
   - Close unnecessary tabs
   - Check browser memory usage
   - Try opening smaller workspaces

3. **Window Creation Permissions**
   - Verify extension has window creation permissions
   - Check browser privacy settings

4. **Try Alternative Methods**
   ```
   Right-click workspace → Open in current window
   Or use preview mode to open individual tabs
   ```

### Performance Issues

#### Slow Analysis

**Symptoms:**
- Tab analysis takes very long time
- Browser becomes unresponsive during analysis
- Analysis times out or fails

**Solutions:**

1. **Reduce Tab Count**
   - Close unnecessary tabs before analysis
   - Aim for 5-20 tabs per analysis
   - Use "Current Window" mode for focus

2. **Check System Resources**
   - Close other applications
   - Check available RAM
   - Consider browser restart

3. **Optimize Settings**
   ```
   Settings → Performance
   - Reduce similarity threshold
   - Limit analysis scope
   - Disable preview generation temporarily
   ```

#### High Memory Usage

**Symptoms:**
- Browser uses excessive memory
- System becomes slow
- Browser crashes or freezes

**Solutions:**

1. **Clear Extension Data**
   ```
   Settings → Storage → Clear Workspace Data
   (Warning: This removes all saved workspaces)
   ```

2. **Limit Workspace Count**
   - Delete old unused workspaces
   - Keep only active projects
   - Use export/import for archival

3. **Browser Optimization**
   - Restart browser regularly
   - Close unused tabs
   - Clear browser cache

### UI/UX Issues

#### Interface Not Loading

**Symptoms:**
- Extension popup appears blank
- UI elements missing or broken
- Styling issues

**Solutions:**

1. **Clear Extension Cache**
   - Browser settings → Extensions
   - Clear extension data
   - Reload extension

2. **Check Browser Zoom**
   - Reset browser zoom to 100%
   - Check if interface appears correctly

3. **Update Browser**
   - Ensure latest browser version
   - Check for extension updates

#### Dark Mode Issues

**Symptoms:**
- Dark mode not working
- UI appears broken in dark mode
- Theme switching not functioning

**Solutions:**

1. **Check System Theme**
   - Extension follows system theme by default
   - Try manual theme selection in settings

2. **Clear Theme Settings**
   ```
   Settings → Appearance → Reset to Auto
   ```

3. **Browser Compatibility**
   - Some browsers have limited dark mode support
   - Try switching manually in extension settings

#### Search Not Working

**Symptoms:**
- Search bar doesn't filter workspaces
- Search results appear incorrect
- Search functionality unresponsive

**Solutions:**

1. **Check Search Terms**
   - Use simple keywords
   - Try different search terms
   - Search is case-insensitive

2. **Refresh Workspace List**
   - Close and reopen extension popup
   - Or click refresh button if available

3. **Clear Search Cache**
   - Clear browser data
   - Restart extension

## 🔧 Advanced Troubleshooting

### Extension Console Debugging

#### Chrome

1. **Open Extension Console**
   ```
   chrome://extensions/
   → Click "Inspect views: service worker" (for background)
   → Or "Inspect views: popup.html" (for popup)
   ```

2. **Common Error Messages**
   ```javascript
   // Permission errors
   "Cannot access chrome://... tabs"

   // Storage errors
   "Storage quota exceeded"

   // Analysis errors
   "Failed to analyze tab similarity"
   ```

#### Firefox

1. **Open Extension Console**
   ```
   about:debugging
   → This Firefox
   → Find AI Tab Organiser
   → Click "Inspect"
   ```

2. **Enable Extension Debugging**
   ```
   about:config
   → Set devtools.chrome.enabled = true
   → Set devtools.debugger.remote-enabled = true
   ```

### Log Analysis

#### Enable Detailed Logging

1. **Modify Extension Settings** (for developers)
   ```javascript
   // In background.js or popup.js
   const DEBUG = true;

   function debugLog(message, data) {
     if (DEBUG) {
       console.log(`[AI-Tab-Organiser] ${message}`, data);
     }
   }
   ```

2. **Common Log Messages**
   ```
   [INFO] Analysis started with 12 tabs
   [DEBUG] Similarity matrix calculated
   [ERROR] Failed to create workspace: Storage quota exceeded
   [WARN] Tab analysis timeout after 30 seconds
   ```

### Data Recovery

#### Backup Workspace Data

1. **Export Before Troubleshooting**
   ```
   Extension Settings → Export Data
   Save to safe location
   ```

2. **Manual Data Export**
   ```javascript
   // In browser console
   chrome.storage.local.get(null, (data) => {
     console.log(JSON.stringify(data, null, 2));
   });
   ```

#### Restore Corrupted Data

1. **Import Previous Backup**
   ```
   Settings → Import Data → Select backup file
   ```

2. **Reset to Defaults**
   ```
   Settings → Reset All Settings
   (Warning: Removes all workspaces and settings)
   ```

## 🌐 Browser-Specific Issues

### Chrome/Chromium Issues

#### Service Worker Problems

**Symptoms:**
- Extension stops working after browser sleep
- Background tasks not executing
- Workspace operations fail

**Solutions:**

1. **Restart Service Worker**
   ```
   chrome://extensions/
   → Find AI Tab Organiser
   → Click "service worker" link
   → Click reload
   ```

2. **Check Service Worker Status**
   ```
   chrome://serviceworker-internals/
   → Find extension service worker
   → Check status and logs
   ```

#### Tab Groups Compatibility

**Symptoms:**
- Tab grouping features not working
- Native Chrome groups conflicting

**Solutions:**

1. **Enable Tab Groups**
   ```
   chrome://flags/
   → Search "tab groups"
   → Enable relevant flags
   → Restart browser
   ```

2. **Clear Existing Groups**
   - Manually ungroup all tabs
   - Try extension grouping again

### Firefox-Specific Issues

#### WebExtension API Differences

**Symptoms:**
- Some features not working in Firefox
- Different behavior compared to Chrome

**Solutions:**

1. **Check Firefox Version**
   ```
   about:support
   Ensure Firefox 109+ for full compatibility
   ```

2. **Enable WebExtension APIs**
   ```
   about:config
   → Set extensions.webextensions.enabled = true
   ```

#### Container Compatibility

**Symptoms:**
- Firefox containers interfering with extension
- Tabs not being analyzed correctly

**Solutions:**

1. **Disable Container Isolation** (temporarily)
   ```
   Settings → Privacy & Security
   → Disable "Contain Facebook" etc.
   ```

2. **Configure Container Settings**
   - Allow extension to access all containers
   - Or analyze containers separately

## 📞 Getting Additional Help

### Self-Service Resources

1. **Documentation**
   - [User Guide](user-guide.md) - Complete feature documentation
   - [Installation Guide](installation.md) - Setup instructions
   - [Developer Guide](developer-guide.md) - Technical details

2. **Community Resources**
   - [GitHub Discussions](https://github.com/masterK0927/aiTabOrganiser/discussions)
   - [Issue Tracker](https://github.com/masterK0927/aiTabOrganiser/issues)

### Reporting Issues

#### Information to Include

1. **System Information**
   ```
   Browser: Chrome 120.0.6099.109
   OS: Windows 11 / macOS 14 / Ubuntu 22.04
   Extension Version: 1.5.0
   ```

2. **Problem Description**
   - What you were trying to do
   - What happened instead
   - Steps to reproduce
   - Error messages (exact text)

3. **Screenshots/Console Logs**
   - UI screenshots showing the problem
   - Browser console errors
   - Extension console logs

#### Bug Report Template

```markdown
**Bug Description**
Brief description of the issue

**Steps to Reproduce**
1. Step one
2. Step two
3. Step three

**Expected Behavior**
What should have happened

**Actual Behavior**
What actually happened

**System Information**
- Browser: [Chrome/Firefox] [Version]
- OS: [Windows/macOS/Linux] [Version]
- Extension Version: [1.5.0]

**Console Errors**
```
Paste any error messages here
```

**Screenshots**
Attach relevant screenshots
```

### Contact Support

#### Email Support
- **Email**: masterK0927@protonmail.com
- **Response Time**: Usually within 24-48 hours
- **Include**: System info, detailed description, screenshots

#### GitHub Issues
- **Best for**: Bug reports, feature requests
- **Public**: Helps other users with similar issues
- **Searchable**: Check existing issues first

## 📚 FAQ

### Frequently Asked Questions

#### Q: Why does analysis take so long?
**A:** Analysis time depends on tab count and content complexity. For 10+ tabs, it may take 5-15 seconds. Try reducing tab count or using "Current Window" mode.

#### Q: Can I recover deleted workspaces?
**A:** Currently, there's no built-in recovery. Always export your data before major changes. Future versions will include an undo feature.

#### Q: Does the extension work offline?
**A:** Yes, the extension works offline for existing workspaces. However, tab analysis requires loaded web pages for best results.

#### Q: Why are some tabs not included in analysis?
**A:** The extension filters out system tabs (chrome://, about:, extension pages) for security and relevance. Only regular web pages are analyzed.

#### Q: Can I customize the grouping algorithm?
**A:** Yes! Go to Settings → Advanced to adjust similarity weights and thresholds. See the [API Reference](api-reference.md) for details.

#### Q: How much storage does the extension use?
**A:** Typically 1-5MB depending on workspace count. Each workspace stores only basic tab metadata, not full page content.

#### Q: Is my browsing data sent anywhere?
**A:** No. All analysis happens locally on your device. No data is sent to external servers. See our privacy policy in the [User Guide](user-guide.md).

#### Q: Can I use this with other tab management extensions?
**A:** Generally yes, but conflicts may occur. If you experience issues, try disabling other tab extensions temporarily.

---

**Still need help?** Don't hesitate to reach out through our [GitHub Issues](https://github.com/masterK0927/aiTabOrganiser/issues) or email support!