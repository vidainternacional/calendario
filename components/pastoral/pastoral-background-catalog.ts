'use client'

import {
  PALETAS_PRESENTACION,
  PLANTILLAS_VISUALES,
  type PaletaPresentacion,
} from '@/components/pastoral/pastoral-editor-presets'

type FondoBase = {
  id: string
  label: string
  fondo: string
  texto: string
  acento?: string
}

const crear = ({ id, label, fondo, texto, acento }: FondoBase): PaletaPresentacion => ({
  id: `fondo-${id}`,
  label,
  fondo,
  titulo: texto,
  texto,
  acento: acento ?? texto,
  fuenteTitulo: 'Inter',
  fuenteCuerpo: 'Inter',
})

const solidos: FondoBase[] = [
  { id: 'blanco', label: 'Blanco', fondo: '#FFFFFF', texto: '#0F172A' },
  { id: 'marfil', label: 'Marfil', fondo: '#FFFDF7', texto: '#2F2924' },
  { id: 'crema', label: 'Crema', fondo: '#F7EEDB', texto: '#3F352B' },
  { id: 'arena', label: 'Arena', fondo: '#E8D6B8', texto: '#3B2F24' },
  { id: 'rosa', label: 'Rosa suave', fondo: '#FCE7F3', texto: '#831843' },
  { id: 'coral', label: 'Coral', fondo: '#FB7185', texto: '#3F0D19' },
  { id: 'rojo', label: 'Rojo', fondo: '#B91C1C', texto: '#FFFFFF' },
  { id: 'borgona', label: 'Borgoña', fondo: '#581C2B', texto: '#FFF7ED' },
  { id: 'naranja', label: 'Naranja', fondo: '#EA580C', texto: '#FFFFFF' },
  { id: 'ambar', label: 'Ámbar', fondo: '#F59E0B', texto: '#422006' },
  { id: 'amarillo', label: 'Amarillo', fondo: '#FDE047', texto: '#422006' },
  { id: 'salvia', label: 'Salvia', fondo: '#B7C9A8', texto: '#183226' },
  { id: 'verde', label: 'Verde', fondo: '#166534', texto: '#FFFFFF' },
  { id: 'esmeralda', label: 'Esmeralda', fondo: '#047857', texto: '#FFFFFF' },
  { id: 'menta', label: 'Menta', fondo: '#D1FAE5', texto: '#064E3B' },
  { id: 'turquesa', label: 'Turquesa', fondo: '#0F766E', texto: '#FFFFFF' },
  { id: 'cielo', label: 'Cielo', fondo: '#DBEAFE', texto: '#1E3A8A' },
  { id: 'azul', label: 'Azul', fondo: '#1D4ED8', texto: '#FFFFFF' },
  { id: 'marino', label: 'Azul marino', fondo: '#0F2743', texto: '#FFFFFF' },
  { id: 'indigo', label: 'Índigo', fondo: '#3730A3', texto: '#FFFFFF' },
  { id: 'lavanda', label: 'Lavanda', fondo: '#EDE9FE', texto: '#4C1D95' },
  { id: 'violeta', label: 'Violeta', fondo: '#6D28D9', texto: '#FFFFFF' },
  { id: 'ciruela', label: 'Ciruela', fondo: '#4A214D', texto: '#FFFFFF' },
  { id: 'grafito', label: 'Grafito', fondo: '#28313D', texto: '#FFFFFF' },
  { id: 'negro', label: 'Negro', fondo: '#09090B', texto: '#FFFFFF' },
]

const degradados: FondoBase[] = [
  { id: 'amanecer', label: 'Amanecer', fondo: 'linear-gradient(135deg,#FFF6E8 0%,#FFD9C7 48%,#F3D5E8 100%)', texto: '#5A3134' },
  { id: 'ocaso', label: 'Ocaso', fondo: 'linear-gradient(135deg,#7C2D12 0%,#BE123C 48%,#4C1D95 100%)', texto: '#FFFFFF' },
  { id: 'oceano', label: 'Océano', fondo: 'linear-gradient(135deg,#082F49 0%,#0369A1 52%,#06B6D4 100%)', texto: '#FFFFFF' },
  { id: 'aurora', label: 'Aurora', fondo: 'linear-gradient(135deg,#312E81 0%,#7C3AED 52%,#EC4899 100%)', texto: '#FFFFFF' },
  { id: 'bosque', label: 'Bosque', fondo: 'linear-gradient(145deg,#10271E 0%,#1E4936 55%,#3F6212 100%)', texto: '#FFFBEA' },
  { id: 'vino', label: 'Vino', fondo: 'linear-gradient(145deg,#3F101F 0%,#7F1D1D 55%,#9F1239 100%)', texto: '#FFFFFF' },
  { id: 'oro', label: 'Oro suave', fondo: 'linear-gradient(135deg,#FFF8E1 0%,#E7C873 45%,#A16207 100%)', texto: '#3B2A0B' },
  { id: 'hielo', label: 'Hielo', fondo: 'linear-gradient(145deg,#F8FAFC 0%,#E0F2FE 55%,#BAE6FD 100%)', texto: '#0C4A6E' },
  { id: 'rosa-azul', label: 'Rosa y azul', fondo: 'linear-gradient(135deg,#FCE7F3 0%,#DDD6FE 50%,#BFDBFE 100%)', texto: '#312E81' },
  { id: 'tierra', label: 'Tierra', fondo: 'linear-gradient(135deg,#4A2C1B 0%,#92400E 55%,#D97706 100%)', texto: '#FFF7ED' },
  { id: 'jade', label: 'Jade', fondo: 'linear-gradient(135deg,#064E3B 0%,#0F766E 52%,#2DD4BF 100%)', texto: '#FFFFFF' },
  { id: 'medianoche', label: 'Medianoche', fondo: 'linear-gradient(145deg,#020617 0%,#172554 52%,#312E81 100%)', texto: '#FFFFFF' },
  { id: 'perla', label: 'Perla', fondo: 'linear-gradient(145deg,#FFFFFF 0%,#F1F5F9 52%,#E2E8F0 100%)', texto: '#0F172A' },
  { id: 'durazno', label: 'Durazno', fondo: 'linear-gradient(135deg,#FFF7ED 0%,#FED7AA 50%,#FDBA74 100%)', texto: '#7C2D12' },
  { id: 'lila', label: 'Lila', fondo: 'linear-gradient(145deg,#FAF5FF 0%,#E9D5FF 50%,#C4B5FD 100%)', texto: '#4C1D95' },
]

const texturas: FondoBase[] = [
  { id: 'papel', label: 'Papel', fondo: 'repeating-linear-gradient(0deg,rgba(92,69,54,.045) 0 1px,transparent 1px 5px),linear-gradient(#FBF7EE,#F2E7D4)', texto: '#403329' },
  { id: 'lino-claro', label: 'Lino claro', fondo: 'repeating-linear-gradient(0deg,rgba(15,23,42,.025) 0 1px,transparent 1px 4px),repeating-linear-gradient(90deg,rgba(15,23,42,.02) 0 1px,transparent 1px 4px),#F8FAFC', texto: '#0F172A' },
  { id: 'lino-oscuro', label: 'Lino oscuro', fondo: 'repeating-linear-gradient(0deg,rgba(255,255,255,.028) 0 1px,transparent 1px 4px),repeating-linear-gradient(90deg,rgba(255,255,255,.018) 0 1px,transparent 1px 4px),#1F2937', texto: '#FFFFFF' },
  { id: 'rayas-claro', label: 'Rayas claras', fondo: 'repeating-linear-gradient(135deg,#FFFFFF 0 8px,#F1F5F9 8px 16px)', texto: '#0F172A' },
  { id: 'rayas-azul', label: 'Rayas azul', fondo: 'repeating-linear-gradient(135deg,#0F2743 0 10px,#173A63 10px 20px)', texto: '#FFFFFF' },
  { id: 'cuadricula', label: 'Cuadrícula', fondo: 'linear-gradient(rgba(15,23,42,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(15,23,42,.055) 1px,transparent 1px),#F8FAFC', texto: '#0F172A' },
  { id: 'cuadricula-negra', label: 'Cuadrícula noche', fondo: 'linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px),#111827', texto: '#FFFFFF' },
  { id: 'diagonal', label: 'Diagonal', fondo: 'repeating-linear-gradient(45deg,#FEF3C7 0 7px,#FDE68A 7px 14px)', texto: '#78350F' },
  { id: 'carbon', label: 'Carbón', fondo: 'repeating-linear-gradient(135deg,rgba(255,255,255,.025) 0 2px,transparent 2px 7px),linear-gradient(145deg,#20262F,#353D49)', texto: '#FFFFFF' },
  { id: 'rosa-papel', label: 'Papel rosa', fondo: 'repeating-linear-gradient(0deg,rgba(131,24,67,.035) 0 1px,transparent 1px 6px),linear-gradient(#FFF7FA,#FCE7F3)', texto: '#831843' },
  { id: 'salvia-papel', label: 'Papel salvia', fondo: 'repeating-linear-gradient(90deg,rgba(20,83,45,.035) 0 1px,transparent 1px 6px),linear-gradient(#F7FEE7,#E7F2D5)', texto: '#14532D' },
  { id: 'puntos', label: 'Puntos', fondo: 'radial-gradient(circle,rgba(15,23,42,.10) 1.2px,transparent 1.4px),#FFFFFF', texto: '#0F172A' },
]

const efectos: FondoBase[] = [
  { id: 'halo-azul', label: 'Halo azul', fondo: 'radial-gradient(circle at 72% 22%,rgba(96,165,250,.36),transparent 30%),linear-gradient(145deg,#07111F,#172554)', texto: '#FFFFFF' },
  { id: 'halo-oro', label: 'Halo oro', fondo: 'radial-gradient(circle at 50% 20%,rgba(250,204,21,.30),transparent 26%),linear-gradient(145deg,#18140B,#3F2D12)', texto: '#FFFBEA' },
  { id: 'halo-verde', label: 'Halo verde', fondo: 'radial-gradient(circle at 20% 80%,rgba(74,222,128,.30),transparent 30%),linear-gradient(145deg,#052E16,#14532D)', texto: '#FFFFFF' },
  { id: 'halo-violeta', label: 'Halo violeta', fondo: 'radial-gradient(circle at 80% 20%,rgba(216,180,254,.35),transparent 28%),linear-gradient(145deg,#2E1065,#581C87)', texto: '#FFFFFF' },
  { id: 'aurora-fria', label: 'Aurora fría', fondo: 'radial-gradient(circle at 20% 20%,rgba(34,211,238,.35),transparent 25%),radial-gradient(circle at 80% 70%,rgba(129,140,248,.35),transparent 30%),linear-gradient(145deg,#020617,#172554)', texto: '#FFFFFF' },
  { id: 'aurora-calida', label: 'Aurora cálida', fondo: 'radial-gradient(circle at 15% 25%,rgba(251,146,60,.38),transparent 28%),radial-gradient(circle at 80% 75%,rgba(244,63,94,.28),transparent 30%),linear-gradient(145deg,#FFF8F4,#FBE4E7)', texto: '#4A2A2D' },
  { id: 'niebla', label: 'Niebla', fondo: 'radial-gradient(circle at 20% 25%,rgba(255,255,255,.82),transparent 28%),radial-gradient(circle at 80% 70%,rgba(203,213,225,.65),transparent 32%),linear-gradient(135deg,#E2E8F0,#CBD5E1)', texto: '#1E293B' },
  { id: 'profundidad', label: 'Profundidad', fondo: 'radial-gradient(circle at 50% 45%,rgba(255,255,255,.12),transparent 30%),radial-gradient(circle at 50% 50%,transparent 35%,rgba(0,0,0,.45) 100%),#1E293B', texto: '#FFFFFF' },
  { id: 'luz-central', label: 'Luz central', fondo: 'radial-gradient(circle at 50% 45%,#FFFFFF 0%,#E0F2FE 26%,#1E3A8A 100%)', texto: '#0F172A' },
  { id: 'luz-central-oscura', label: 'Luz nocturna', fondo: 'radial-gradient(circle at 50% 42%,#334155 0%,#0F172A 42%,#020617 100%)', texto: '#FFFFFF' },
  { id: 'duotono-rojo', label: 'Duotono rojo', fondo: 'radial-gradient(circle at 80% 20%,rgba(255,255,255,.14),transparent 25%),linear-gradient(120deg,#450A0A,#991B1B 55%,#E11D48)', texto: '#FFFFFF' },
  { id: 'duotono-azul', label: 'Duotono azul', fondo: 'radial-gradient(circle at 18% 78%,rgba(255,255,255,.15),transparent 28%),linear-gradient(120deg,#082F49,#1D4ED8 55%,#6366F1)', texto: '#FFFFFF' },
  { id: 'cristal-claro', label: 'Cristal claro', fondo: 'radial-gradient(circle at 15% 15%,rgba(255,255,255,.95),transparent 22%),radial-gradient(circle at 85% 80%,rgba(165,243,252,.65),transparent 30%),linear-gradient(135deg,#F8FAFC,#DBEAFE)', texto: '#0F172A' },
  { id: 'cristal-rosa', label: 'Cristal rosa', fondo: 'radial-gradient(circle at 18% 18%,rgba(255,255,255,.8),transparent 22%),radial-gradient(circle at 82% 75%,rgba(244,114,182,.35),transparent 30%),linear-gradient(135deg,#FFF1F2,#FCE7F3)', texto: '#831843' },
  { id: 'cristal-noche', label: 'Cristal noche', fondo: 'radial-gradient(circle at 18% 20%,rgba(255,255,255,.12),transparent 20%),radial-gradient(circle at 80% 75%,rgba(56,189,248,.20),transparent 28%),linear-gradient(145deg,#020617,#0F172A)', texto: '#FFFFFF' },
]

export const FONDOS_PASTORALES: PaletaPresentacion[] = [
  ...solidos.map(crear),
  ...degradados.map(crear),
  ...texturas.map(crear),
  ...efectos.map(crear),
]

export function activarCatalogoFondosPastorales() {
  // El editor deja de ofrecer composiciones prefabricadas. Solo quedan fondos.
  PLANTILLAS_VISUALES.splice(0, PLANTILLAS_VISUALES.length)
  PALETAS_PRESENTACION.splice(0, PALETAS_PRESENTACION.length, ...FONDOS_PASTORALES)
}

activarCatalogoFondosPastorales()
