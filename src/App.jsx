import { useState, useEffect, useRef, useMemo, useCallback } from 'react'

// Prayer times will be fetched directly from Almanar website

const ARABIC_NAMES = {
  Imsak: 'الإمساك',
  Fajr: 'الفجر',
  Sunrise: 'الشروق',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء',
}

const PRAYER_ORDER = ['Imsak', 'Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
const PRAYERS_ONLY = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

const ARABIC_FONT = "'Amiri', -apple-system, BlinkMacSystemFont, 'Geeza Pro', 'Traditional Arabic', 'Segoe UI', Tahoma, sans-serif"

// SVG crescent icon
function CrescentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3C8 3 4 7 4 12C4 17 8 21 12 21C14.2 21 16.2 20 17.5 18.5C15.5 18.5 12.5 16.5 12.5 12.5C12.5 8.5 15.5 6.5 17.5 6.5C16.2 5 14.2 3 12 3Z"
        fill="currentColor" fillOpacity="0.4" />
    </svg>
  )
}

function PinIcon({ isPinned, onClick }) {
  return (
    <div 
      onClick={onClick}
      style={{ WebkitAppRegion: 'no-drag' }}
      className={`cursor-pointer transition-colors p-1 rounded hover:bg-white/10 ${isPinned ? 'text-emerald-400' : 'text-gray-400 hover:text-white'}`}
      title={isPinned ? "إلغاء التثبيت" : "تثبيت في المقدمة"}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 17v5" />
        <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
      </svg>
    </div>
  )
}

function SpeakerIcon({ enabled, onClick }) {
  return (
    <div 
      onClick={onClick}
      style={{ WebkitAppRegion: 'no-drag' }}
      className={`cursor-pointer transition-colors p-1 rounded hover:bg-white/10 ${enabled ? 'text-emerald-400' : 'text-gray-400 hover:text-white'}`}
      title={enabled ? "كتم صوت الأذان" : "تفعيل صوت الأذان"}
    >
      {enabled ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <line x1="23" y1="9" x2="17" y2="15"></line>
          <line x1="17" y1="9" x2="23" y2="15"></line>
        </svg>
      )}
    </div>
  )
}

function CloseIcon({ onClick }) {
  return (
    <div 
      onClick={onClick}
      style={{ WebkitAppRegion: 'no-drag' }}
      className="cursor-pointer transition-colors p-1 rounded hover:bg-white/10 text-gray-400 hover:text-red-400"
      title="إخفاء التطبيق (Hide)"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </div>
  )
}

// Returns the name of the next upcoming prayer (skips Imsak and Sunrise)
function getNextPrayer(times) {
  const now = new Date()
  const current = now.getHours() * 60 + now.getMinutes()
  for (const name of PRAYERS_ONLY) {
    if (!times[name]) continue
    const [h, m] = times[name].split(':').map(Number)
    if (h * 60 + m > current) return name
  }
  return 'Fajr' // wrap to next day
}

function getRemainingTime(times, nextPrayer) {
  if (!times[nextPrayer]) return '0h 0m'
  const now = new Date()
  const current = now.getHours() * 60 + now.getMinutes()
  const [h, m] = times[nextPrayer].split(':').map(Number)
  let diff = h * 60 + m - current
  if (diff <= 0) diff += 24 * 60 // next day
  const hrs = Math.floor(diff / 60)
  const mins = diff % 60
  return `${hrs}h ${mins}m`
}

export default function App() {
  const [now, setNow] = useState(new Date())
  const [isHovering, setIsHovering] = useState(false)
  const [isPinned, setIsPinned] = useState(false)

  // Initialize immediately with cached prayer times if available (instant boot recovery)
  const [fetchedTimes, setFetchedTimes] = useState(() => {
    try {
      const cached = localStorage.getItem('cachedPrayerTimes')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length >= 5) {
          return parsed
        }
      }
    } catch {}
    return null
  })

  const [fetchError, setFetchError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [retrySecondsLeft, setRetrySecondsLeft] = useState(null)

  const retryTimeoutRef = useRef(null)
  const retryCountdownRef = useRef(null)

  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('soundEnabled')
    return saved !== null ? JSON.parse(saved) : true
  })
  
  const lastNotified = useRef(null)
  const audioRef = useRef(new Audio('./adhan.mp3'))

  const startAutoRetry = useCallback((seconds = 5) => {
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
    if (retryCountdownRef.current) clearInterval(retryCountdownRef.current)

    setRetrySecondsLeft(seconds)
    retryCountdownRef.current = setInterval(() => {
      setRetrySecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(retryCountdownRef.current)
          return null
        }
        return prev - 1
      })
    }, 1000)

    retryTimeoutRef.current = setTimeout(() => {
      fetchPrayers(false)
    }, seconds * 1000)
  }, [])

  const fetchPrayers = useCallback((isUserClick = false) => {
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
    if (retryCountdownRef.current) clearInterval(retryCountdownRef.current)
    setRetrySecondsLeft(null)

    setIsLoading(true)
    if (window.electron?.getPrayerTimes) {
      window.electron.getPrayerTimes().then(times => {
        setIsLoading(false)
        if (times && times.error) {
          setFetchError(`Main Process: ${times.error}`)
          // Auto retry in 5s (particularly useful at boot time when Wi-Fi is connecting)
          startAutoRetry(5)
        } else if (times && Object.keys(times).length >= 5) {
          const cleanTimes = {}
          for (const key of PRAYER_ORDER) {
            if (times[key]) cleanTimes[key] = times[key]
          }
          setFetchedTimes(cleanTimes)
          setFetchError(null)
          try {
            localStorage.setItem('cachedPrayerTimes', JSON.stringify(cleanTimes))
          } catch {}
        } else {
          setFetchError('تعذر جلب المواقيت بشكل صحيح')
          startAutoRetry(5)
        }
      }).catch(err => {
        setIsLoading(false)
        setFetchError(err.toString())
        startAutoRetry(5)
      })
    } else {
      setIsLoading(false)
      setFetchError(`window.electron is ${typeof window.electron}`)
    }
  }, [startAutoRetry])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    localStorage.setItem('soundEnabled', JSON.stringify(soundEnabled))
  }, [soundEnabled])

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Auto-refresh immediately when crossing midnight into a new day
  const prevDateRef = useRef(now.toDateString())
  useEffect(() => {
    const todayStr = now.toDateString()
    if (prevDateRef.current !== todayStr) {
      console.log('Day changed (midnight rollover), fetching new day prayer times:', todayStr)
      prevDateRef.current = todayStr
      fetchPrayers(false)
    }
  }, [now, fetchPrayers])

  // Auto-refresh when internet connection is re-established (e.g. Wi-Fi connects after restart)
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network connected, refreshing prayer times...')
      fetchPrayers(false)
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [fetchPrayers])

  // Cleanup auto-retry timers on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
      if (retryCountdownRef.current) clearInterval(retryCountdownRef.current)
    }
  }, [])

  // Initial fetch and 30-minute refresh
  useEffect(() => {
    fetchPrayers(false)
    const interval = setInterval(() => fetchPrayers(false), 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchPrayers])

  // Listen to IPC events from main process (Tray or Menu actions or Wake from sleep)
  useEffect(() => {
    const unlistenPin = window.electron?.onTogglePinFromMain?.((pinned) => {
      setIsPinned(pinned)
    })
    const unlistenSound = window.electron?.onToggleSoundFromMain?.(() => {
      setSoundEnabled(prev => !prev)
    })
    const unlistenRefresh = window.electron?.onRefreshFromMain?.(() => {
      fetchPrayers(false)
    })

    return () => {
      unlistenPin?.()
      unlistenSound?.()
      unlistenRefresh?.()
    }
  }, [fetchPrayers])

  const times = fetchedTimes || {}
  const nextPrayer = useMemo(() => getNextPrayer(times), [times, now])

  // Trigger Adhan notification and audio playback
  useEffect(() => {
    if (now.getSeconds() === 0) {
      const currentTime = now.getHours() * 60 + now.getMinutes()
      for (const name of PRAYERS_ONLY) {
        if (!times[name]) continue
        const [h, m] = times[name].split(':').map(Number)
        if (h * 60 + m === currentTime) {
          const notificationId = `${now.toDateString()}-${name}`
          if (lastNotified.current !== notificationId) {
            lastNotified.current = notificationId
            
            window.electron?.showNotification({
              title: 'حان موعد الصلاة',
              body: `حان الآن موعد صلاة ${ARABIC_NAMES[name]}`,
              silent: true
            })
            
            if (soundEnabled) {
              audioRef.current.currentTime = 0
              audioRef.current.play().catch(e => console.error('Audio play failed:', e))
            }
          }
        }
      }
    }
  }, [now, times, soundEnabled])

  const remaining = useMemo(() => getRemainingTime(times, nextPrayer), [times, nextPrayer, now])

  const togglePin = () => {
    const newPinned = !isPinned
    setIsPinned(newPinned)
    window.electron?.togglePin(newPinned)
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    window.electron?.showContextMenu()
  }

  if (!fetchedTimes) {
    return (
      <div
        className="w-[260px] min-h-[300px] rounded-2xl flex flex-col items-center justify-center p-5 select-none shadow-2xl text-center"
        onContextMenu={handleContextMenu}
        style={{
          background: 'linear-gradient(160deg, rgba(20, 33, 27, 0.94) 0%, rgba(12, 22, 16, 0.90) 100%)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          WebkitAppRegion: 'drag',
          direction: 'rtl',
        }}
      >
        <div className="w-10 h-10 mb-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>

        <div className="text-emerald-400 font-medium text-sm mb-1.5" style={{ fontFamily: ARABIC_FONT }}>
          {isLoading ? 'جاري الاتصال وتحميل المواقيت...' : 'تعذر تحميل المواقيت'}
        </div>

        {fetchError && (
          <div className="text-xs text-red-400/90 mb-3 leading-relaxed max-w-[220px]">
            {fetchError}
          </div>
        )}

        {retrySecondsLeft && !isLoading && (
          <div className="text-[11px] text-emerald-300/70 mb-3" style={{ fontFamily: ARABIC_FONT }}>
            إعادة المحاولة تلقائياً خلال {retrySecondsLeft} ث...
          </div>
        )}

        <button
          onClick={() => fetchPrayers(true)}
          disabled={isLoading}
          className="px-4 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 active:scale-95 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
          style={{ fontFamily: ARABIC_FONT, WebkitAppRegion: 'no-drag' }}
        >
          <svg className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{isLoading ? 'جاري المحاولة...' : 'إعادة المحاولة الآن'}</span>
        </button>
      </div>
    )
  }

  const dateStr = now.toLocaleDateString('ar-LB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const timeStr = now.toLocaleTimeString('ar-LB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })

  return (
    <div
      className="w-[260px] rounded-2xl p-4 select-none transition-all duration-300 relative group"
      onContextMenu={handleContextMenu}
      style={{
        WebkitAppRegion: isPinned ? 'no-drag' : 'drag',
        background: 'linear-gradient(160deg, rgba(20, 33, 27, 0.94) 0%, rgba(12, 22, 16, 0.90) 100%)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: isHovering
          ? '0 12px 48px rgba(0,0,0,0.6), 0 0 24px rgba(110,231,183,0.1), inset 0 1px 0 rgba(255,255,255,0.08)'
          : '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
        direction: 'rtl',
      }}
      onMouseLeave={() => setIsHovering(false)}
      onMouseEnter={() => setIsHovering(true)}
    >
      {/* Header: crescent + date + live clock + controls */}
      <div
        className="text-center mb-3 pb-3 relative"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="absolute left-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <PinIcon isPinned={isPinned} onClick={togglePin} />
          <SpeakerIcon enabled={soundEnabled} onClick={() => setSoundEnabled(!soundEnabled)} />
          <CloseIcon onClick={() => window.electron?.hideWindow()} />
        </div>
        <div 
          className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mb-1"
          style={{ fontFamily: ARABIC_FONT }}
        >
          <CrescentIcon />
          <span>{dateStr}</span>

          {fetchError && (
            <button
              onClick={() => fetchPrayers(true)}
              style={{ WebkitAppRegion: 'no-drag' }}
              className="text-[10px] text-amber-400 hover:text-amber-300 font-medium bg-amber-400/10 hover:bg-amber-400/20 px-1.5 py-0.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer"
              title="المواقيت محفوظة محلياً (انقر للتحديث عبر الإنترنت)"
            >
              <svg className={`w-2.5 h-2.5 ${isLoading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isLoading ? 'تحديث...' : 'محفوظة'}</span>
            </button>
          )}
        </div>
        <div className="text-2xl font-semibold text-white tracking-wide tabular-nums">
          {timeStr}
        </div>
      </div>

      {/* Prayer times list */}
      <div className="flex flex-col gap-1 prayer-list">
        {PRAYER_ORDER.map((name) => {
          const time = times[name]
          if (!time) return null
          const isNext = name === nextPrayer
          const isPast = (() => {
            const [h, m] = time.split(':').map(Number)
            return h * 60 + m < now.getHours() * 60 + now.getMinutes()
          })()
          const isNonPrayer = name === 'Imsak' || name === 'Sunrise'

          return (
            <div
              key={name}
              className={`prayer-row flex justify-between items-center px-3 py-1.5 rounded-lg transition-all duration-300 ${
                isNext ? 'next-prayer-glow' : ''
              }`}
              style={{
                background: isNext
                  ? 'linear-gradient(135deg, rgba(110,231,183,0.18) 0%, rgba(110,231,183,0.06) 100%)'
                  : 'rgba(255,255,255,0.02)',
                border: isNext
                  ? '1px solid rgba(110,231,183,0.35)'
                  : '1px solid transparent',
              }}
            >
              <span
                className="text-sm font-mono tabular-nums"
                style={{
                  color: isNext ? '#6ee7b7' : isPast ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.6)',
                  fontWeight: isNext ? 600 : 400,
                }}
              >
                {time}
              </span>
              <span
                className="text-sm"
                style={{
                  fontFamily: ARABIC_FONT,
                  color: isNext ? '#e2e8f0' : isPast ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.7)',
                  fontWeight: isNext ? 700 : isNonPrayer ? 300 : 500,
                  fontSize: isNext ? '0.95rem' : '0.85rem',
                }}
              >
                {ARABIC_NAMES[name]}
              </span>
            </div>
          )
        })}
      </div>

      {/* Next prayer footer with countdown */}
      <div className="mt-3 pt-3 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs" style={{ color: 'rgba(110,231,183,0.75)', fontFamily: ARABIC_FONT }}>
            الصلاة التالية:
          </span>
          <span
            className="text-sm font-semibold"
            style={{
              fontFamily: ARABIC_FONT,
              color: '#6ee7b7',
            }}
          >
            {ARABIC_NAMES[nextPrayer]}
          </span>
        </div>
        <div className="text-[11px] mt-0.5" style={{ color: 'rgba(110,231,183,0.5)', direction: 'ltr' }}>
          {remaining} متبقٍ
        </div>
      </div>
    </div>
  )
}
