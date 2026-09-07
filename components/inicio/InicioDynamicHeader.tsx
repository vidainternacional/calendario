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
  morning: 'linear-gradient(165deg,#68b8e9 0%,#a9d8ef 52%,#f4c88d 100%)',
  afternoon: 'linear-gradient(165deg,#237fc8 0%,#54a8df 55%,#9ed8ef 100%)',
  sunset: 'linear-gradient(165deg,#55458e 0%,#d87582 48%,#f4a35f 76%,#f7c57d 100%)',
  night: 'linear-gradient(165deg,#050914 0%,#0b1730 52%,#15284a 100%)',
}

const stars = [
  [8,18,.7,2.1],[17,35,.45,3.4],[27,14,.8,4.7],[38,29,.5,2.8],[49,11,.65,5.2],[59,37,.8,3.7],
  [69,17,.45,4.3],[79,31,.7,2.5],[90,13,.55,5.7],[13,58,.5,4.9],[32,49,.75,2.3],[52,61,.45,5.4],
  [73,52,.65,3.1],[88,66,.8,4.2],[95,43,.5,2.7],
] as const
const rainDrops = Array.from({ length: 22 }, (_, i) => ({ left: (i * 17 + 7) % 103, delay: (i % 7) * -.19, duration: .72 + (i % 5) * .08 }))

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
    } else void load(13.9942, -89.5597)
    return () => { active = false }
  }, [])

  const resolved = useMemo(() => {
    const actualPart = dayPart(now?.getHours() ?? 9)
    if (!forced) return { part: actualPart, weather }
    const map: Record<string, { part: DayPart; weather: WeatherKind }> = {
      manana: { part: 'morning', weather: 'clear' }, tarde: { part: 'afternoon', weather: 'clear' },
      atardecer: { part: 'sunset', weather: 'clear' }, noche: { part: 'night', weather: 'clear' },
      nublado: { part: actualPart, weather: 'cloudy' }, lluvia: { part: actualPart, weather: 'rain' },
      tormenta: { part: actualPart, weather: 'storm' },
    }
    return map[forced] || { part: actualPart, weather }
  }, [forced, now, weather])

  const nombre = profile?.nombre_completo || email?.split('@')[0] || 'Servidor'
  const firstName = (nombre.trim().split(/\s+/)[0] || 'Servidor').replace(/^./, c => c.toUpperCase())
  const dateLabel = now ? new Intl.DateTimeFormat('es-SV',{ weekday:'long',day:'numeric',month:'long' }).format(now).replace(/^./,c=>c.toUpperCase()) : 'Tu espacio personal en VIDA'
  const hasClouds = resolved.weather !== 'clear'
  const hasRain = resolved.weather === 'rain' || resolved.weather === 'storm'

  return (
    <div className="relative overflow-hidden text-white transition-colors duration-1000" style={{ background: scene[resolved.part] }}>
      <style>{`
        @keyframes vida-ray{0%,100%{opacity:.2;transform:rotate(-7deg) scale(1)}50%{opacity:.38;transform:rotate(-5deg) scale(1.04)}}
        @keyframes vida-cloud-a{from{transform:translate3d(-9%,0,0)}to{transform:translate3d(10%,0,0)}}
        @keyframes vida-cloud-b{from{transform:translate3d(9%,0,0)}to{transform:translate3d(-10%,0,0)}}
        @keyframes vida-rain{0%{transform:translate3d(0,-35px,0);opacity:0}12%{opacity:.5}100%{transform:translate3d(-22px,190px,0);opacity:0}}
        @keyframes vida-flash{0%,88%,91%,100%{opacity:0}89%{opacity:.22}90%{opacity:.05}}
        @keyframes vida-star{0%,100%{opacity:.18;transform:scale(.8)}50%{opacity:.9;transform:scale(1.15)}}
        .vida-weather-layer{transition:opacity 900ms ease}
        @media(prefers-reduced-motion:reduce){.vida-animated{animation:none!important}}
      `}</style>

      <div className="vida-weather-layer pointer-events-none absolute inset-0" aria-hidden="true">
        {resolved.weather === 'clear' && resolved.part !== 'night' && <>
          <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-white/30 blur-2xl" />
          <div className="vida-animated absolute -right-28 -top-28 h-[340px] w-[390px] origin-top-right animate-[vida-ray_9s_ease-in-out_infinite] opacity-30" style={{background:'conic-gradient(from 198deg at 100% 0%,transparent 0deg,rgba(255,255,255,.34) 8deg,transparent 18deg,transparent 30deg,rgba(255,244,205,.26) 40deg,transparent 55deg)'}} />
        </>}
        {resolved.part === 'night' && !hasClouds && stars.map(([x,y,o,d],i)=><span key={i} className="vida-animated absolute rounded-full bg-white animate-[vida-star_3.8s_ease-in-out_infinite]" style={{left:`${x}%`,top:`${y}%`,width:i%4===0?2:1,height:i%4===0?2:1,opacity:o,animationDelay:`-${d}s`}} />)}

        {hasClouds && <>
          <div className="absolute inset-0 bg-slate-700/20" />
          <div className="vida-animated absolute -left-[18%] top-0 h-28 w-[90%] animate-[vida-cloud-a_24s_ease-in-out_infinite_alternate] rounded-[50%] bg-white/20 blur-2xl" />
          <div className="vida-animated absolute -right-[20%] top-12 h-32 w-[86%] animate-[vida-cloud-b_31s_ease-in-out_infinite_alternate] rounded-[50%] bg-slate-200/18 blur-2xl" />
          <div className="vida-animated absolute left-[8%] top-24 h-24 w-[78%] animate-[vida-cloud-a_38s_ease-in-out_infinite_alternate] rounded-[50%] bg-slate-500/16 blur-3xl" />
        </>}

        {hasRain && <div className="absolute inset-0 overflow-hidden">{rainDrops.map((drop,i)=><span key={i} className="vida-animated absolute -top-8 h-10 w-px rotate-[12deg] animate-[vida-rain_linear_infinite] bg-gradient-to-b from-transparent via-white/45 to-transparent" style={{left:`${drop.left}%`,animationDelay:`${drop.delay}s`,animationDuration:`${resolved.weather==='storm'?drop.duration*.72:drop.duration}s`}} />)}</div>}
        {resolved.weather === 'storm' && <div className="vida-animated absolute inset-0 animate-[vida-flash_8s_linear_infinite] bg-white" />}
      </div>

      <header className="relative z-10 mx-auto flex min-h-[174px] max-w-3xl items-end justify-between gap-5 px-4 pb-8 pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-6 sm:pb-9">
        <div className="min-w-0 flex-1 [text-shadow:0_1px_4px_rgba(0,0,0,.22)]">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/75">
            <span>{dateLabel}</span><span className="opacity-50" aria-hidden="true">·</span><span>{temperature != null ? `${temperature}°` : 'Ahora'}</span>
          </div>
          <h1 className="mt-2 truncate text-[28px] font-bold leading-[1.08] tracking-[-0.035em] sm:text-[30px]">{greeting(resolved.part)}, {firstName}</h1>
        </div>
        <UserAvatar nombre={nombre} avatarUrl={profile?.avatar_url} size="lg" className="shrink-0 ring-1 ring-white/60" />
      </header>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-12 bg-gradient-to-b from-transparent via-[#f4f5f9]/35 to-[#f4f5f9]" aria-hidden="true" />
    </div>
  )
}
