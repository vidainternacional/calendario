'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type AuthState =
  | { error?: string; success?: string }
  | undefined

// ─── Login ────────────────────────────────────────────────────────────────────

export async function login(
  _state: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Por favor completa todos los campos.' }
  }

  const supabase = await createClient()

  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Correo o contraseña incorrectos.' }
    }
    return { error: error.message }
  }

  // Verificar estado de la cuenta — pendientes/suspendidos van a la sala de espera
  if (authData.user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('estado_cuenta')
      .eq('id', authData.user.id)
      .single()

    if (profile && profile.estado_cuenta !== 'activo') {
      redirect('/pendiente')
    }
  }

  redirect('/inicio')
}

// ─── Signup ───────────────────────────────────────────────────────────────────

export async function signup(
  _state: AuthState,
  formData: FormData
): Promise<AuthState> {
  const nombre = formData.get('nombre') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!nombre || !email || !password || !confirmPassword) {
    return { error: 'Por favor completa todos los campos.' }
  }

  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden.' }
  }

  if (password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.' }
  }

  const supabase = await createClient()

  // Crear usuario en Supabase Auth.
  // El perfil se crea AUTOMÁTICAMENTE vía trigger en la base de datos
  // (handle_new_user) con estado_cuenta = 'pendiente'.
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre }, // metadata que el trigger usa para nombre_completo
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Este correo ya está registrado.' }
    }
    return { error: error.message }
  }

  // Cuenta nueva → sala de espera hasta que un líder/admin la apruebe
  redirect('/pendiente')
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
