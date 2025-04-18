import { getStorage } from './utils/browserAPI.js';

const DEFAULT_SIMILARITY_THRESHOLD = 0.5;
const DEFAULT_DOMAIN_WEIGHT = 0.6;
const DEFAULT_PATH_WEIGHT = 0.3;
const DEFAULT_TITLE_WEIGHT = 0.1;
const DEFAULT_MIN_WORKSPACE_SIZE = 2;

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
        similarityThreshold: result.similarity_threshold || DEFAULT_SIMILARITY_THRESHOLD,
        domainWeight: result.domain_weight || DEFAULT_DOMAIN_WEIGHT,
        pathWeight: result.path_weight || DEFAULT_PATH_WEIGHT,
        titleWeight: result.title_weight || DEFAULT_TITLE_WEIGHT,
        minWorkspaceSize: result.min_workspace_size || DEFAULT_MIN_WORKSPACE_SIZE,
        autoGroupTabs: result.auto_group_tabs !== undefined ? result.auto_group_tabs : true,
        namingStrategy: result.naming_strategy || 'domain-word',
        tabSource: result.tab_source || 'current-window'
      });
    });
  });
}

/**
 * Groups tabs by similarity based on domain, URL path, and common title words.
 * @param {Array} tabs - An array of tabs.
 * @returns {Promise<Array>} - A promise resolving to an array of groups with properties { name, tabs }.
 */
export async function groupTabsBySimilarity(tabs) {
  const settings = await loadSettings();
  console.log("Using settings for grouping:", settings);
  
  const SIMILARITY_THRESHOLD = settings.similarityThreshold || DEFAULT_SIMILARITY_THRESHOLD;
  const DOMAIN_WEIGHT = settings.domainWeight || DEFAULT_DOMAIN_WEIGHT;
  const PATH_WEIGHT = settings.pathWeight || DEFAULT_PATH_WEIGHT;
  const TITLE_WEIGHT = settings.titleWeight || DEFAULT_TITLE_WEIGHT;
  const MIN_WORKSPACE_SIZE = settings.minWorkspaceSize || DEFAULT_MIN_WORKSPACE_SIZE;
  const NAMING_STRATEGY = settings.namingStrategy || 'domain-word';
  
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

  const calculateSimilarity = (tab1, tab2) => {
    try {
      const url1 = new URL(tab1.url);
      const url2 = new URL(tab2.url);
      const domainMatch = url1.hostname.replace("www.", "") === url2.hostname.replace("www.", "");
      const pathSimilarity = url1.pathname.split("/").filter(Boolean).some(
        part => url2.pathname.includes(part)
      );
      
      const titleWords1 = (tab1.title || "").toLowerCase().split(/\W+/);
      const titleWords2 = (tab2.title || "").toLowerCase().split(/\W+/);
      const commonWords = titleWords1.filter(word =>
        titleWords2.includes(word) && word.length > 3
      );
      
      return (domainMatch ? DOMAIN_WEIGHT : 0) + 
             (pathSimilarity ? PATH_WEIGHT : 0) + 
             (commonWords.length > 0 ? TITLE_WEIGHT : 0);
    } catch {
      return 0;
    }
  };

  const groups = [];
  validTabs.forEach((tab) => {
    const similarGroupIndex = groups.findIndex(group =>
      group.some(existingTab => calculateSimilarity(tab, existingTab) >= SIMILARITY_THRESHOLD)
    );
    if (similarGroupIndex !== -1) {
      groups[similarGroupIndex].push(tab);
    } else {
      groups.push([tab]);
    }
  });

  const result = groups.filter(group => group.length >= MIN_WORKSPACE_SIZE).map(group => {
    const domains = group.map(tab => {
      try {
        return new URL(tab.url).hostname.replace("www.", "");
      } catch {
        return null;
      }
    }).filter(Boolean);

    const domainCounts = {};
    domains.forEach(domain => {
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;
    });

    const primaryDomain = Object.keys(domainCounts).reduce(
      (a, b) => domainCounts[a] > domainCounts[b] ? a : b,
      null
    );

    const titleWords = group
      .flatMap(tab => (tab.title || "").toLowerCase().split(/\W+/))
      .filter(word => word.length > 3);

    const wordCounts = {};
    titleWords.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    const commonWord = Object.keys(wordCounts).reduce(
      (a, b) => wordCounts[a] > wordCounts[b] ? a : b,
      null
    );

    let name;
    console.log("Using naming strategy:", NAMING_STRATEGY);
    
    if (NAMING_STRATEGY === 'domain-word') {
      name = primaryDomain 
        ? (commonWord ? `${primaryDomain} - ${commonWord}` : primaryDomain)
        : (commonWord || "Workspace");
    } else if (NAMING_STRATEGY === 'domain-only') {
      name = primaryDomain || "Workspace";
    } else if (NAMING_STRATEGY === 'auto-numbered') {
      name = `Workspace ${groups.indexOf(group) + 1}`;
    } else {
      name = primaryDomain 
        ? (commonWord ? `${primaryDomain} - ${commonWord}` : primaryDomain)
        : (commonWord || "Workspace");
    }

    return {
      name: name,
      tabs: group
    };
  });
  
  console.log("Returning groups from ml-model:", result);
  return Array.isArray(result) ? result : [];
}