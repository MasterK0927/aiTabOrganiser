import { groupTabsBySimilarity } from "./ml-model.js";
import { queryTabs, ensureArray } from "./utils/tabUtils.js";
import { loadWorkspaces, saveWorkspaces, generateWorkspaceName } from "./utils/workspaceUtils.js";
import { groupExistingWorkspaceTabsInCurrentWindow, ungroupWorkspaceTabs } from "./utils/groupUtils.js";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "analyze_tabs":
      chrome.tabs.query({}, async (rawTabs) => {
        try {
          const validTabs = ensureArray(rawTabs).filter(tab =>
            tab.url &&
            !tab.url.startsWith("chrome://") &&
            !tab.url.startsWith("chrome-extension://")
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
          sendResponse({ success: true, workspaces });
        } catch (error) {
          console.error("Tab analysis error:", error);
          sendResponse({
            error: error.message || "Failed to analyze tabs",
            details: error.toString()
          });
        }
      });
      return true;

    case "get_workspaces":
      loadWorkspaces()
        .then(workspaces => sendResponse({ success: true, workspaces }))
        .catch(error => {
          console.error("Failed to load workspaces:", error);
          sendResponse({ error: "Failed to load workspaces" });
        });
      return true;

    case "switch_workspace_sandboxed":
      loadWorkspaces()
        .then(async (workspaces) => {
          const workspace = workspaces[message.workspaceIndex];
          if (!workspace) throw new Error("Workspace not found");
          const newWindow = await chrome.windows.create({
            url: chrome.runtime.getURL("sandbox.html") + "?workspaceIndex=" + message.workspaceIndex,
            focused: true,
            state: "maximized"
          });
          const initialTabs = await queryTabs({ windowId: newWindow.id });
          if (initialTabs.length > 1) await chrome.tabs.remove(initialTabs[0].id);
          return { success: true };
        })
        .then(result => sendResponse(result))
        .catch(error => {
          console.error("Sandboxed workspace switch failed:", error);
          sendResponse({ error: error.message });
        });
      return true;

    case "delete_workspace":
      loadWorkspaces()
        .then(async (workspaces) => {
          const workspace = workspaces[message.workspaceIndex];
          if (!workspace) throw new Error("Workspace not found");
          await ungroupWorkspaceTabs(workspace);
          workspaces.splice(message.workspaceIndex, 1);
          await saveWorkspaces(workspaces);
          sendResponse({ success: true, workspaces });
        })
        .catch(error => {
          console.error("Failed to delete workspace:", error);
          sendResponse({ error: error.message });
        });
      return true;

    case "save_workspaces":
      saveWorkspaces(message.workspaces)
        .then(() => sendResponse({ success: true }))
        .catch(error => {
          console.error("Failed to save workspaces:", error);
          sendResponse({ error: "Failed to save workspaces" });
        });
      return true;

    default:
      console.warn("Unknown action:", message.action);
      sendResponse({ error: "Unknown action" });
  }
});