// Global State & Map Reference
let map;
let markersGroup;
let isRegisterMode = false;

// Token & User helpers
const getToken = () => localStorage.getItem('astromaps_token');
const getUser = () => JSON.parse(localStorage.getItem('astromaps_user') || 'null');

// Initialize Leaflet Map with Open-Access Tile Provider
function initMap() {
  map = L.map('map', {
    center: [0, 0],
    zoom: 2,
    minZoom: 1,
    maxZoom: 6
  });

  // OpenStreetMap tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  markersGroup = L.layerGroup().addTo(map);
}

// Fetch Sidereal Time from API
async function fetchSiderealTime() {
  try {
    const response = await fetch('/api/astro/sidereal-time?longitude=0.0');
    if (!response.ok) return;
    const data = await response.json();

    document.getElementById('gstVal').textContent = `${data.gstHours}h`;
    document.getElementById('lstVal').textContent = `${data.lstHours}h`;
    document.getElementById('zenithVal').textContent = `${data.zenithRA}h`;
  } catch (err) {
    console.error('Failed to fetch sidereal time:', err);
  }
}

// Search Catalog Objects via API
async function searchCatalog() {
  const query = document.getElementById('searchInput').value.trim();
  const resultsContainer = document.getElementById('resultsList');
  if (!query) return;

  resultsContainer.innerHTML = '<p class="text-slate-400 text-sm">Searching...</p>';
  markersGroup.clearLayers();

  try {
    const response = await fetch(`/api/astro/catalog/search?query=${encodeURIComponent(query)}`);
    const results = await response.json();

    resultsContainer.innerHTML = '';

    if (!Array.isArray(results) || results.length === 0) {
      resultsContainer.innerHTML = '<p class="text-amber-400 text-sm">No celestial targets found.</p>';
      return;
    }

    const token = getToken();

    results.forEach(obj => {
      const card = document.createElement('div');
      card.className = 'p-3 bg-slate-950 border border-slate-800 rounded-lg hover:border-indigo-500 transition space-y-2';
      card.innerHTML = `
        <div class="flex justify-between items-start">
          <h3 class="font-bold text-indigo-300 text-sm cursor-pointer hover:underline">${obj.catalog_id} - ${obj.object_name}</h3>
          <span class="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">${obj.type}</span>
        </div>
        <p class="text-xs text-slate-400">RA: <span class="text-slate-200">${obj.ra}°</span> | Dec: <span class="text-slate-200">${obj.dec}°</span></p>
        ${token ? `
          <button type="button" class="saveTargetBtn text-xs bg-slate-800 hover:bg-indigo-600 text-slate-200 px-2 py-1 rounded w-full transition cursor-pointer" data-id="${obj.catalog_id}" data-name="${obj.object_name}">
            ⭐ Bookmark Target
          </button>
        ` : ''}
      `;

      // Zoom map on target click
      card.querySelector('h3').addEventListener('click', () => {
        map.setView([obj.dec, obj.ra], 4);
      });

      // Save event handler
      const saveBtn = card.querySelector('.saveTargetBtn');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => saveTarget(obj.catalog_id, obj.object_name));
      }

      resultsContainer.appendChild(card);

      // Add Map Marker
      const marker = L.circleMarker([obj.dec, obj.ra], {
        color: '#818cf8',
        radius: 8,
        fillColor: '#6366f1',
        fillOpacity: 0.8
      });
      marker.bindPopup(`<strong>${obj.catalog_id} (${obj.object_name})</strong><br/>RA: ${obj.ra}° | Dec: ${obj.dec}°`);
      markersGroup.addLayer(marker);
    });

  } catch (err) {
    console.error('Search error:', err);
    resultsContainer.innerHTML = '<p class="text-rose-400 text-sm">Error querying server.</p>';
  }
}

// Save Target Bookmark
async function saveTarget(catalog_id, object_name) {
  const token = getToken();
  if (!token) return alert('Please login to save targets.');

  try {
    const response = await fetch('/api/targets/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ catalog_id, object_name, notes: 'Saved from catalog search' })
    });

    if (response.ok) {
      fetchSavedTargets();
      alert(`Bookmark saved: ${catalog_id}`);
    } else {
      const data = await response.json();
      alert(data.error || 'Failed to save target.');
    }
  } catch (err) {
    console.error('Save failed:', err);
  }
}

// Fetch Saved Targets
async function fetchSavedTargets() {
  const token = getToken();
  const savedContainer = document.getElementById('savedList');
  const savedCount = document.getElementById('savedCount');

  if (!token) {
    savedContainer.innerHTML = '<p class="text-slate-500 text-sm italic">Log in to view your saved targets.</p>';
    savedCount.textContent = '0';
    return;
  }

  try {
    const response = await fetch('/api/targets', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const targets = await response.json();

    if (!Array.isArray(targets)) {
      savedContainer.innerHTML = '<p class="text-rose-400 text-sm">Failed to load saved targets.</p>';
      return;
    }

    savedCount.textContent = targets.length;
    savedContainer.innerHTML = '';

    if (targets.length === 0) {
      savedContainer.innerHTML = '<p class="text-slate-500 text-sm italic">No targets bookmarked yet.</p>';
      return;
    }

    targets.forEach(t => {
      const card = document.createElement('div');
      card.className = 'p-3 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-center';
      card.innerHTML = `
        <div>
          <h4 class="font-bold text-indigo-300 text-sm">${t.catalog_id} - ${t.object_name}</h4>
          <p class="text-xs text-slate-400">${t.notes || 'No notes'}</p>
        </div>
        <button type="button" class="deleteBtn text-xs text-rose-400 hover:text-rose-300 p-1 cursor-pointer">Delete</button>
      `;

      card.querySelector('.deleteBtn').addEventListener('click', () => deleteTarget(t.id));
      savedContainer.appendChild(card);
    });

  } catch (err) {
    console.error('Failed to load saved targets:', err);
  }
}

// Delete Target Bookmark
async function deleteTarget(id) {
  const token = getToken();
  try {
    await fetch(`/api/targets/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchSavedTargets();
  } catch (err) {
    console.error('Delete failed:', err);
  }
}

// UI State Management (Auth Header & Saved Tabs)
function updateAuthUI() {
  const user = getUser();
  const openAuthBtn = document.getElementById('openAuthBtn');
  const userInfo = document.getElementById('userInfo');
  const userGreeting = document.getElementById('userGreeting');

  if (user) {
    openAuthBtn.classList.add('hidden');
    userInfo.classList.remove('hidden');
    userGreeting.textContent = `👤 ${user.username}`;
    fetchSavedTargets();
  } else {
    openAuthBtn.classList.remove('hidden');
    userInfo.classList.add('hidden');
    document.getElementById('savedCount').textContent = '0';
  }
}

// Event Listeners Initialization
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  fetchSiderealTime();
  setInterval(fetchSiderealTime, 10000);
  updateAuthUI();

  // Modal Control Handlers
  const authModal = document.getElementById('authModal');
  const openAuthBtn = document.getElementById('openAuthBtn');
  const closeAuthModal = document.getElementById('closeAuthModal');

  if (openAuthBtn && authModal) {
    openAuthBtn.addEventListener('click', (e) => {
      e.preventDefault();
      authModal.classList.remove('hidden');
    });
  }

  if (closeAuthModal && authModal) {
    closeAuthModal.addEventListener('click', () => {
      authModal.classList.add('hidden');
    });
  }

  // Search Control Handlers
  document.getElementById('searchBtn').addEventListener('click', searchCatalog);
  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchCatalog();
  });

  // Tab Switching Handlers
  const tabSearch = document.getElementById('tabSearch');
  const tabSaved = document.getElementById('tabSaved');
  const panelSearch = document.getElementById('panelSearch');
  const panelSaved = document.getElementById('panelSaved');

  tabSearch.addEventListener('click', () => {
    tabSearch.className = 'text-sm font-semibold text-indigo-400 border-b-2 border-indigo-500 pb-1 cursor-pointer';
    tabSaved.className = 'text-sm font-semibold text-slate-400 hover:text-slate-200 border-b-2 border-transparent pb-1 cursor-pointer';
    panelSearch.classList.remove('hidden');
    panelSaved.classList.add('hidden');
  });

  tabSaved.addEventListener('click', () => {
    tabSaved.className = 'text-sm font-semibold text-indigo-400 border-b-2 border-indigo-500 pb-1 cursor-pointer';
    tabSearch.className = 'text-sm font-semibold text-slate-400 hover:text-slate-200 border-b-2 border-transparent pb-1 cursor-pointer';
    panelSaved.classList.remove('hidden');
    panelSearch.classList.add('hidden');
    fetchSavedTargets();
  });

  // Modal Toggle Handler (Login vs Register Mode)
  const toggleAuthModeBtn = document.getElementById('toggleAuthModeBtn');
  const modalTitle = document.getElementById('modalTitle');
  const usernameField = document.getElementById('usernameField');
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  const authToggleMsg = document.getElementById('authToggleMsg');

  toggleAuthModeBtn.addEventListener('click', () => {
    isRegisterMode = !isRegisterMode;
    if (isRegisterMode) {
      modalTitle.textContent = 'Create Account';
      usernameField.classList.remove('hidden');
      authSubmitBtn.textContent = 'Register';
      authToggleMsg.textContent = 'Already have an account?';
      toggleAuthModeBtn.textContent = 'Sign in';
    } else {
      modalTitle.textContent = 'Account Login';
      usernameField.classList.add('hidden');
      authSubmitBtn.textContent = 'Sign In';
      authToggleMsg.textContent = "Don't have an account?";
      toggleAuthModeBtn.textContent = 'Register here';
    }
  });

  // Authentication Form Submit Handler
  document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const username = document.getElementById('authUsername').value;
    const authError = document.getElementById('authError');

    const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegisterMode ? { username, email, password } : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        authError.textContent = data.error || 'Authentication failed.';
        authError.classList.remove('hidden');
        return;
      }

      localStorage.setItem('astromaps_token', data.token);
      localStorage.setItem('astromaps_user', JSON.stringify(data.user));

      authError.classList.add('hidden');
      authModal.classList.add('hidden');
      updateAuthUI();
    } catch (err) {
      console.error('Auth error:', err);
      authError.textContent = 'Network error during authentication.';
      authError.classList.remove('hidden');
    }
  });

  // Logout Handler
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('astromaps_token');
    localStorage.removeItem('astromaps_user');
    updateAuthUI();
    searchCatalog();
  });
});