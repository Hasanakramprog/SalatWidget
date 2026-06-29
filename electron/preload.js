const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  moveWindow: (pos) => ipcRenderer.send('move-window', pos),
  togglePin: (isPinned) => ipcRenderer.send('toggle-pin', isPinned),
  showNotification: (options) => ipcRenderer.send('show-notification', options),
  getPrayerTimes: () => ipcRenderer.invoke('get-prayer-times'),
})
