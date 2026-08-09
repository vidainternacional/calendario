'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const allowedSex = new Set(['masculino', 'femenino'])
const allowedCivil = new Set(['soltero', 'casado', 'divorciado', 'viudo', 'prefiere_no_indicar'])

function text(fd: FormData, key: string, max = 500) {
  const value = String(fd.get(key) ?? '').trim()
  return value ? value.slice(0, max) : null
}

function dateValue(fd: FormData, key: string) {
  const value = String(fd.get(key) ?? '').trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
}

function nullableBoolean(fd: FormData, key: string) {
  const value = String(fd.get(key) ?? '')
  if (value === 'si') return true
  if (value === 'no') return false
  return null
}

function list(fd: FormData, key: string) {
  return String(fd.get(key) ?? '')
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 30)
}

export async function guardarMiFichaVida(fd: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado.' }

  const sexoRaw = String(fd.get('sexo') ?? '')
  const civilRaw = String(fd.get('estado_civil') ?? '')

  const payload = {
    profile_id: user.id,
    sexo: allowedSex.has(sexoRaw) ? sexoRaw : null,
    estado_civil: allowedCivil.has(civilRaw) ? civilRaw : null,
    municipio: text(fd, 'municipio', 120),
    departamento: text(fd, 'departamento', 120),
    direccion_referencia: text(fd, 'direccion_referencia', 500),
    contacto_emergencia_nombre: text(fd, 'contacto_emergencia_nombre', 160),
    contacto_emergencia_telefono: text(fd, 'contacto_emergencia_telefono', 60),
    contacto_emergencia_relacion: text(fd, 'contacto_emergencia_relacion', 100),
    bautizado: nullableBoolean(fd, 'bautizado'),
    desea_bautizarse: nullableBoolean(fd, 'desea_bautizarse'),
    fecha_bautismo: dateValue(fd, 'fecha_bautismo'),
    fecha_ingreso_vida: dateValue(fd, 'fecha_ingreso_vida'),
    iglesia_anterior: text(fd, 'iglesia_anterior', 180),
    profesion_oficio: text(fd, 'profesion_oficio', 180),
    empresa_emprendimiento: text(fd, 'empresa_emprendimiento', 180),
    descripcion_profesional: text(fd, 'descripcion_profesional', 1200),
    visibilidad_profesional: fd.get('visibilidad_profesional') === 'on',
    disponibilidad_dias: fd.getAll('disponibilidad_dias').map(String).slice(0, 7),
    disponibilidad_horarios: text(fd, 'disponibilidad_horarios', 500),
    habilidades_personales: list(fd, 'habilidades_personales'),
    idiomas: list(fd, 'idiomas'),
    formacion_ministerial: list(fd, 'formacion_ministerial'),
    biografia: text(fd, 'biografia', 1200),
  }

  const { error } = await (supabase as any)
    .from('member_profile_details')
    .upsert(payload, { onConflict: 'profile_id' })

  if (error) return { success: false, error: error.message }

  revalidatePath('/perfil')
  revalidatePath('/admin/usuarios')
  return { success: true }
}
