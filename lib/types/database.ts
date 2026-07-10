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
      profiles: {
        Row: {
          id: string
          nombre_completo: string
          rol: string
          activo: boolean
          created_at: string
        }
        Insert: {
          id: string
          nombre_completo: string
          rol?: string
          activo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nombre_completo?: string
          rol?: string
          activo?: boolean
        }
      }
      ministerios: {
        Row: {
          id: string
          ministerio_padre_id: string | null
          nombre: string
          emoji: string
          color_primario: string
          color_secundario: string
          descripcion: string | null
          orden: number
          activo: boolean
          created_at: string
        }
      }
      ministerio_miembros: {
        Row: {
          id: string
          ministerio_id: string
          profile_id: string
          es_lider: boolean
          created_at: string
        }
      }
      publicaciones: {
        Row: {
          id: string
          ministerio_id: string | null
          autor_id: string
          tipo: 'aviso' | 'banner' | 'evento' | 'mensaje_diario'
          titulo: string
          cuerpo: string | null
          imagen_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          ministerio_id?: string | null
          autor_id: string
          tipo?: 'aviso' | 'banner' | 'evento' | 'mensaje_diario'
          titulo: string
          cuerpo?: string | null
          imagen_url?: string | null
          created_at?: string
        }
      }
      eventos: {
        Row: {
          id: string
          ministerio_id: string | null
          titulo: string
          descripcion: string | null
          ubicacion: string | null
          fecha_inicio: string
          fecha_fin: string
          todo_el_dia: boolean
          creado_por: string
          created_at: string
        }
      }
      solicitudes: {
        Row: {
          id: string
          ministerio_id: string | null
          tipo: 'salon' | 'equipo_sonido' | 'presupuesto' | 'otro'
          titulo: string
          detalle: string | null
          fecha_solicitada: string | null
          estado: 'pendiente' | 'aprobada' | 'rechazada'
          solicitado_por: string
          revisado_por: string | null
          comentario_revision: string | null
          created_at: string
        }
        Insert: {
          id?: string
          ministerio_id?: string | null
          tipo?: 'salon' | 'equipo_sonido' | 'presupuesto' | 'otro'
          titulo: string
          detalle?: string | null
          fecha_solicitada?: string | null
          estado?: 'pendiente' | 'aprobada' | 'rechazada'
          solicitado_por: string
          revisado_por?: string | null
          comentario_revision?: string | null
          created_at?: string
        }
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
