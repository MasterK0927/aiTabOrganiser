import { groupTabsBySimilarity } from "./ml-model.js";

const STORAGE_KEY = "ai_tab_manager_workspaces";

function queryTabs(queryInfo = {}) {
  return new Promise((resolve) => {
    chrome.tabs.query(queryInfo, (tabs) => {
      resolve(Array.from(tabs)); 
    });
  });
}

function ensureArray(possibleArray) {
    if (!possibleArray) return [];
    if (Array.isArray(possibleArray)) return possibleArray;
    if (typeof possibleArray === 'object') return Object.values(possibleArray);
    return [possibleArray];
  }

async function loadWorkspaces() {
  const result = await chrome.storage.local.get([STORAGE_KEY]);
  return result[STORAGE_KEY] || [];
}

async function saveWorkspaces(workspaces) {
  await chrome.storage.local.set({ [STORAGE_KEY]: workspaces });
}

function generateWorkspaceName(tabs) {
    const safeTabs = ensureArray(tabs);
    
    const domains = safeTabs.map(tab => {
      try {
        return tab.url ? new URL(tab.url).hostname.replace('www.', '') : '';
      } catch (e) {
        return '';
      }
    }).filter(Boolean);
  
    const domainCounts = {};
    domains.forEach(domain => {
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;
    });
  
    const primaryDomain = Object.entries(domainCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];
  
    const titleWords = safeTabs
      .map(tab => tab.title || '') 
      .flatMap(title => title.toLowerCase().split(/\W+/))
      .filter(word => word.length > 3);
  
    const wordCounts = {};
    titleWords.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
  
    const commonWord = Object.entries(wordCounts)
      .filter(([word]) => !['http', 'https', 'www', 'com'].includes(word))
      .sort((a, b) => b[1] - a[1])[0]?.[0];
  
    if (primaryDomain && commonWord) {
      return `${primaryDomain} - ${commonWord}`;
    } else if (primaryDomain) {
      return primaryDomain;
    } else {
      return `Workspace (${new Date().toLocaleDateString()})`;
    }
  }

async function openWorkspaceTabs(workspace) {
  try {
    const newWindow = await chrome.windows.create({
      focused: true,
      state: 'maximized'
    });

    const tabPromises = workspace.tabs.map(tab => 
      chrome.tabs.create({
        windowId: newWindow.id,
        url: tab.url,
        active: false
      })
    );

    await Promise.all(tabPromises);

    const initialTabs = await queryTabs({ windowId: newWindow.id });
    if (initialTabs.length > workspace.tabs.length) {
      await chrome.tabs.remove(initialTabs[0].id);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to open workspace tabs:', error);
    return { error: 'Failed to open workspace tabs' };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "analyze_tabs") {
      const analyzeTabsPromise = new Promise((resolve, reject) => {
        chrome.tabs.query({}, async (rawTabs) => {
          try {
            console.log('Raw tabs received:', rawTabs);
            
            const validTabs = ensureArray(rawTabs).filter(tab => 
              tab.url && 
              !tab.url.startsWith('chrome://') && 
              !tab.url.startsWith('chrome-extension://')
            );
            
            console.log('Valid tabs:', validTabs);
            
            if (validTabs.length === 0) {
              throw new Error('No valid tabs found');
            }
            
            const groups = groupTabsBySimilarity(validTabs);
            console.log('Grouped tabs:', groups);
            
            const workspaces = groups.map(group => ({
              name: generateWorkspaceName(group.tabs),
              tabs: group.tabs,
              createdAt: new Date().toISOString()
            }));
            
            console.log('Generated workspaces:', workspaces);
            
            await saveWorkspaces(workspaces);
            
            resolve(workspaces);
          } catch (error) {
            console.error('Tab analysis error:', error);
            reject(error);
          }
        });
      });
  
      analyzeTabsPromise
        .then(workspaces => {
          sendResponse({ success: true, workspaces });
        })
        .catch(error => {
          sendResponse({ 
            error: error.message || 'Failed to analyze tabs', 
            details: error.toString() 
          });
        });
  
      return true;
    }
  
  
    if (message.action === "get_workspaces") {
      loadWorkspaces()
        .then(workspaces => sendResponse({ success: true, workspaces }))
        .catch(error => {
          console.error('Failed to load workspaces:', error);
          sendResponse({ error: 'Failed to load workspaces' });
        });
      return true;
    }
  
    if (message.action === "switch_workspace") {
      loadWorkspaces()
        .then(async workspaces => {
          const workspace = workspaces[message.workspaceIndex];
          if (!workspace) {
            throw new Error('Workspace not found');
          }
          return openWorkspaceTabs(workspace);
        })
        .then(result => sendResponse(result))
        .catch(error => {
          console.error('Workspace switch failed:', error);
          sendResponse({ error: error.message });
        });
      return true;
    }
  
    if (message.action === "save_workspaces") {
      saveWorkspaces(message.workspaces)
        .then(() => sendResponse({ success: true }))
        .catch(error => {
          console.error('Failed to save workspaces:', error);
          sendResponse({ error: 'Failed to save workspaces' });
        });
      return true;
    }
  });