-- Ejecutar en Supabase SQL Editor
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clave text UNIQUE NOT NULL,
  valor jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Lectura pública de settings" ON public.app_settings
  FOR SELECT USING (true);

CREATE POLICY "Solo administradores pueden modificar settings" ON public.app_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('pastor', 'administrador')
    )
  );

-- Insertar valor por defecto para el ícono
INSERT INTO public.app_settings (clave, valor)
VALUES ('active_icon_variant', '"dorado"'::jsonb)
ON CONFLICT (clave) DO NOTHING;
