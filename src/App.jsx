import { useState, useEffect, useRef, useMemo } from 'react'

// Beirut June 2026 prayer timetable
const PRAYER_TIMES = {
  1:  { Imsak: '3:48', Fajr: '4:00', Sunrise: '5:28', Dhuhr: '12:36', Asr: '16:21', Maghrib: '20:03', Isha: '21:06' },
  2:  { Imsak: '3:48', Fajr: '3:59', Sunrise: '5:28', Dhuhr: '12:36', Asr: '16:21', Maghrib: '20:04', Isha: '21:07' },
  3:  { Imsak: '3:47', Fajr: '3:59', Sunrise: '5:28', Dhuhr: '12:36', Asr: '16:21', Maghrib: '20:05', Isha: '21:08' },
  4:  { Imsak: '3:47', Fajr: '3:58', Sunrise: '5:28', Dhuhr: '12:36', Asr: '16:21', Maghrib: '20:05', Isha: '21:08' },
  5:  { Imsak: '3:47', Fajr: '3:58', Sunrise: '5:27', Dhuhr: '12:36', Asr: '16:21', Maghrib: '20:06', Isha: '21:09' },
  6:  { Imsak: '3:46', Fajr: '3:58', Sunrise: '5:27', Dhuhr: '12:37', Asr: '16:22', Maghrib: '20:06', Isha: '21:10' },
  7:  { Imsak: '3:46', Fajr: '3:57', Sunrise: '5:27', Dhuhr: '12:37', Asr: '16:22', Maghrib: '20:07', Isha: '21:10' },
  8:  { Imsak: '3:46', Fajr: '3:57', Sunrise: '5:27', Dhuhr: '12:37', Asr: '16:22', Maghrib: '20:07', Isha: '21:11' },
  9:  { Imsak: '3:45', Fajr: '3:57', Sunrise: '5:27', Dhuhr: '12:37', Asr: '16:22', Maghrib: '20:08', Isha: '21:11' },
  10: { Imsak: '3:45', Fajr: '3:56', Sunrise: '5:27', Dhuhr: '12:37', Asr: '16:22', Maghrib: '20:08', Isha: '21:12' },
  11: { Imsak: '3:45', Fajr: '3:56', Sunrise: '5:27', Dhuhr: '12:38', Asr: '16:23', Maghrib: '20:09', Isha: '21:13' },
  12: { Imsak: '3:45', Fajr: '3:56', Sunrise: '5:27', Dhuhr: '12:38', Asr: '16:23', Maghrib: '20:09', Isha: '21:13' },
  13: { Imsak: '3:45', Fajr: '3:56', Sunrise: '5:27', Dhuhr: '12:38', Asr: '16:23', Maghrib: '20:10', Isha: '21:14' },
  14: { Imsak: '3:45', Fajr: '3:56', Sunrise: '5:27', Dhuhr: '12:38', Asr: '16:23', Maghrib: '20:10', Isha: '21:14' },
  15: { Imsak: '3:45', Fajr: '3:56', Sunrise: '5:27', Dhuhr: '12:38', Asr: '16:23', Maghrib: '20:11', Isha: '21:14' },
  16: { Imsak: '3:45', Fajr: '3:56', Sunrise: '5:27', Dhuhr: '12:39', Asr: '16:24', Maghrib: '20:11', Isha: '21:15' },
  17: { Imsak: '3:45', Fajr: '3:56', Sunrise: '5:27', Dhuhr: '12:39', Asr: '16:24', Maghrib: '20:11', Isha: '21:15' },
  18: { Imsak: '3:45', Fajr: '3:56', Sunrise: '5:27', Dhuhr: '12:39', Asr: '16:24', Maghrib: '20:12', Isha: '21:15' },
  19: { Imsak: '3:45', Fajr: '3:56', Sunrise: '5:27', Dhuhr: '12:39', Asr: '16:24', Maghrib: '20:12', Isha: '21:16' },
  20: { Imsak: '3:45', Fajr: '3:56', Sunrise: '5:28', Dhuhr: '12:40', Asr: '16:25', Maghrib: '20:12', Isha: '21:16' },
  21: { Imsak: '3:45', Fajr: '3:57', Sunrise: '5:28', Dhuhr: '12:40', Asr: '16:25', Maghrib: '20:12', Isha: '21:16' },
  22: { Imsak: '3:45', Fajr: '3:57', Sunrise: '5:28', Dhuhr: '12:40', Asr: '16:25', Maghrib: '20:13', Isha: '21:16' },
  23: { Imsak: '3:46', Fajr: '3:57', Sunrise: '5:28', Dhuhr: '12:40', Asr: '16:25', Maghrib: '20:13', Isha: '21:17' },
  24: { Imsak: '3:46', Fajr: '3:57', Sunrise: '5:28', Dhuhr: '12:40', Asr: '16:25', Maghrib: '20:13', Isha: '21:17' },
  25: { Imsak: '3:46', Fajr: '3:58', Sunrise: '5:29', Dhuhr: '12:41', Asr: '16:26', Maghrib: '20:13', Isha: '21:17' },
  26: { Imsak: '3:47', Fajr: '3:58', Sunrise: '5:29', Dhuhr: '12:41', Asr: '16:26', Maghrib: '20:13', Isha: '21:17' },
  27: { Imsak: '3:47', Fajr: '3:58', Sunrise: '5:29', Dhuhr: '12:41', Asr: '16:26', Maghrib: '20:13', Isha: '21:17' },
  28: { Imsak: '3:47', Fajr: '3:59', Sunrise: '5:30', Dhuhr: '12:41', Asr: '16:26', Maghrib: '20:13', Isha: '21:17' },
  29: { Imsak: '3:48', Fajr: '3:59', Sunrise: '5:30', Dhuhr: '12:41', Asr: '16:26', Maghrib: '20:13', Isha: '21:17' },
  30: { Imsak: '3:48', Fajr: '4:00', Sunrise: '5:31', Dhuhr: '12:42', Asr: '16:27', Maghrib: '20:13', Isha: '21:17' },
}

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

// Returns the name of the next upcoming prayer (skips Imsak and Sunrise)
function getNextPrayer(times) {
  const now = new Date()
  const current = now.getHours() * 60 + now.getMinutes()
  for (const name of PRAYERS_ONLY) {
    const [h, m] = times[name].split(':').map(Number)
    if (h * 60 + m > current) return name
  }
  return 'Fajr' // wrap to next day
}

function getRemainingTime(times, nextPrayer) {
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

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    // Fetch live prayer times from the Almanar scraper in main process
    if (window.electron?.getPrayerTimes) {
      window.electron.getPrayerTimes().then(times => {
        if (times && Object.keys(times).length > 0) {
          setFetchedTimes(times)
        }
      })
    }
  }, [])

  const day = now.getDate()
  const times = fetchedTimes || PRAYER_TIMES[day] || {}
  const nextPrayer = useMemo(() => getNextPrayer(times), [times, now])
  const remaining = useMemo(() => getRemainingTime(times, nextPrayer), [times, nextPrayer, now])

  const togglePin = () => {
    const newPinned = !isPinned;
    setIsPinned(newPinned);
    window.electron?.togglePin(newPinned);
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
        <div className="absolute left-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <PinIcon isPinned={isPinned} onClick={togglePin} />
        </div>
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mb-1">
          <CrescentIcon />
          <span>{dateStr}</span>
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
