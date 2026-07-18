-- Ejecutar en Supabase SQL Editor

-- Tabla de caché para estudios generados
CREATE TABLE IF NOT EXISTS public.estudios_profundos_ia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pasaje text NOT NULL,
  pasaje_normalizado text NOT NULL,
  resultado jsonb NOT NULL,
  generado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS en estudios_profundos_ia
ALTER TABLE public.estudios_profundos_ia ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden leer la caché
CREATE POLICY "Lectura pública de estudios_profundos_ia" ON public.estudios_profundos_ia
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Política: Todos los usuarios autenticados pueden insertar en la caché
CREATE POLICY "Insertar en estudios_profundos_ia" ON public.estudios_profundos_ia
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);


-- Tabla para notas personales
CREATE TABLE IF NOT EXISTS public.notas_estudio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  pasaje_normalizado text NOT NULL,
  nota text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(profile_id, pasaje_normalizado)
);

-- Habilitar RLS en notas_estudio
ALTER TABLE public.notas_estudio ENABLE ROW LEVEL SECURITY;

-- Política: Leer solo propias notas
CREATE POLICY "Leer propias notas_estudio" ON public.notas_estudio
  FOR SELECT USING (profile_id = auth.uid());

-- Política: Insertar/Actualizar propias notas
CREATE POLICY "Insertar propias notas_estudio" ON public.notas_estudio
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Actualizar propias notas_estudio" ON public.notas_estudio
  FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Eliminar propias notas_estudio" ON public.notas_estudio
  FOR DELETE USING (profile_id = auth.uid());
