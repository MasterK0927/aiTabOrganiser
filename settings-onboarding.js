import { getStorage } from './utils/browserAPI.js';

const SETTINGS_ONBOARDING_STORAGE_KEY = "ai_tab_manager_settings_onboarding_completed";

export const SETTINGS_ONBOARDING_STEPS = [
  {
    id: 'welcome',
    element: null,
    title: 'Settings & Customization',
    content: 'Welcome to the settings page! Let\'s walk through the available options to help you customize as per your preferences.',
    position: 'center'
  },
  {
    id: 'similarity-threshold',
    element: '#similarity-threshold',
    title: 'Similarity Threshold',
    content: 'Adjust how similar tabs need to be in order to be grouped together. Higher values require tabs to be more related.',
    position: 'bottom'
  },
  {
    id: 'domain-weight',
    element: '#domain-weight',
    title: 'Domain Importance',
    content: 'Control how much importance is given to matching website domains when grouping tabs.',
    position: 'bottom'
  },
  {
    id: 'path-weight',
    element: '#path-weight',
    title: 'URL Path Importance',
    content: 'Determine how much the URL path (what comes after the domain) influences tab grouping.',
    position: 'center'
  },
  {
    id: 'title-weight',
    element: '#title-weight',
    title: 'Tab Title Importance',
    content: 'Set how much the tab titles affect grouping. Useful for grouping tabs with similar topics but different domains.',
    position: 'center'
  },
  {
    id: 'auto-group-tabs',
    element: '#auto-group-tabs',
    title: 'Auto-group Tabs',
    content: 'Enable or disable automatic browser tab grouping when creating workspaces.',
    position: 'center'
  },
  {
    id: 'min-workspace-size',
    element: '#min-workspace-size',
    title: 'Minimum Workspace Size',
    content: 'Set how many tabs are required to form a workspace. Smaller numbers create more workspaces.',
    position: 'center'
  },
  {
    id: 'naming-strategy',
    element: '#naming-strategy',
    title: 'Naming Strategy',
    content: 'Choose how workspace names are automatically generated to best suit your preferences.',
    position: 'center'
  },
  {
    id: 'preview-mode',
    element: '#preview-mode',
    title: 'Tab Preview Mode',
    content: 'Control how tab previews are displayed in the extension.',
    position: 'center'
  },
  {
    id: 'save-button',
    element: '#save-settings',
    title: 'Save Settings',
    content: 'Remember to save your changes with this button before leaving the settings page.',
    position: 'center'
  },
  {
    id: 'completion',
    element: null,
    title: 'All Set!',
    content: 'You now know how to customize AI Tab Manager to your exact needs. Feel free to experiment with different settings!',
    position: 'center'
  }
];

/**
 * Checks if the user has completed the settings onboarding
 * @returns {Promise<boolean>} - Promise resolving to whether onboarding is completed
 */
export async function hasCompletedSettingsOnboarding() {
  return new Promise((resolve) => {
    const storage = getStorage();
    storage.get([SETTINGS_ONBOARDING_STORAGE_KEY], (result) => {
      resolve(!!result[SETTINGS_ONBOARDING_STORAGE_KEY]);
    });
  });
}

/**
 * Marks the settings onboarding as completed
 * @returns {Promise<void>}
 */
export async function markSettingsOnboardingCompleted() {
  return new Promise((resolve) => {
    const storage = getStorage();
    storage.set({ [SETTINGS_ONBOARDING_STORAGE_KEY]: true }, resolve);
  });
}

/**
 * Creates helpful tooltips for settings fields without doing a walkthrough
 * @param {boolean} darkMode - Whether dark mode is enabled
 */
export function addSettingsTooltips(darkMode = false) {
  const settingOptions = document.querySelectorAll('.settings-option');
  
  settingOptions.forEach(option => {
    const label = option.querySelector('label');
    const description = option.querySelector('.settings-description');
    
    if (label && description) {
      const tooltipTrigger = document.createElement('span');
      tooltipTrigger.className = 'tooltip-trigger';
      tooltipTrigger.innerHTML = '?';
      tooltipTrigger.setAttribute('aria-label', description.textContent);
      tooltipTrigger.setAttribute('data-tooltip', description.textContent);
      
      tooltipTrigger.addEventListener('mouseenter', (e) => {
        const tooltip = document.createElement('div');
        tooltip.className = `setting-tooltip ${darkMode ? 'dark' : ''}`;
        tooltip.textContent = e.target.getAttribute('data-tooltip');
        
        document.body.appendChild(tooltip);
        
        const rect = e.target.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width/2 - tooltip.offsetWidth/2}px`;
        tooltip.style.top = `${rect.bottom + 10}px`;
        
        tooltipTrigger.tooltip = tooltip;
      });
      
      tooltipTrigger.addEventListener('mouseleave', () => {
        if (tooltipTrigger.tooltip) {
          tooltipTrigger.tooltip.remove();
          tooltipTrigger.tooltip = null;
        }
      });
      
      label.appendChild(tooltipTrigger);
      
      description.style.display = 'none';
    }
  });
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
      
      scrollToElement(element);
      
      setTimeout(() => {
        positionTooltip(element, tooltip, step);
      }, 400);
    }
  } else {
    tooltip.style.top = '50%';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translate(-50%, -50%)';
  }
  
  currentWalkthroughStep = stepIndex;
}

/**
 * Scrolls to make an element visible in the viewport
 * @param {Element} element - The element to scroll to
 */
function scrollToElement(element) {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const isInView = (
    rect.top >= 60 &&
    rect.bottom <= windowHeight - 100
  );
  
  if (!isInView) {
    const isNearBottom = rect.top > windowHeight - 200;
    const extraSpace = isNearBottom ? 250 : 150;
    
    const targetPosition = window.scrollY + rect.top - (windowHeight / 2) + (rect.height / 2) - (isNearBottom ? extraSpace : 0);
    
    console.log(`Scrolling to element ${element.id || element.className}, target position: ${targetPosition}`);
    
    window.scrollTo({
      top: Math.max(0, targetPosition),
      behavior: 'smooth'
    });
  }
}

/**
 * Positions a tooltip relative to an element
 * @param {Element} element - The element to position relative to
 * @param {Element} tooltip - The tooltip element
 * @param {Object} step - The step configuration
 */
function positionTooltip(element, tooltip, step) {
  const elementRect = element.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const windowWidth = window.innerWidth;
  
  let targetPosition = step.position;

  const hasSpaceBelow = elementRect.bottom + tooltipRect.height + 20 <= windowHeight;
  const hasSpaceAbove = elementRect.top - tooltipRect.height - 20 >= 0;
  const hasSpaceRight = elementRect.right + tooltipRect.width + 20 <= windowWidth;
  const hasSpaceLeft = elementRect.left - tooltipRect.width - 20 >= 0;
  
  // Override position if the specified one doesn't fit
  if (targetPosition === 'bottom' && !hasSpaceBelow) {
    targetPosition = hasSpaceAbove ? 'top' : (hasSpaceRight ? 'right' : 'left');
    console.log(`Repositioning: Not enough space below element, using ${targetPosition} instead`);
    tooltip.className = tooltip.className.replace(/position-\w+/, `position-${targetPosition}`);
  } else if (targetPosition === 'top' && !hasSpaceAbove) {
    targetPosition = hasSpaceBelow ? 'bottom' : (hasSpaceRight ? 'right' : 'left');
    console.log(`Repositioning: Not enough space above element, using ${targetPosition} instead`);
    tooltip.className = tooltip.className.replace(/position-\w+/, `position-${targetPosition}`);
  } else if (targetPosition === 'right' && !hasSpaceRight) {
    targetPosition = hasSpaceLeft ? 'left' : (hasSpaceBelow ? 'bottom' : 'top');
    console.log(`Repositioning: Not enough space to the right, using ${targetPosition} instead`);
    tooltip.className = tooltip.className.replace(/position-\w+/, `position-${targetPosition}`);
  } else if (targetPosition === 'left' && !hasSpaceLeft) {
    targetPosition = hasSpaceRight ? 'right' : (hasSpaceBelow ? 'bottom' : 'top');
    console.log(`Repositioning: Not enough space to the left, using ${targetPosition} instead`);
    tooltip.className = tooltip.className.replace(/position-\w+/, `position-${targetPosition}`);
  }
  
  switch (targetPosition) {
    case 'top':
      tooltip.style.left = `${elementRect.left + elementRect.width / 2 - tooltipRect.width / 2}px`;
      tooltip.style.top = `${elementRect.top - tooltipRect.height - 10 + window.scrollY}px`;
      break;
    case 'bottom':
      tooltip.style.left = `${elementRect.left + elementRect.width / 2 - tooltipRect.width / 2}px`;
      tooltip.style.top = `${elementRect.bottom + 10 + window.scrollY}px`;
      break;
    case 'left':
      tooltip.style.left = `${elementRect.left - tooltipRect.width - 10}px`;
      tooltip.style.top = `${elementRect.top + elementRect.height / 2 - tooltipRect.height / 2 + window.scrollY}px`;
      break;
    case 'right':
      tooltip.style.left = `${elementRect.right + 10}px`;
      tooltip.style.top = `${elementRect.top + elementRect.height / 2 - tooltipRect.height / 2 + window.scrollY}px`;
      break;
  }
  
  const tooltipLeft = parseInt(tooltip.style.left);
  const tooltipTop = parseInt(tooltip.style.top) - window.scrollY;
  
  if (tooltipLeft < 10) {
    tooltip.style.left = '10px';
  } else if (tooltipLeft + tooltipRect.width > windowWidth - 10) {
    tooltip.style.left = `${windowWidth - tooltipRect.width - 10}px`;
  }
  
  if (tooltipTop < 10) {
    tooltip.style.top = `${window.scrollY + 10}px`;
  } else if (tooltipTop + tooltipRect.height > windowHeight - 10) {
    tooltip.style.top = `${window.scrollY + windowHeight - tooltipRect.height - 10}px`;
  }
  
  console.log(`Positioned tooltip for '${step.id}', position: ${targetPosition}`);
}

function clearWalkthroughElements() {
  document.querySelectorAll('.settings-walkthrough-overlay, .settings-walkthrough-tooltip').forEach(el => el.remove());
  
  document.querySelectorAll('.walkthrough-element-highlight').forEach(el => {
    el.classList.remove('walkthrough-element-highlight');
  });
}

function finishWalkthrough() {
  clearWalkthroughElements();
  markSettingsOnboardingCompleted();
}