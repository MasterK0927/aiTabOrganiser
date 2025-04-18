import { groupTabsBySimilarity } from "./ml-model.js";
import { queryTabs, ensureArray } from "./utils/tabUtils.js";
import { loadWorkspaces, saveWorkspaces, generateWorkspaceName } from "./utils/workspaceUtils.js";
import { groupExistingWorkspaceTabsInCurrentWindow, ungroupWorkspaceTabs } from "./utils/groupUtils.js";
import { getURL, createWindow, removeTabs, isFirefox } from "./utils/browserAPI.js";
import { captureTabScreenshot } from "./utils/preview.js";

// Create message handler function for reuse
const handleMessage = async (message, sender) => {
  switch (message.action) {
    case "analyze_tabs":
      try {
        const rawTabs = await queryTabs({});
        const validTabs = ensureArray(rawTabs).filter(tab =>
          tab.url &&
          !tab.url.startsWith("chrome://") &&
          !tab.url.startsWith("chrome-extension://") &&
          !tab.url.startsWith("moz-extension://") &&
          !tab.url.startsWith("about:")
        );
        
        if (validTabs.length === 0) {
          throw new Error("No valid tabs found");
        }
        
        const groups = groupTabsBySimilarity(validTabs);
        const workspaces = groups.map(group => ({
          name: generateWorkspaceName(group.tabs),
          tabs: group.tabs,
          createdAt: new Date().toISOString()
        }));
        
        await saveWorkspaces(workspaces);

        for (const workspace of workspaces) {
          await groupExistingWorkspaceTabsInCurrentWindow(workspace);
        }
        
        return { success: true, workspaces };
      } catch (error) {
        console.error("Tab analysis error:", error);
        return {
          error: error.message || "Failed to analyze tabs",
          details: error.toString()
        };
      }

    case "get_workspaces":
      try {
        const workspaces = await loadWorkspaces();
        return { success: true, workspaces };
      } catch (error) {
        console.error("Failed to load workspaces:", error);
        return { error: "Failed to load workspaces" };
      }

    case "capture_tab_screenshot":
      try {
        const tabId = message.tabId;
        const screenshot = await captureTabScreenshot(tabId);
        return { success: true, screenshot };
      } catch (error) {
        console.error("Failed to capture screenshot:", error);
        return { error: "Failed to capture screenshot" };
      }

    case "switch_workspace_sandboxed":
      try {
        const workspaces = await loadWorkspaces();
        const workspace = workspaces[message.workspaceIndex];
        
        if (!workspace) throw new Error("Workspace not found");
        
        const newWindow = await createWindow({
          url: getURL("sandbox.html") + "?workspaceIndex=" + message.workspaceIndex,
          focused: true
        });
        
        const initialTabs = await queryTabs({ windowId: newWindow.id });
        if (initialTabs.length > 1) await removeTabs(initialTabs[0].id);
        
        return { success: true };
      } catch (error) {
        console.error("Sandboxed workspace switch failed:", error);
        return { error: error.message };
      }

    case "delete_workspace":
      try {
        const workspaces = await loadWorkspaces();
        const workspace = workspaces[message.workspaceIndex];
        
        if (!workspace) throw new Error("Workspace not found");
        
        await ungroupWorkspaceTabs(workspace);
        workspaces.splice(message.workspaceIndex, 1);
        await saveWorkspaces(workspaces);
        
        return { success: true, workspaces };
      } catch (error) {
        console.error("Failed to delete workspace:", error);
        return { error: error.message };
      }

    case "save_workspaces":
      try {
        await saveWorkspaces(message.workspaces);
        return { success: true };
      } catch (error) {
        console.error("Failed to save workspaces:", error);
        return { error: "Failed to save workspaces" };
      }

    default:
      console.warn("Unknown action:", message.action);
      return { error: "Unknown action" };
  }
};

if (isFirefox) {
  // Firefox listener
  browser.runtime.onMessage.addListener((message, sender) => {
    return handleMessage(message, sender);
  });
} else {
  // Chrome listener
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender)
      .then(response => sendResponse(response))
      .catch(error => {
        console.error("Error in message handler:", error);
        sendResponse({ error: error.message || "Unknown error" });
      });
    return true;
  });
}