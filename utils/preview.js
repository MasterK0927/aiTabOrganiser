import { isFirefox, browserAPI } from './browserAPI.js';

/**
 * Takes a screenshot of a tab (Chrome only)
 * @param {number} tabId - ID of the tab to capture
 * @returns {Promise<string>} - Promise resolving to a data URL of the screenshot
 */
export async function captureTabScreenshot(tabId) {
  if (isFirefox) {
    try {
      return await browser.tabs.captureTab(tabId, { format: 'jpeg', quality: 70 });
    } catch (error) {
      console.error("Error capturing screenshot in Firefox:", error);
      return null;
    }
  } else {
    try {
      return new Promise((resolve) => {
        chrome.tabs.captureVisibleTab(
          { format: 'jpeg', quality: 70 },
          (dataUrl) => {
            resolve(dataUrl);
          }
        );
      });
    } catch (error) {
      console.error("Error capturing screenshot in Chrome:", error);
      return null;
    }
  }
}

/**
 * Gets a website favicon
 * @param {string} url - URL of the website
 * @returns {string} - URL to the favicon
 */
export function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch (error) {
    return null;
  }
}

/**
 * Determines if a website is likely to be embeddable
 * @param {string} url - URL to check
 * @returns {boolean} - Whether the site is likely embeddable
 */
export function isLikelyEmbeddable(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const embeddableDomains = [
      'youtube.com', 'youtu.be',
      'vimeo.com',
      'dailymotion.com',
      'twitch.tv',
      'ted.com',
      'wikipedia.org',
      'google.com/maps', 'maps.google',
      'docs.google.com',
      'slides.google.com',
      'drive.google.com',
      'sheets.google.com',
      'codepen.io'
    ];
    
    return embeddableDomains.some(domain => hostname.includes(domain));
  } catch (error) {
    return false;
  }
}

/**
 * Extracts YouTube video ID from URL
 * @param {string} url - YouTube URL
 * @returns {string|null} - Video ID or null
 */
export function extractYouTubeVideoId(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('youtube.com')) {
      return urlObj.searchParams.get('v');
    } else if (urlObj.hostname.includes('youtu.be')) {
      return urlObj.pathname.substring(1);
    }
  } catch (e) {
    console.error("Error extracting YouTube ID:", e);
  }
  return null;
}

/**
 * Extracts Vimeo video ID from URL
 * @param {string} url - Vimeo URL
 * @returns {string|null} - Video ID or null
 */
export function extractVimeoVideoId(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('vimeo.com')) {
      return urlObj.pathname.substring(1);
    }
  } catch (e) {
    console.error("Error extracting Vimeo ID:", e);
  }
  return null;
}

/**
 * Gets the embed URL for a given site
 * @param {string} url - Original URL
 * @returns {string|null} - Embed URL or null if not supported
 */
export function getEmbedUrl(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // YouTube
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      const videoId = extractYouTubeVideoId(url);
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    
    // Vimeo
    if (hostname.includes('vimeo.com')) {
      const videoId = extractVimeoVideoId(url);
      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }
    
    // Google Maps
    if (hostname.includes('google.com/maps') || hostname.includes('maps.google')) {
      const query = urlObj.search || '';
      return `https://www.google.com/maps/embed${urlObj.pathname}${query}`;
    }
    
    // Wikipedia
    if (hostname.includes('wikipedia.org')) {
      const mobilePath = urlObj.pathname.replace('/wiki/', '/wiki/Special:MobileDiff/0/');
      return `https://${urlObj.hostname}${mobilePath}?useformat=mobile`;
    }
    
    // try to embed the URL directly
    if (isLikelyEmbeddable(url)) {
      return url;
    }
    
  } catch (e) {
    console.error("Error generating embed URL:", e);
  }
  return null;
}

/**
 * Gets a preview URL for Google Maps
 * @param {string} url - Maps URL
 * @returns {string} - Static map image URL
 */
export function getGoogleMapsPreviewUrl(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('google.com/maps') || urlObj.hostname.includes('maps.google')) {
      // Try to extract location from URL
      const ll = urlObj.searchParams.get('ll') || urlObj.searchParams.get('center');
      const q = urlObj.searchParams.get('q');
      const zoom = urlObj.searchParams.get('z') || '14';
      
      if (ll) {
        return `https://maps.googleapis.com/maps/api/staticmap?center=${ll}&zoom=${zoom}&size=400x300&key=AIzaSyD_lgZr5Fs4j8BmVH2jiizJuAFLadXiIYY`;
      } else if (q) {
        return `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(q)}&zoom=${zoom}&markers=${encodeURIComponent(q)}&size=400x300&key=AIzaSyD_lgZr5Fs4j8BmVH2jiizJuAFLadXiIYY`;
      }
    }
  } catch (e) {
    console.error("Error generating maps preview:", e);
  }
  return null;
}

/**
 * Generate website preview using 3rd party API
 * @param {string} url - Website URL
 * @returns {string} - Preview image URL
 */
export function getWebsitePreviewUrl(url) {
  try {
    // Using a free thumbnail service
    return `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;
  } catch (e) {
    return null;
  }
}