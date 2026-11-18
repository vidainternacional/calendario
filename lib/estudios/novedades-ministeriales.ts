export type VideoMinisterial = { id: string; titulo: string; publicadoEn: string }
export type AperturasVideos = Record<string, string>
export const claveAperturasVideos = (usuarioId: string) => `vida-videos-abiertos-v1:${usuarioId}`
export function leerAperturasVideos(texto: string | null): AperturasVideos {
  try {
    const datos: unknown = JSON.parse(texto || '{}')
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) return {}
    return Object.fromEntries(Object.entries(datos).filter(([id, fecha]) => /^[a-f0-9-]{36}$/i.test(id) && typeof fecha === 'string' && Number.isFinite(Date.parse(fecha))).slice(-5000))
  } catch { return {} }
}
export function videosPorAbrir(videos: VideoMinisterial[], aperturas: AperturasVideos) {
  return videos.filter((video) => aperturas[video.id] !== video.publicadoEn)
}
