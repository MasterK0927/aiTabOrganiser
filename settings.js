import { sendMessage, getStorage } from './utils/browserAPI.js';
import { 
  SETTINGS_ONBOARDING_STEPS, 
  hasCompletedSettingsOnboarding, 
  markSettingsOnboardingCompleted,
  addSettingsTooltips
} from './settings-onboarding.js';

const DEFAULT_SETTINGS = {
  similarityThreshold: 0.5,
  domainWeight: 0.6,
  pathWeight: 0.3,
  titleWeight: 0.1,
  
  autoGroupTabs: true,
  minWorkspaceSize: 2,
  namingStrategy: 'domain-word',
  
  previewMode: 'auto'
};

const statusMessage = document.getElementById("status-message");
const darkModeToggle = document.getElementById("dark-mode-toggle");
const backButton = document.getElementById("back-to-main");
const saveButton = document.getElementById("save-settings");
const importFileInput = document.getElementById("import-file");
const exportButton = document.getElementById("export-settings");
const importButton = document.getElementById("import-settings");
const resetButton = document.getElementById("reset-settings");
const startWalkthroughButton = document.getElementById("start-walkthrough-floating");

function showStatus(message, isError = false) {
  console.log("Showing status:", message, isError);
  statusMessage.textContent = message;
  statusMessage.className = isError ? "status-message error visible" : "status-message success visible";
  
  setTimeout(() => {
    statusMessage.className = statusMessage.className.replace(" visible", "");
  }, 3000);
}

async function saveSettings(settings) {
  console.log("Saving settings:", settings);
  return new Promise((resolve, reject) => {
    try {
      const storage = getStorage();
      if (!storage) {
        throw new Error("Browser storage API not available");
      }
      
      storage.set({ ai_tab_manager_settings: settings }, () => {
        const error = chrome.runtime.lastError || 
                     (typeof browser !== 'undefined' && browser.runtime && browser.runtime.lastError);
        if (error) {
          console.error("Storage error:", error);
          reject(error);
        } else {
          sendMessage({ action: "settings_updated", settings })
            .then(() => resolve())
            .catch(err => {
              console.warn("Could not notify background script, but settings were saved:", err);
              resolve();
            });
        }
      });
    } catch (error) {
      console.error("Error in saveSettings:", error);
      reject(error);
    }
  });
}

async function loadSettings() {
  console.log("Loading settings from storage");
  return new Promise((resolve) => {
    try {
      const storage = getStorage();
      if (!storage) {
        console.warn("No storage API available, using defaults");
        resolve(DEFAULT_SETTINGS);
        return;
      }
      
      storage.get(['ai_tab_manager_settings'], (result) => {
        if (!result || !result.ai_tab_manager_settings) {
          console.log("No stored settings found, using defaults");
          resolve(DEFAULT_SETTINGS);
        } else {
          console.log("Loaded settings:", result.ai_tab_manager_settings);
          resolve(result.ai_tab_manager_settings);
        }
      });
    } catch (error) {
      console.error("Error loading settings:", error);
      resolve(DEFAULT_SETTINGS);
    }
  });
}

function updateUI(settings) {
  console.log("Updating UI with settings:", settings);
  try {
    document.getElementById("similarity-threshold").value = settings.similarityThreshold;
    document.getElementById("similarity-threshold-value").textContent = settings.similarityThreshold;
    
    document.getElementById("domain-weight").value = settings.domainWeight;
    document.getElementById("domain-weight-value").textContent = settings.domainWeight;
    
    document.getElementById("path-weight").value = settings.pathWeight;
    document.getElementById("path-weight-value").textContent = settings.pathWeight;
    
    document.getElementById("title-weight").value = settings.titleWeight;
    document.getElementById("title-weight-value").textContent = settings.titleWeight;
    
    document.getElementById("auto-group-tabs").checked = settings.autoGroupTabs;
    document.getElementById("min-workspace-size").value = settings.minWorkspaceSize;
    document.getElementById("naming-strategy").value = settings.namingStrategy;
    
    document.getElementById("preview-mode").value = settings.previewMode;
    
    document.querySelectorAll('input[type="range"]').forEach(input => {
      const valueDisplay = document.getElementById(`${input.id}-value`);
      if (valueDisplay) {
        input.oninput = function() {
          valueDisplay.textContent = this.value;
        };
      }
    });
  } catch (error) {
    console.error("Error updating UI:", error);
    showStatus("Error updating UI", true);
  }
}

function getSettingsFromUI() {
  try {
    const settings = {
      similarityThreshold: parseFloat(document.getElementById("similarity-threshold").value),
      domainWeight: parseFloat(document.getElementById("domain-weight").value),
      pathWeight: parseFloat(document.getElementById("path-weight").value),
      titleWeight: parseFloat(document.getElementById("title-weight").value),
      
      autoGroupTabs: document.getElementById("auto-group-tabs").checked,
      minWorkspaceSize: parseInt(document.getElementById("min-workspace-size").value),
      namingStrategy: document.getElementById("naming-strategy").value,
      
      previewMode: document.getElementById("preview-mode").value
    };
    
    console.log("Settings collected from UI:", settings);
    return settings;
  } catch (error) {
    console.error("Error getting settings from UI:", error);
    return DEFAULT_SETTINGS;
  }
}

function exportSettings() {
  try {
    const settings = getSettingsFromUI();
    const blob = new Blob([JSON.stringify(settings, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", "ai-tab-manager-settings.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    
    setTimeout(() => {
      document.body.removeChild(downloadAnchorNode);
      URL.revokeObjectURL(url);
    }, 100);
    
    showStatus("Settings exported successfully");
  } catch (error) {
    console.error("Export error:", error);
    showStatus("Failed to export settings: " + error.message, true);
  }
}

function importSettings(file) {
  console.log("Importing settings from file:", file);
  if (!file) {
    showStatus("No file selected", true);
    return;
  }
  
  const reader = new FileReader();
  
  reader.onload = async (event) => {
    try {
      const jsonContent = event.target.result;
      console.log("File content:", jsonContent);
      const settings = JSON.parse(jsonContent);
      
      if (!settings || typeof settings !== 'object') {
        throw new Error("Invalid settings format");
      }
      
      console.log("Parsed settings:", settings);
      
      updateUI(settings);
      
      await saveSettings(settings);
      
      showStatus("Settings imported successfully");
    } catch (error) {
      console.error("Import error:", error);
      showStatus("Failed to import settings: " + error.message, true);
    }
  };
  
  reader.onerror = (error) => {
    console.error("File reading error:", error);
    showStatus("Error reading the file", true);
  };
  
  reader.readAsText(file);
}

let walkthroughActive = false;
let currentWalkthroughStep = 0;


function startWalkthrough() {
  walkthroughActive = true;
  currentWalkthroughStep = 0;
  showWalkthroughStep(currentWalkthroughStep);
}

/**
 * Shows a specific step in the walkthrough
 * @param {number} stepIndex - The index of the step to show
 */
function showWalkthroughStep(stepIndex) {
  clearWalkthroughElements();
  
  if (stepIndex >= SETTINGS_ONBOARDING_STEPS.length) {
    finishWalkthrough();
    return;
  }
  
  const step = SETTINGS_ONBOARDING_STEPS[stepIndex];
  
  const overlay = document.createElement('div');
  overlay.className = 'settings-walkthrough-overlay';
  document.body.appendChild(overlay);
  
  const tooltip = document.createElement('div');
  tooltip.className = `settings-walkthrough-tooltip position-${step.position}`;
  
  const title = document.createElement('div');
  title.className = 'walkthrough-tooltip-title';
  title.textContent = step.title;
  tooltip.appendChild(title);
  
  const content = document.createElement('div');
  content.className = 'walkthrough-tooltip-content';
  content.textContent = step.content;
  tooltip.appendChild(content);
  
  const progress = document.createElement('div');
  progress.className = 'walkthrough-progress';
  
  SETTINGS_ONBOARDING_STEPS.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.className = `walkthrough-dot ${index === stepIndex ? 'active' : ''}`;
    progress.appendChild(dot);
  });
  
  tooltip.appendChild(progress);
  
  const controls = document.createElement('div');
  controls.className = 'walkthrough-controls';
  
  if (stepIndex > 0) {
    const backButton = document.createElement('button');
    backButton.className = 'walkthrough-button';
    backButton.textContent = 'Back';
    backButton.addEventListener('click', () => {
      showWalkthroughStep(stepIndex - 1);
    });
    controls.appendChild(backButton);
  } else {
    const skipButton = document.createElement('button');
    skipButton.className = 'walkthrough-button';
    skipButton.textContent = 'Skip Tour';
    skipButton.addEventListener('click', finishWalkthrough);
    controls.appendChild(skipButton);
  }
  
  const nextButton = document.createElement('button');
  nextButton.className = 'walkthrough-button primary';
  nextButton.textContent = stepIndex === SETTINGS_ONBOARDING_STEPS.length - 1 ? 'Finish' : 'Next';
  nextButton.addEventListener('click', () => {
    showWalkthroughStep(stepIndex + 1);
  });
  controls.appendChild(nextButton);
  
  tooltip.appendChild(controls);
  document.body.appendChild(tooltip);
  
  if (step.element) {
    const element = document.querySelector(step.element);
    if (element) {
      element.classList.add('walkthrough-element-highlight');
      
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
  
  currentWalkthroughStep = stepIndex;
}

function clearWalkthroughElements() {
  document.querySelectorAll('.settings-walkthrough-overlay, .settings-walkthrough-tooltip').forEach(el => el.remove());
  
  document.querySelectorAll('.walkthrough-element-highlight').forEach(el => {
    el.classList.remove('walkthrough-element-highlight');
  });
}

async function finishWalkthrough() {
  clearWalkthroughElements();
  walkthroughActive = false;
  await markSettingsOnboardingCompleted();
  
  showStatus('Settings tutorial completed!');
}

function initializeSliders() {
  const rangeSliders = document.querySelectorAll('input[type="range"]');
  
  rangeSliders.forEach(slider => {
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'slider-container';
    
    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'slider-value';
    valueDisplay.textContent = slider.value;
    
    slider.parentNode.insertBefore(sliderContainer, slider);
    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(valueDisplay);
    
    slider.addEventListener('input', () => {
      valueDisplay.textContent = slider.value;
      
      const percent = (slider.value - slider.min) / (slider.max - slider.min);
      const thumbWidth = 18;
      const sliderWidth = slider.getBoundingClientRect().width;
      const offset = percent * (sliderWidth - thumbWidth) + thumbWidth / 2;
      
      valueDisplay.style.left = `${offset}px`;
      valueDisplay.style.transform = 'translateX(-50%)';
    });
    
    slider.dispatchEvent(new Event('input'));
  });
}

async function initializeSettings() {
  try {
    console.log("Initializing settings page");
    
    const isDarkMode = localStorage.getItem("darkMode") === "enabled";
    if (isDarkMode) {
      document.documentElement.classList.add("dark-mode");
    }
    
    if (darkModeToggle) {
      darkModeToggle.addEventListener("click", () => {
        document.documentElement.classList.toggle("dark-mode");
        const isDark = document.documentElement.classList.contains("dark-mode");
        localStorage.setItem("darkMode", isDark ? "enabled" : "disabled");
        
        document.querySelectorAll('.setting-tooltip').forEach(tooltip => {
          if (isDark) {
            tooltip.classList.add('dark');
          } else {
            tooltip.classList.remove('dark');
          }
        });
      });
    }

    if (startWalkthroughButton) {
      startWalkthroughButton.addEventListener("click", startWalkthrough);
    }
    
    if (backButton) {
      backButton.addEventListener("click", () => {
        window.location.href = "popup.html";
      });
    }
    
    if (saveButton) {
      saveButton.addEventListener("click", async () => {
        try {
          const settings = getSettingsFromUI();
          await saveSettings(settings);
          
          saveButton.classList.add("saved");
          setTimeout(() => {
            saveButton.classList.remove("saved");
          }, 1000);
          
          showStatus("Settings saved successfully");
        } catch (error) {
          console.error("Save error:", error);
          showStatus("Failed to save settings: " + error.message, true);
        }
      });
    }
    
    exportButton.addEventListener("click", exportSettings);
    
    importButton.addEventListener("click", () => {
      importFileInput.value = '';
      importFileInput.click();
    });
    
    importFileInput.addEventListener("change", (event) => {
      if (event.target.files && event.target.files.length > 0) {
        importSettings(event.target.files[0]);
      } else {
        showStatus("No file selected", true);
      }
    });
    
    resetButton.addEventListener("click", async () => {
      try {
        if (confirm("Are you sure you want to reset all settings to their default values?")) {
          updateUI(DEFAULT_SETTINGS);
          await saveSettings(DEFAULT_SETTINGS);
          showStatus("Settings reset to defaults");
        }
      } catch (error) {
        console.error("Reset error:", error);
        showStatus("Failed to reset settings: " + error.message, true);
      }
    });
    
    const settings = await loadSettings();
    updateUI(settings);
    
    addSettingsTooltips(isDarkMode);
    
    const completedWalkthrough = await hasCompletedSettingsOnboarding();
    if (!completedWalkthrough) {
      setTimeout(startWalkthrough, 1000);
    }
    
    initializeSliders();
    
    console.log("Settings page initialized successfully");
  } catch (error) {
    console.error("Error initializing settings:", error);
    showStatus("Failed to initialize settings", true);
  }
}

document.addEventListener('DOMContentLoaded', initializeSettings);