const workspaceList = document.getElementById("workspace-list");
const searchWorkspaces = document.getElementById("search-workspaces");
const tabsContainer = document.getElementById("tabs-container");
const statusMessage = document.getElementById("status-message");

let activeWorkspaceIndex = -1;

function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.className = isError ? "error" : "success";
  setTimeout(() => {
    statusMessage.textContent = "";
    statusMessage.className = "";
  }, 3000);
}

function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

function renderTabs(tabs, parentElement, level = 0) {
  if (!tabs || !Array.isArray(tabs) || tabs.length === 0) return;
  const tabsList = document.createElement("div");
  tabsList.className = "tabs-list";
  tabsList.style.marginLeft = `${level * 20}px`;
  tabs.forEach(tab => {
    if (!tab || !tab.url) return;
    const tabCard = document.createElement("div");
    tabCard.className = "tab-card";
    
    if (tab.favIconUrl) {
      const icon = document.createElement("img");
      icon.src = tab.favIconUrl;
      icon.className = "tab-icon";
      icon.width = 16;
      icon.height = 16;
      icon.onerror = () => { icon.style.display = "none"; };
      tabCard.appendChild(icon);
    }
    
    const tabName = document.createElement("a");
    tabName.href = "#";
    tabName.className = "tab-name";
    tabName.textContent = tab.title || "Untitled Tab";
    tabName.title = tab.url;
    tabName.onclick = (e) => {
      e.preventDefault();
      if (tab.url) chrome.tabs.create({ url: tab.url });
    };
    tabCard.appendChild(tabName);
    
    try {
      const domain = new URL(tab.url).hostname;
      const domainBadge = document.createElement("span");
      domainBadge.className = "domain-badge";
      domainBadge.textContent = domain;
      tabCard.appendChild(domainBadge);
    } catch (error) {
      console.log("Error parsing URL:", tab.url);
    }
    
    tabsList.appendChild(tabCard);
    
    if (tab.tabs && tab.tabs.length > 0) {
      renderTabs(tab.tabs, tabsList, level + 1);
    }
  });
  parentElement.appendChild(tabsList);
}

async function renderWorkspaces(workspaces, filter = "") {
  workspaceList.innerHTML = "";
  tabsContainer.innerHTML = "";
  const filteredWorkspaces = workspaces.filter(w =>
    w.name.toLowerCase().includes(filter.toLowerCase())
  );
  
  if (filteredWorkspaces.length === 0) {
    const noWorkspacesMessage = document.createElement("div");
    noWorkspacesMessage.className = "no-workspaces";
    noWorkspacesMessage.textContent = filter 
      ? "No matching workspaces found." 
      : "No workspaces yet. Click 'Analyze Tabs' to create workspaces.";
    workspaceList.appendChild(noWorkspacesMessage);
    return;
  }
  
  filteredWorkspaces.forEach((workspace, index) => {
    const workspaceCard = document.createElement("div");
    workspaceCard.className = `workspace-card ${index === 0 ? "active" : ""}`;
  
    const title = document.createElement("input");
    title.type = "text";
    title.value = workspace.name;
    title.className = "workspace-title";
    title.addEventListener("change", async () => {
      workspaces[index].name = title.value;
      try {
        await chrome.runtime.sendMessage({ 
          action: "save_workspaces", 
          workspaces 
        });
        showStatus("Workspace renamed successfully");
      } catch (error) {
        showStatus("Failed to rename workspace", true);
        title.value = workspace.name;
      }
    });
  
    const tabCount = document.createElement("span");
    tabCount.className = "tab-count";
    tabCount.textContent = `${workspace.tabs.length} tabs`;
  
    const controls = document.createElement("div");
    controls.className = "workspace-controls";
  
    // "Open (sandboxed)" button.
    const openSandboxButton = document.createElement("button");
    openSandboxButton.textContent = "Open (sandboxed)";
    openSandboxButton.className = "open-button";
    openSandboxButton.onclick = async () => {
      try {
        const response = await chrome.runtime.sendMessage({
          action: "switch_workspace_sandboxed",
          workspaceIndex: index,
        });
        if (response.error) throw new Error(response.error);
        showStatus("Workspace opened in sandboxed window");
      } catch (error) {
        showStatus("Failed to open workspace in sandbox", true);
      }
    };
  
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "×";
    deleteButton.className = "delete-button";
    deleteButton.onclick = async () => {
      if (confirm("Delete this workspace?")) {
        try {
          const response = await chrome.runtime.sendMessage({
            action: "delete_workspace",
            workspaceIndex: index,
          });
          if (response.error) throw new Error(response.error);
          showStatus("Workspace deleted");
          renderWorkspaces(response.workspaces);
        } catch (error) {
          showStatus("Failed to delete workspace", true);
        }
      }
    };
  
    controls.appendChild(tabCount);
    controls.appendChild(openSandboxButton);
    controls.appendChild(deleteButton);
  
    workspaceCard.appendChild(title);
    workspaceCard.appendChild(controls);
    workspaceList.appendChild(workspaceCard);
  });
  
  filteredWorkspaces.forEach((workspace) => {
    const workspaceHeader = document.createElement("div");
    workspaceHeader.className = "workspace-header";
    workspaceHeader.textContent = workspace.name;
    tabsContainer.appendChild(workspaceHeader);
    renderTabs(workspace.tabs, tabsContainer);
  });
}

async function loadAndRenderWorkspaces(filter = "") {
  try {
    const response = await chrome.runtime.sendMessage({ action: "get_workspaces" });
    if (response.error) throw new Error(response.error);
    await renderWorkspaces(response.workspaces || [], filter);
  } catch (error) {
    showStatus("Failed to load workspaces", true);
  }
}

document.getElementById("analyze-tabs").addEventListener("click", async () => {
  try {
    const response = await chrome.runtime.sendMessage({ action: "analyze_tabs" });
    if (response.error) throw new Error(response.error);
    showStatus("Tabs analyzed and grouped successfully");
    await loadAndRenderWorkspaces();
  } catch (error) {
    showStatus("Failed to analyze tabs", true);
  }
});

searchWorkspaces.addEventListener("input", debounce((e) => {
  loadAndRenderWorkspaces(e.target.value);
}, 300));

loadAndRenderWorkspaces();