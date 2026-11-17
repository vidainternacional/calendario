/** Solo permite volver a la superficie de estudio, sin redirecciones externas. */
export function studyReturnHref(value: string | null | undefined): string | null {
  if (!value || value.length > 2500 || /[\\\u0000-\u0020\u007f]/.test(value)) return null
  try {
    const url = new URL(value, 'https://vida.invalid')
    if (url.origin !== 'https://vida.invalid' || url.pathname !== '/estudios/profundo') return null
    return `${url.pathname}${url.search}`
  } catch {
    return null
  }
}

export function studyResumeHref(query: string, section: string | null, tab: string, from: string | null = null) {
  const params = new URL('/estudios/profundo', 'https://vida.invalid').searchParams
  params.set('q', query)
  params.set('auto', '1')
  params.set('resume', '1')
  if (section) params.set('section', section)
  if (tab === 'concordance') params.set('tab', 'concordancias')
  if (from === 'biblia' || from === 'pastoral') params.set('from', from)
  return `/estudios/profundo?${params}`
}
