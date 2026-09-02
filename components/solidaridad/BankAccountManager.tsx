'use client'

import { useState, useTransition } from 'react'
import { Check, Landmark, Pencil, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { eliminarCuentaBancariaIglesia, guardarCuentaBancariaIglesia } from '@/app/actions/solidaridad'
import type { ChurchBankAccount, ChurchBankAccountPurpose } from '@/lib/solidarity/types'

const emptyForm = {
  id: '',
  purpose: 'ayuda_solidaria' as ChurchBankAccountPurpose,
  title: '',
  bank: '',
  holder: '',
  accountNumber: '',
  accountType: '',
  instructions: '',
  active: true,
}

export default function BankAccountManager({ accounts }: { accounts: ChurchBankAccount[] }) {
  const router = useRouter()
  const [form, setForm] = useState(emptyForm)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  const edit = (account: ChurchBankAccount) => {
    setForm({
      id: account.id,
      purpose: account.proposito,
      title: account.titulo,
      bank: account.banco,
      holder: account.titular,
      accountNumber: account.numero_cuenta,
      accountType: account.tipo_cuenta || '',
      instructions: account.instrucciones || '',
      active: account.activo,
    })
    setMessage(null)
  }

  const save = () => {
    setMessage(null)
    startTransition(async () => {
      const result = await guardarCuentaBancariaIglesia({
        id: form.id || undefined,
        purpose: form.purpose,
        title: form.title,
        bank: form.bank,
        holder: form.holder,
        accountNumber: form.accountNumber,
        accountType: form.accountType,
        instructions: form.instructions,
        active: form.active,
      })
      if (!result.success) {
        setMessage(result.error || 'No fue posible guardar la cuenta.')
        return
      }
      setForm(emptyForm)
      setMessage('Datos bancarios guardados.')
      router.refresh()
    })
  }

  const remove = (account: ChurchBankAccount) => {
    if (!window.confirm(`¿Eliminar “${account.titulo}”?`)) return
    startTransition(async () => {
      const result = await eliminarCuentaBancariaIglesia(account.id)
      setMessage(result.success ? 'Cuenta eliminada.' : result.error || 'No fue posible eliminar la cuenta.')
      if (result.success) {
        if (form.id === account.id) setForm(emptyForm)
        router.refresh()
      }
    })
  }

  return (
    <section className="mt-5 overflow-hidden rounded-[22px] bg-white ring-1 ring-black/[0.05]">
      <header className="border-b border-slate-100 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-violet-50 text-violet-600"><Landmark className="h-4 w-4" /></span>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-violet-600">Administrador</p>
            <h2 className="mt-0.5 text-lg font-extrabold text-[#171923]">Datos bancarios oficiales</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">Configura por separado Ayuda Solidaria y Diezmos/Ofrendas.</p>
          </div>
        </div>
      </header>

      <div className="space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-600">Uso</span>
            <select value={form.purpose} onChange={(event) => setForm((current) => ({ ...current, purpose: event.target.value as ChurchBankAccountPurpose }))} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-violet-400">
              <option value="ayuda_solidaria">Ayuda Solidaria</option>
              <option value="diezmos_ofrendas">Diezmos y ofrendas</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-600">Título</span>
            <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Ej. Cuenta principal" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-violet-400" />
          </label>
          <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-600">Banco</span><input value={form.bank} onChange={(event) => setForm((current) => ({ ...current, bank: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-violet-400" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-600">Titular</span><input value={form.holder} onChange={(event) => setForm((current) => ({ ...current, holder: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-violet-400" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-600">Número de cuenta</span><input value={form.accountNumber} onChange={(event) => setForm((current) => ({ ...current, accountNumber: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-violet-400" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-600">Tipo de cuenta <span className="font-medium text-slate-400">(opcional)</span></span><input value={form.accountType} onChange={(event) => setForm((current) => ({ ...current, accountType: event.target.value }))} placeholder="Ahorro / corriente" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-violet-400" /></label>
          <label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-600">Instrucciones <span className="font-medium text-slate-400">(opcional)</span></span><textarea value={form.instructions} onChange={(event) => setForm((current) => ({ ...current, instructions: event.target.value }))} rows={3} maxLength={1000} className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-violet-400" /></label>
        </div>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} className="h-4 w-4 accent-[#5b3df5]" />Mostrar esta cuenta a los usuarios</label>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={pending} onClick={save} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#5b3df5] px-4 text-xs font-extrabold text-white disabled:opacity-50">{form.id ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{form.id ? 'Guardar cambios' : 'Agregar cuenta'}</button>
          {form.id ? <button type="button" onClick={() => setForm(emptyForm)} className="min-h-10 rounded-xl bg-slate-100 px-4 text-xs font-bold text-slate-600">Cancelar</button> : null}
        </div>
        {message ? <p className="text-xs font-semibold text-slate-600">{message}</p> : null}
      </div>

      <div className="border-t border-slate-100">
        {accounts.length === 0 ? <p className="px-4 py-6 text-center text-sm text-slate-400">Todavía no hay cuentas configuradas.</p> : accounts.map((account) => (
          <article key={account.id} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-800">{account.titulo}</p>
              <p className="mt-1 text-xs text-slate-500">{account.proposito === 'ayuda_solidaria' ? 'Ayuda Solidaria' : 'Diezmos y ofrendas'} · {account.banco} · {account.activo ? 'Visible' : 'Oculta'}</p>
              <p className="mt-1 break-all text-xs font-semibold text-slate-600">{account.numero_cuenta}</p>
            </div>
            <button type="button" onClick={() => edit(account)} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600" aria-label="Editar cuenta"><Pencil className="h-4 w-4" /></button>
            <button type="button" disabled={pending} onClick={() => remove(account)} className="grid h-9 w-9 place-items-center rounded-full bg-rose-50 text-rose-600 disabled:opacity-50" aria-label="Eliminar cuenta"><Trash2 className="h-4 w-4" /></button>
          </article>
        ))}
      </div>
    </section>
  )
}
