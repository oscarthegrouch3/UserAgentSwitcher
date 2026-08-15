/**
 * UserAgent Switcher - Background Service
 * Intercepts and rewrites outgoing User-Agent headers using webRequestBlocking.
 */

let activeUA = '';

// Load saved state on startup / wake up
browser.storage.local.get(['enabled', 'activeUA']).then((data) => {
  activeUA = data.enabled && data.activeUA ? data.activeUA : '';
  browser.action.setBadgeText({ text: activeUA ? 'ON' : '' });
  browser.action.setBadgeBackgroundColor({ color: '#2563eb' });
});

// Update activeUA whenever storage changes
browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    browser.storage.local.get(['enabled', 'activeUA']).then((data) => {
      activeUA = data.enabled && data.activeUA ? data.activeUA : '';
      browser.action.setBadgeText({ text: activeUA ? 'ON' : '' });
      browser.action.setBadgeBackgroundColor({ color: '#2563eb' });
    });
  }
});

// Synchronously rewrite outgoing User-Agent headers for all network requests
browser.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    if (!activeUA) return;

    for (let header of details.requestHeaders) {
      if (header.name.toLowerCase() === 'user-agent') {
        header.value = activeUA;
        return { requestHeaders: details.requestHeaders };
      }
    }

    details.requestHeaders.push({ name: 'User-Agent', value: activeUA });
    return { requestHeaders: details.requestHeaders };
  },
  { urls: ['<all_urls>'] },
  ['blocking', 'requestHeaders']
);
