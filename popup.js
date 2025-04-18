import { sendMessage, isFirefox, createTab } from './utils/browserAPI.js';
import { hasCompletedOnboarding, markOnboardingCompleted, ONBOARDING_STEPS } from './utils/onboarding.js';

if (isFirefox) {
  window.addEventListener('load', () => {
    console.log("DOM fully loaded in Firefox");
    
    const searchBar = document.getElementById("search-workspaces");
    if (searchBar) {
      console.log("Search bar found:", searchBar);
      console.log("Search bar computed style:", window.getComputedStyle(searchBar));
    } else {
      console.error("Search bar not found in DOM");
    }
    
    const searchContainer = document.querySelector(".search-container");
    if (searchContainer) {
      console.log("Search container found:", searchContainer);
      console.log("Search container style:", window.getComputedStyle(searchContainer));
    }
  });
}

let onboardingActive = false;
let currentOnboardingStep = 0;

const workspaceList = document.getElementById("workspace-list");
const searchWorkspaces = document.getElementById("search-workspaces");
const tabsContainer = document.getElementById("tabs-container");
const statusMessage = document.getElementById("status-message");

let activeWorkspaceIndex = 0;
let currentWorkspaces = [];

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
    tabName.onclick = async (e) => {
      e.preventDefault();
      if (tab.url) {
        await createTab({ url: tab.url });
      }
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

function showWorkspaceTabs(index) {
  if (!currentWorkspaces || currentWorkspaces.length === 0) return;
  
  if (index < 0 || index >= currentWorkspaces.length) {
    index = 0;
  }
  
  activeWorkspaceIndex = index;
  
  const workspaceCards = document.querySelectorAll('.workspace-card');
  workspaceCards.forEach((card, i) => {
    if (i === index) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });
  
  tabsContainer.innerHTML = "";
  
  const workspace = currentWorkspaces[index];
  
  const workspaceHeader = document.createElement("div");
  workspaceHeader.className = "workspace-header";
  workspaceHeader.textContent = workspace.name;
  tabsContainer.appendChild(workspaceHeader);
  
  renderTabs(workspace.tabs, tabsContainer);
}

async function renderWorkspaces(workspaces, filter = "") {
  workspaceList.innerHTML = "";
  const filteredWorkspaces = workspaces.filter(w =>
    w.name.toLowerCase().includes(filter.toLowerCase())
  );
  
  currentWorkspaces = filteredWorkspaces;
  
  if (filteredWorkspaces.length === 0) {
    const noWorkspacesMessage = document.createElement("div");
    noWorkspacesMessage.className = "no-workspaces";
    noWorkspacesMessage.textContent = filter 
      ? "No matching workspaces found." 
      : "No workspaces yet. Click 'Analyze Tabs' to create workspaces.";
    workspaceList.appendChild(noWorkspacesMessage);
    tabsContainer.innerHTML = "<div class='no-workspaces'>No workspaces available.</div>";
    return;
  }
  
  filteredWorkspaces.forEach((workspace, index) => {
    const workspaceCard = document.createElement("div");
    workspaceCard.className = `workspace-card ${index === activeWorkspaceIndex ? "active" : ""}`;
    workspaceCard.setAttribute("data-index", index);
    
    // Make the entire card clickable to switch workspaces
    workspaceCard.addEventListener("click", (e) => {
      // Don't trigger if clicking on buttons or input
      if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
        showWorkspaceTabs(index);
      }
    });
  
    const title = document.createElement("input");
    title.type = "text";
    title.value = workspace.name;
    title.className = "workspace-title";
    title.addEventListener("change", async () => {
      workspaces[index].name = title.value;
      try {
        await sendMessage({ 
          action: "save_workspaces", 
          workspaces 
        });
        showStatus("Workspace renamed successfully");
        
        if (index === activeWorkspaceIndex) {
          const header = tabsContainer.querySelector('.workspace-header');
          if (header) header.textContent = title.value;
        }
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
    openSandboxButton.onclick = async (e) => {
      e.stopPropagation();
      try {
        const response = await sendMessage({
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
    deleteButton.onclick = async (e) => {
      e.stopPropagation();
      if (confirm("Delete this workspace?")) {
        try {
          const response = await sendMessage({
            action: "delete_workspace",
            workspaceIndex: index,
          });
          if (response.error) throw new Error(response.error);
          showStatus("Workspace deleted");
          
          if (activeWorkspaceIndex >= response.workspaces.length) {
            activeWorkspaceIndex = Math.max(0, response.workspaces.length - 1);
          }
          
          await renderWorkspaces(response.workspaces);
          if (response.workspaces.length > 0) {
            showWorkspaceTabs(activeWorkspaceIndex);
          }
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
  
  showWorkspaceTabs(activeWorkspaceIndex);
}

async function loadAndRenderWorkspaces(filter = "") {
  try {
    const response = await sendMessage({ action: "get_workspaces" });
    if (response.error) throw new Error(response.error);
    await renderWorkspaces(response.workspaces || [], filter);
  } catch (error) {
    showStatus("Failed to load workspaces", true);
  }
}

function startOnboarding() {
  onboardingActive = true;
  currentOnboardingStep = 0;
  showOnboardingStep(currentOnboardingStep);
}

function showOnboardingStep(stepIndex) {
  clearOnboardingElements();
  
  if (stepIndex >= ONBOARDING_STEPS.length) {
    finishOnboarding();
    return;
  }
  
  const step = ONBOARDING_STEPS[stepIndex];
  
  const overlay = document.createElement('div');
  overlay.className = 'onboarding-overlay';
  document.body.appendChild(overlay);
  
  const tooltip = document.createElement('div');
  tooltip.className = `onboarding-tooltip position-${step.position}`;
  
  const title = document.createElement('div');
  title.className = 'onboarding-tooltip-title';
  title.textContent = step.title;
  tooltip.appendChild(title);
  
  const content = document.createElement('div');
  content.className = 'onboarding-tooltip-content';
  content.textContent = step.content;
  tooltip.appendChild(content);
  
  const progress = document.createElement('div');
  progress.className = 'onboarding-progress';
  
  ONBOARDING_STEPS.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.className = `onboarding-dot ${index === stepIndex ? 'active' : ''}`;
    progress.appendChild(dot);
  });
  
  tooltip.appendChild(progress);
  
  const controls = document.createElement('div');
  controls.className = 'onboarding-controls';
  
  if (stepIndex > 0) {
    const backButton = document.createElement('button');
    backButton.className = 'onboarding-button';
    backButton.textContent = 'Back';
    backButton.addEventListener('click', () => {
      showOnboardingStep(stepIndex - 1);
    });
    controls.appendChild(backButton);
  } else {
    const skipButton = document.createElement('button');
    skipButton.className = 'onboarding-button';
    skipButton.textContent = 'Skip Tour';
    skipButton.addEventListener('click', finishOnboarding);
    controls.appendChild(skipButton);
  }
  
  const nextButton = document.createElement('button');
  nextButton.className = 'onboarding-button primary';
  nextButton.textContent = stepIndex === ONBOARDING_STEPS.length - 1 ? 'Finish' : 'Next';
  nextButton.addEventListener('click', () => {
    showOnboardingStep(stepIndex + 1);
  });
  controls.appendChild(nextButton);
  
  tooltip.appendChild(controls);
  document.body.appendChild(tooltip);
  
  if (step.element) {
    const element = document.querySelector(step.element);
    if (element) {
      element.classList.add('onboarding-element-highlight');
      
      const elementRect = element.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      
      switch (step.position) {
        case 'top':
          tooltip.style.left = `${elementRect.left + elementRect.width / 2 - tooltipRect.width / 2}px`;
          tooltip.style.top = `${elementRect.top - tooltipRect.height - 10}px`;
          break;
        case 'bottom':
          tooltip.style.left = `${elementRect.left + elementRect.width / 2 - tooltipRect.width / 2}px`;
          tooltip.style.top = `${elementRect.bottom + 10}px`;
          break;
        case 'left':
          tooltip.style.left = `${elementRect.left - tooltipRect.width - 10}px`;
          tooltip.style.top = `${elementRect.top + elementRect.height / 2 - tooltipRect.height / 2}px`;
          break;
        case 'right':
          tooltip.style.left = `${elementRect.right + 10}px`;
          tooltip.style.top = `${elementRect.top + elementRect.height / 2 - tooltipRect.height / 2}px`;
          break;
      }
      
      const tooltipTop = parseInt(tooltip.style.top);
      const tooltipLeft = parseInt(tooltip.style.left);
      
      if (tooltipTop < 10) tooltip.style.top = '10px';
      if (tooltipLeft < 10) tooltip.style.left = '10px';
      if (tooltipTop + tooltipRect.height > window.innerHeight - 10) {
        tooltip.style.top = `${window.innerHeight - tooltipRect.height - 10}px`;
      }
      if (tooltipLeft + tooltipRect.width > window.innerWidth - 10) {
        tooltip.style.left = `${window.innerWidth - tooltipRect.width - 10}px`;
      }
    }
  }
  
  currentOnboardingStep = stepIndex;
}

function clearOnboardingElements() {
  document.querySelectorAll('.onboarding-overlay, .onboarding-tooltip').forEach(el => el.remove());
  
  document.querySelectorAll('.onboarding-element-highlight').forEach(el => {
    el.classList.remove('onboarding-element-highlight');
  });
}

async function finishOnboarding() {
  clearOnboardingElements();
  onboardingActive = false;
  await markOnboardingCompleted();
  
  showStatus('Welcome to AI Tab Manager!');
}

async function initializeApp() {
  if (localStorage.getItem("darkMode") === "enabled") {
    document.documentElement.classList.add("dark-mode");
  }
  
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  if (darkModeToggle) {
    darkModeToggle.addEventListener("click", () => {
      document.documentElement.classList.toggle("dark-mode");
      const isDark = document.documentElement.classList.contains("dark-mode");
      localStorage.setItem("darkMode", isDark ? "enabled" : "disabled");
    });
  }
  
  await loadAndRenderWorkspaces();
  
  const completed = await hasCompletedOnboarding();
  if (!completed) {
    startOnboarding();
  }
}

document.addEventListener('DOMContentLoaded', initializeApp);

document.getElementById("analyze-tabs").addEventListener("click", async () => {
  try {
    const response = await sendMessage({ action: "analyze_tabs" });
    if (response.error) throw new Error(response.error);
    
    const browserName = isFirefox ? "Firefox" : "Chrome";
    const tabGroupMsg = isFirefox 
      ? " (note: Firefox doesn't support native tab grouping)" 
      : " and grouped";
    
    showStatus(`Tabs analyzed${tabGroupMsg} successfully in ${browserName}`);
    
    activeWorkspaceIndex = 0;
    await loadAndRenderWorkspaces();
  } catch (error) {
    showStatus("Failed to analyze tabs", true);
  }
});

searchWorkspaces.addEventListener("input", debounce((e) => {
  loadAndRenderWorkspaces(e.target.value);
}, 300));