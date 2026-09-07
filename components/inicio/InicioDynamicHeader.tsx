'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import UserAvatar from '@/components/comunidad/UserAvatar'

type Props = { userId: string; email?: string | null }
type WeatherKind = 'clear' | 'cloudy' | 'rain' | 'storm'
type DayPart = 'morning' | 'afternoon' | 'sunset' | 'night'
function weatherKind(code?: number | null): WeatherKind { if(code==null)return'clear';if(code>=95)return'storm';if((code>=51&&code<=67)||(code>=80&&code<=82))return'rain';if(code>=1&&code<=48)return'cloudy';return'clear' }
function dayPart(hour:number):DayPart{if(hour<12)return'morning';if(hour<17)return'afternoon';if(hour<19)return'sunset';return'night'}
function greeting(part:DayPart){if(part==='morning')return'Buenos días';if(part==='night')return'Buenas noches';return'Buenas tardes'}
const scene:Record<DayPart,string>={
 morning:'linear-gradient(168deg,#4fa7df 0%,#83c7e9 34%,#c4e2e7 67%,#f4c47f 100%)',
 afternoon:'linear-gradient(168deg,#126db7 0%,#258bd0 32%,#58afe0 67%,#a8ddef 100%)',
 sunset:'linear-gradient(168deg,#3d397b 0%,#8f527f 31%,#dc7378 61%,#f39a5c 82%,#f6c778 100%)',
 night:'linear-gradient(168deg,#02050d 0%,#071225 34%,#0d1d39 68%,#173057 100%)'}
const stars=Array.from({length:32},(_,i)=>({x:(i*37+11)%97,y:(i*53+9)%88,size:1+(i%3),duration:2+(i%7)*.43,delay:-((i*31)%47)/10}))
const rain=Array.from({length:84},(_,i)=>({x:(i*29+5)%106,duration:.55+(i%8)*.055,delay:-((i*17)%43)/10,h:15+(i%6)*2}))
function Cloud({className}:{className:string}){return <div className={className}><i/><i/><i/></div>}
export default function InicioDynamicHeader({userId,email}:Props){
 const[now,setNow]=useState<Date|null>(null);const[profile,setProfile]=useState<{nombre_completo?:string|null;avatar_url?:string|null}|null>(null);const[weather,setWeather]=useState<WeatherKind>('clear');const[temperature,setTemperature]=useState<number|null>(null);const[forced,setForced]=useState<string|null>(null)
 useEffect(()=>{const tick=()=>setNow(new Date());tick();const id=window.setInterval(tick,60000);setForced(new URLSearchParams(window.location.search).get('ambiente'));return()=>window.clearInterval(id)},[])
 useEffect(()=>{let active=true;const supabase=createClient();void supabase.from('profiles').select('nombre_completo, avatar_url').eq('id',userId).single().then(({data})=>{if(active)setProfile(data)});return()=>{active=false}},[userId])
 useEffect(()=>{let active=true;const load=async(latitude:number,longitude:number)=>{try{const response=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`);if(!response.ok)return;const json=await response.json();if(!active)return;setWeather(weatherKind(json?.current?.weather_code));setTemperature(typeof json?.current?.temperature_2m==='number'?Math.round(json.current.temperature_2m):null)}catch{/* conserva ambiente por hora si el clima no está disponible */}};if('geolocation'in navigator)navigator.geolocation.getCurrentPosition(({coords})=>void load(coords.latitude,coords.longitude),()=>void load(13.9942,-89.5597),{enableHighAccuracy:false,timeout:5000,maximumAge:1800000});else void load(13.9942,-89.5597);return()=>{active=false}},[])
 const resolved=useMemo(()=>{const actualPart=dayPart(now?.getHours()??9);if(!forced)return{part:actualPart,weather};const map:Record<string,{part:DayPart;weather:WeatherKind}>={manana:{part:'morning',weather:'clear'},tarde:{part:'afternoon',weather:'clear'},atardecer:{part:'sunset',weather:'clear'},noche:{part:'night',weather:'clear'},nublado:{part:actualPart,weather:'cloudy'},lluvia:{part:actualPart,weather:'rain'},tormenta:{part:actualPart,weather:'storm'}};return map[forced]||{part:actualPart,weather}},[forced,now,weather])
 const nombre=profile?.nombre_completo||email?.split('@')[0]||'Servidor';const firstName=(nombre.trim().split(/\s+/)[0]||'Servidor').replace(/^./,c=>c.toUpperCase());const dateLabel=now?new Intl.DateTimeFormat('es-SV',{weekday:'long',day:'numeric',month:'long'}).format(now).replace(/^./,c=>c.toUpperCase()):'Tu espacio personal en VIDA';const cloudy=resolved.weather!=='clear';const drops=resolved.weather==='storm'?rain:rain.slice(0,52)
 return <div className="relative bg-[#f4f5f9] text-white">
  <style>{`
   @keyframes vidaTwinkle{0%,100%{opacity:.2;transform:scale(.82)}50%{opacity:1;transform:scale(1.12)}}
   @keyframes vidaRay{0%,100%{opacity:.15;transform:rotate(-4deg) scale(1)}50%{opacity:.25;transform:rotate(2deg) scale(1.03)}}
   @keyframes vidaCloudNear{from{transform:translate3d(-20%,0,0)}to{transform:translate3d(25%,0,0)}}
   @keyframes vidaCloudMid{from{transform:translate3d(18%,0,0)}to{transform:translate3d(-20%,0,0)}}
   @keyframes vidaCloudFar{from{transform:translate3d(-12%,0,0)}to{transform:translate3d(14%,0,0)}}
   @keyframes vidaRain{0%{transform:translate3d(0,-45px,0) rotate(15deg);opacity:0}10%{opacity:.72}100%{transform:translate3d(-34px,235px,0) rotate(15deg);opacity:0}}
   @keyframes vidaFlash{0%,91%,93%,100%{opacity:0}91.5%{opacity:.3}92%{opacity:.04}92.45%{opacity:.2}}
   @keyframes vidaNoise{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(1px,-1px,0)}}
   .vida-cloud{position:absolute;width:170px;height:48px;border-radius:999px;background:rgba(240,246,252,.48);box-shadow:0 10px 24px rgba(19,35,52,.12)}
   .vida-cloud i{position:absolute;display:block;border-radius:50%;background:inherit}.vida-cloud i:nth-child(1){width:72px;height:72px;left:27px;bottom:5px}.vida-cloud i:nth-child(2){width:92px;height:92px;left:68px;bottom:0}.vida-cloud i:nth-child(3){width:60px;height:60px;right:-10px;bottom:2px}
   @media(prefers-reduced-motion:reduce){.vida-animated{animation:none!important}}
  `}</style>
  <div className="relative overflow-hidden" style={{background:scene[resolved.part],WebkitMaskImage:'linear-gradient(to bottom,#000 0%,#000 70%,rgba(0,0,0,.85) 80%,rgba(0,0,0,.4) 90%,transparent 100%)',maskImage:'linear-gradient(to bottom,#000 0%,#000 70%,rgba(0,0,0,.85) 80%,rgba(0,0,0,.4) 90%,transparent 100%)'}}>
   <div className="pointer-events-none absolute inset-0 z-[1] transition-opacity duration-700" aria-hidden="true">
    {resolved.weather==='clear'&&resolved.part!=='night'&&<><div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/30"/><div className="vida-animated absolute -right-44 -top-52 h-[460px] w-[520px] origin-top-right animate-[vidaRay_30s_ease-in-out_infinite]" style={{background:'conic-gradient(from 205deg at 100% 0%,transparent 0 7deg,rgba(255,255,255,.9) 8deg 13deg,transparent 14deg 24deg,rgba(255,245,200,.72) 25deg 31deg,transparent 32deg 45deg,rgba(255,255,255,.62) 46deg 51deg,transparent 52deg 70deg)'}}/></>}
    {resolved.part==='night'&&!cloudy&&stars.map((s,i)=><span key={i} className="vida-animated absolute rounded-full bg-white shadow-[0_0_3px_rgba(255,255,255,.65)] animate-[vidaTwinkle_ease-in-out_infinite]" style={{left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,animationDuration:`${s.duration}s`,animationDelay:`${s.delay}s`}}/>)}
    {cloudy&&<><div className="absolute inset-0 bg-slate-700/25"/><Cloud className="vida-cloud vida-animated left-[-14%] top-[16%] scale-[1.25] opacity-60 animate-[vidaCloudNear_40s_ease-in-out_infinite_alternate]"/><Cloud className="vida-cloud vida-animated right-[-10%] top-[38%] scale-[.9] opacity-50 animate-[vidaCloudMid_62s_ease-in-out_infinite_alternate]"/><Cloud className="vida-cloud vida-animated left-[18%] top-[4%] scale-[.65] opacity-40 animate-[vidaCloudFar_90s_ease-in-out_infinite_alternate]"/></>}
    {(resolved.weather==='rain'||resolved.weather==='storm')&&<div className="absolute inset-0 overflow-hidden">{drops.map((d,i)=><span key={i} className="vida-animated absolute -top-7 w-[1.5px] animate-[vidaRain_linear_infinite] bg-white/65" style={{left:`${d.x}%`,height:d.h,animationDuration:`${resolved.weather==='storm'?d.duration*.68:d.duration}s`,animationDelay:`${d.delay}s`}}/>)}</div>}
    {resolved.weather==='storm'&&<div className="vida-animated absolute inset-0 animate-[vidaFlash_11s_linear_infinite] bg-white"/>}
    <div className="vida-animated absolute inset-0 animate-[vidaNoise_8s_ease-in-out_infinite] opacity-[.025] mix-blend-overlay" style={{backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"}}/>
   </div>
   <header className="relative z-10 mx-auto flex min-h-[190px] max-w-3xl items-end justify-between gap-5 px-4 pb-12 pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-6 sm:pb-14"><div className="min-w-0 flex-1 [text-shadow:0_1px_4px_rgba(0,0,0,.28)]"><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.12em] text-white/80"><span>{dateLabel}</span><span className="opacity-50">·</span><span>{temperature!=null?`${temperature}°`:'Ahora'}</span></div><h1 className="mt-2 truncate text-[28px] font-bold leading-[1.08] tracking-[-.035em] sm:text-[30px]">{greeting(resolved.part)}, {firstName}</h1></div><UserAvatar nombre={nombre} avatarUrl={profile?.avatar_url} size="lg" className="shrink-0 ring-1 ring-white/60"/></header>
  </div>
 </div>
}
