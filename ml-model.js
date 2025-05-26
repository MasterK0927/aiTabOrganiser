import { getStorage } from './utils/browserAPI.js';

const DEFAULT_SIMILARITY_THRESHOLD = 0.5;
const DEFAULT_DOMAIN_WEIGHT = 0.6;
const DEFAULT_PATH_WEIGHT = 0.3;
const DEFAULT_TITLE_WEIGHT = 0.1;
const DEFAULT_MIN_WORKSPACE_SIZE = 2;

const API_ENDPOINT = 'https://aitaborganiser.onrender.com/group-tabs';

async function loadSettings() {
  return new Promise((resolve) => {
    const storage = getStorage();
    storage.get([
      "similarity_threshold",
      "domain_weight",
      "path_weight",
      "title_weight",
      "min_workspace_size",
      "auto_group_tabs",
      "naming_strategy",
      "tab_source"
    ], (result) => {
      resolve({
        similarityThreshold: result.similarity_threshold ?? DEFAULT_SIMILARITY_THRESHOLD,
        domainWeight: result.domain_weight ?? DEFAULT_DOMAIN_WEIGHT,
        pathWeight: result.path_weight ?? DEFAULT_PATH_WEIGHT,
        titleWeight: result.title_weight ?? DEFAULT_TITLE_WEIGHT,
        minWorkspaceSize: result.min_workspace_size ?? DEFAULT_MIN_WORKSPACE_SIZE,
        autoGroupTabs: result.auto_group_tabs !== undefined ? result.auto_group_tabs : true,
        namingStrategy: result.naming_strategy || 'domain-word',
        tabSource: result.tab_source || 'current-window'
      });
    });
  });
}

async function groupTabsWithAPI(validTabs, settings) {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tabs: validTabs,
        settings
      })
    });

    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${responseText}`);
    }

    const data = await response.json();
    return Array.isArray(data.groups) ? data.groups : [];
  } catch (error) {
    console.error("Error grouping tabs with API:", error);
    return [];
  }
}

/**
 * Groups tabs by similarity using API (ML model).
 * @param {Array} tabs - An array of tabs.
 * @returns {Promise<Array>} - A promise resolving to an array of groups with properties { name, tabs }.
 */
export async function groupTabsBySimilarity(tabs) {
  const settings = await loadSettings();

  const validTabs = tabs.filter(tab =>
    tab &&
    tab.url &&
    tab.url.trim() !== "" &&
    !tab.url.startsWith("chrome://") &&
    !tab.url.startsWith("chrome-extension://") &&
    !tab.url.startsWith("moz-extension://") &&
    !tab.url.startsWith("about:")
  );

  if (validTabs.length === 0) {
    return [];
  }

  const apiTabs = validTabs.map(tab => ({
    url: tab.url,
    title: tab.title
  }));

  return await groupTabsWithAPI(apiTabs, settings);
}
