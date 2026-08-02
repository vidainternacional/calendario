import { redirect } from 'next/navigation'

export default async function ConcordanciasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q = '' } = await searchParams
  const params = new URLSearchParams({ tab: 'concordancias' })

  if (q.trim()) params.set('q', q.trim())

  redirect(`/estudios/profundo?${params.toString()}`)
}
