-- Ejecutar en Supabase SQL Editor para Bloque 4

ALTER TABLE public.publicaciones ADD COLUMN IF NOT EXISTS estado text NOT NULL DEFAULT 'aprobado'
  CHECK (estado IN ('pendiente', 'aprobado', 'rechazado'));
