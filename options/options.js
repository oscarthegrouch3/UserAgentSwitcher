/**
 * UserAgent Switcher - Options Page Script
 */

const nameInput = document.getElementById('customName');
const uaInput = document.getElementById('customUA');
const addBtn = document.getElementById('addPresetBtn');
const listContainer = document.getElementById('savedPresetsList');
const globalAutoReload = document.getElementById('globalAutoReload');
const saveAllBtn = document.getElementById('saveAllBtn');

let userPresets = [];

async function loadSettings() {
  const data = await browser.storage.local.get(['userPresets', 'globalAutoReload']);
  userPresets = data.userPresets || [];
  globalAutoReload.checked = !!data.globalAutoReload;
  renderPresets();
}

function renderPresets() {
  listContainer.innerHTML = '';
  
  if (userPresets.length === 0) {
    listContainer.innerHTML = '<p class="hint">No custom presets saved yet.</p>';
    return;
  }

  userPresets.forEach((p, index) => {
    const div = document.createElement('div');
    div.className = 'preset-item';
    div.innerHTML = `
      <div class="preset-info">
        <span class="preset-name">${escapeHtml(p.name)}</span>
        <span class="preset-ua">${escapeHtml(p.userAgent)}</span>
      </div>
      <button class="btn-danger" data-index="${index}">Remove</button>
    `;
    listContainer.appendChild(div);
  });

  // Add remove listeners
  listContainer.querySelectorAll('.btn-danger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      userPresets.splice(index, 1);
      renderPresets();
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

addBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  const ua = uaInput.value.trim();

  if (!name || !ua) {
    alert('Please provide both a name and a User-Agent string.');
    return;
  }

  userPresets.push({ name, userAgent: ua });
  nameInput.value = '';
  uaInput.value = '';
  renderPresets();
});

saveAllBtn.addEventListener('click', async () => {
  await browser.storage.local.set({
    userPresets: userPresets,
    globalAutoReload: globalAutoReload.checked
  });
  alert('Settings saved successfully!');
});

document.addEventListener('DOMContentLoaded', loadSettings);
