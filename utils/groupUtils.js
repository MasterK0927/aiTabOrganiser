import { queryTabs } from './tabUtils.js';
import { getCurrentWindow, createTabGroup, updateTabGroup, ungroupTabs, isFirefox, getStorage } from './browserAPI.js';

async function loadSettings() {
  return new Promise((resolve) => {
    const storage = getStorage();
    storage.get(['ai_tab_manager_settings'], (result) => {
      resolve(result.ai_tab_manager_settings || {});
    });
  });
}

/**
 * Groups all open tabs for the given workspace in the current window.
 * It collects all matching open tab IDs (including duplicates) and groups them.
 * @param {Object} workspace - The workspace object containing saved tabs.
 * @returns {Promise<Object>} - A promise resolving with a success message or error.
 */
export async function groupExistingWorkspaceTabsInCurrentWindow(workspace) {
  try {
    const settings = await loadSettings();
    const autoGroupTabs = settings.hasOwnProperty('autoGroupTabs') ? settings.autoGroupTabs : true;
    
    if (!autoGroupTabs) {
      return { success: true, info: "Auto-grouping disabled in settings" };
    }
    
    if (!workspace || !workspace.tabs || workspace.tabs.length === 0) {
      return { error: "No tabs in workspace" };
    }
    
    const workspaceUrls = workspace.tabs.map(tab => tab.url);
    const currentTabs = await queryTabs({ currentWindow: true });
    
    const matchingTabIds = currentTabs
      .filter(tab => workspaceUrls.some(url => url === tab.url))
      .map(tab => tab.id);
    
    if (matchingTabIds.length === 0) {
      return { error: "No matching tabs found in current window" };
    }
    
    if (isFirefox) {
      console.log(`Would group ${matchingTabIds.length} tabs in Firefox for workspace: ${workspace.name}`);
      return { 
        success: true, 
        info: "Firefox doesn't support native tab grouping, but tabs are identified" 
      };
    } else {
      // Chrome specific behavior
      const groupId = await createTabGroup({ tabIds: matchingTabIds });
      await updateTabGroup(groupId, {
        title: workspace.name,
        color: "blue"
      });
      return { success: true };
    }
  } catch (error) {
    console.error("Failed to group workspace tabs:", error);
    return { error: "Failed to group workspace tabs" };
  }
}

/**
 * Ungroups all open tabs for the given workspace in the current window.
 * This revised function collects all matching tabs for each saved tab and then ungroup them.
 * @param {Object} workspace - The workspace object containing saved tabs.
 * @returns {Promise<Object>} - A promise resolving with a success message or error.
 */
export async function ungroupWorkspaceTabs(workspace) {
  try {
    const currentWindow = await getCurrentWindow();
    const openTabs = await queryTabs({ windowId: currentWindow.id });
    
    let matchingTabIds = [];
    for (const savedTab of workspace.tabs) {
      const matches = openTabs.filter(openTab =>
        openTab.url && savedTab.url && openTab.url === savedTab.url
      );
      matchingTabIds.push(...matches.map(tab => tab.id));
    }
    
    matchingTabIds = [...new Set(matchingTabIds)];
    
    if (matchingTabIds.length > 0 && !isFirefox) {
      await ungroupTabs(matchingTabIds);
      console.log("Ungrouped tabs:", matchingTabIds);
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to ungroup workspace tabs:", error);
    return { error: "Failed to ungroup workspace tabs" };
  }
}