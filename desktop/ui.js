const get = id => document.getElementById(id);
const address = get('address');
const api = window.browser;
let active;

for (const action of ['open', 'home', 'reload', 'back', 'forward', 'bookmark', 'ladybird']) {
  get(action).onclick = () => api.action(action);
}
get('toolbar').onsubmit = event => {
  event.preventDefault();
  address.blur();
  api.action('navigate', address.value);
};
get('ai').onclick = () => api.action('ai', address.value);
get('bookmarks').onchange = event => {
  if (event.target.value) api.action('navigate', event.target.value);
  event.target.selectedIndex = 0;
};
api.onFocus(() => { address.focus(); address.select(); });
api.onState(state => {
  if (active !== state.active || document.activeElement !== address) address.value = state.url;
  active = state.active;
  get('status').textContent = state.status;
  get('back').disabled = !state.back;
  get('forward').disabled = !state.forward;
  get('bookmark').textContent = state.bookmarks.some(item => item.url === state.url) ? '★' : '☆';
  const tabs = state.tabs.map(tab => {
    const wrapper = document.createElement('div');
    wrapper.className = 'tab' + (tab.id === active ? ' active' : '');
    const title = document.createElement('button');
    title.textContent = tab.title;
    title.title = tab.title;
    title.setAttribute('aria-pressed', String(tab.id === active));
    title.onclick = () => api.action('select', tab.id);
    const close = document.createElement('button');
    close.textContent = '×';
    close.setAttribute('aria-label', 'Close tab');
    close.onclick = () => api.action('close', tab.id);
    wrapper.append(title, close);
    return wrapper;
  });
  get('tabs').replaceChildren(...tabs);
  get('bookmarks').replaceChildren(new Option('Bookmarks', ''),
    ...state.bookmarks.map(item => new Option(item.title, item.url)));
});
api.action('ready');
