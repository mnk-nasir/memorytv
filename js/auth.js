/**
 * auth.js
 * Handles:
 *  - PWA service worker registration
 *  - Google OAuth 2.0 (Drive + Photos scopes)
 *  - Apple Sign In (iCloud Photos via CloudKit)
 *  - Token storage, refresh, and revocation
 *
 * SETUP:
 *  1. Replace GOOGLE_CLIENT_ID with your OAuth 2.0 Web Client ID
 *     https://console.cloud.google.com/apis/credentials
 *  2. Replace APPLE_CLIENT_ID with your Apple Service ID
 *     https://developer.apple.com/account/resources/identifiers
 *  3. Set REDIRECT_URI to your GitHub Pages URL
 */

// ── CONFIG ────────────────────────────────────────────────────────────
const CONFIG = {
  GOOGLE_CLIENT_ID:   'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
  GOOGLE_SCOPES: [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/photoslibrary.readonly',
    'profile',
    'email',
  ].join(' '),

  APPLE_CLIENT_ID:    'com.yourapp.memorytv',
  APPLE_REDIRECT_URI: 'https://mnk-nasir.github.io/memorytv',
  APPLE_SCOPE:        'name email',

  REDIRECT_URI: window.location.origin + window.location.pathname,
};

// ── TOKEN STORE ───────────────────────────────────────────────────────
const TokenStore = {
  save(provider, tokens) {
    sessionStorage.setItem(`mtv_${provider}`, JSON.stringify({
      ...tokens,
      saved_at: Date.now(),
    }));
  },
  get(provider) {
    const raw = sessionStorage.getItem(`mtv_${provider}`);
    return raw ? JSON.parse(raw) : null;
  },
  remove(provider) {
    sessionStorage.removeItem(`mtv_${provider}`);
  },
  isExpired(provider) {
    const t = this.get(provider);
    if (!t) return true;
    const elapsed = (Date.now() - t.saved_at) / 1000;
    return elapsed >= (t.expires_in - 60); // 60s buffer
  },
};

// ── PWA: SERVICE WORKER REGISTRATION ─────────────────────────────────
export async function registerPWA() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Service workers not supported.');
    return;
  }
  try {
    const reg = await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
    console.log('[PWA] Service worker registered:', reg.scope);

    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showToast('Update available — refresh to get the latest version.');
        }
      });
    });

    // Listen for sync messages
    navigator.serviceWorker.addEventListener('message', e => {
      if (e.data.type === 'SYNC_COMPLETE') showToast('Media library synced!');
    });

    // Handle URL params from OAuth redirects
    handleOAuthRedirect();

    // Handle PWA install prompt
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      window._installPrompt = e;
      document.getElementById('pwa-install-btn')?.classList.remove('hidden');
    });

  } catch (err) {
    console.error('[PWA] Registration failed:', err);
  }
}

// ── PWA: INSTALL ──────────────────────────────────────────────────────
export async function installPWA() {
  if (!window._installPrompt) {
    showToast('Open in browser and use "Add to Home Screen"');
    return;
  }
  window._installPrompt.prompt();
  const { outcome } = await window._installPrompt.userChoice;
  if (outcome === 'accepted') showToast('MemoryTV installed!');
  window._installPrompt = null;
}

// ── GOOGLE OAUTH ──────────────────────────────────────────────────────
export function googleSignIn() {
  const params = new URLSearchParams({
    client_id:     CONFIG.GOOGLE_CLIENT_ID,
    redirect_uri:  CONFIG.REDIRECT_URI,
    response_type: 'token',
    scope:         CONFIG.GOOGLE_SCOPES,
    include_granted_scopes: 'true',
    state: 'google_auth',
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function googleSignOut() {
  const tokens = TokenStore.get('google');
  if (tokens?.access_token) {
    fetch(`https://oauth2.googleapis.com/revoke?token=${tokens.access_token}`, { method: 'POST' });
  }
  TokenStore.remove('google');
  updateSourceUI('drive',  false);
  updateSourceUI('photos', false);
  showToast('Signed out of Google');
}

export function isGoogleConnected() {
  return !!TokenStore.get('google') && !TokenStore.isExpired('google');
}

export function getGoogleToken() {
  return TokenStore.get('google')?.access_token;
}

// ── APPLE SIGN IN ─────────────────────────────────────────────────────
export function appleSignIn() {
  if (!window.AppleID) {
    loadAppleScript().then(() => appleSignIn());
    return;
  }
  AppleID.auth.init({
    clientId:    CONFIG.APPLE_CLIENT_ID,
    scope:       CONFIG.APPLE_SCOPE,
    redirectURI: CONFIG.APPLE_REDIRECT_URI,
    usePopup:    true,
  });

  AppleID.auth.signIn()
    .then(response => {
      const { id_token, code } = response.authorization;
      TokenStore.save('apple', { id_token, code, expires_in: 3600 });
      updateSourceUI('apple', true);
      showToast('Apple iCloud connected!');
      fetchApplePhotos();
    })
    .catch(err => {
      if (err.error !== 'popup_closed_by_user') {
        showToast('Apple Sign In failed — check your configuration.');
        console.error('[Apple]', err);
      }
    });
}

export function appleSignOut() {
  TokenStore.remove('apple');
  updateSourceUI('apple', false);
  showToast('Signed out of Apple iCloud');
}

export function isAppleConnected() {
  return !!TokenStore.get('apple') && !TokenStore.isExpired('apple');
}

function loadAppleScript() {
  return new Promise((resolve, reject) => {
    if (document.getElementById('apple-js')) { resolve(); return; }
    const s = document.createElement('script');
    s.id  = 'apple-js';
    s.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
    s.onload  = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ── OAUTH REDIRECT HANDLER ────────────────────────────────────────────
function handleOAuthRedirect() {
  const hash   = new URLSearchParams(window.location.hash.replace('#', '?').slice(1));
  const search = new URLSearchParams(window.location.search);
  const state  = hash.get('state') || search.get('state');

  if (state === 'google_auth' && hash.get('access_token')) {
    const tokens = {
      access_token: hash.get('access_token'),
      expires_in:   parseInt(hash.get('expires_in') || '3600'),
      token_type:   hash.get('token_type'),
    };
    TokenStore.save('google', tokens);
    window.history.replaceState({}, '', window.location.pathname);
    updateSourceUI('drive',  true);
    updateSourceUI('photos', true);
    showToast('Google Drive & Photos connected!');
    fetchGooglePhotos();
    fetchGoogleDrive();
  }
}

// ── GOOGLE PHOTOS API ─────────────────────────────────────────────────
export async function fetchGooglePhotos(pageToken = null) {
  if (!isGoogleConnected()) return [];
  const token = getGoogleToken();
  const body  = { pageSize: 50, ...(pageToken && { pageToken }) };

  const res = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  if (!res.ok) { console.error('[Photos API]', await res.text()); return []; }

  const data = await res.json();
  const items = (data.mediaItems || []).map(normalizeGooglePhoto);
  updateMediaGrid(items, 'photos');
  return items;
}

export async function fetchGoogleAlbums() {
  if (!isGoogleConnected()) return [];
  const token = getGoogleToken();
  const res = await fetch('https://photoslibrary.googleapis.com/v1/albums?pageSize=50', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.albums || []).map(a => ({
    id:     a.id,
    title:  a.title,
    count:  parseInt(a.mediaItemsCount || 0),
    cover:  a.coverPhotoBaseUrl + '=w400-h240-c',
    source: 'photos',
    type:   'album',
  }));
}

export async function fetchGoogleDrive() {
  if (!isGoogleConnected()) return [];
  const token = getGoogleToken();
  const query = encodeURIComponent("mimeType contains 'image/' or mimeType contains 'video/'");
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,thumbnailLink,createdTime,imageMediaMetadata)&pageSize=50`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const items = (data.files || []).map(normalizeGoogleDriveFile);
  updateMediaGrid(items, 'drive');
  return items;
}

// ── APPLE CLOUDKIT API ────────────────────────────────────────────────
export async function fetchApplePhotos() {
  const tokens = TokenStore.get('apple');
  if (!tokens) return [];
  // CloudKit JS — requires Apple Developer setup
  // Full implementation requires CloudKit container configuration
  console.log('[Apple] CloudKit fetch — configure your container ID in CloudKit Dashboard');
  showToast('Apple Photos ready — configure CloudKit container to fetch media.');
  return [];
}

// ── NORMALIZERS ───────────────────────────────────────────────────────
function normalizeGooglePhoto(item) {
  const isVideo = item.mimeType?.startsWith('video/');
  const meta    = item.mediaMetadata || {};
  return {
    id:      item.id,
    title:   item.filename || 'Untitled',
    thumb:   item.baseUrl + '=w400-h240-c',
    url:     item.baseUrl + (isVideo ? '=dv' : '=d'),
    date:    meta.creationTime ? new Date(meta.creationTime).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '',
    type:    isVideo ? 'video' : 'photo',
    source:  'photos',
    loc:     meta.photo?.cameraMake || '',
    people:  '',
  };
}

function normalizeGoogleDriveFile(file) {
  const isVideo = file.mimeType?.startsWith('video/');
  return {
    id:     file.id,
    title:  file.name || 'Untitled',
    thumb:  file.thumbnailLink || '',
    url:    `https://drive.google.com/uc?id=${file.id}`,
    date:   file.createdTime ? new Date(file.createdTime).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '',
    type:   isVideo ? 'video' : 'photo',
    source: 'drive',
    loc:    file.imageMediaMetadata?.location || '',
    people: '',
  };
}

// ── UI HELPERS ────────────────────────────────────────────────────────
function updateSourceUI(sourceId, connected) {
  // Update sidebar badge
  document.querySelectorAll('.source-card').forEach(card => {
    const name = card.querySelector('.source-name')?.textContent?.toLowerCase();
    if (!name) return;
    const matches = (sourceId === 'drive'  && name.includes('drive'))  ||
                    (sourceId === 'photos' && name.includes('photos')) ||
                    (sourceId === 'apple'  && name.includes('apple'))  ||
                    (sourceId === 'local'  && name.includes('local'));
    if (matches) {
      card.classList.toggle('connected', connected);
      const badge = card.querySelector('.source-badge');
      if (badge) badge.classList.toggle('on', connected);
    }
  });

  // Update connect page cards
  document.querySelectorAll('.connect-card').forEach(card => {
    const name = card.querySelector('.connect-card-name')?.textContent?.toLowerCase();
    if (!name) return;
    const matches = (sourceId === 'drive'  && name.includes('drive'))  ||
                    (sourceId === 'photos' && name.includes('photos')) ||
                    (sourceId === 'apple'  && name.includes('apple'));
    if (matches) {
      card.classList.toggle('connected', connected);
      const dot = card.querySelector('.dot');
      if (dot) dot.classList.toggle('green', connected);
      const statusText = card.querySelector('.status-dot span');
      if (statusText) statusText.textContent = connected ? 'Connected' : 'Not connected';
    }
  });
}

function updateMediaGrid(items, source) {
  // Merge real items into the grid — called after API fetch
  if (typeof buildGrid === 'function' && items.length > 0) {
    buildGrid(items, 'media-grid-recent');
  }
}

// ── INIT ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  registerPWA();

  // Restore session state
  if (isGoogleConnected()) {
    updateSourceUI('drive',  true);
    updateSourceUI('photos', true);
  }
  if (isAppleConnected()) {
    updateSourceUI('apple', true);
  }
});
