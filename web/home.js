const key = 'meeket-browser-shortcuts-v1';
const form = document.getElementById('shortcut');
const links = document.getElementById('links');
const status = document.getElementById('status');
const add = document.getElementById('add');
let entries = [];

function valid(entry) {
  try {
    const url = new URL(entry.url);
    return typeof entry.label === 'string' && entry.label.trim() &&
      ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}

try {
  const saved = JSON.parse(localStorage.getItem(key) ?? '[]');
  if (Array.isArray(saved)) entries = saved.filter(valid).slice(0, 24);
} catch {
  status.textContent = 'Shortcut storage is unavailable.';
}

function render() {
  links.querySelectorAll('.card').forEach(card => card.remove());
  for (const [index, entry] of entries.entries()) {
    const card = document.createElement('div');
    card.className = 'card';
    const link = document.createElement('a');
    link.href = entry.url;
    link.textContent = entry.label;
    const remove = document.createElement('button');
    remove.textContent = '×';
    remove.setAttribute('aria-label', 'Remove ' + entry.label);
    remove.onclick = () => save(entries.filter((_, position) => position !== index));
    card.append(link, remove);
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

add.hidden = false;
add.onclick = () => { form.hidden = false; form.elements.label.focus(); };
document.getElementById('cancel').onclick = () => { form.hidden = true; add.focus(); };
form.onsubmit = event => {
  event.preventDefault();
  const entry = { label: form.elements.label.value.trim(), url: form.elements.url.value.trim() };
  if (!valid(entry)) { status.textContent = 'Enter a label and an HTTP or HTTPS URL.'; return; }
  if (entries.length >= 24) { status.textContent = 'Remove a shortcut before adding another.'; return; }
  if (save([...entries, entry])) { form.reset(); form.hidden = true; add.focus(); }
};
render();
