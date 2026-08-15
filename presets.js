/**
 * UserAgent Switcher - Platform Presets
 */

const PRESETS = [
  // --- WINDOWS ---
  {
    id: 'win-chrome',
    platform: 'windows',
    name: 'Google Chrome',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    platformValue: 'Win32'
  },
  {
    id: 'win-edge',
    platform: 'windows',
    name: 'Microsoft Edge',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
    platformValue: 'Win32'
  },
  {
    id: 'win-firefox',
    platform: 'windows',
    name: 'Mozilla Firefox',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
    platformValue: 'Win32'
  },

  // --- MACOS ---
  {
    id: 'mac-safari',
    platform: 'macos',
    name: 'Apple Safari',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15',
    platformValue: 'MacIntel'
  },
  {
    id: 'mac-chrome',
    platform: 'macos',
    name: 'Google Chrome',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    platformValue: 'MacIntel'
  },
  {
    id: 'mac-firefox',
    platform: 'macos',
    name: 'Mozilla Firefox',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:133.0) Gecko/20100101 Firefox/133.0',
    platformValue: 'MacIntel'
  },

  // --- LINUX ---
  {
    id: 'linux-firefox',
    platform: 'linux',
    name: 'Mozilla Firefox',
    userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0',
    platformValue: 'Linux x86_64'
  },
  {
    id: 'linux-chrome',
    platform: 'linux',
    name: 'Google Chrome',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    platformValue: 'Linux x86_64'
  },

  // --- IOS ---
  {
    id: 'ios-safari-iphone',
    platform: 'ios',
    name: 'Safari (iPhone)',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1',
    platformValue: 'iPhone'
  },
  {
    id: 'ios-safari-ipad',
    platform: 'ios',
    name: 'Safari (iPad)',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1',
    platformValue: 'iPad'
  },

  // --- ANDROID ---
  {
    id: 'android-chrome',
    platform: 'android',
    name: 'Google Chrome',
    userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.135 Mobile Safari/537.36',
    platformValue: 'Linux armv8l'
  },
  {
    id: 'android-firefox',
    platform: 'android',
    name: 'Mozilla Firefox',
    userAgent: 'Mozilla/5.0 (Android 14; Mobile; rv:133.0) Gecko/133.0 Firefox/133.0',
    platformValue: 'Linux armv8l'
  }
];

const PLATFORMS = [
  { id: 'windows', name: 'Windows' },
  { id: 'macos', name: 'macOS' },
  { id: 'linux', name: 'Linux' },
  { id: 'ios', name: 'iOS (iPhone / iPad)' },
  { id: 'android', name: 'Android' }
];

function getPresetById(id) {
  return PRESETS.find(p => p.id === id) || null;
}

function getPresetsByPlatform(platformId) {
  return PRESETS.filter(p => p.platform === platformId);
}
