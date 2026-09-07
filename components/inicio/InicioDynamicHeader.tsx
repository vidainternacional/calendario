'use client'

import { useEffect, useMemo, useState } from 'react'
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

const scene: Record<DayPart, { background: string; text: string; meta: string }> = {
  morning: {
    background: 'linear-gradient(145deg, #FFF9F2 0%, #FFF5EA 54%, #FFEFE0 100%)',
    text: '#18181B',
    meta: 'rgba(63,63,70,.62)',
  },
  afternoon: {
    background: 'linear-gradient(145deg, #FFFFFF 0%, #FAFAFB 55%, #F5F5F7 100%)',
    text: '#18181B',
    meta: 'rgba(63,63,70,.60)',
  },
  sunset: {
    background: 'linear-gradient(145deg, #FFD9A8 0%, #F8C2A5 48%, #F2A8A0 100%)',
    text: '#33211F',
    meta: 'rgba(72,45,42,.68)',
  },
  night: {
    background: 'linear-gradient(145deg, #0B0E14 0%, #10131A 52%, #14171F 100%)',
    text: '#F8FAFC',
    meta: 'rgba(226,232,240,.68)',
  },
}

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
  const palette = scene[resolved.part]
  const climateFilter = resolved.weather === 'cloudy'
    ? 'saturate(.85) brightness(.99)'
    : resolved.weather === 'storm'
      ? 'brightness(.90) contrast(1.035)'
      : 'none'

  return (
    <div
      className="relative overflow-hidden"
      style={{ background: palette.background, color: palette.text, filter: climateFilter }}
    >
      <style>{`
        @keyframes vida-grain-breathe { 0%,100% { opacity:.03 } 50% { opacity:.04 } }
        @keyframes vida-light-drift { 0%,100% { transform:translate3d(0,0,0) } 50% { transform:translate3d(2px,1px,0) } }
        @keyframes vida-vapor-breathe { 0%,100% { opacity:.025; transform:translate3d(0,0,0) } 50% { opacity:.05; transform:translate3d(1px,-1px,0) } }
        @media (prefers-reduced-motion: reduce) {
          .vida-grain,.vida-light,.vida-vapor { animation:none!important }
        }
      `}</style>

      <div className="vida-light pointer-events-none absolute -inset-[3px] animate-[vida-light-drift_20s_ease-in-out_infinite]" aria-hidden="true">
        {resolved.part === 'morning' && (
          <div className="absolute -right-[12%] -top-[65%] h-[190%] w-[68%] bg-[radial-gradient(ellipse_at_center,rgba(255,214,153,0.15),rgba(255,214,153,0)_68%)]" />
        )}
        {resolved.part === 'sunset' && (
          <div className="absolute -left-[18%] -top-[90%] h-[220%] w-[76%] bg-[radial-gradient(ellipse_at_center,rgba(255,244,220,0.16),rgba(255,244,220,0)_70%)]" />
        )}
      </div>

      <div
        className="vida-grain pointer-events-none absolute inset-0 animate-[vida-grain-breathe_20s_ease-in-out_infinite] mix-blend-multiply"
        aria-hidden="true"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.48'/%3E%3C/svg%3E\")",
        }}
      />

      {(resolved.weather === 'rain' || resolved.weather === 'storm') && (
        <div
          className="vida-vapor pointer-events-none absolute inset-0 animate-[vida-vapor-breathe_20s_ease-in-out_infinite]"
          aria-hidden="true"
          style={{
            background: 'radial-gradient(ellipse at 20% 20%, rgba(255,255,255,.55), transparent 42%), radial-gradient(ellipse at 82% 62%, rgba(255,255,255,.35), transparent 48%)',
          }}
        />
      )}

      <header className="relative mx-auto flex min-h-[164px] max-w-3xl items-end justify-between gap-5 px-4 pb-7 pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-6 sm:pb-8">
        <div className="min-w-0 flex-1">
          <div
            className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: palette.meta }}
          >
            <span>{dateLabel}</span>
            <span className="opacity-45" aria-hidden="true">·</span>
            <span>{temperature != null ? `${temperature}°` : 'Ahora'}</span>
          </div>
          <h1 className="mt-2 truncate text-[28px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[30px]">
            {greeting(resolved.part)}, {firstName}
          </h1>
        </div>
        <UserAvatar
          nombre={nombre}
          avatarUrl={profile?.avatar_url}
          size="lg"
          className="shrink-0 ring-1 ring-white/45"
        />
      </header>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-9 bg-gradient-to-b from-transparent to-[#f4f5f9]"
        aria-hidden="true"
      />
    </div>
  )
}
