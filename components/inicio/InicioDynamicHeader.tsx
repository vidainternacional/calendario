'use client'

import { useEffect, useMemo, useState } from 'react'
import { Cloud, CloudRain, CloudSun, Moon, Sun } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import UserAvatar from '@/components/comunidad/UserAvatar'

type Props = { userId: string; email?: string | null }
type WeatherKind = 'clear' | 'cloudy' | 'rain' | 'storm'
type DayPart = 'morning' | 'afternoon' | 'sunset' | 'night'

function weatherKind(code?: number | null): WeatherKind {
  if (code == null) return 'clear'
  if (code >= 95) return 'storm'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  if (code >= 1 && code <= 48) return 'cloudy'
  return 'clear'
}

function dayPart(hour: number): DayPart {
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  if (hour < 19) return 'sunset'
  return 'night'
}

function greeting(part: DayPart) {
  if (part === 'morning') return 'Buenos días'
  if (part === 'night') return 'Buenas noches'
  return 'Buenas tardes'
}

const scene = {
  morning: 'from-sky-300 via-sky-100 to-amber-50 text-slate-900',
  afternoon: 'from-sky-500 via-sky-300 to-cyan-100 text-white',
  sunset: 'from-indigo-500 via-orange-300 to-amber-100 text-white',
  night: 'from-slate-950 via-indigo-950 to-slate-800 text-white',
} satisfies Record<DayPart, string>

export default function InicioDynamicHeader({ userId, email }: Props) {
  const [now, setNow] = useState<Date | null>(null)
  const [profile, setProfile] = useState<{ nombre_completo?: string | null; avatar_url?: string | null } | null>(null)
  const [weather, setWeather] = useState<WeatherKind>('clear')
  const [temperature, setTemperature] = useState<number | null>(null)
  const [forced, setForced] = useState<string | null>(null)

  useEffect(() => {
    const tick = () => setNow(new Date())
    tick()
    const id = window.setInterval(tick, 60_000)
    const params = new URLSearchParams(window.location.search)
    setForced(params.get('ambiente'))
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    let active = true
    const supabase = createClient()
    void supabase.from('profiles').select('nombre_completo, avatar_url').eq('id', userId).single().then(({ data }) => {
      if (active) setProfile(data)
    })
    return () => { active = false }
  }, [userId])

  useEffect(() => {
    let active = true
    const load = async (latitude: number, longitude: number) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`
        const response = await fetch(url)
        if (!response.ok) return
        const json = await response.json()
        if (!active) return
        setWeather(weatherKind(json?.current?.weather_code))
        setTemperature(typeof json?.current?.temperature_2m === 'number' ? Math.round(json.current.temperature_2m) : null)
      } catch { /* conserva ambiente por hora si el clima no está disponible */ }
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => void load(coords.latitude, coords.longitude),
        () => void load(13.9942, -89.5597),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 30 * 60 * 1000 },
      )
    } else {
      void load(13.9942, -89.5597)
    }
    return () => { active = false }
  }, [])

  const resolved = useMemo(() => {
    const actualPart = dayPart(now?.getHours() ?? 9)
    if (!forced) return { part: actualPart, weather }
    const map: Record<string, { part: DayPart; weather: WeatherKind }> = {
      manana: { part: 'morning', weather: 'clear' },
      tarde: { part: 'afternoon', weather: 'clear' },
      atardecer: { part: 'sunset', weather: 'clear' },
      noche: { part: 'night', weather: 'clear' },
      nublado: { part: actualPart, weather: 'cloudy' },
      lluvia: { part: actualPart, weather: 'rain' },
      tormenta: { part: actualPart, weather: 'storm' },
    }
    return map[forced] || { part: actualPart, weather }
  }, [forced, now, weather])

  const nombre = profile?.nombre_completo || email?.split('@')[0] || 'Servidor'
  const firstName = (nombre.trim().split(/\s+/)[0] || 'Servidor').replace(/^./, (c) => c.toUpperCase())
  const dateLabel = now
    ? new Intl.DateTimeFormat('es-SV', { weekday: 'long', day: 'numeric', month: 'long' }).format(now).replace(/^./, (c) => c.toUpperCase())
    : 'Tu espacio personal en VIDA'
  const WeatherIcon = resolved.weather === 'rain' || resolved.weather === 'storm'
    ? CloudRain
    : resolved.weather === 'cloudy'
      ? CloudSun
      : resolved.part === 'night'
        ? Moon
        : Sun

  return (
    <div className={`relative overflow-hidden bg-gradient-to-b ${scene[resolved.part]}`}>
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {resolved.part === 'night' ? (
          <>
            <span className="absolute left-[12%] top-8 h-1 w-1 rounded-full bg-white/80" />
            <span className="absolute left-[32%] top-16 h-1.5 w-1.5 rounded-full bg-white/55" />
            <span className="absolute right-[24%] top-10 h-1 w-1 rounded-full bg-white/75" />
            <span className="absolute right-[8%] top-20 h-1.5 w-1.5 rounded-full bg-white/45" />
          </>
        ) : (
          <span className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/25 blur-sm" />
        )}
        {(resolved.weather === 'cloudy' || resolved.weather === 'rain' || resolved.weather === 'storm') && (
          <>
            <Cloud className="absolute -left-8 top-7 h-28 w-28 text-white/25" strokeWidth={1.1} />
            <Cloud className="absolute right-12 top-16 h-20 w-20 text-white/20" strokeWidth={1.1} />
          </>
        )}
        {(resolved.weather === 'rain' || resolved.weather === 'storm') && (
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-slate-700/10" />
        )}
      </div>

      <header className="relative mx-auto flex min-h-[156px] max-w-3xl items-end justify-between gap-4 px-4 pb-5 pt-[calc(1.15rem+env(safe-area-inset-top))] sm:px-6 sm:pb-6">
        <div className="min-w-0 flex-1 drop-shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-semibold opacity-80">
            <span>{dateLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <WeatherIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {temperature != null ? `${temperature}°` : 'Ahora'}
            </span>
          </div>
          <h1 className="mt-1 truncate text-[27px] font-bold leading-tight tracking-[-0.035em]">
            {greeting(resolved.part)}, {firstName}
          </h1>
        </div>
        <UserAvatar
          nombre={nombre}
          avatarUrl={profile?.avatar_url}
          size="lg"
          className="shadow-[0_8px_20px_rgba(15,23,42,0.2)] ring-4 ring-white/50"
        />
      </header>
    </div>
  )
}
