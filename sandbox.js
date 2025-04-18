import { getStorage, isFirefox, createTab } from './utils/browserAPI.js';
import { isLikelyEmbeddable, getEmbedUrl, getFaviconUrl, getWebsitePreviewUrl, extractYouTubeVideoId, getGoogleMapsPreviewUrl} from './utils/preview.js';

document.addEventListener("DOMContentLoaded", () => {
  // Try to access localStorage, but have a fallback if sandboxed
  let isDarkMode = false;
  try {
    isDarkMode = localStorage.getItem("darkMode") === "enabled";
    if (isDarkMode) {
      document.documentElement.classList.add("dark-mode");
    }
    
    const darkModeToggle = document.getElementById("dark-mode-toggle");
    darkModeToggle.addEventListener("click", () => {
      document.documentElement.classList.toggle("dark-mode");
      const isDark = document.documentElement.classList.contains("dark-mode");
      localStorage.setItem("darkMode", isDark ? "enabled" : "disabled");
    });
  } catch (e) {
    // Running in a sandbox without localStorage access
    console.log("Running in restricted sandbox mode, localStorage not available");
    
    const darkModeToggle = document.getElementById("dark-mode-toggle");
    if (darkModeToggle) {
      darkModeToggle.addEventListener("click", () => {
        document.documentElement.classList.toggle("dark-mode");
      });
    }
  }
  
  document.getElementById("close-button").addEventListener("click", () => {
    window.close();
  });
  
  const params = new URLSearchParams(window.location.search);
  const workspaceIndex = params.get("workspaceIndex");
  console.log("Loading workspace index:", workspaceIndex);
  
  // Get available space for browser screenshots
  const loadWorkspace = () => {
    const storage = getStorage();
    storage.get(["ai_tab_manager_workspaces"], (data) => {
      const workspaces = data["ai_tab_manager_workspaces"] || [];
      const workspace = workspaces[workspaceIndex];
      
      if (!workspace) {
        document.getElementById("tabs-container").innerHTML = 
          "<div class='fallback-message'>Workspace not found.</div>";
        document.getElementById("workspace-title").textContent = "Unknown Workspace";
        document.getElementById("tabs-count").textContent = "No tabs available";
        return;
      }
      
      document.title = `Workspace: ${workspace.name}`;
      document.getElementById("workspace-title").textContent = workspace.name;
      document.getElementById("tabs-count").textContent = 
        `${workspace.tabs.length} tab${workspace.tabs.length === 1 ? '' : 's'}`;
      
      const container = document.getElementById("tabs-container");
      container.innerHTML = "";
      
      if (!workspace.tabs || workspace.tabs.length === 0) {
        container.innerHTML = "<div class='fallback-message'>This workspace has no tabs.</div>";
        return;
      }
      
      workspace.tabs.forEach((tab) => {
        if (!tab.url) return;
        
        try {
          const tabCard = document.createElement("div");
          tabCard.className = "tab-card";
          
          const tabHeader = document.createElement("div");
          tabHeader.className = "tab-header";
          
          if (tab.favIconUrl) {
            const icon = document.createElement("img");
            icon.src = tab.favIconUrl;
            icon.className = "tab-icon";
            icon.onerror = () => { 
              icon.src = getFaviconUrl(tab.url);
              icon.onerror = () => { icon.style.display = "none"; };
            };
            tabHeader.appendChild(icon);
          } else {
            const icon = document.createElement("img");
            icon.src = getFaviconUrl(tab.url);
            icon.className = "tab-icon";
            icon.onerror = () => { icon.style.display = "none"; };
            tabHeader.appendChild(icon);
          }
          
          const title = document.createElement("div");
          title.className = "tab-title";
          title.textContent = tab.title || "Untitled Tab";
          title.title = tab.title || tab.url;
          tabHeader.appendChild(title);
          
          tabCard.appendChild(tabHeader);
          
          const tabContent = document.createElement("div");
          tabContent.className = "tab-content";
          
          try {
            const url = new URL(tab.url);
            const domain = url.hostname.replace(/^www\./, '');
            
            const domainBadge = document.createElement("span");
            domainBadge.className = "domain-badge";
            domainBadge.textContent = domain;
            tabContent.appendChild(domainBadge);
            
            const previewContainer = document.createElement("div");
            previewContainer.className = "preview-container";
            
            // Try to create embedded content for supported sites
            if (isLikelyEmbeddable(tab.url)) {
              const embedUrl = getEmbedUrl(tab.url);
              
              if (embedUrl) {
                const iframe = document.createElement("iframe");
                iframe.src = embedUrl;
                iframe.className = "preview-iframe";
                iframe.setAttribute("allowfullscreen", "true");
                
                // Set appropriate sandbox attributes
                if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
                  iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-presentation");
                } else if (url.hostname.includes('vimeo.com')) {
                  iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
                } else {
                  iframe.setAttribute("sandbox", "allow-scripts");
                }
                
                iframe.style.display = "block";
                previewContainer.appendChild(iframe);
              } else {
                createFallbackPreview(previewContainer, tab);
              }
            } 
            else if (url.hostname.includes('google.com/maps') || url.hostname.includes('maps.google')) {
              const mapPreviewUrl = getGoogleMapsPreviewUrl(tab.url);
              if (mapPreviewUrl) {
                const mapImg = document.createElement("img");
                mapImg.src = mapPreviewUrl;
                mapImg.className = "map-preview";
                mapImg.alt = "Google Maps Preview";
                previewContainer.appendChild(mapImg);
              } else {
                createFallbackPreview(previewContainer, tab);
              }
            } 
            else {
              createFallbackPreview(previewContainer, tab);
              
              // Try to load a preview from a third-party service
              const previewImg = document.createElement("img");
              previewImg.className = "website-preview";
              previewImg.src = getWebsitePreviewUrl(tab.url);
              previewImg.alt = "Website Preview";
              previewImg.style.display = "none";
              
              previewImg.onload = () => {
                // If the preview loads successfully, replace the placeholder
                previewContainer.innerHTML = '';
                previewContainer.appendChild(previewImg);
                previewImg.style.display = "block";
              };
              
              previewContainer.appendChild(previewImg);
            }
            
            tabContent.appendChild(previewContainer);
          } catch (error) {
            console.error("Error creating preview:", error);
            createFallbackPreview(tabContent, tab);
          }
          
          const tabActions = document.createElement("div");
          tabActions.className = "tab-actions";
          
          const openButton = document.createElement("button");
          openButton.className = "action-button";
          openButton.textContent = "Open Tab";
          openButton.addEventListener("click", async () => {
            try {
              await createTab({ url: tab.url });
            } catch (error) {
              console.error("Error opening tab:", error);
            }
          });
          
          const openNewWindowButton = document.createElement("button");
          openNewWindowButton.className = "action-button secondary";
          openNewWindowButton.textContent = "New Window";
          openNewWindowButton.addEventListener("click", async () => {
            try {
              await createTab({ url: tab.url, windowId: null });
            } catch (error) {
              console.error("Error opening new window:", error);
            }
          });
          
          tabActions.appendChild(openButton);
          tabActions.appendChild(openNewWindowButton);
          tabContent.appendChild(tabActions);
          
          tabCard.appendChild(tabContent);
          container.appendChild(tabCard);
        } catch (error) {
          console.error("Error creating tab card:", error, tab);
        }
      });
    });
  };
  
  // Helper function to create fallback preview
  function createFallbackPreview(container, tab) {
    const previewPlaceholder = document.createElement("div");
    previewPlaceholder.className = "preview-placeholder";
    
    // Create URL display
    const urlDisplay = document.createElement("div");
    urlDisplay.className = "url-display";
    urlDisplay.textContent = tab.url;
    
    // Create preview message
    const previewMessage = document.createElement("div");
    previewMessage.className = "preview-message";
    previewMessage.textContent = "Preview not available";
    
    previewPlaceholder.appendChild(previewMessage);
    previewPlaceholder.appendChild(urlDisplay);
    container.appendChild(previewPlaceholder);
  }
  
  loadWorkspace();
});