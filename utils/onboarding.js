import { getStorage } from './browserAPI.js';

const ONBOARDING_STORAGE_KEY = "ai_tab_manager_onboarding_completed";

export const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    element: null,
    title: 'Welcome to AI Tab Manager!',
    content: 'Let\'s take a quick tour to help you get the most out of this extension.',
    position: 'center'
  },
  {
    id: 'analyze-tabs',
    element: '#analyze-tabs',
    title: 'Analyze Your Tabs',
    content: 'Click here to automatically organize your open tabs into smart workspaces based on content similarity.',
    position: 'bottom'
  },
  {
    id: 'workspace-list',
    element: '#workspace-list',
    title: 'Workspace Management',
    content: 'Your organized tab collections appear here. Click on a workspace to view its tabs.',
    position: 'right'
  },
  {
    id: 'search-workspaces',
    element: '#search-workspaces',
    title: 'Find Workspaces Quickly',
    content: 'Search for specific workspaces when your collection grows.',
    position: 'bottom'
  },
  {
    id: 'tabs-container',
    element: '#tabs-container',
    title: 'Your Workspace Tabs',
    content: 'View and access all tabs within a workspace from here.',
    position: 'bottom'
  },
  {
    id: 'dark-mode-toggle',
    element: '#dark-mode-toggle',
    title: 'Toggle Dark Mode',
    content: 'Switch between light and dark themes based on your preference.',
    position: 'bottom'
  },
  {
    id: 'completion',
    element: null,
    title: 'You\'re All Set!',
    content: 'You\'re ready to start using AI Tab Manager. Enjoy organized browsing!',
    position: 'center'
  }
];

/**
 * Checks if the user has completed the onboarding
 * @returns {Promise<boolean>} - Promise resolving to whether onboarding is completed
 */
export async function hasCompletedOnboarding() {
  return new Promise((resolve) => {
    const storage = getStorage();
    storage.get([ONBOARDING_STORAGE_KEY], (result) => {
      resolve(!!result[ONBOARDING_STORAGE_KEY]);
    });
  });
}

/**
 * Marks the onboarding as completed
 * @returns {Promise<void>}
 */
export async function markOnboardingCompleted() {
  return new Promise((resolve) => {
    const storage = getStorage();
    storage.set({ [ONBOARDING_STORAGE_KEY]: true }, () => {
      resolve();
    });
  });
}

/**
 * Resets the onboarding status (for testing)
 * @returns {Promise<void>}
 */
export async function resetOnboardingStatus() {
  return new Promise((resolve) => {
    const storage = getStorage();
    storage.remove(ONBOARDING_STORAGE_KEY, () => {
      resolve();
    });
  });
}