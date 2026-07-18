-- Ejecutar en Supabase SQL Editor para Preguntas y Feedback

CREATE TABLE IF NOT EXISTS public.preguntas_congregacion (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- Puede ser nulo si es anónima
  es_anonima boolean NOT NULL DEFAULT false,
  texto text NOT NULL,
  respuesta text,
  respondida_por uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'respondida', 'archivada')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.preguntas_congregacion ENABLE ROW LEVEL SECURITY;

-- Políticas
-- Todos los usuarios autenticados pueden insertar
CREATE POLICY "Cualquier usuario autenticado puede enviar preguntas"
  ON public.preguntas_congregacion FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Usuarios normales solo pueden ver sus propias preguntas (si no son anónimas)
CREATE POLICY "Usuarios ven sus propias preguntas no anonimas"
  ON public.preguntas_congregacion FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- Administradores y pastores pueden verlo todo y actualizar
CREATE POLICY "Admins y pastores ven todas las preguntas"
  ON public.preguntas_congregacion FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.rol IN ('administrador', 'pastor') OR profiles.es_pastor_general = true)
    )
  );

CREATE POLICY "Admins y pastores pueden actualizar preguntas"
  ON public.preguntas_congregacion FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.rol IN ('administrador', 'pastor') OR profiles.es_pastor_general = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.rol IN ('administrador', 'pastor') OR profiles.es_pastor_general = true)
    )
  );

-- Trigger para updated_at
CREATE TRIGGER handle_updated_at_preguntas
  BEFORE UPDATE ON public.preguntas_congregacion
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime('updated_at');
