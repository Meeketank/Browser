const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('browser', {
  action: (name, value) => ipcRenderer.send('browser:action', name, value),
  onState: callback => ipcRenderer.on('browser:state', (_event, state) => callback(state)),
  onFocus: callback => ipcRenderer.on('browser:focus', () => callback()),
});
