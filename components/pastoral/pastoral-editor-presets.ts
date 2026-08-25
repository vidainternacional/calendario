import type { Alineacion } from '@/components/pastoral/pastoral-canvas-model'

export type PlantillaVisual = {
  id: string
  nombre: string
  categoria: 'Cristianas' | 'Minimalistas' | 'Generales'
  fondo: string
  colorTexto: string
  titulo: { x: number; y: number; w: number; h: number; pt: number; alineacion: Alineacion; fuente: string }
  subtitulo?: { x: number; y: number; w: number; h: number; pt: number; alineacion: Alineacion; fuente: string }
  cuerpo?: { x: number; y: number; w: number; h: number; pt: number; alineacion: Alineacion; fuente: string }
}

export type PaletaPresentacion = {
  id: string
  label: string
  fondo: string
  titulo: string
  texto: string
  acento: string
  fuenteTitulo: string
  fuenteCuerpo: string
}

export const PALETAS_PRESENTACION: PaletaPresentacion[] = [
  { id: 'claro-editorial', label: 'Claro editorial', fondo: '#FFFFFF', titulo: '#0F172A', texto: '#334155', acento: '#C0392B', fuenteTitulo: 'Georgia', fuenteCuerpo: 'Inter' },
  { id: 'marfil-academico', label: 'Marfil', fondo: '#FCF8F0', titulo: '#3B2F2F', texto: '#5B4636', acento: '#B45309', fuenteTitulo: 'Georgia', fuenteCuerpo: 'Inter' },
  { id: 'arena-conferencia', label: 'Arena', fondo: '#F4E8D4', titulo: '#3F2A1F', texto: '#5C4536', acento: '#C2410C', fuenteTitulo: 'Garamond', fuenteCuerpo: 'Inter' },
  { id: 'salvia', label: 'Salvia', fondo: '#EEF3EA', titulo: '#1F3A2D', texto: '#3F5D4A', acento: '#5B7F62', fuenteTitulo: 'Georgia', fuenteCuerpo: 'Inter' },
  { id: 'cielo-suave', label: 'Cielo suave', fondo: '#EDF6FF', titulo: '#15304A', texto: '#365B7A', acento: '#3B82F6', fuenteTitulo: 'Inter', fuenteCuerpo: 'Inter' },
  { id: 'azul-conferencia', label: 'Azul conferencia', fondo: '#EAF0F7', titulo: '#102A43', texto: '#334E68', acento: '#2F6F9F', fuenteTitulo: 'Arial Black', fuenteCuerpo: 'Inter' },
  { id: 'lavanda', label: 'Lavanda', fondo: '#F3F0FA', titulo: '#352C5C', texto: '#5A5180', acento: '#7C6BB1', fuenteTitulo: 'Georgia', fuenteCuerpo: 'Inter' },
  { id: 'rosa-viejo', label: 'Rosa viejo', fondo: '#F8EEEE', titulo: '#5B2733', texto: '#77414B', acento: '#A8556A', fuenteTitulo: 'Garamond', fuenteCuerpo: 'Inter' },
  { id: 'terracota', label: 'Terracota', fondo: '#F9EEE8', titulo: '#5B2B20', texto: '#7A493E', acento: '#C46A4A', fuenteTitulo: 'Georgia', fuenteCuerpo: 'Inter' },
  { id: 'gris-estudio', label: 'Gris estudio', fondo: '#F3F4F6', titulo: '#111827', texto: '#4B5563', acento: '#6B7280', fuenteTitulo: 'Inter', fuenteCuerpo: 'Inter' },
  { id: 'carbon', label: 'Carbón', fondo: '#161A22', titulo: '#F8FAFC', texto: '#CBD5E1', acento: '#E2B714', fuenteTitulo: 'Inter', fuenteCuerpo: 'Inter' },
  { id: 'noche', label: 'Noche', fondo: '#0B1220', titulo: '#FFFFFF', texto: '#CBD5E1', acento: '#60A5FA', fuenteTitulo: 'Georgia', fuenteCuerpo: 'Inter' },
  { id: 'azul-profundo', label: 'Azul profundo', fondo: '#10213A', titulo: '#F8FAFC', texto: '#D9E7F5', acento: '#7DB4E6', fuenteTitulo: 'Inter', fuenteCuerpo: 'Inter' },
  { id: 'petroleo', label: 'Petróleo', fondo: '#0E2F35', titulo: '#F4FAF8', texto: '#CDE5E0', acento: '#5FC0B5', fuenteTitulo: 'Georgia', fuenteCuerpo: 'Inter' },
  { id: 'bosque', label: 'Bosque', fondo: '#173528', titulo: '#F7F6EE', texto: '#D9E6D8', acento: '#A3C585', fuenteTitulo: 'Georgia', fuenteCuerpo: 'Inter' },
  { id: 'oliva', label: 'Oliva', fondo: '#323A22', titulo: '#FFF8E7', texto: '#E7E2C3', acento: '#C6B35E', fuenteTitulo: 'Garamond', fuenteCuerpo: 'Inter' },
  { id: 'esmeralda', label: 'Esmeralda', fondo: '#0B3D32', titulo: '#F7FEFA', texto: '#D3EEE3', acento: '#34D399', fuenteTitulo: 'Inter', fuenteCuerpo: 'Inter' },
  { id: 'vino', label: 'Vino', fondo: '#4A1225', titulo: '#FFF7FA', texto: '#F2D7DF', acento: '#D9779A', fuenteTitulo: 'Georgia', fuenteCuerpo: 'Inter' },
  { id: 'borgona', label: 'Borgoña', fondo: '#5A1F2E', titulo: '#FFF9F6', texto: '#F5DDD4', acento: '#E7A07E', fuenteTitulo: 'Garamond', fuenteCuerpo: 'Inter' },
  { id: 'ciruela', label: 'Ciruela', fondo: '#3A2144', titulo: '#FCF7FF', texto: '#E8DDF0', acento: '#B58BC8', fuenteTitulo: 'Georgia', fuenteCuerpo: 'Inter' },
  { id: 'uva', label: 'Uva', fondo: '#2D2352', titulo: '#FCFAFF', texto: '#DED8F3', acento: '#9688D8', fuenteTitulo: 'Inter', fuenteCuerpo: 'Inter' },
  { id: 'indigo', label: 'Índigo', fondo: '#202B58', titulo: '#F9FAFF', texto: '#D9DEF7', acento: '#8EA1FF', fuenteTitulo: 'Inter', fuenteCuerpo: 'Inter' },
  { id: 'pizarra', label: 'Pizarra', fondo: '#28323F', titulo: '#F8FAFC', texto: '#D7DEE7', acento: '#94A3B8', fuenteTitulo: 'Inter', fuenteCuerpo: 'Inter' },
  { id: 'acero', label: 'Acero', fondo: '#374151', titulo: '#FFFFFF', texto: '#E5E7EB', acento: '#9CA3AF', fuenteTitulo: 'Helvetica', fuenteCuerpo: 'Inter' },
  { id: 'cobre', label: 'Cobre', fondo: '#4B2C20', titulo: '#FFF7ED', texto: '#F0D6C5', acento: '#D28A5F', fuenteTitulo: 'Georgia', fuenteCuerpo: 'Inter' },
  { id: 'cafe', label: 'Café', fondo: '#33251F', titulo: '#FFF8F1', texto: '#E8D7C9', acento: '#C89A74', fuenteTitulo: 'Garamond', fuenteCuerpo: 'Inter' },
  { id: 'coral', label: 'Coral', fondo: '#5B2C32', titulo: '#FFF8F7', texto: '#F5DAD6', acento: '#F28C82', fuenteTitulo: 'Inter', fuenteCuerpo: 'Inter' },
  { id: 'turquesa', label: 'Turquesa', fondo: '#10464A', titulo: '#F6FFFF', texto: '#D5F1F1', acento: '#5EC7C9', fuenteTitulo: 'Inter', fuenteCuerpo: 'Inter' },
  { id: 'luz-calida', label: 'Luz cálida', fondo: '#FFF7E8', titulo: '#4A321D', texto: '#6A4B2F', acento: '#E0A33B', fuenteTitulo: 'Georgia', fuenteCuerpo: 'Inter' },
  { id: 'luz-fria', label: 'Luz fría', fondo: '#F4F8FB', titulo: '#23374D', texto: '#4A6178', acento: '#5B8DB8', fuenteTitulo: 'Inter', fuenteCuerpo: 'Inter' },
]

export const PLANTILLAS_VISUALES: PlantillaVisual[] = [
  { id: 'predicacion-limpia', nombre: 'Predicación limpia', categoria: 'Cristianas', fondo: '#FFFFFF', colorTexto: '#0F172A', titulo: { x: 9, y: 11, w: 82, h: 30, pt: 42, alineacion: 'izquierda', fuente: 'Georgia' }, subtitulo: { x: 9, y: 45, w: 78, h: 17, pt: 23, alineacion: 'izquierda', fuente: 'Inter' }, cuerpo: { x: 9, y: 67, w: 78, h: 22, pt: 18, alineacion: 'izquierda', fuente: 'Inter' } },
  { id: 'versiculo-protagonista', nombre: 'Versículo protagonista', categoria: 'Cristianas', fondo: '#0B1220', colorTexto: '#F8FAFC', titulo: { x: 10, y: 18, w: 80, h: 36, pt: 38, alineacion: 'centro', fuente: 'Georgia' }, subtitulo: { x: 17, y: 62, w: 66, h: 16, pt: 20, alineacion: 'centro', fuente: 'Inter' } },
  { id: 'serie-dominical', nombre: 'Serie dominical', categoria: 'Cristianas', fondo: '#F4E8D4', colorTexto: '#3F2A1F', titulo: { x: 8, y: 14, w: 84, h: 32, pt: 40, alineacion: 'centro', fuente: 'Arial Black' }, subtitulo: { x: 14, y: 51, w: 72, h: 16, pt: 22, alineacion: 'centro', fuente: 'Inter' }, cuerpo: { x: 18, y: 73, w: 64, h: 15, pt: 17, alineacion: 'centro', fuente: 'Inter' } },
  { id: 'oracion-serena', nombre: 'Oración serena', categoria: 'Cristianas', fondo: '#EDF6FF', colorTexto: '#15304A', titulo: { x: 12, y: 17, w: 76, h: 30, pt: 38, alineacion: 'centro', fuente: 'Garamond' }, cuerpo: { x: 15, y: 56, w: 70, h: 28, pt: 19, alineacion: 'centro', fuente: 'Georgia' } },
  { id: 'texto-biblico', nombre: 'Texto bíblico', categoria: 'Cristianas', fondo: '#F7F5EE', colorTexto: '#2E312B', titulo: { x: 12, y: 18, w: 76, h: 22, pt: 24, alineacion: 'centro', fuente: 'Georgia' }, cuerpo: { x: 14, y: 46, w: 72, h: 34, pt: 20, alineacion: 'centro', fuente: 'Georgia' } },
  { id: 'puntos-predica', nombre: 'Puntos de prédica', categoria: 'Cristianas', fondo: '#FFFFFF', colorTexto: '#172033', titulo: { x: 8, y: 10, w: 84, h: 24, pt: 34, alineacion: 'izquierda', fuente: 'Inter' }, cuerpo: { x: 10, y: 42, w: 78, h: 42, pt: 19, alineacion: 'izquierda', fuente: 'Inter' } },
  { id: 'pregunta-central', nombre: 'Pregunta central', categoria: 'Cristianas', fondo: '#173528', colorTexto: '#F7F6EE', titulo: { x: 12, y: 20, w: 76, h: 42, pt: 38, alineacion: 'centro', fuente: 'Georgia' }, subtitulo: { x: 18, y: 69, w: 64, h: 14, pt: 18, alineacion: 'centro', fuente: 'Inter' } },
  { id: 'serie-semanal', nombre: 'Serie semanal', categoria: 'Cristianas', fondo: '#202B58', colorTexto: '#F9FAFF', titulo: { x: 9, y: 15, w: 82, h: 30, pt: 40, alineacion: 'izquierda', fuente: 'Inter' }, subtitulo: { x: 9, y: 51, w: 66, h: 15, pt: 19, alineacion: 'izquierda', fuente: 'Inter' }, cuerpo: { x: 9, y: 72, w: 66, h: 14, pt: 16, alineacion: 'izquierda', fuente: 'Inter' } },
  { id: 'cita-pastoral', nombre: 'Cita pastoral', categoria: 'Cristianas', fondo: '#FCF8F0', colorTexto: '#3B2F2F', titulo: { x: 14, y: 21, w: 72, h: 38, pt: 34, alineacion: 'centro', fuente: 'Garamond' }, subtitulo: { x: 24, y: 68, w: 52, h: 13, pt: 17, alineacion: 'centro', fuente: 'Inter' } },
  { id: 'minimal-claro', nombre: 'Minimal claro', categoria: 'Minimalistas', fondo: '#F8FAFC', colorTexto: '#0F172A', titulo: { x: 8, y: 18, w: 84, h: 32, pt: 42, alineacion: 'izquierda', fuente: 'Helvetica' }, subtitulo: { x: 8, y: 59, w: 70, h: 16, pt: 20, alineacion: 'izquierda', fuente: 'Inter' } },
  { id: 'minimal-oscuro', nombre: 'Minimal oscuro', categoria: 'Minimalistas', fondo: '#161A22', colorTexto: '#F8FAFC', titulo: { x: 10, y: 18, w: 80, h: 34, pt: 40, alineacion: 'centro', fuente: 'Inter' }, cuerpo: { x: 18, y: 60, w: 64, h: 22, pt: 18, alineacion: 'centro', fuente: 'Inter' } },
  { id: 'editorial', nombre: 'Editorial', categoria: 'Minimalistas', fondo: '#F3F4F6', colorTexto: '#111827', titulo: { x: 7, y: 12, w: 86, h: 32, pt: 44, alineacion: 'izquierda', fuente: 'Georgia' }, subtitulo: { x: 7, y: 56, w: 60, h: 14, pt: 18, alineacion: 'izquierda', fuente: 'Inter' } },
  { id: 'minimal-centrado', nombre: 'Minimal centrado', categoria: 'Minimalistas', fondo: '#FFFFFF', colorTexto: '#111827', titulo: { x: 15, y: 28, w: 70, h: 30, pt: 40, alineacion: 'centro', fuente: 'Inter' }, subtitulo: { x: 22, y: 64, w: 56, h: 14, pt: 18, alineacion: 'centro', fuente: 'Inter' } },
  { id: 'minimal-calido', nombre: 'Minimal cálido', categoria: 'Minimalistas', fondo: '#FFF7E8', colorTexto: '#4A321D', titulo: { x: 10, y: 20, w: 80, h: 30, pt: 38, alineacion: 'centro', fuente: 'Georgia' }, cuerpo: { x: 20, y: 58, w: 60, h: 24, pt: 18, alineacion: 'centro', fuente: 'Inter' } },
  { id: 'linea-lateral', nombre: 'Línea lateral', categoria: 'Minimalistas', fondo: '#FFFFFF', colorTexto: '#172033', titulo: { x: 14, y: 18, w: 70, h: 30, pt: 40, alineacion: 'izquierda', fuente: 'Inter' }, cuerpo: { x: 14, y: 59, w: 70, h: 24, pt: 17, alineacion: 'izquierda', fuente: 'Inter' } },
  { id: 'mensaje-central', nombre: 'Mensaje central', categoria: 'Generales', fondo: '#4A1225', colorTexto: '#FFF7FA', titulo: { x: 10, y: 18, w: 80, h: 32, pt: 40, alineacion: 'centro', fuente: 'Trebuchet MS' }, subtitulo: { x: 16, y: 57, w: 68, h: 16, pt: 21, alineacion: 'centro', fuente: 'Inter' } },
  { id: 'anuncio-simple', nombre: 'Anuncio simple', categoria: 'Generales', fondo: '#FFF7E8', colorTexto: '#4A321D', titulo: { x: 9, y: 12, w: 82, h: 30, pt: 38, alineacion: 'izquierda', fuente: 'Arial Black' }, subtitulo: { x: 9, y: 48, w: 74, h: 16, pt: 21, alineacion: 'izquierda', fuente: 'Inter' }, cuerpo: { x: 9, y: 70, w: 74, h: 17, pt: 17, alineacion: 'izquierda', fuente: 'Inter' } },
  { id: 'conferencia', nombre: 'Conferencia', categoria: 'Generales', fondo: '#10213A', colorTexto: '#F8FAFC', titulo: { x: 8, y: 13, w: 84, h: 34, pt: 42, alineacion: 'izquierda', fuente: 'Inter' }, subtitulo: { x: 8, y: 54, w: 70, h: 15, pt: 20, alineacion: 'izquierda', fuente: 'Inter' }, cuerpo: { x: 8, y: 75, w: 70, h: 12, pt: 16, alineacion: 'izquierda', fuente: 'Inter' } },
  { id: 'agenda', nombre: 'Agenda', categoria: 'Generales', fondo: '#F4F8FB', colorTexto: '#23374D', titulo: { x: 8, y: 10, w: 84, h: 25, pt: 34, alineacion: 'izquierda', fuente: 'Inter' }, cuerpo: { x: 10, y: 41, w: 78, h: 46, pt: 18, alineacion: 'izquierda', fuente: 'Inter' } },
  { id: 'anuncio-oscuro', nombre: 'Anuncio oscuro', categoria: 'Generales', fondo: '#28323F', colorTexto: '#F8FAFC', titulo: { x: 10, y: 20, w: 80, h: 34, pt: 42, alineacion: 'centro', fuente: 'Arial Black' }, subtitulo: { x: 17, y: 62, w: 66, h: 16, pt: 20, alineacion: 'centro', fuente: 'Inter' } },
  { id: 'reflexion', nombre: 'Reflexión', categoria: 'Generales', fondo: '#EEF3EA', colorTexto: '#1F3A2D', titulo: { x: 14, y: 18, w: 72, h: 31, pt: 38, alineacion: 'centro', fuente: 'Georgia' }, cuerpo: { x: 17, y: 57, w: 66, h: 28, pt: 18, alineacion: 'centro', fuente: 'Georgia' } },
]
