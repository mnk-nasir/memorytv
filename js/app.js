/**
 * app.js
 * Core application logic: routing, grid rendering, toast notifications.
 *
 * Google OAuth config — replace with your credentials:
 * https://console.cloud.google.com/apis/credentials
 */

const GOOGLE_CLIENT_ID = '791890361828-6fcmcvq9gnvuo8j6da5s1vfou3p7ikio.apps.googleusercontent.com';
const APPLE_CLIENT_ID  = 'com.yourapp.memorytv';
const APPLE_REDIRECT_URI = 'https://mnk-nasir.github.io/memorytv/callback';

// ── SOURCE CSS CLASS MAP ──────────────────────────────────────────────
function srcClass(s) {
  return { drive: 'src-drive', photos: 'src-photos', apple: 'src-apple', local: 'src-local' }[s] || 'src-drive';
}
function typeClass(t) {
  return { photo: 'badge-photo', video: 'badge-video', album: 'badge-album' }[t] || 'badge-photo';
}
function typeLabel(t) {
  return { photo: 'Photo', video: 'Video', album: 'Album' }[t] || 'Photo';
}

// ── GRID BUILDER ─────────────────────────────────────────────────────
function buildGrid(items, id) {
  const g = document.getElementById(id);
  if (!g) return;
  g.innerHTML = items.map(m => `
    <div class="media-card" onclick="openTVMode('${m.thumb || ''}','${m.title}','${m.date}','${m.loc || ''}','${m.people || ''}','${m.url || ''}','${m.type || 'photo'}')">
      <div class="media-thumb" style="background-image: url('${m.thumb || ''}'); background-size: cover; background-position: center;">
        ${!m.thumb ? `<span style="font-size:38px;position:relative;z-index:1">${m.emoji}</span>` : ''}
        <div class="media-play-btn"><div class="play-circle">▶</div></div>
        <div class="media-badge ${typeClass(m.type)}">${typeLabel(m.type)}</div>
      </div>
      <div class="media-info">
        <div class="media-title">${m.title}</div>
        <div class="media-meta">
          <span class="media-source ${srcClass(m.src)}"></span>
          <span>${m.date}</span>
          ${m.loc ? `<span>· ${m.loc}</span>` : ''}
        </div>
      </div>
    </div>`).join('');
}

// ── ALBUM GRID BUILDER ────────────────────────────────────────────────
function buildAlbumGrid(albums, id) {
  const g = document.getElementById(id);
  if (!g) return;
  g.innerHTML = albums.map(a => `
    <div class="media-card" onclick="fetchAlbumPhotos('${a.id}')">
      <div class="media-thumb" style="background-image: url('${a.cover}'); background-size: cover; background-position: center;">
        ${!a.cover ? `<span style="font-size:38px;position:relative;z-index:1">🖼️</span>` : ''}
        <div class="media-play-btn"><div class="play-circle">▶</div></div>
        <div class="media-badge badge-album">Album</div>
      </div>
      <div class="media-info">
        <div class="media-title">${a.title}</div>
        <div class="media-meta">
          <span class="media-source src-photos"></span>
          <span>${a.count} items</span>
        </div>
      </div>
    </div>`).join('');
}

// ── PAGE ROUTING ──────────────────────────────────────────────────────
function showPage(id, pill) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + id);
  if (target) target.classList.add('active');
  if (pill) {
    document.querySelectorAll('.nav-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
  }
}

// ── FILTER CHIPS ──────────────────────────────────────────────────────
function toggleChip(el) {
  const siblings = el.closest('.filter-chips').querySelectorAll('.chip');
  siblings.forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  showToast('Filter applied: ' + el.textContent);
}

// ── CHANNEL PREVIEW ───────────────────────────────────────────────────
function updatePreview() {
  const name = document.getElementById('ch-name').value || 'My Channel';
  const dur  = document.getElementById('slide-dur').value;
  ['preview-name', 'preview-title'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = name;
  });
  const durEl = document.getElementById('preview-dur');
  if (durEl) durEl.textContent = dur + 's per slide';
}

// ── TOAST ─────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ── INIT ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildGrid(MEDIA_ITEMS, 'media-grid-recent');
  buildGrid(ALBUM_ITEMS, 'media-grid-albums');
  buildTVStrip();
  updateTVClock();
  setInterval(updateTVClock, 30000);

  // Listen for real media loaded from Google Photos/Drive
  document.addEventListener('memorytv:media-loaded', (e) => {
    const { items, source } = e.detail;
    if (items && items.length > 0) {
      buildGrid(items, 'media-grid-recent');
    }
  });

  // Listen for albums loaded from Google Photos
  document.addEventListener('memorytv:albums-loaded', (e) => {
    const { albums } = e.detail;
    if (albums && albums.length > 0) {
      buildAlbumGrid(albums, 'media-grid-albums');
    }
  });
});
