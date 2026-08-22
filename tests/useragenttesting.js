/**
 * test-ua-switcher.js
 *
 * Automated test harness for the UserAgent Switcher extension (Firefox only).
 *
 * Requires:
 *   npm install --save-dev playwright web-ext
 *
 * How it works:
 *   1. `web-ext run` launches Firefox with the extension pre-loaded and
 *      opens a remote debugging port (via --firefox-profile + RDP).
 *   2. Playwright connects to that already-running Firefox instance over
 *      CDP-equivalent (Firefox's Juggler protocol) instead of launching
 *      its own clean browser — this is required because Playwright cannot
 *      load unpacked Firefox WebExtensions on its own.
 *   3. Extension storage is seeded via the Browser Toolbox / a scripted
 *      debugger connection, since there is no popup UI in this codebase.
 *
 * Usage:
 *   npm run test:firefox
 */

const { firefox } = require('playwright');
const { execa } = require('execa'); // npm install --save-dev execa
const path = require('path');
const assert = require('assert');

const EXTENSION_SOURCE_DIR = path.resolve(__dirname, '..'); // folder containing manifest.json
const REMOTE_DEBUG_PORT = 9222;
const TEST_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TestUA/1.0';
const TEST_PLATFORM = 'Win32';
const ECHO_URL = 'https://httpbin.org/user-agent'; // server-side UA echo
const TEST_PAGE_URL = 'https://example.com';

let webExtProcess;

// LAUNCH: start Firefox with the extension loaded via web-ext
async function launchFirefoxWithExtension() {
  webExtProcess = execa(
    'npx',
    [
      'web-ext',
      'run',
      '--source-dir', EXTENSION_SOURCE_DIR,
      '--start-url', 'about:blank',
      '--firefox-profile', 'ua-switcher-test-profile',
      '--keep-profile-changes',
      '--pref', 'devtools.debugger.remote-enabled=true',
      '--pref', `devtools.debugger.remote-port=${REMOTE_DEBUG_PORT}`,
      '--pref', 'devtools.debugger.prompt-connection=false',
    ],
    { stdio: 'pipe' }
  );

  // Give Firefox time to fully start and open the debug port before connecting.
  await new Promise((resolve) => setTimeout(resolve, 5000));

  webExtProcess.stdout?.on('data', (d) => console.log('[web-ext]', d.toString().trim()));
  webExtProcess.stderr?.on('data', (d) => console.error('[web-ext:err]', d.toString().trim()));
}

async function stopFirefox() {
  if (webExtProcess) {
    webExtProcess.kill();
  }
}

// SEED STORAGE: since there's no popup UI, write directly to
// browser.storage.local by evaluating in the extension's background context.
// This connects via Playwright's Firefox support for extension background
// pages once attached to the running instance.
async function seedExtensionStorage(context) {
  const backgroundPage = context.backgroundPages()[0];

  if (!backgroundPage) {
    throw new Error(
      'Could not find the extension background page. Confirm web-ext loaded ' +
      'the extension successfully and that manifest.json points to a valid background script.'
    );
  }

  await backgroundPage.evaluate(
    ({ ua, platform }) =>
      browser.storage.local.set({ enabled: true, activeUA: ua, activePlatform: platform }),
    { ua: TEST_UA, platform: TEST_PLATFORM }
  );

  console.log('Seeded extension storage with test UA\n');
}

async function disableExtensionSpoof(context) {
  const backgroundPage = context.backgroundPages()[0];
  await backgroundPage.evaluate(() => browser.storage.local.set({ enabled: false }));
}

// TESTS
async function testJsLevelSpoof(page) {
  await page.goto(TEST_PAGE_URL);

  const { ua, appVersion, platform } = await page.evaluate(() => ({
    ua: navigator.userAgent,
    appVersion: navigator.appVersion,
    platform: navigator.platform,
  }));

  console.log('[JS-level] userAgent:', ua);
  console.log('[JS-level] appVersion:', appVersion);
  console.log('[JS-level] platform:', platform);

  assert.strictEqual(ua, TEST_UA, 'navigator.userAgent did not match spoofed value');
  assert.strictEqual(
    appVersion,
    TEST_UA.replace(/^Mozilla\//, ''),
    'navigator.appVersion did not match derived spoofed value'
  );
  assert.strictEqual(platform, TEST_PLATFORM, 'navigator.platform did not match spoofed value');

  console.log('JS-level spoof test passed\n');
}

async function testNetworkLevelSpoof(page) {
  const response = await page.goto(ECHO_URL);
  const body = await response.json();

  console.log('[Network-level] Server saw User-Agent:', body['user-agent']);

  assert.strictEqual(
    body['user-agent'],
    TEST_UA,
    'Server-observed User-Agent header did not match spoofed value'
  );

  console.log('Network-level spoof test passed\n');
}

async function testToggleOff(context, page) {
  await disableExtensionSpoof(context);

  await page.goto(TEST_PAGE_URL, { waitUntil: 'load' });
  const ua = await page.evaluate(() => navigator.userAgent);

  console.log('[Toggle-off] userAgent after disabling:', ua);
  assert.notStrictEqual(ua, TEST_UA, 'Spoof was still active after disabling extension');

  console.log('Toggle-off test passed\n');
}

// MAIN
(async () => {
  let browserInstance;

  try {
    await launchFirefoxWithExtension();

    browserInstance = await firefox.connect(`ws://localhost:${REMOTE_DEBUG_PORT}`);
    const context = browserInstance.contexts()[0] || (await browserInstance.newContext());
    const page = await context.newPage();

    await seedExtensionStorage(context);
    await testJsLevelSpoof(page);
    await testNetworkLevelSpoof(page);
    await testToggleOff(context, page);

    console.log('All tests passed');
    process.exitCode = 0;
  } catch (err) {
    console.error('Test failed:', err.message);
    process.exitCode = 1;
  } finally {
    if (browserInstance) await browserInstance.close().catch(() => {});
    await stopFirefox();
  }
})();