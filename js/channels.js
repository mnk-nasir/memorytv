/**
 * channels.js
 * Channel builder — create, preview and save custom channels.
 */

const savedChannels = [
  { emoji: '🌅', name: 'Summer 2024',    count: 142, duration: 8  },
  { emoji: '👨‍👩‍👧‍👦', name: 'Family Channel',  count: 312, duration: 10 },
  { emoji: '✈️', name: 'Travel Memories', count: 89,  duration: 6  },
];

function updatePreview() {
  const name = document.getElementById('ch-name')?.value || 'My Channel';
  const dur  = document.getElementById('slide-dur')?.value || 8;

  ['preview-name', 'preview-title'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = name;
  });

  const durEl = document.getElementById('preview-dur');
  if (durEl) durEl.textContent = dur + 's per slide';
}

function saveChannel() {
  const name = document.getElementById('ch-name')?.value;
  const dur  = parseInt(document.getElementById('slide-dur')?.value || 8);

  if (!name || name.trim() === '') {
    showToast('Please enter a channel name first.');
    return;
  }

  savedChannels.push({ emoji: '📺', name: name.trim(), count: 0, duration: dur });
  renderSavedChannels();
  showToast(`Channel "${name}" saved! Ready to stream.`);
}

function renderSavedChannels() {
  const container = document.getElementById('saved-channels-list');
  if (!container) return;
  container.innerHTML = savedChannels.map(ch => `
    <div class="playlist-item">
      <div class="playlist-thumb">${ch.emoji}</div>
      <div class="playlist-meta">
        <div class="playlist-name">${ch.name}</div>
        <div class="playlist-count">${ch.count} items · ${ch.duration}s</div>
      </div>
    </div>`).join('');
}

document.addEventListener('DOMContentLoaded', renderSavedChannels);
