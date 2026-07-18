-- Ejecutar en Supabase SQL Editor para Bloque 1

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS es_pastor_general boolean DEFAULT false;
