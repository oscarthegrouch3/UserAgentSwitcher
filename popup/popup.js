/**
 * UserAgent Switcher - Popup Script
 */

const toggle = document.getElementById('enableToggle');
const platformSelect = document.getElementById('platformSelect');
const presetSelect = document.getElementById('presetSelect');
const customUaInput = document.getElementById('customUaInput');
const customUaWrapper = document.getElementById('customUaWrapper');
const toggleCustomUaBtn = document.getElementById('toggleCustomUaBtn');
const autoReloadToggle = document.getElementById('autoReloadToggle');
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
    'activeUA',
    'customUA',
    'autoReload'
  ]);

  toggle.checked = !!data.enabled;
  platformSelect.value = data.selectedPlatform || '';
  customUaInput.value = data.customUA || '';
  autoReloadToggle.checked = !!data.autoReload;

  if (data.customUA) {
    customUaWrapper.classList.remove('hidden');
    toggleCustomUaBtn.textContent = 'Hide Custom User-Agent';
  }

  if (data.selectedPlatform) {
    updateBrowserDropdown(data.selectedPlatform, data.selectedPreset);
  }

  updatePreviewText(data.enabled, data.activeUA);
});

// Toggle Custom UA Visibility
toggleCustomUaBtn.addEventListener('click', () => {
  const isHidden = customUaWrapper.classList.toggle('hidden');
  toggleCustomUaBtn.textContent = isHidden ? 'Use Custom User-Agent' : 'Hide Custom User-Agent';
  
  // If we hide it, and there was a custom UA, we might want to clear it or just leave it.
  // For now, we just hide the UI.
});

// Update browser dropdown based on chosen platform
function updateBrowserDropdown(platformId, selectedPresetId = '') {
  presetSelect.innerHTML = '<option value="">-- Select Browser --</option>';

  if (!platformId) {
    presetSelect.disabled = true;
    return;
  }

  // Combine built-in presets with user-saved presets
  browser.storage.local.get('userPresets').then(data => {
    const userPresets = data.userPresets || [];
    const builtInPresets = getPresetsByPlatform(platformId);
    
    // Filter user presets for this platform if they have a platform, 
    // or just show all custom ones as a separate category.
    // Since custom presets in options don't have a platform, we show them all.
    
    // 1. Add Built-in Presets
    builtInPresets.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      if (p.id === selectedPresetId) opt.selected = true;
      presetSelect.appendChild(opt);
    });

    if (userPresets.length > 0) {
      const group = document.createElement('optgroup');
      group.label = 'My Custom Presets';
      
      userPresets.forEach(p => {
        const opt = document.createElement('option');
        opt.value = 'custom-' + p.name; // Unique id for custom
        opt.textContent = p.name;
        // We can't easily match selectedPresetId if it's a custom one without more logic, 
        // but we can try.
        presetSelect.appendChild(opt);
      });
      presetSelect.appendChild(group);
    }

    presetSelect.disabled = false;
    if (!selectedPresetId && builtInPresets.length > 0) {
      presetSelect.selectedIndex = 1; 
    }
  });
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

// Helper to reload current tab
async function reloadActiveTab() {
  const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (activeTab && activeTab.id) {
    browser.tabs.reload(activeTab.id);
  }
}

// Refactored Apply logic to be reusable
async function triggerApply() {
  const customUA = customUaInput.value.trim();
  let activeUA = '';
  let platformValue = '';
  let platform = platformSelect.value;
  let presetId = presetSelect.value;

  if (customUA) {
    activeUA = customUA;
  } else {
    // Check if it's a custom user preset
    if (presetId && presetId.startsWith('custom-')) {
      const name = presetId.replace('custom-', '');
      const data = await browser.storage.local.get('userPresets');
      const userPresets = data.userPresets || [];
      const customPreset = userPresets.find(p => p.name === name);
      if (customPreset) {
        activeUA = customPreset.userAgent;
      }
    } else {
      const preset = getPresetById(presetId);
      if (!preset) return; // Don't reload if nothing is selected
      activeUA = preset.userAgent;
      platformValue = preset.platformValue;
    }
  }

  await browser.storage.local.set({
    enabled: true,
    selectedPlatform: platform,
    selectedPreset: presetId,
    activeUA: activeUA,
    activePlatform: platformValue,
    customUA: customUA
  });

  updatePreviewText(true, activeUA);
  await reloadActiveTab();
}

// When platform changes, refresh browser list
platformSelect.addEventListener('change', async () => {
  updateBrowserDropdown(platformSelect.value);
  if (autoReloadToggle.checked && toggle.checked) {
    await triggerApply();
  }
});

// When browser preset changes
presetSelect.addEventListener('change', async () => {
  if (autoReloadToggle.checked && toggle.checked) {
    await triggerApply();
  }
});

// When custom UA input changes
customUaInput.addEventListener('input', async () => {
  if (autoReloadToggle.checked && toggle.checked) {
    await triggerApply();
  }
});

// Handle auto-reload setting change
autoReloadToggle.addEventListener('change', async () => {
  await browser.storage.local.set({ autoReload: autoReloadToggle.checked });
});

// Apply & Reload Tab
applyBtn.addEventListener('click', async () => {
  const customUA = customUaInput.value.trim();
  let activeUA = '';
  let platformValue = '';
  let platform = platformSelect.value;
  let presetId = presetSelect.value;

  if (customUA) {
    activeUA = customUA;
  } else {
    // Check if it's a custom user preset
    if (presetId && presetId.startsWith('custom-')) {
      const name = presetId.replace('custom-', '');
      const data = await browser.storage.local.get('userPresets');
      const userPresets = data.userPresets || [];
      const customPreset = userPresets.find(p => p.name === name);
      if (customPreset) {
        activeUA = customPreset.userAgent;
      } else {
        alert('Custom preset not found.');
        return;
      }
    } else {
      const preset = getPresetById(presetId);
      if (!preset) {
        alert('Please select a platform and browser preset, or enter a custom User-Agent.');
        return;
      }
      activeUA = preset.userAgent;
      platformValue = preset.platformValue;
    }
  }

  toggle.checked = true;

  await browser.storage.local.set({
    enabled: true,
    selectedPlatform: platform,
    selectedPreset: presetId,
    activeUA: activeUA,
    activePlatform: platformValue,
    customUA: customUA
  });

  updatePreviewText(true, activeUA);
  await reloadActiveTab();
});

// Reset to Default
resetBtn.addEventListener('click', async () => {
  toggle.checked = false;
  platformSelect.value = '';
  presetSelect.innerHTML = '<option value="">-- Select Browser --</option>';
  presetSelect.disabled = true;
  customUaInput.value = '';

  await browser.storage.local.set({
    enabled: false,
    selectedPlatform: '',
    selectedPreset: '',
    activeUA: '',
    activePlatform: '',
    customUA: ''
  });

  updatePreviewText(false, '');
  await reloadActiveTab();
});

// Direct toggle change
toggle.addEventListener('change', async () => {
  if (!toggle.checked) {
    await browser.storage.local.set({ enabled: false });
    updatePreviewText(false, '');
  } else {
    const customUA = customUaInput.value.trim();
    const preset = getPresetById(presetSelect.value);
    
    let activeUA = '';
    let platformValue = '';

    if (customUA) {
      activeUA = customUA;
    } else if (preset) {
      activeUA = preset.userAgent;
      platformValue = preset.platformValue;
    }

    if (activeUA) {
      await browser.storage.local.set({
        enabled: true,
        activeUA: activeUA,
        activePlatform: platformValue
      });
      updatePreviewText(true, activeUA);
    }
  }
});
