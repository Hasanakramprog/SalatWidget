import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  moveWindow: (pos) => ipcRenderer.send('move-window', pos),
  togglePin: (isPinned) => ipcRenderer.send('toggle-pin', isPinned),
  getPrayerTimes: () => ipcRenderer.invoke('get-prayer-times'),
})
