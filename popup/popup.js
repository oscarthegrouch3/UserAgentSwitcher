/**
 * UserAgent Switcher - Popup Script
 */

const toggle = document.getElementById('enableToggle');
const platformSelect = document.getElementById('platformSelect');
const presetSelect = document.getElementById('presetSelect');
const activeUaText = document.getElementById('activeUaText');
const statusBadge = document.getElementById('statusBadge');
const applyBtn = document.getElementById('applyBtn');
const resetBtn = document.getElementById('resetBtn');

// Initialize popup on load
document.addEventListener('DOMContentLoaded', async () => {
  const data = await browser.storage.local.get([
    'enabled',
    'selectedPlatform',
    'selectedPreset',
    'activeUA'
  ]);

  toggle.checked = !!data.enabled;
  platformSelect.value = data.selectedPlatform || '';

  if (data.selectedPlatform) {
    updateBrowserDropdown(data.selectedPlatform, data.selectedPreset);
  }

  updatePreviewText(data.enabled, data.activeUA);
});

// Update browser dropdown based on chosen platform
function updateBrowserDropdown(platformId, selectedPresetId = '') {
  presetSelect.innerHTML = '<option value="">-- Select Browser --</option>';

  if (!platformId) {
    presetSelect.disabled = true;
    return;
  }

  const presets = getPresetsByPlatform(platformId);
  presets.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    if (p.id === selectedPresetId) opt.selected = true;
    presetSelect.appendChild(opt);
  });

  presetSelect.disabled = false;
  if (!selectedPresetId && presets.length > 0) {
    presetSelect.selectedIndex = 1; // Default to first available browser in that platform
  }
}

// Update status badge and active User-Agent display
function updatePreviewText(enabled, ua) {
  if (statusBadge) {
    statusBadge.textContent = enabled ? 'On' : 'Off';
  }
  if (enabled && ua) {
    activeUaText.textContent = ua;
  } else {
    activeUaText.textContent = navigator.userAgent; // Show real system User-Agent when Off
  }
}

// When platform changes, refresh browser list
platformSelect.addEventListener('change', () => {
  updateBrowserDropdown(platformSelect.value);
});

// Apply & Reload Tab
applyBtn.addEventListener('click', async () => {
  const platform = platformSelect.value;
  const presetId = presetSelect.value;
  const preset = getPresetById(presetId);

  if (!preset) {
    alert('Please select a platform and browser preset first.');
    return;
  }

  toggle.checked = true;

  await browser.storage.local.set({
    enabled: true,
    selectedPlatform: platform,
    selectedPreset: presetId,
    activeUA: preset.userAgent,
    activePlatform: preset.platformValue
  });

  updatePreviewText(true, preset.userAgent);

  // Reload current active tab
  const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (activeTab && activeTab.id) {
    browser.tabs.reload(activeTab.id);
  }
});

// Reset to Default
resetBtn.addEventListener('click', async () => {
  toggle.checked = false;
  platformSelect.value = '';
  presetSelect.innerHTML = '<option value="">-- Select Browser --</option>';
  presetSelect.disabled = true;

  await browser.storage.local.set({
    enabled: false,
    selectedPlatform: '',
    selectedPreset: '',
    activeUA: '',
    activePlatform: ''
  });

  updatePreviewText(false, '');

  // Reload current active tab
  const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (activeTab && activeTab.id) {
    browser.tabs.reload(activeTab.id);
  }
});

// Direct toggle change
toggle.addEventListener('change', async () => {
  if (!toggle.checked) {
    await browser.storage.local.set({ enabled: false });
    updatePreviewText(false, '');
  } else {
    const preset = getPresetById(presetSelect.value);
    if (preset) {
      await browser.storage.local.set({
        enabled: true,
        activeUA: preset.userAgent,
        activePlatform: preset.platformValue
      });
      updatePreviewText(true, preset.userAgent);
    }
  }
});
