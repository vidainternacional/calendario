'use client'

import { Check, Copy, Landmark } from 'lucide-react'
import { useState } from 'react'
import type { ChurchBankAccount } from '@/lib/solidarity/types'

// Vista de solo lectura para mostrar datos oficiales; la edición vive en Administración.
export default function BankAccountCards({
  accounts,
  emptyText = 'Aún no hay una cuenta bancaria configurada para esta opción.',
}: {
  accounts: ChurchBankAccount[]
  emptyText?: string
}) {
  const [copied, setCopied] = useState<string | null>(null)

  const copy = async (account: ChurchBankAccount) => {
    try {
      await navigator.clipboard.writeText(account.numero_cuenta)
      setCopied(account.id)
      window.setTimeout(() => setCopied((current) => current === account.id ? null : current), 1600)
    } catch {
      setCopied(null)
    }
  }

  if (accounts.length === 0) {
    return <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-500">{emptyText}</p>
  }

  return (
    <div className="space-y-3">
      {accounts.map((account) => (
        <article key={account.id} className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-50 text-violet-600"><Landmark className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-[#171923]">{account.titulo}</p>
              <p className="mt-1 text-xs text-slate-500">{account.banco}{account.tipo_cuenta ? ` · ${account.tipo_cuenta}` : ''}</p>
              <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">Número de cuenta</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="min-w-0 flex-1 break-all text-base font-extrabold text-slate-800">{account.numero_cuenta}</p>
                <button type="button" onClick={() => void copy(account)} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-600">
                  {copied === account.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === account.id ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">Titular: {account.titular}</p>
              {account.instrucciones ? <p className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">{account.instrucciones}</p> : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
