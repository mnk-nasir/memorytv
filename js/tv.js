/**
 * tv.js
 * Full-screen TV Mode — slideshow player with progress, controls,
 * channel strip, and keyboard / D-pad navigation.
 */

const SLIDE_DURATION = 8000; // ms per slide

let tvIdx      = 0;
let tvPlaying  = true;
let tvInterval = null;
let tvProgressInterval = null;
let tvPct      = 0;

// ── CLOCK ─────────────────────────────────────────────────────────────
function updateTVClock() {
  const now = new Date();
  const el  = document.getElementById('tv-clock');
  if (el) {
    el.textContent =
      now.getHours().toString().padStart(2, '0') + ':' +
      now.getMinutes().toString().padStart(2, '0');
  }
}

// ── STRIP ─────────────────────────────────────────────────────────────
function buildTVStrip() {
  const strip = document.getElementById('tv-strip');
  if (!strip) return;
  strip.innerHTML = TV_ITEMS.map((item, i) => `
    <div class="tv-ch-thumb ${i === tvIdx ? 'active' : ''}" onclick="tvJump(${i})" 
         style="background-image: url('${item.thumb || ''}'); background-size: cover; background-position: center;">
      ${!item.thumb ? item.emoji : ''}
    </div>`).join('');
}

// ── UPDATE DISPLAY ────────────────────────────────────────────────────
function tvUpdate() {
  const item = TV_ITEMS[tvIdx];
  if (!item) return;

  const display = document.getElementById('tv-display');
  if (display) {
    if (item.type === 'video') {
      display.innerHTML = `<video src="${item.url}" autoplay muted loop style="width:100%; height:100%; object-fit: cover; animation: fadeIn 0.8s"></video>`;
    } else {
      display.innerHTML = `<img src="${item.url || item.thumb}" style="width:100%; height:100%; object-fit: cover; animation: fadeIn 0.8s">`;
    }
  }

  const titleEl = document.getElementById('tv-media-title');
  if (titleEl) titleEl.textContent = item.title;

  const subEl = document.getElementById('tv-media-sub');
  if (subEl) subEl.textContent = item.sub;

  const tagsEl = document.getElementById('tv-tags');
  if (tagsEl && item.tags) {
    tagsEl.innerHTML = item.tags.map(t => `<span class="tv-tag">${t}</span>`).join('');
  }

  buildTVStrip();
}

// ── PROGRESS ─────────────────────────────────────────────────────────
function tvStartProgress() {
  clearInterval(tvProgressInterval);
  tvPct = 0;
  const bar = document.getElementById('tv-progress');
  if (bar) bar.style.width = '0%';

  tvProgressInterval = setInterval(() => {
    tvPct += 100 / (SLIDE_DURATION / 100);
    if (bar) bar.style.width = Math.min(tvPct, 100) + '%';
  }, 100);
}

// ── PLAYBACK ─────────────────────────────────────────────────────────
function tvPlay() {
  clearInterval(tvInterval);
  tvStartProgress();
  tvInterval = setInterval(() => tvNext(), SLIDE_DURATION);
  const btn = document.getElementById('tv-play-btn');
  if (btn) btn.textContent = '⏸';
  tvPlaying = true;
}

function tvPause() {
  clearInterval(tvInterval);
  clearInterval(tvProgressInterval);
  const btn = document.getElementById('tv-play-btn');
  if (btn) btn.textContent = '▶';
  tvPlaying = false;
}

function tvTogglePlay() {
  tvPlaying ? tvPause() : tvPlay();
}

function tvNext() {
  tvIdx = (tvIdx + 1) % TV_ITEMS.length;
  tvUpdate();
  if (tvPlaying) tvPlay();
}

function tvPrev() {
  tvIdx = (tvIdx - 1 + TV_ITEMS.length) % TV_ITEMS.length;
  tvUpdate();
  if (tvPlaying) tvPlay();
}

function tvJump(i) {
  tvIdx = i;
  tvUpdate();
  if (tvPlaying) tvPlay();
}

// ── OPEN / CLOSE ──────────────────────────────────────────────────────
function openTVMode(thumb, title, date, loc, people, url, type) {
  if (thumb) {
    TV_ITEMS[0] = {
      thumb,
      url: url || thumb,
      type: type || 'photo',
      title: title || '',
      sub: [loc ? '📍 ' + loc : '', people ? '👤 ' + people : '', date ? '📅 ' + date : '']
            .filter(Boolean).join(' · '),
      tags: [loc, 'Google Photos'].filter(Boolean),
    };
    tvIdx = 0;
  }
  const overlay = document.getElementById('tv-mode');
  if (overlay) overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  tvUpdate();
  tvPlay();
  updateTVClock();
}

function closeTVMode() {
  const overlay = document.getElementById('tv-mode');
  if (overlay) overlay.classList.remove('active');
  document.body.style.overflow = '';
  tvPause();
}

// ── KEYBOARD / D-PAD ─────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  const tvActive = document.getElementById('tv-mode')?.classList.contains('active');
  if (!tvActive) return;

  if (e.key === 'ArrowRight' || e.key === 'ArrowDown')  tvNext();
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')    tvPrev();
  if (e.key === ' ' || e.key === 'Enter')               tvTogglePlay();
  if (e.key === 'Escape')                               closeTVMode();
  e.preventDefault();
});
