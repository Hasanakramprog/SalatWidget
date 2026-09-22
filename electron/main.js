import { app, BrowserWindow, ipcMain, screen, globalShortcut, Notification, Tray, Menu, nativeImage } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import * as cheerio from 'cheerio'

const __dirname = dirname(fileURLToPath(import.meta.url))

let win
let tray = null

function getTargetPosition() {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { x: areaX, y: areaY, width: areaWidth, height: areaHeight } = primaryDisplay.workArea
  const winWidth = 280
  const winHeight = 440
  const posX = Math.round(areaX + areaWidth - winWidth - 24)
  const posY = Math.round(areaY + areaHeight - winHeight - 24)
  return { x: posX, y: posY, width: winWidth, height: winHeight }
}

function createWindow() {
  const { x, y, width, height } = getTargetPosition()

  win = new BrowserWindow({
    width,
    height,
    x,
    y,
    transparent: true,
    frame: false,
    alwaysOnTop: false,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      autoplayPolicy: 'no-user-gesture-required',
    },
  })

  // Show once ready to prevent visual flickering
  win.once('ready-to-show', () => {
    win.show()
  })

  // Support macOS virtual desktops (Spaces) so widget stays visible across spaces
  if (process.platform === 'darwin') {
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false })
  }

  // Load built Vite bundle
  win.loadFile(join(__dirname, '../dist/index.html'))

  win.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error('\n--- PRELOAD ERROR ---')
    console.error(preloadPath)
    console.error(error)
    console.error('---------------------\n')
  })

  win.webContents.on('console-message', (event, level, message, line) => {
    if (level >= 2) {
      console.error(`[RENDERER ERROR] ${message} (Line ${line})`)
    } else {
      console.log(`[RENDERER] ${message}`)
    }
  })
}

function setWindowPinned(isPinned) {
  if (!win) return
  if (process.platform === 'darwin') {
    win.setAlwaysOnTop(isPinned, isPinned ? 'floating' : 'normal')
  } else {
    win.setAlwaysOnTop(isPinned)
  }
  win.webContents.send('main-toggle-pin', isPinned)
  updateTrayMenu()
}

function toggleWidgetVisibility() {
  if (!win) return
  if (win.isVisible()) {
    win.hide()
  } else {
    win.show()
    win.focus()
  }
  updateTrayMenu()
}

function updateTrayMenu() {
  if (!tray) return
  const isVisible = win ? win.isVisible() : true
  const isPinned = win ? win.isAlwaysOnTop() : false

  const contextMenu = Menu.buildFromTemplate([
    {
      label: isVisible ? 'إخفاء التطبيق (Hide)' : 'إظهار التطبيق (Show)',
      click: () => toggleWidgetVisibility()
    },
    {
      label: 'تثبيت في المقدمة (Pin on Top)',
      type: 'checkbox',
      checked: isPinned,
      click: (item) => setWindowPinned(item.checked)
    },
    {
      label: 'تحديث المواقيت (Refresh Times)',
      click: () => {
        if (win) win.webContents.send('main-refresh')
      }
    },
    { type: 'separator' },
    {
      label: 'تشغيل عند بدء التشغيل (Start at Login)',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => {
        app.setLoginItemSettings({
          openAtLogin: item.checked,
          openAsHidden: false,
          name: 'Prayer Widget',
        })
      }
    },
    { type: 'separator' },
    {
      label: 'خروج (Quit)',
      accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
      click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  ])
  tray.setContextMenu(contextMenu)
}

function createTray() {
  try {
    const iconPath = join(__dirname, 'assets/trayTemplate.png')
    let trayIcon = nativeImage.createFromPath(iconPath)
    if (process.platform === 'darwin') {
      trayIcon.setTemplateImage(true)
    }
    tray = new Tray(trayIcon)
    tray.setToolTip('Prayer Widget (مواقيت الصلاة)')
    updateTrayMenu()

    tray.on('click', () => {
      toggleWidgetVisibility()
    })

    tray.on('right-click', () => {
      updateTrayMenu()
      tray.popUpContextMenu()
    })
  } catch (err) {
    console.error('Failed to create tray icon:', err)
  }
}

app.whenReady().then(() => {
  // On macOS, hide dock icon so the widget acts as a desktop & menu bar accessory
  if (process.platform === 'darwin') {
    app.dock?.hide()
  }

  createWindow()
  createTray()

  globalShortcut.register('Shift+S', () => {
    toggleWidgetVisibility()
  })
})

app.on('before-quit', () => {
  app.isQuitting = true
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' || app.isQuitting) {
    app.quit()
  }
})

// Window dragging
ipcMain.on('move-window', (_, { x, y }) => {
  if (win) {
    win.setPosition(Math.round(x), Math.round(y))
  }
})

// Pin toggle
ipcMain.on('toggle-pin', (_, isPinned) => {
  setWindowPinned(isPinned)
})

// Hide window
ipcMain.on('hide-window', () => {
  if (win) {
    win.hide()
    updateTrayMenu()
  }
})

// Close / Quit App
ipcMain.on('close-app', () => {
  app.isQuitting = true
  app.quit()
})

// Show Context Menu on right click
ipcMain.on('show-context-menu', () => {
  if (!win) return
  const isPinned = win.isAlwaysOnTop()
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'إخفاء التطبيق (Hide)',
      click: () => {
        win.hide()
        updateTrayMenu()
      }
    },
    {
      label: 'تثبيت في المقدمة (Pin on Top)',
      type: 'checkbox',
      checked: isPinned,
      click: (item) => setWindowPinned(item.checked)
    },
    {
      label: 'تحديث المواقيت (Refresh Times)',
      click: () => {
        win.webContents.send('main-refresh')
      }
    },
    { type: 'separator' },
    {
      label: 'تشغيل عند بدء التشغيل (Start at Login)',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => {
        app.setLoginItemSettings({
          openAtLogin: item.checked,
          openAsHidden: false,
          name: 'Prayer Widget',
        })
      }
    },
    { type: 'separator' },
    {
      label: 'خروج (Quit)',
      accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
      click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  ])
  contextMenu.popup({ window: win })
})

// Show system notification
ipcMain.on('show-notification', (_, { title, body, silent }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body, silent }).show()
  }
})

// Scrape prayer times from Almanar with offline fallback
ipcMain.handle('get-prayer-times', async () => {
  const mapping = {
    'الامساك': 'Imsak',
    'صلاة الصبح': 'Fajr',
    'الشروق': 'Sunrise',
    'الظهر': 'Dhuhr',
    'العصر': 'Asr',
    'المغرب': 'Maghrib',
    'العشاء': 'Isha'
  }

  const parseHtml = (html) => {
    const $ = cheerio.load(html)
    const times = {}
    $('.pray-title').each((_, el) => {
      const text = $(el).text().trim()
      for (const [arName, enName] of Object.entries(mapping)) {
        if (text.includes(arName)) {
          const match = text.match(/\d{2}:\d{2}/)
          if (match) {
            times[enName] = match[0]
          }
        }
      }
    })
    return times
  }

  // 1. Try fetching live from Almanar
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 7000)
    const response = await fetch('https://almanar.com.lb/salat/', { signal: controller.signal })
    clearTimeout(timeoutId)
    const html = await response.text()
    const times = parseHtml(html)
    if (Object.keys(times).length > 0) {
      return times
    }
  } catch (error) {
    console.warn('Network fetch failed, attempting local fallback:', error.message)
  }

  // 2. Fallback to local salat.html if available
  try {
    const localHtmlPath = join(__dirname, '../salat.html')
    if (fs.existsSync(localHtmlPath)) {
      const localHtml = fs.readFileSync(localHtmlPath, 'utf8')
      const times = parseHtml(localHtml)
      if (Object.keys(times).length > 0) {
        return times
      }
    }
  } catch (localErr) {
    console.error('Local fallback failed:', localErr)
  }

  return { error: 'تعذر جلب مواقيت الصلاة (يرجى التحقق من اتصال الإنترنت)' }
})

// Auto-start configuration
app.setLoginItemSettings({
  openAtLogin: true,
  openAsHidden: false,
  name: 'Prayer Widget',
})
