/**
 * Queries tabs using chrome.tabs.query and returns a promise of an array of tabs.
 * @param {Object} queryInfo - The query criteria.
 * @returns {Promise<Array>} - A promise that resolves to an array of tabs.
 */
export function queryTabs(queryInfo = {}) {
    return new Promise((resolve) => {
      chrome.tabs.query(queryInfo, (tabs) => {
        resolve(Array.from(tabs));
      });
    });
  }
  
  /**
   * Ensures the given value is returned as an array.
   * @param {any} possibleArray - The input which may or may not be an array.
   * @returns {Array} - The input as an array.
   */
  export function ensureArray(possibleArray) {
    if (!possibleArray) return [];
    if (Array.isArray(possibleArray)) return possibleArray;
    if (typeof possibleArray === "object") return Object.values(possibleArray);
    return [possibleArray];
  }
  