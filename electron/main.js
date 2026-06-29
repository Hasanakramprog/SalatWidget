import { app, BrowserWindow, ipcMain, screen, globalShortcut } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import * as cheerio from 'cheerio'

const __dirname = dirname(fileURLToPath(import.meta.url))

let win

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  win = new BrowserWindow({
    width: 280,
    height: 430,
    x: width - 300,
    y: height - 450,
    transparent: true,
    frame: false,
    alwaysOnTop: false,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  })

  // In production, load the built files
  // In development, load from Vite dev server
  win.loadFile(join(__dirname, '../dist/index.html'))
}

app.whenReady().then(() => {
  createWindow()

  globalShortcut.register('Shift+S', () => {
    if (win) {
      if (win.isVisible()) {
        win.hide()
      } else {
        win.show()
      }
    }
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Handle window dragging from renderer
ipcMain.on('move-window', (_, { x, y }) => {
  win.setPosition(Math.round(x), Math.round(y))
})

// Handle pin toggle
ipcMain.on('toggle-pin', (_, isPinned) => {
  win.setAlwaysOnTop(isPinned)
})

// Scrape prayer times from Almanar
ipcMain.handle('get-prayer-times', async () => {
  try {
    const response = await fetch('https://almanar.com.lb/salat/');
    const html = await response.text();
    const $ = cheerio.load(html);
    const times = {};
    const mapping = {
      'الامساك': 'Imsak',
      'صلاة الصبح': 'Fajr',
      'الشروق': 'Sunrise',
      'الظهر': 'Dhuhr',
      'العصر': 'Asr',
      'المغرب': 'Maghrib',
      'العشاء': 'Isha'
    };
    $('.pray-title').each((_, el) => {
      const text = $(el).text().trim();
      for (const [arName, enName] of Object.entries(mapping)) {
        if (text.includes(arName)) {
          const match = text.match(/\d{2}:\d{2}/);
          if (match) {
            times[enName] = match[0];
          }
        }
      }
    });
    return times;
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    return null;
  }
});

// Auto-start with Windows
app.setLoginItemSettings({
  openAtLogin: true,
  name: 'Prayer Widget',
})
