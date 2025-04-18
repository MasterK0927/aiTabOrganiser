import { getStorage } from "./browserAPI.js";

const STORAGE_KEY = "ai_tab_manager_workspaces";

/**
 * Loads workspaces from chrome.storage.
 * @returns {Promise<Array>} - A promise that resolves to the array of workspaces.
 */
export async function loadWorkspaces() {
  return new Promise((resolve) => {
    const storage = getStorage();
    storage.get([STORAGE_KEY], (result) => {
      resolve(result[STORAGE_KEY] || []);
    });
  });
}

/**
 * Saves the provided workspaces array to chrome.storage.
 * @param {Array} workspaces - The workspaces to save.
 * @returns {Promise<void>}
 */
export async function saveWorkspaces(workspaces) {
  return new Promise((resolve) => {
    const storage = getStorage();
    storage.set({ [STORAGE_KEY]: workspaces }, () => {
      resolve();
    });
  });
}

/**
 * Generates a workspace name based on the tabs within it.
 * @param {Array} tabs - The tabs to generate the name from.
 * @returns {string} - A generated workspace name.
 */
export function generateWorkspaceName(tabs) {
  const safeTabs = Array.isArray(tabs) ? tabs : Object.values(tabs || {});
  const domains = safeTabs
    .map(tab => {
      try {
        return tab.url ? new URL(tab.url).hostname.replace("www.", "") : "";
      } catch (e) {
        return "";
      }
    })
    .filter(Boolean);

  const domainCounts = {};
  domains.forEach(domain => {
    domainCounts[domain] = (domainCounts[domain] || 0) + 1;
  });
  const primaryDomain = Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  const titleWords = safeTabs
    .map(tab => tab.title || "")
    .flatMap(title => title.toLowerCase().split(/\W+/))
    .filter(word => word.length > 3);

  const wordCounts = {};
  titleWords.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });

  const commonWord = Object.entries(wordCounts)
    .filter(([word]) => !["http", "https", "www", "com"].includes(word))
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  if (primaryDomain && commonWord) {
    return `${primaryDomain} - ${commonWord}`;
  } else if (primaryDomain) {
    return primaryDomain;
  } else {
    return `Workspace (${new Date().toLocaleDateString()})`;
  }
}
