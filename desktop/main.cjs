const { app, BrowserWindow, WebContentsView, ipcMain, session } = require('electron');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { isWebUrl, destination } = require('../web/navigation.js');

const toolbar = path.join(__dirname, 'ui.html');
const toolbarUrl = pathToFileURL(toolbar).href;
const home = pathToFileURL(path.join(__dirname, '../web/index.html')).href;
const isolated = { sandbox: true, contextIsolation: true, nodeIntegration: false };
const partition = 'persist:meeket-web';
const maxTabs = 20;
app.setPath('userData', path.join(app.getPath('appData'), 'Meeket Browser'));
const tabs = new Map();
let window;
let active;
let nextId = 1;
let bookmarks = [];
let status = '';
let closing = false;

function stateFile() {
  return path.join(app.getPath('userData'), 'workspace.json');
}

function persist() {
  try {
    fs.writeFileSync(stateFile() + '.tmp', JSON.stringify({
      bookmarks,
      pages: [...tabs.values()].map(tab => tab.url).filter(isWebUrl),
    }));
    fs.renameSync(stateFile() + '.tmp', stateFile());
  } catch (error) {
    console.error('Workspace save failed', error);
  }
}

function publish() {
  if (!window || window.isDestroyed()) return;
  const tab = tabs.get(active);
  const history = tab?.view.webContents.navigationHistory;
  window.webContents.send('browser:state', {
    active, status, bookmarks,
    url: isWebUrl(tab?.url) ? tab.url : '',
    back: history?.canGoBack(), forward: history?.canGoForward(),
    tabs: [...tabs.values()].map(({ id, title }) => ({ id, title })),
  });
}

function layout() {
  const [width, height] = window.getContentSize();
  tabs.get(active)?.view.setBounds({ x: 0, y: 100, width, height: Math.max(0, height - 100) });
}

function select(id) {
  if (!tabs.has(id)) return;
  if (id === active) return;
  status = '';
  if (tabs.has(active)) window.contentView.removeChildView(tabs.get(active).view);
  active = id;
  window.contentView.addChildView(tabs.get(id).view);
  layout();
  publish();
}

function load(contents, url) {
  contents.loadURL(url).catch(error => {
    if (error.code === 'ERR_ABORTED' || contents.isDestroyed()) return;
    if (tabs.get(active)?.view.webContents !== contents) return;
    status = 'Could not open this page.';
    publish();
  });
}

function openTab(url = home, background = false) {
  if (closing) return;
  if (tabs.size >= maxTabs) {
    status = 'Close a tab before opening another.';
    publish();
    return;
  }
  const id = nextId++;
  const view = new WebContentsView({ webPreferences: { ...isolated, partition } });
  const tab = { id, view, url, title: url === home ? 'New tab' : url };
  tabs.set(id, tab);
  const contents = view.webContents;
  const guard = (event, target) => {
    const url = typeof target === 'string' ? target : (target?.url ?? event.url);
    if (!isWebUrl(url)) event.preventDefault();
  };
  contents.on('will-navigate', guard);
  contents.on('will-redirect', guard);
  contents.setWindowOpenHandler(({ url: target }) => {
    if (isWebUrl(target)) setImmediate(() => openTab(target));
    return { action: 'deny' };
  });
  function record(_event, target) {
    if (target !== home && !isWebUrl(target)) return;
    if (closing) return;
    if (active === id) status = '';
    tab.url = target;
    tab.title = target === home ? 'New tab' : contents.getTitle() || target;
    persist();
    publish();
  }
  contents.on('did-navigate', record);
  contents.on('did-navigate-in-page', (event, url, mainFrame) => {
    if (mainFrame) record(event, url);
  });
  contents.on('page-title-updated', (_event, title) => {
    tab.title = tab.url === home ? 'New tab' : (title || tab.url);
    publish();
  });
  contents.on('render-process-gone', () => {
    if (closing || active !== id) return;
    status = 'This page stopped responding. Reload it to try again.';
    publish();
  });
  contents.on('before-input-event', shortcut);
  if (!background) select(id);
  load(contents, url);
}

function closeTab(id) {
  const tab = tabs.get(id);
  if (!tab) return;
  const wasActive = active === id;
  if (wasActive) window.contentView.removeChildView(tab.view);
  tabs.delete(id);
  if (wasActive) active = undefined;
  tab.view.webContents.close();
  if (wasActive && tabs.size) select([...tabs.keys()].at(-1));
  if (!tabs.size) openTab();
  persist();
  publish();
}

function shortcut(event, input) {
  if (input.type !== 'keyDown' || !(input.control || input.meta)) return;
  const key = input.key.toLowerCase();
  if (!['l', 't', 'w'].includes(key)) return;
  event.preventDefault();
  if (key === 't') openTab();
  if (key === 'w') closeTab(active);
  if (key === 'l') {
    window.webContents.focus();
    window.webContents.send('browser:focus');
  }
}

function openInLadybird(url) {
  const binary = process.env.MEENAV_LADYBIRD_BINARY || process.env.MEEKET_LADYBIRD_BINARY;
  if (!binary || !path.isAbsolute(binary)) {
    status = 'Set MEENAV_LADYBIRD_BINARY to an absolute executable path.';
    return;
  }
  if (!isWebUrl(url)) {
    status = 'Open a web page first.';
    return;
  }
  const child = spawn(binary, [url], { shell: false, stdio: 'ignore' });
  child.on('error', error => { status = error.message; publish(); });
  child.unref();
}

ipcMain.on('browser:action', (event, action, value) => {
  if (!window || window.isDestroyed() || event.sender !== window.webContents ||
      event.senderFrame?.url !== toolbarUrl || event.senderFrame.parent) return;
  const tab = tabs.get(active);
  const contents = tab?.view.webContents;
  status = '';
  switch (action) {
    case 'ready': break;
    case 'open': openTab(); break;
    case 'select': select(value); break;
    case 'close': closeTab(value); break;
    case 'home': if (contents) load(contents, home); break;
    case 'reload': contents?.reload(); break;
    case 'back': if (contents?.navigationHistory.canGoBack()) contents.navigationHistory.goBack(); break;
    case 'forward': if (contents?.navigationHistory.canGoForward()) contents.navigationHistory.goForward(); break;
    case 'navigate':
    case 'ai': {
      const url = typeof value === 'string' && value.length <= 8192 && destination(value, action === 'ai');
      if (url && contents) load(contents, url);
      break;
    }
    case 'bookmark':
      if (isWebUrl(tab?.url)) {
        bookmarks = bookmarks.some(item => item.url === tab.url)
          ? bookmarks.filter(item => item.url !== tab.url)
          : [...bookmarks, { title: tab.title, url: tab.url }].slice(-100);
        persist();
      }
      break;
    case 'ladybird': openInLadybird(tab?.url); break;
    default: return;
  }
  publish();
});

if (!app.requestSingleInstanceLock()) app.quit();
else app.whenReady().then(() => {
  app.on('second-instance', () => {
    if (closing || !window) return;
    if (window.isMinimized()) window.restore();
    window.focus();
  });
  const web = session.fromPartition(partition);
  web.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  web.setPermissionCheckHandler(() => false);
  window = new BrowserWindow({
    title: 'MeeNav', width: 1260, height: 820, minWidth: 740, minHeight: 420,
    webPreferences: { ...isolated, preload: path.join(__dirname, 'preload.cjs') },
  });
  window.removeMenu();
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('before-input-event', shortcut);
  window.on('resize', layout);
  window.on('close', () => { closing = true; persist(); });
  window.on('closed', () => {
    for (const { view } of tabs.values()) {
      if (!view.webContents.isDestroyed()) view.webContents.close();
    }
    tabs.clear();
  });
  let pages = [];
  try {
    const profile = JSON.parse(fs.readFileSync(stateFile(), 'utf8'));
    if (Array.isArray(profile.pages)) pages = profile.pages.filter(isWebUrl).slice(0, maxTabs);
    if (Array.isArray(profile.bookmarks)) bookmarks = profile.bookmarks.filter(item => typeof item?.title === 'string' && isWebUrl(item.url)).slice(-100);
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Workspace restore failed', error);
  }
  window.loadFile(toolbar);
  for (const url of pages) openTab(url, true);
  if (tabs.size) select(tabs.keys().next().value);
  else openTab();
});

app.on('window-all-closed', () => app.quit());
