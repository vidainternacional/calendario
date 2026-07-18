-- Ejecutar en Supabase SQL Editor para Bloque 2

CREATE TABLE IF NOT EXISTS public.ministerio_solicitudes_ingreso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ministerio_id uuid REFERENCES public.ministerios(id) ON DELETE CASCADE,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  created_at timestamp with time zone DEFAULT now(),
  resuelto_at timestamp with time zone,
  UNIQUE(profile_id, ministerio_id, estado) -- Para evitar múltiples solicitudes pendientes
);

ALTER TABLE public.ministerio_solicitudes_ingreso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura de solicitudes propias o lideres" ON public.ministerio_solicitudes_ingreso
  FOR SELECT USING (
    profile_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.ministerio_miembros WHERE profile_id = auth.uid() AND ministerio_id = ministerio_solicitudes_ingreso.ministerio_id AND es_lider = true) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (rol IN ('pastor', 'administrador') OR es_pastor_general = true))
  );

CREATE POLICY "Insertar solicitud propia" ON public.ministerio_solicitudes_ingreso
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Actualizar solicitud lideres" ON public.ministerio_solicitudes_ingreso
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.ministerio_miembros WHERE profile_id = auth.uid() AND ministerio_id = ministerio_solicitudes_ingreso.ministerio_id AND es_lider = true) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (rol IN ('pastor', 'administrador') OR es_pastor_general = true))
  );
