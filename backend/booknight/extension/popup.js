// Points at the deployed Booknight backend/frontend.
const API_BASE = 'https://book-night-h3oj.vercel.app/api';
const CLIENT_ORIGIN = 'https://booknight-rmfs.vercel.app';

const $ = (id) => document.getElementById(id);

const views = {
  loading: $('loading-view'),
  login: $('login-view'),
  main: $('main-view'),
};

function showView(name) {
  Object.entries(views).forEach(([key, el]) => el.classList.toggle('hidden', key !== name));
}

// --- storage helpers (chrome.storage.local, not localStorage - MV3 popups
// don't reliably persist localStorage between opens) ---
const storage = {
  get: (keys) => new Promise((resolve) => chrome.storage.local.get(keys, resolve)),
  set: (obj) => new Promise((resolve) => chrome.storage.local.set(obj, resolve)),
  remove: (keys) => new Promise((resolve) => chrome.storage.local.remove(keys, resolve)),
};

// --- API helper ---
async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

// --- current tab info ---
function getCurrentTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs[0]));
  });
}

// --- main flow ---
async function init() {
  const { token } = await storage.get('token');

  if (!token) {
    showView('login');
    return;
  }

  try {
    await apiRequest('/auth/me', { token }); // validates the stored token
    await enterMainView(token);
  } catch {
    // Token expired/invalid - clear it and fall back to login.
    await storage.remove(['token']);
    showView('login');
  }
}

async function enterMainView(token) {
  showView('main');

  const tab = await getCurrentTab();
  $('tab-title').textContent = tab.title || tab.url;
  $('tab-url').textContent = tab.url;
  $('tab-favicon').src = tab.favIconUrl || '';
  $('tab-favicon').style.visibility = tab.favIconUrl ? 'visible' : 'hidden';
  $('open-board-link').href = CLIENT_ORIGIN;

  const select = $('workspace-select');
  select.innerHTML = '';

  try {
    const data = await apiRequest('/workspaces', { token });
    if (data.workspaces.length === 0) {
      const opt = document.createElement('option');
      opt.textContent = 'No workspaces yet - create one on the web app';
      select.appendChild(opt);
      $('save-button').disabled = true;
      return;
    }

    const { lastWorkspaceId } = await storage.get('lastWorkspaceId');
    data.workspaces.forEach((ws) => {
      const opt = document.createElement('option');
      opt.value = ws._id;
      opt.textContent = ws.name;
      select.appendChild(opt);
    });
    if (lastWorkspaceId && data.workspaces.some((w) => w._id === lastWorkspaceId)) {
      select.value = lastWorkspaceId;
    }
  } catch (err) {
    $('save-error').textContent = err.message;
    $('save-error').classList.remove('hidden');
  }
}

// --- login ---
$('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('login-email').value.trim();
  const password = $('login-password').value;
  const errorEl = $('login-error');
  const submitBtn = $('login-submit');

  errorEl.classList.add('hidden');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in…';

  try {
    const data = await apiRequest('/auth/login', { method: 'POST', body: { email, password } });
    await storage.set({ token: data.token });
    await enterMainView(data.token);
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign in';
  }
});

// --- save current tab ---
$('save-button').addEventListener('click', async () => {
  const { token } = await storage.get('token');
  const workspaceId = $('workspace-select').value;
  const saveBtn = $('save-button');
  const errorEl = $('save-error');
  const successEl = $('save-success');

  errorEl.classList.add('hidden');
  successEl.classList.add('hidden');

  if (!workspaceId) {
    errorEl.textContent = 'No workspace selected.';
    errorEl.classList.remove('hidden');
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';

  try {
    const tab = await getCurrentTab();
    await apiRequest('/bookmarks', {
      method: 'POST',
      token,
      body: { url: tab.url, workspaceId },
    });
    await storage.set({ lastWorkspaceId: workspaceId });
    successEl.classList.remove('hidden');
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save to Booknight';
  }
});

// --- logout ---
$('logout-button').addEventListener('click', async () => {
  await storage.remove(['token']);
  $('login-email').value = '';
  $('login-password').value = '';
  showView('login');
});

init();