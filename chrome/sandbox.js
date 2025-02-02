document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const workspaceIndex = params.get("workspaceIndex");
  
    chrome.storage.local.get(["ai_tab_manager_workspaces"], (data) => {
      const workspaces = data["ai_tab_manager_workspaces"] || [];
      const workspace = workspaces[workspaceIndex];
      if (!workspace) {
        document.getElementById("tabs-container").textContent = "Workspace not found.";
        return;
      }
      const container = document.getElementById("tabs-container");
  
      workspace.tabs.forEach((tab) => {
        if (!tab.url) return;
        const iframe = document.createElement("iframe");
        iframe.setAttribute("sandbox", "allow-scripts allow-forms");
        iframe.src = tab.url;
        container.appendChild(iframe);
      });
    });
  });  