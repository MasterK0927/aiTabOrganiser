export function groupTabsBySimilarity(tabs) {
    // Filter out invalid tabs first
    const validTabs = tabs.filter(tab => 
      tab && 
      tab.url && 
      tab.url.trim() !== '' && 
      !tab.url.startsWith('chrome://') && 
      !tab.url.startsWith('chrome-extension://')
    );

    if (validTabs.length === 0) {
      return [];
    }
  
    const calculateSimilarity = (tab1, tab2) => {
      try {
        const url1 = new URL(tab1.url);
        const url2 = new URL(tab2.url);
        
        const domainMatch = url1.hostname.replace('www.', '') === url2.hostname.replace('www.', '');
        
        const pathSimilarity = url1.pathname.split('/').filter(Boolean).some(
          part => url2.pathname.includes(part)
        );
        
        const titleWords1 = (tab1.title || '').toLowerCase().split(/\W+/);
        const titleWords2 = (tab2.title || '').toLowerCase().split(/\W+/);
        const commonWords = titleWords1.filter(word => 
          titleWords2.includes(word) && word.length > 3
        );
        
        return (domainMatch ? 0.6 : 0) + 
               (pathSimilarity ? 0.3 : 0) + 
               (commonWords.length > 0 ? 0.1 : 0);
      } catch {
        return 0;
      }
    };
  
    const SIMILARITY_THRESHOLD = 0.5;
    const groups = [];
  
    validTabs.forEach((tab) => {
      const similarGroupIndex = groups.findIndex(group => 
        group.some(existingTab => calculateSimilarity(tab, existingTab) >= SIMILARITY_THRESHOLD)
      );
  
      if (similarGroupIndex !== -1) {
        groups[similarGroupIndex].push(tab);
      } else {
        groups.push([tab]);
      }
    });
  
    return groups
      .filter(group => group.length > 1)
      .map(group => {
        const domains = group.map(tab => {
          try {
            return new URL(tab.url).hostname.replace('www.', '');
          } catch {
            return null;
          }
        }).filter(Boolean);
  
        const domainCounts = {};
        domains.forEach(domain => {
          domainCounts[domain] = (domainCounts[domain] || 0) + 1;
        });
  
        const primaryDomain = Object.keys(domainCounts).reduce(
          (a, b) => domainCounts[a] > domainCounts[b] ? a : b, 
          null
        );
  
        const titleWords = group
          .flatMap(tab => (tab.title || '').toLowerCase().split(/\W+/))
          .filter(word => word.length > 3);
  
        const wordCounts = {};
        titleWords.forEach(word => {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        });
  
        const commonWord = Object.keys(wordCounts).reduce(
          (a, b) => wordCounts[a] > wordCounts[b] ? a : b, 
          null
        );
  
        return {
          name: primaryDomain 
            ? (commonWord ? `${primaryDomain} - ${commonWord}` : primaryDomain)
            : (commonWord || 'Workspace'),
          tabs: group
        };
      });
  }