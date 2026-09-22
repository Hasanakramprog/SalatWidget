const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  moveWindow: (pos) => ipcRenderer.send('move-window', pos),
  togglePin: (isPinned) => ipcRenderer.send('toggle-pin', isPinned),
  showNotification: (options) => ipcRenderer.send('show-notification', options),
  getPrayerTimes: () => ipcRenderer.invoke('get-prayer-times'),
  hideWindow: () => ipcRenderer.send('hide-window'),
  closeApp: () => ipcRenderer.send('close-app'),
  showContextMenu: () => ipcRenderer.send('show-context-menu'),
  onTogglePinFromMain: (callback) => {
    const handler = (_, val) => callback(val)
    ipcRenderer.on('main-toggle-pin', handler)
    return () => ipcRenderer.removeListener('main-toggle-pin', handler)
  },
  onToggleSoundFromMain: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('main-toggle-sound', handler)
    return () => ipcRenderer.removeListener('main-toggle-sound', handler)
  },
  onRefreshFromMain: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('main-refresh', handler)
    return () => ipcRenderer.removeListener('main-refresh', handler)
  },
})
