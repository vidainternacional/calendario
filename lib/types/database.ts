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
          rol: 'servidor' | 'lider' | 'pastor' | 'administrador'
          activo: boolean
          created_at: string
          telefono: string | null
          es_pastor_general: boolean
        }
        Insert: {
          id: string
          nombre_completo: string
          rol?: 'servidor' | 'lider' | 'pastor' | 'administrador'
          activo?: boolean
          created_at?: string
          telefono?: string | null
          es_pastor_general?: boolean
        }
        Update: {
          id?: string
          nombre_completo?: string
          rol?: 'servidor' | 'lider' | 'pastor' | 'administrador'
          activo?: boolean
          telefono?: string | null
          es_pastor_general?: boolean
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
      ministerio_solicitudes_ingreso: {
        Row: {
          id: string
          profile_id: string
          ministerio_id: string
          estado: 'pendiente' | 'aprobada' | 'rechazada'
          created_at: string
          resuelto_at: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          ministerio_id: string
          estado?: 'pendiente' | 'aprobada' | 'rechazada'
          created_at?: string
          resuelto_at?: string | null
        }
        Update: {
          estado?: 'pendiente' | 'aprobada' | 'rechazada'
          resuelto_at?: string | null
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
          estado: 'pendiente' | 'aprobado' | 'rechazado'
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
          estado?: 'pendiente' | 'aprobado' | 'rechazado'
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
      evento_asignaciones: {
        Row: {
          id: string
          evento_id: string
          profile_id: string
          estado: 'asignado' | 'confirmado' | 'declinado'
          created_at: string
        }
        Update: {
          profile_id?: string
          estado?: 'asignado' | 'confirmado' | 'declinado'
        }
      }
      intercambios: {
        Row: {
          id: string
          asignacion_origen_id: string
          asignacion_destino_id: string | null
          solicitante_id: string
          destinatario_id: string | null
          mensaje: string | null
          estado: 'pendiente' | 'aceptado' | 'rechazado' | 'cancelado'
          created_at: string
          resuelto_at: string | null
        }
        Insert: {
          id?: string
          asignacion_origen_id: string
          asignacion_destino_id?: string | null
          solicitante_id: string
          destinatario_id?: string | null
          mensaje?: string | null
          estado?: 'pendiente' | 'aceptado' | 'rechazado' | 'cancelado'
          created_at?: string
          resuelto_at?: string | null
        }
        Update: {
          estado?: 'pendiente' | 'aceptado' | 'rechazado' | 'cancelado'
          resuelto_at?: string | null
        }
      }
      notificaciones_preferencias: {
        Row: {
          id: string
          profile_id: string
          ministerio_id: string
          activo: boolean
        }
      }
      identidad_visual: {
        Row: {
          clave: string
          valor: string
          actualizado_por: string
          updated_at: string
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
