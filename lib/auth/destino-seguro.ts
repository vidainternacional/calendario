/** Solo permite rutas internas, sin normalizaciones que cambien de origen. */
export function destinoSeguro(destino: string | null): string {
  if (!destino?.startsWith('/') || destino.startsWith('//')) return '/restablecer'
  if (/[\\\u0000-\u0020\u007f]/.test(destino)) return '/restablecer'
  return destino
}
