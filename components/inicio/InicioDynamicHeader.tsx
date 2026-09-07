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

const scene: Record<DayPart, string> = {
  morning: 'linear-gradient(170deg,#3e9bd6 0%,#77bee5 28%,#a9d3e5 55%,#d9d8c5 78%,#e7b874 100%)',
  afternoon: 'linear-gradient(170deg,#0c68b2 0%,#197dc4 27%,#3a9bd3 54%,#6fb8da 77%,#9bcbdc 100%)',
  sunset: 'linear-gradient(170deg,#302f6b 0%,#6e457a 28%,#b75e7b 55%,#e78268 78%,#f0b16f 100%)',
  night: 'linear-gradient(170deg,#01040b 0%,#061127 32%,#0a1b38 62%,#132b50 100%)',
}

const stars = Array.from({ length: 34 }, (_, i) => ({
  x: (i * 37 + 11) % 97,
  y: (i * 53 + 9) % 96,
  size: 1 + (i % 3),
  duration: 2 + (i % 7) * 0.43,
  delay: -((i * 31) % 47) / 10,
}))

const rain = Array.from({ length: 84 }, (_, i) => ({
  x: (i * 29 + 5) % 106,
  duration: 0.55 + (i % 8) * 0.055,
  delay: -((i * 17) % 43) / 10,
  h: 15 + (i % 6) * 2,
}))

function CloudTexture({
  id,
  seed,
  baseFrequency,
  blur,
  tint,
  opacity,
  className,
}: {
  id: string
  seed: number
  baseFrequency: string
  blur: number
  tint: string
  opacity: number
  className: string
}) {
  return (
    <svg
      className={`absolute -inset-[8%] h-[116%] w-[116%] ${className}`}
      viewBox="0 0 800 1200"
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity }}
      aria-hidden="true"
    >
      <defs>
        <filter id={id} x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={baseFrequency}
            numOctaves="4"
            seed={seed}
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation={blur} result="softNoise" />
          <feColorMatrix in="softNoise" type="luminanceToAlpha" result="alpha" />
          <feComponentTransfer in="alpha" result="shaped">
            <feFuncA type="gamma" amplitude="1.35" exponent="1.15" offset="-0.08" />
          </feComponentTransfer>
          <feFlood floodColor={tint} result="color" />
          <feComposite in="color" in2="shaped" operator="in" />
        </filter>
      </defs>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  )
}

function Atmosphere({ kind, night }: { kind: WeatherKind; night: boolean }) {
  if (kind === 'clear') return null

  const heavy = kind === 'rain' || kind === 'storm'
  const storm = kind === 'storm'
  const highlight = night ? '#b9c8df' : '#f7fafc'
  const mid = night ? '#8ea3bf' : '#dbe5ec'
  const shadow = night ? '#18263d' : storm ? '#4c6076' : '#72869a'

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: storm
            ? 'linear-gradient(180deg,rgba(20,33,49,.42),rgba(31,47,64,.22) 42%,rgba(83,101,116,.12) 100%)'
            : heavy
              ? 'linear-gradient(180deg,rgba(85,107,127,.22),rgba(152,171,185,.08) 56%,transparent 100%)'
              : 'linear-gradient(180deg,rgba(255,255,255,.08),rgba(152,177,194,.05) 62%,transparent 100%)',
        }}
      />

      <CloudTexture
        id="vida-cloud-back"
        seed={5}
        baseFrequency="0.0028 0.0055"
        blur={22}
        tint={highlight}
        opacity={heavy ? 0.62 : 0.5}
        className="vida-animated animate-[vidaCloudBack_115s_ease-in-out_infinite_alternate] mix-blend-soft-light"
      />
      <CloudTexture
        id="vida-cloud-mid"
        seed={11}
        baseFrequency="0.0055 0.0095"
        blur={14}
        tint={mid}
        opacity={heavy ? 0.5 : 0.38}
        className="vida-animated animate-[vidaCloudMid_82s_ease-in-out_infinite_alternate] mix-blend-screen"
      />
      <CloudTexture
        id="vida-cloud-shadow"
        seed={19}
        baseFrequency="0.004 0.007"
        blur={18}
        tint={shadow}
        opacity={storm ? 0.48 : heavy ? 0.34 : 0.22}
        className="vida-animated animate-[vidaCloudShadow_138s_ease-in-out_infinite_alternate] mix-blend-multiply"
      />

      <div
        className="absolute inset-0 mix-blend-soft-light"
        style={{
          background: night
            ? 'radial-gradient(ellipse at 68% 14%,rgba(185,202,222,.18),transparent 35%),radial-gradient(ellipse at 28% 58%,rgba(255,255,255,.08),transparent 42%)'
            : 'radial-gradient(ellipse at 72% 11%,rgba(255,255,255,.28),transparent 34%),radial-gradient(ellipse at 20% 52%,rgba(255,255,255,.13),transparent 42%)',
        }}
      />
    </div>
  )
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
    setForced(new URLSearchParams(window.location.search).get('ambiente'))
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
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`)
        if (!response.ok) return
        const json = await response.json()
        if (!active) return
        setWeather(weatherKind(json?.current?.weather_code))
        setTemperature(typeof json?.current?.temperature_2m === 'number' ? Math.round(json.current.temperature_2m) : null)
      } catch { /* conserva el ambiente por hora si el clima no responde */ }
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => void load(coords.latitude, coords.longitude),
        () => void load(13.9942, -89.5597),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 1_800_000 },
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
  const cloudy = resolved.weather !== 'clear'
  const drops = resolved.weather === 'storm' ? rain : rain.slice(0, 52)

  return (
    <>
      <style>{`
        @keyframes vidaTwinkle{0%,100%{opacity:.2;transform:scale(.82)}50%{opacity:1;transform:scale(1.12)}}
        @keyframes vidaRay{0%,100%{opacity:.13;transform:rotate(-4deg) scale(1)}50%{opacity:.23;transform:rotate(1deg) scale(1.035)}}
        @keyframes vidaCloudBack{from{transform:translate3d(-3%,0,0) scale(1.04)}to{transform:translate3d(3%,1%,0) scale(1.07)}}
        @keyframes vidaCloudMid{from{transform:translate3d(2%,-1%,0) scale(1.05)}to{transform:translate3d(-3%,1%,0) scale(1.08)}}
        @keyframes vidaCloudShadow{from{transform:translate3d(-2%,1%,0) scale(1.04)}to{transform:translate3d(2%,-1%,0) scale(1.07)}}
        @keyframes vidaRain{0%{transform:translate3d(0,-45px,0) rotate(15deg);opacity:0}10%{opacity:.65}100%{transform:translate3d(-34px,110vh,0) rotate(15deg);opacity:0}}
        @keyframes vidaFlash{0%,91%,93%,100%{opacity:0}91.5%{opacity:.28}92%{opacity:.04}92.45%{opacity:.16}}
        @media(prefers-reduced-motion:reduce){.vida-animated{animation:none!important}}
      `}</style>

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" style={{ background: scene[resolved.part] }} aria-hidden="true">
        <div className="absolute inset-0 transition-opacity duration-700">
          {resolved.weather === 'clear' && resolved.part !== 'night' && (
            <>
              <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/22 blur-xl" />
              <div
                className="vida-animated absolute -right-52 -top-60 h-[700px] w-[760px] origin-top-right animate-[vidaRay_30s_ease-in-out_infinite]"
                style={{
                  background: 'conic-gradient(from 205deg at 100% 0%,transparent 0 7deg,rgba(255,255,255,.72) 8deg 13deg,transparent 14deg 25deg,rgba(255,245,205,.56) 26deg 32deg,transparent 33deg 47deg,rgba(255,255,255,.48) 48deg 54deg,transparent 55deg 73deg)',
                }}
              />
            </>
          )}

          {resolved.part === 'night' && !cloudy && stars.map((s, i) => (
            <span
              key={i}
              className="vida-animated absolute rounded-full bg-white shadow-[0_0_3px_rgba(255,255,255,.65)] animate-[vidaTwinkle_ease-in-out_infinite]"
              style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, animationDuration: `${s.duration}s`, animationDelay: `${s.delay}s` }}
            />
          ))}

          <Atmosphere kind={resolved.weather} night={resolved.part === 'night'} />

          {(resolved.weather === 'rain' || resolved.weather === 'storm') && (
            <div className="absolute inset-0 overflow-hidden">
              {drops.map((d, i) => (
                <span
                  key={i}
                  className="vida-animated absolute -top-7 w-[1.25px] animate-[vidaRain_linear_infinite] bg-white/58"
                  style={{ left: `${d.x}%`, height: d.h, animationDuration: `${resolved.weather === 'storm' ? d.duration * 0.68 : d.duration}s`, animationDelay: `${d.delay}s` }}
                />
              ))}
            </div>
          )}

          {resolved.weather === 'storm' && <div className="vida-animated absolute inset-0 animate-[vidaFlash_11s_linear_infinite] bg-white mix-blend-screen" />}
        </div>
      </div>

      <header className="relative z-10 mx-auto flex min-h-[190px] max-w-3xl items-end justify-between gap-5 px-4 pb-8 pt-[calc(1.25rem+env(safe-area-inset-top))] text-white sm:px-6 sm:pb-10">
        <div className="min-w-0 flex-1 [text-shadow:0_1px_4px_rgba(0,0,0,.28)]">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.12em] text-white/80">
            <span>{dateLabel}</span><span className="opacity-50">·</span><span>{temperature != null ? `${temperature}°` : 'Ahora'}</span>
          </div>
          <h1 className="mt-2 truncate text-[28px] font-bold leading-[1.08] tracking-[-.035em] sm:text-[30px]">{greeting(resolved.part)}, {firstName}</h1>
        </div>
        <UserAvatar nombre={nombre} avatarUrl={profile?.avatar_url} size="lg" className="shrink-0 ring-1 ring-white/60" />
      </header>
    </>
  )
}
