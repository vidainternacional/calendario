-- FASE G — Endurecimiento de Contactos y privacidad real del Buzón anónimo.
-- Cambio aprobado explícitamente por el usuario el 2026-08-18.

-- =========================================================
-- 1. CONTACTOS
-- =========================================================

-- Eliminar grants excesivos, incluidos TRUNCATE/TRIGGER/REFERENCES.
REVOKE ALL PRIVILEGES ON TABLE public.contactos FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.contactos FROM authenticated;

-- Solo lo que realmente usa la aplicación.
GRANT SELECT, DELETE ON TABLE public.contactos TO authenticated;
GRANT INSERT (solicitante_id, destinatario_id)
ON public.contactos TO authenticated;
GRANT UPDATE (estado, resuelto_at)
ON public.contactos TO authenticated;

-- Crear solicitudes únicamente como pendientes.
DROP POLICY IF EXISTS crear_solicitud_contacto
ON public.contactos;

CREATE POLICY crear_solicitud_contacto
ON public.contactos
FOR INSERT
TO authenticated
WITH CHECK (
  solicitante_id = auth.uid()
  AND estado = 'pendiente'
  AND resuelto_at IS NULL
  AND public.cuenta_activa()
);

-- Solo el destinatario puede aceptar/rechazar
-- y únicamente mientras esté pendiente.
DROP POLICY IF EXISTS responder_solicitud_contacto
ON public.contactos;

CREATE POLICY responder_solicitud_contacto
ON public.contactos
FOR UPDATE
TO authenticated
USING (
  destinatario_id = auth.uid()
  AND estado = 'pendiente'
  AND public.cuenta_activa()
)
WITH CHECK (
  destinatario_id = auth.uid()
  AND estado IN ('aceptado', 'rechazado')
  AND public.cuenta_activa()
);

DROP POLICY IF EXISTS eliminar_contacto
ON public.contactos;

CREATE POLICY eliminar_contacto
ON public.contactos
FOR DELETE
TO authenticated
USING (
  public.cuenta_activa()
  AND (
    solicitante_id = auth.uid()
    OR destinatario_id = auth.uid()
  )
);

DROP POLICY IF EXISTS ver_mis_contactos
ON public.contactos;

CREATE POLICY ver_mis_contactos
ON public.contactos
FOR SELECT
TO authenticated
USING (
  solicitante_id = auth.uid()
  OR destinatario_id = auth.uid()
);


-- =========================================================
-- 2. IDENTIDAD PRIVADA DEL BUZÓN ANÓNIMO
-- =========================================================

CREATE TABLE public.preguntas_congregacion_identidad (
  pregunta_id uuid PRIMARY KEY
    REFERENCES public.preguntas_congregacion(id)
    ON DELETE CASCADE,
  profile_id uuid NOT NULL
    REFERENCES public.profiles(id)
    ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.preguntas_congregacion_identidad
ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES
ON TABLE public.preguntas_congregacion_identidad
FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.preguntas_congregacion_identidad
TO service_role;


-- Función que permite que el autor siga viendo su pregunta
-- sin revelar su identidad en la tabla pastoral.
CREATE OR REPLACE FUNCTION public.es_propietario_pregunta_congregacion(
  p_pregunta_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.preguntas_congregacion_identidad i
    WHERE i.pregunta_id = p_pregunta_id
      AND i.profile_id = auth.uid()
  );
$$;

REVOKE ALL
ON FUNCTION public.es_propietario_pregunta_congregacion(uuid)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.es_propietario_pregunta_congregacion(uuid)
TO authenticated;


-- Las preguntas anónimas nuevas trasladan automáticamente
-- la identidad a la tabla privada.
CREATE OR REPLACE FUNCTION public.proteger_identidad_pregunta_anonima()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.es_anonima = true AND NEW.profile_id IS NOT NULL THEN

    INSERT INTO public.preguntas_congregacion_identidad (
      pregunta_id,
      profile_id
    )
    VALUES (
      NEW.id,
      NEW.profile_id
    )
    ON CONFLICT (pregunta_id)
    DO UPDATE SET profile_id = EXCLUDED.profile_id;

    UPDATE public.preguntas_congregacion
    SET profile_id = NULL
    WHERE id = NEW.id
      AND profile_id IS NOT NULL;

  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL
ON FUNCTION public.proteger_identidad_pregunta_anonima()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS
trg_proteger_identidad_pregunta_anonima
ON public.preguntas_congregacion;

CREATE TRIGGER trg_proteger_identidad_pregunta_anonima
AFTER INSERT ON public.preguntas_congregacion
FOR EACH ROW
EXECUTE FUNCTION public.proteger_identidad_pregunta_anonima();


-- Migrar preguntas anónimas ya existentes.
INSERT INTO public.preguntas_congregacion_identidad (
  pregunta_id,
  profile_id
)
SELECT id, profile_id
FROM public.preguntas_congregacion
WHERE es_anonima = true
  AND profile_id IS NOT NULL
ON CONFLICT (pregunta_id)
DO UPDATE SET profile_id = EXCLUDED.profile_id;

UPDATE public.preguntas_congregacion
SET profile_id = NULL
WHERE es_anonima = true
  AND profile_id IS NOT NULL;


-- El autor sigue viendo tanto preguntas normales como anónimas.
DROP POLICY IF EXISTS
"Usuarios ven sus propias preguntas no anonimas"
ON public.preguntas_congregacion;

CREATE POLICY "Usuarios ven sus propias preguntas"
ON public.preguntas_congregacion
FOR SELECT
TO authenticated
USING (
  profile_id = auth.uid()
  OR (
    es_anonima = true
    AND public.es_propietario_pregunta_congregacion(id)
  )
);


-- =========================================================
-- 3. GRANTS MÍNIMOS DEL BUZÓN
-- =========================================================

REVOKE ALL PRIVILEGES
ON TABLE public.preguntas_congregacion
FROM anon;

REVOKE ALL PRIVILEGES
ON TABLE public.preguntas_congregacion
FROM authenticated;

GRANT SELECT
ON TABLE public.preguntas_congregacion
TO authenticated;

GRANT INSERT (
  profile_id,
  es_anonima,
  texto,
  estado
)
ON public.preguntas_congregacion
TO authenticated;

GRANT UPDATE (
  respuesta,
  respondida_por,
  estado
)
ON public.preguntas_congregacion
TO authenticated;


-- Un usuario solo puede crear una pregunta pendiente propia.
DROP POLICY IF EXISTS
"Cualquier usuario autenticado puede enviar preguntas"
ON public.preguntas_congregacion;

CREATE POLICY
"Cualquier usuario autenticado puede enviar preguntas"
ON public.preguntas_congregacion
FOR INSERT
TO authenticated
WITH CHECK (
  profile_id = auth.uid()
  AND public.cuenta_activa()
  AND estado = 'pendiente'
  AND respuesta IS NULL
  AND respondida_por IS NULL
);


-- El gestor solo puede transformar una pendiente
-- en respondida o archivada.
DROP POLICY IF EXISTS
"Admins y pastores pueden actualizar preguntas"
ON public.preguntas_congregacion;

CREATE POLICY
"Admins y pastores pueden actualizar preguntas"
ON public.preguntas_congregacion
FOR UPDATE
TO authenticated
USING (
  estado = 'pendiente'
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        p.rol IN ('administrador', 'pastor')
        OR p.es_pastor_general = true
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        p.rol IN ('administrador', 'pastor')
        OR p.es_pastor_general = true
      )
  )
  AND (
    (
      estado = 'respondida'
      AND respondida_por = auth.uid()
      AND length(trim(coalesce(respuesta, ''))) > 0
    )
    OR
    (
      estado = 'archivada'
      AND respuesta IS NULL
      AND respondida_por IS NULL
    )
  )
);
