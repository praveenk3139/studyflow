// Background service worker for StudyFlow AI Focus Shield extension
const BLOCKED_DOMAINS = [
  'instagram.com',
  'facebook.com',
  'x.com',
  'twitter.com',
  'snapchat.com',
  'reddit.com',
  'tiktok.com',
  'twitch.tv'
];

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    chrome.storage.local.get(['focusActive'], (result) => {
      if (result.focusActive) {
        const isBlocked = BLOCKED_DOMAINS.some(domain => changeInfo.url.includes(domain));
        if (isBlocked) {
          chrome.tabs.update(tabId, {
            url: 'http://localhost:3000/#focus-shield?blocked=' + encodeURIComponent(changeInfo.url)
          });
        }
      }
    });
  }
});
