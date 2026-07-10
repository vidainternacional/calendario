// Tipos de base de datos — generados parcialmente
// Para regenerar con el schema real:
//   npx supabase gen types typescript --project-id atjtjpchslxbseayzflz > lib/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          nombre: string
          email: string
          rol: string
          ministerio_id: string | null
          foto_url: string | null
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nombre: string
          email: string
          rol?: string
          ministerio_id?: string | null
          foto_url?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          email?: string
          rol?: string
          ministerio_id?: string | null
          foto_url?: string | null
          activo?: boolean
          updated_at?: string
        }
      }
      // Más tablas se agregarán al generar tipos desde Supabase CLI
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
