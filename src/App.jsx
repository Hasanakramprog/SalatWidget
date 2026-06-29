import { useState, useEffect, useRef, useMemo } from 'react'

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
      className={`cursor-pointer transition-colors p-1 rounded hover:bg-white/10 ${isPinned ? 'text-emerald-400' : 'text-gray-500'}`}
      title={isPinned ? "إلغاء التثبيت" : "تثبيت على الشاشة"}
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
      className={`cursor-pointer transition-colors p-1 rounded hover:bg-white/10 ${enabled ? 'text-emerald-400' : 'text-gray-500'}`}
      title={enabled ? "كتم الصوت" : "تفعيل الصوت"}
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

// Returns the name of the next upcoming prayer (skips Imsak and Sunrise)
function getNextPrayer(times) {
  const now = new Date()
  const current = now.getHours() * 60 + now.getMinutes()
  for (const name of PRAYERS_ONLY) {
    if (!times[name]) continue;
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
  const [fetchedTimes, setFetchedTimes] = useState(null)

  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('soundEnabled')
    return saved !== null ? JSON.parse(saved) : true
  })
  
  const lastNotified = useRef(null)
  const audioRef = useRef(new Audio('./adhan.mp3'))

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

  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    // Fetch live prayer times from the Almanar scraper in main process
    if (window.electron?.getPrayerTimes) {
      window.electron.getPrayerTimes().then(times => {
        if (times && times.error) {
          setFetchError(`Main Process: ${times.error}`)
        } else if (times && Object.keys(times).length > 0) {
          setFetchedTimes(times)
          setFetchError(null)
        } else {
          setFetchError('Returned empty or null')
        }
      }).catch(err => {
        setFetchError(err.toString())
      })
    } else {
      setFetchError(`window.electron is ${typeof window.electron}`)
    }
  }, [])

  const times = fetchedTimes || {}
  const nextPrayer = useMemo(() => getNextPrayer(times), [times, now])

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
    const newPinned = !isPinned;
    setIsPinned(newPinned);
    window.electron?.togglePin(newPinned);
  }

  if (!fetchedTimes) {
    return (
      <div
        className="w-[260px] h-[300px] rounded-2xl flex flex-col items-center justify-center p-4"
        style={{
          background: 'linear-gradient(160deg, rgba(20, 33, 27, 0.92) 0%, rgba(12, 22, 16, 0.88) 100%)',
          backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <div className="text-emerald-400/70 animate-pulse text-sm mb-2">جاري الاتصال...</div>
        {fetchError && <div className="text-xs text-red-400/80 text-center">{fetchError}</div>}
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
      className="w-[260px] rounded-2xl p-4 select-none transition-shadow duration-300 relative group"
      style={{
        WebkitAppRegion: isPinned ? 'no-drag' : 'drag',
        background: 'linear-gradient(160deg, rgba(20, 33, 27, 0.92) 0%, rgba(12, 22, 16, 0.88) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: isHovering
          ? '0 8px 40px rgba(0,0,0,0.5), 0 0 20px rgba(110,231,183,0.08), inset 0 1px 0 rgba(255,255,255,0.05)'
          : '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
        direction: 'rtl',
      }}
      onMouseLeave={() => setIsHovering(false)}
      onMouseEnter={() => setIsHovering(true)}
    >
      {/* Header: crescent + date + live clock */}
      <div
        className="text-center mb-3 pb-3 relative"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="absolute left-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <PinIcon isPinned={isPinned} onClick={togglePin} />
          <SpeakerIcon enabled={soundEnabled} onClick={() => setSoundEnabled(!soundEnabled)} />
        </div>
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mb-1">
          <CrescentIcon />
          <span>{dateStr}</span>

          {fetchError && (
            <span 
              className="text-[10px] text-red-400 font-semibold bg-red-400/10 px-1.5 rounded-full"
              title={fetchError}
            >
              {fetchError.substring(0, 20)}...
            </span>
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
                  ? 'linear-gradient(135deg, rgba(110,231,183,0.15) 0%, rgba(110,231,183,0.05) 100%)'
                  : 'rgba(255,255,255,0.02)',
                border: isNext
                  ? '1px solid rgba(110,231,183,0.3)'
                  : '1px solid transparent',
              }}
            >
              <span
                className="text-sm font-mono tabular-nums"
                style={{
                  color: isNext ? '#6ee7b7' : isPast ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
                  fontWeight: isNext ? 600 : 400,
                }}
              >
                {time}
              </span>
              <span
                className="text-sm"
                style={{
                  fontFamily: "'Traditional Arabic', 'Segoe UI', Tahoma, sans-serif",
                  color: isNext ? '#e2e8f0' : isPast ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
                  fontWeight: isNext ? 700 : isNonPrayer ? 300 : 400,
                  fontSize: isNext ? '0.9rem' : '0.8rem',
                }}
              >
                {ARABIC_NAMES[name]}
              </span>
            </div>
          )
        })}
      </div>

      {/* Next prayer footer with countdown */}
      <div className="mt-3 pt-3 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs" style={{ color: 'rgba(110,231,183,0.65)' }}>
            الصلاة التالية:
          </span>
          <span
            className="text-sm font-semibold"
            style={{
              fontFamily: "'Traditional Arabic', 'Segoe UI', Tahoma, sans-serif",
              color: '#6ee7b7',
            }}
          >
            {ARABIC_NAMES[nextPrayer]}
          </span>
        </div>
        <div className="text-[11px] mt-0.5" style={{ color: 'rgba(110,231,183,0.45)', direction: 'ltr' }}>
          {remaining} متبقٍ
        </div>
      </div>
    </div>
  )
}
