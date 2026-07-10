// Tipos generados desde el esquema de Supabase
// Actualizar con: npx supabase gen types typescript --project-id <project-id> > lib/types/database.ts
// o: npx supabase gen types typescript --local > lib/types/database.ts

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
      // TODO: Reemplazar con tipos generados por supabase gen types
      // Ejecutar: npx supabase gen types typescript --project-id atjtjpchslxbseayzflz > lib/types/database.ts
      [key: string]: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
      }
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
