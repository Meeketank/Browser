const key = 'meeket-browser-shortcuts-v1';
const form = document.getElementById('shortcut');
const links = document.getElementById('links');
const status = document.getElementById('status');
const add = document.getElementById('add');
const query = document.getElementById('query');
const desktop = location.protocol === 'file:';
let entries = [];

function valid(entry) {
  return typeof entry?.label === 'string' && entry.label.trim() && isWebUrl(entry.url);
}

try {
  const saved = JSON.parse(localStorage.getItem(key) ?? '[]');
  if (Array.isArray(saved)) entries = saved.filter(valid).slice(0, 24);
} catch {
  status.textContent = 'Shortcut storage is unavailable.';
}

function external(link) {
  if (desktop) return;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
}

for (const link of document.querySelectorAll('a[href^="https:"]')) external(link);
if (desktop) {
  document.getElementById('mode').textContent = 'Chromium desktop · Shortcuts saved on this device';
}

document.getElementById('search').onsubmit = event => {
  event.preventDefault();
  const url = destination(query.value, event.submitter?.value === '50');
  if (!url) return;
  if (desktop) location.assign(url);
  else window.open(url, '_blank', 'noopener,noreferrer');
};

document.addEventListener('keydown', event => {
  if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey ||
      event.target.closest?.('input, textarea, select, [contenteditable]')) return;
  event.preventDefault();
  query.focus();
});

function render() {
  links.querySelectorAll('.custom').forEach(card => card.remove());
  for (const [index, entry] of entries.entries()) {
    const card = document.createElement('div');
    card.className = 'tile custom';
    const icon = document.createElement('span');
    icon.className = 'tile-icon mint';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = entry.label.trim().slice(0, 1).toUpperCase();
    const link = document.createElement('a');
    link.href = entry.url;
    link.textContent = entry.label;
    external(link);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = '×';
    remove.setAttribute('aria-label', 'Remove ' + entry.label);
    remove.onclick = () => {
      if (save(entries.filter((_, position) => position !== index))) add.focus();
    };
    card.append(icon, link, remove);
    links.append(card);
  }
}

function save(next) {
  try {
    localStorage.setItem(key, JSON.stringify(next));
    entries = next;
    status.textContent = '';
    render();
    return true;
  } catch {
    status.textContent = 'Could not save shortcuts on this device.';
    return false;
  }
}

function showForm(open) {
  form.hidden = !open;
  add.setAttribute('aria-expanded', String(open));
  (open ? form.elements.label : add).focus();
}

add.hidden = false;
add.onclick = () => showForm(form.hidden);
document.getElementById('cancel').onclick = () => showForm(false);
form.onsubmit = event => {
  event.preventDefault();
  const entry = { label: form.elements.label.value.trim(), url: website(form.elements.url.value) };
  if (!valid(entry)) {
    status.textContent = 'Enter a name and a website address.';
    return;
  }
  if (entries.length >= 24) {
    status.textContent = 'Remove a shortcut before adding another.';
    return;
  }
  if (save([...entries, entry])) {
    form.reset();
    showForm(false);
  }
};
render();
