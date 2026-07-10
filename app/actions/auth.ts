'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

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

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Correo o contraseña incorrectos.' }
    }
    return { error: error.message }
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

  // 1. Crear usuario en Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre }, // metadata en auth.users
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Este correo ya está registrado.' }
    }
    return { error: error.message }
  }

  // 2. Crear perfil en la tabla usuarios (usando service role para bypass RLS)
  if (data.user) {
    const adminClient = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileError } = await (adminClient as any)
      .from('profiles')
      .insert({
        id: data.user.id,
        nombre_completo: nombre,
        rol: 'lider', // rol por defecto
      })

    if (profileError) {
      // No bloqueamos el flujo si falla el perfil — se puede crear después
      console.error('Error creando perfil:', profileError.message)
    }
  }

  redirect('/inicio')
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
