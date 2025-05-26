/**
 * Compatibility layer for browser APIs between Chrome and Firefox
 */

const BROWSER_TARGET = "__BROWSER_TARGET__";
const runtimeBrowser = typeof browser !== 'undefined' ? 'firefox' : 'chrome';

export const targetBrowser = BROWSER_TARGET !== "__BROWSER_TARGET__" ? BROWSER_TARGET : runtimeBrowser;
export const isFirefox = targetBrowser === 'firefox';
export const isChrome = targetBrowser === 'chrome';
export const browserAPI = isFirefox ? browser : chrome;

/**
 * Get the storage API with consistent interface
 * @returns {Object} Storage API
 */
export function getStorage() {
  try {
    if (typeof browser !== 'undefined' && browser && browser.storage) {
      return browser.storage.local;
    } else if (typeof chrome !== 'undefined' && chrome && chrome.storage) {
      return chrome.storage.local;
    }
    return {
      get: (keys, callback) => {
        callback({});
      },
      set: (items, callback) => {
        if (callback) callback();
      }
    };
  } catch (error) {
    console.error("Error accessing browser storage API:", error);
    return null;
  }
}

/**
 * Query for tabs with consistent interface
 * @param {Object} queryInfo - Query parameters
 * @returns {Promise<Array>} - Promise resolving to array of tabs
 */
export function queryTabsAPI(queryInfo = {}) {
  if (isFirefox) {
    return browserAPI.tabs.query(queryInfo);
  } else {
    return new Promise((resolve) => {
      chrome.tabs.query(queryInfo, (tabs) => {
        resolve(Array.from(tabs));
      });
    });
  }
}

/**
 * Create a new window with consistent interface
 * @param {Object} createProperties - Window creation properties
 * @returns {Promise<Object>} - Promise resolving to created window
 */
export function createWindow(createProperties) {
  if (isFirefox) {
    return browserAPI.windows.create(createProperties);
  } else {
    return new Promise((resolve) => {
      chrome.windows.create(createProperties, (window) => {
        resolve(window);
      });
    });
  }
}

/**
 * Get the current window with consistent interface
 * @returns {Promise<Object>} - Promise resolving to current window
 */
export function getCurrentWindow() {
  if (isFirefox) {
    return browserAPI.windows.getCurrent();
  } else {
    return new Promise((resolve) => {
      chrome.windows.getCurrent((window) => {
        resolve(window);
      });
    });
  }
}

/**
 * Get all windows with consistent interface
 * @returns {Promise<Array>} - Promise resolving to array of windows
 */
export function getAllWindows() {
  if (isFirefox) {
    return browserAPI.windows.getAll({ populate: true });
  } else {
    return new Promise((resolve) => {
      chrome.windows.getAll({ populate: true }, (windows) => {
        resolve(windows);
      });
    });
  }
}

/**
 * Create or modify a tab group with compatibility for both browsers
 * @param {Object} options - Group options
 * @returns {Promise<number>} - Promise resolving to group ID or -1 for Firefox
 */
export function createTabGroup(options) {
  if (isFirefox) {
    return Promise.resolve(-1);
  } else {
    return new Promise((resolve) => {
      chrome.tabs.group(options, (groupId) => {
        resolve(groupId);
      });
    });
  }
}

/**
 * Update a tab group with compatibility for both browsers
 * @param {number} groupId - Group ID
 * @param {Object} options - Update options
 * @returns {Promise<void>}
 */
export function updateTabGroup(groupId, options) {
  if (isFirefox) {
    return Promise.resolve();
  } else {
    return new Promise((resolve) => {
      if (chrome.tabGroups) {
        chrome.tabGroups.update(groupId, options, () => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

/**
 * Ungroup tabs with compatibility for both browsers
 * @param {Array} tabIds - Tab IDs to ungroup
 * @returns {Promise<void>}
 */
export function ungroupTabs(tabIds) {
  if (isFirefox) {
    return Promise.resolve();
  } else {
    return new Promise((resolve) => {
      chrome.tabs.ungroup(tabIds, () => {
        resolve();
      });
    });
  }
}

/**
 * Send a message with consistent interface
 * @param {Object} message - Message to send
 * @returns {Promise<any>} - Promise resolving to response
 */
export function sendMessage(message) {
  return new Promise((resolve, reject) => {
    try {
      if (typeof browser !== 'undefined' && browser.runtime) {
        browser.runtime.sendMessage(message)
          .then(resolve)
          .catch(reject);
      } else if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      } else {
        reject(new Error("No browser runtime API available"));
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get extension URL with consistent interface
 * @param {string} path - Path to resource
 * @returns {string} - Extension URL
 */
export function getURL(path) {
  return browserAPI.runtime.getURL(path);
}

/**
 * Remove tabs with consistent interface
 * @param {number|Array} tabIds - Tab ID(s) to remove
 * @returns {Promise<void>} - Promise resolving when tabs are removed
 */
export function removeTabs(tabIds) {
  if (isFirefox) {
    return browserAPI.tabs.remove(tabIds);
  } else {
    return new Promise((resolve) => {
      chrome.tabs.remove(tabIds, () => {
        resolve();
      });
    });
  }
}

/**
 * Create a new tab with consistent interface
 * @param {Object} createProperties - Tab creation properties
 * @returns {Promise<Object>} - Promise resolving to created tab
 */
export function createTab(createProperties) {
  if (isFirefox) {
    return browserAPI.tabs.create(createProperties);
  } else {
    return new Promise((resolve) => {
      chrome.tabs.create(createProperties, (tab) => {
        resolve(tab);
      });
    });
  }
}

/**
 * Activates a tab with consistent interface
 * @param {number} tabId - Tab ID to activate
 * @returns {Promise<void>} - Promise resolving when the tab is activated
 */
export function activateTab(tabId) {
  if (isFirefox) {
    return browserAPI.tabs.update(tabId, { active: true });
  } else {
    return new Promise((resolve) => {
      chrome.tabs.update(tabId, { active: true }, () => {
        resolve();
      });
    });
  }
}