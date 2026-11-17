'use client'

import { useSyncExternalStore } from 'react'
import { createClient } from '@/lib/supabase/client'
import { listarNovedadesMinisteriales } from '@/app/actions/novedades-ministeriales'
import { claveAperturasVideos, leerAperturasVideos, videosPorAbrir, type VideoMinisterial, type AperturasVideos } from '@/lib/estudios/novedades-ministeriales'

type Estado = { usuarioId: string | null; pendientes: VideoMinisterial[] }
const VACIO: Estado = { usuarioId: null, pendientes: [] }
let estado: Estado = VACIO
let videos: VideoMinisterial[] = []
let abiertos: AperturasVideos = {}
let generacion = 0
let enCurso = false
let repetir = false
let ultimaConsulta = 0
let limpiar: (() => void) | null = null
const suscriptores = new Set<() => void>()

function publicar() {
  estado = { usuarioId: estado.usuarioId, pendientes: videosPorAbrir(videos, abiertos) }
  suscriptores.forEach((s) => s())
}
function cambiarUsuario(usuarioId: string | null) {
  if (estado.usuarioId === usuarioId) return
  generacion++; videos = []; abiertos = {}; estado = { usuarioId, pendientes: [] }
  if (usuarioId) { try { abiertos = leerAperturasVideos(localStorage.getItem(claveAperturasVideos(usuarioId))) } catch { /* Sin almacenamiento se conserva el marcador durante esta visita. */ } }
  publicar()
}
async function refrescar(forzar = false) {
  if (typeof window === 'undefined' || !navigator.onLine) return
  if (enCurso) { repetir = true; return }
  if (!forzar && Date.now() - ultimaConsulta < 1200) return
  enCurso = true
  try {
    const client = createClient()
    const { data: { session } } = await client.auth.getSession()
    cambiarUsuario(session?.user.id || null)
    if (!estado.usuarioId) return
    const actual = generacion
    const usuario = estado.usuarioId
    const resultado = await listarNovedadesMinisteriales()
    if (actual !== generacion || estado.usuarioId !== usuario) return
    if (resultado.usuarioId !== usuario) { cambiarUsuario(null); return }
    if (resultado.error) return
    videos = resultado.videos
    publicar()
  } catch { /* Una consulta fallida no convierte los videos en leídos. */ }
  finally {
    enCurso = false; ultimaConsulta = Date.now()
    if (repetir) { repetir = false; void refrescar(true) }
  }
}
function iniciar() {
  if (limpiar || typeof window === 'undefined') return
  const client = createClient()
  const { data: listener } = client.auth.onAuthStateChange((_evento, session) => {
    cambiarUsuario(session?.user.id || null)
    // Fuera del callback Auth para evitar consultas bloqueadas por su exclusión interna.
    queueMicrotask(() => void refrescar(true))
  })
  const volver = () => { if (document.visibilityState === 'visible') void refrescar() }
  const conexion = () => void refrescar(true)
  const almacenamiento = (evento: StorageEvent) => {
    if (estado.usuarioId && evento.key === claveAperturasVideos(estado.usuarioId)) { abiertos = leerAperturasVideos(evento.newValue); publicar() }
  }
  const timer = window.setInterval(volver, 30000)
  window.addEventListener('focus', volver); window.addEventListener('online', conexion)
  window.addEventListener('storage', almacenamiento)
  window.addEventListener('vida-pending-indicators-refresh', conexion)
  window.addEventListener('vida-avisos-contenido-actualizar', conexion)
  document.addEventListener('visibilitychange', volver)
  limpiar = () => {
    listener.subscription.unsubscribe(); window.clearInterval(timer)
    window.removeEventListener('focus', volver); window.removeEventListener('online', conexion)
    window.removeEventListener('storage', almacenamiento)
    window.removeEventListener('vida-pending-indicators-refresh', conexion)
    window.removeEventListener('vida-avisos-contenido-actualizar', conexion)
    document.removeEventListener('visibilitychange', volver)
    limpiar = null
    generacion++; videos = []; abiertos = {}; estado = VACIO
  }
}
function suscribir(callback: () => void) {
  suscriptores.add(callback); iniciar(); void refrescar()
  return () => { suscriptores.delete(callback); if (!suscriptores.size) limpiar?.() }
}
export function useVideosMinisteriales() {
  return useSyncExternalStore(suscribir, () => estado, () => VACIO)
}

/** Marca apertura, no reproducción completa. Solo modifica la cuenta activa de este dispositivo. */
export async function registrarVideoAbierto(usuarioId: string, id: string, publicadoEn: string) {
  const client = createClient()
  const { data: { session } } = await client.auth.getSession()
  if (session?.user.id !== usuarioId) return
  let registros: AperturasVideos = {}
  try { registros = leerAperturasVideos(localStorage.getItem(claveAperturasVideos(usuarioId))) } catch { /* Memoria como respaldo. */ }
  registros[id] = publicadoEn
  try { localStorage.setItem(claveAperturasVideos(usuarioId), JSON.stringify(registros)) } catch { /* Sin persistencia entre visitas. */ }
  if (estado.usuarioId === usuarioId) { abiertos = { ...abiertos, ...registros }; publicar() }
}
