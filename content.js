/**
 * UserAgent Switcher - Content Script
 * Overrides navigator.userAgent and navigator.platform in page context at document_start.
 */

(async () => {
  try {
    const data = await browser.storage.local.get(['enabled', 'activeUA', 'activePlatform']);

    // Do nothing if disabled or no active UA
    if (!data.enabled || !data.activeUA) {
      return;
    }

    const ua = data.activeUA;
    const platform = data.activePlatform || '';

    // Firefox official wrappedJSObject API for safe prototype overrides
    if (typeof window.wrappedJSObject !== 'undefined') {
      const win = window.wrappedJSObject;
      if (win.Navigator && win.Navigator.prototype && typeof exportFunction === 'function') {
        try {
          // Override navigator.userAgent
          Object.defineProperty(win.Navigator.prototype, 'userAgent', {
            get: exportFunction(() => ua, win),
            configurable: true,
            enumerable: true
          });

          // Override navigator.appVersion
          Object.defineProperty(win.Navigator.prototype, 'appVersion', {
            get: exportFunction(() => ua.replace(/^Mozilla\//, ''), win),
            configurable: true,
            enumerable: true
          });

          // Override navigator.platform (e.g. Win32, MacIntel, Linux x86_64, iPhone)
          if (platform) {
            Object.defineProperty(win.Navigator.prototype, 'platform', {
              get: exportFunction(() => platform, win),
              configurable: true,
              enumerable: true
            });
          }
        } catch (e) {}
      }
    }
  } catch (e) {
    // Fail gracefully
  }
})();
