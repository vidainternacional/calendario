-- FASE G — separar permisos globales de Pastor y liderazgo ministerial real.
-- Aprobado explícitamente por el usuario el 2026-08-17.
-- Reversión: restaurar las definiciones RLS heredadas documentadas en la auditoría de FASE G.

-- 1. Configuración global: solo Administrador.
DROP POLICY IF EXISTS "Solo administradores pueden modificar settings"
ON public.app_settings;

CREATE POLICY "Solo administradores pueden modificar settings"
ON public.app_settings
FOR ALL
TO public
USING (public.mi_rol() = 'administrador'::public.rol_app)
WITH CHECK (public.mi_rol() = 'administrador'::public.rol_app);

-- 2. Solicitudes de ingreso:
-- solicitante ve la propia; líder ve/gestiona las de su ministerio;
-- Administrador ve/gestiona todas.
DROP POLICY IF EXISTS "Actualizar solicitud lideres"
ON public.ministerio_solicitudes_ingreso;

CREATE POLICY "Actualizar solicitud lideres"
ON public.ministerio_solicitudes_ingreso
FOR UPDATE
TO public
USING (
  public.lidera(ministerio_id)
  OR public.mi_rol() = 'administrador'::public.rol_app
)
WITH CHECK (
  public.lidera(ministerio_id)
  OR public.mi_rol() = 'administrador'::public.rol_app
);

DROP POLICY IF EXISTS "Lectura de solicitudes propias o lideres"
ON public.ministerio_solicitudes_ingreso;

CREATE POLICY "Lectura de solicitudes propias o lideres"
ON public.ministerio_solicitudes_ingreso
FOR SELECT
TO public
USING (
  profile_id = auth.uid()
  OR public.lidera(ministerio_id)
  OR public.mi_rol() = 'administrador'::public.rol_app
);

-- 3. Funciones/capacidades de ministerio:
-- Administrador o líder real del ministerio.
DROP POLICY IF EXISTS capacidades_manage_leaders
ON public.ministerio_capacidades;

CREATE POLICY capacidades_manage_leaders
ON public.ministerio_capacidades
FOR ALL
TO authenticated
USING (
  public.mi_rol() = 'administrador'::public.rol_app
  OR public.lidera(ministerio_id)
)
WITH CHECK (
  public.mi_rol() = 'administrador'::public.rol_app
  OR public.lidera(ministerio_id)
);

-- 4. Capacidades asignadas a integrantes:
-- se conserva el comportamiento propio existente,
-- pero Pastor deja de ser gestor global.
DROP POLICY IF EXISTS miembro_capacidades_delete_self_or_leader
ON public.ministerio_miembro_capacidades;

CREATE POLICY miembro_capacidades_delete_self_or_leader
ON public.ministerio_miembro_capacidades
FOR DELETE TO authenticated
USING (
  profile_id = auth.uid()
  OR public.mi_rol() = 'administrador'::public.rol_app
  OR public.lidera(ministerio_id)
);

DROP POLICY IF EXISTS miembro_capacidades_insert_self_or_leader
ON public.ministerio_miembro_capacidades;

CREATE POLICY miembro_capacidades_insert_self_or_leader
ON public.ministerio_miembro_capacidades
FOR INSERT TO authenticated
WITH CHECK (
  (
    profile_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.ministerio_miembros mm
      WHERE mm.profile_id = auth.uid()
        AND mm.ministerio_id = ministerio_miembro_capacidades.ministerio_id
    )
  )
  OR public.mi_rol() = 'administrador'::public.rol_app
  OR public.lidera(ministerio_id)
);

DROP POLICY IF EXISTS miembro_capacidades_update_self_or_leader
ON public.ministerio_miembro_capacidades;

CREATE POLICY miembro_capacidades_update_self_or_leader
ON public.ministerio_miembro_capacidades
FOR UPDATE TO authenticated
USING (
  profile_id = auth.uid()
  OR public.mi_rol() = 'administrador'::public.rol_app
  OR public.lidera(ministerio_id)
)
WITH CHECK (
  profile_id = auth.uid()
  OR public.mi_rol() = 'administrador'::public.rol_app
  OR public.lidera(ministerio_id)
);

-- Lectura entre compañeros del mismo ministerio se conserva;
-- solo se sustituye el acceso global de Pastor por Administrador.
DROP POLICY IF EXISTS miembro_capacidades_read_same_ministry
ON public.ministerio_miembro_capacidades;

CREATE POLICY miembro_capacidades_read_same_ministry
ON public.ministerio_miembro_capacidades
FOR SELECT TO authenticated
USING (
  profile_id = auth.uid()
  OR public.mi_rol() = 'administrador'::public.rol_app
  OR EXISTS (
    SELECT 1
    FROM public.ministerio_miembros mm
    WHERE mm.profile_id = auth.uid()
      AND mm.ministerio_id = ministerio_miembro_capacidades.ministerio_id
  )
);

-- 5. Programación/asignaciones:
-- servidor ve/modifica su propia respuesta;
-- líder gestiona su ministerio;
-- Administrador conserva su política global existente.
DROP POLICY IF EXISTS lider_gestiona_asignaciones
ON public.evento_asignaciones;

CREATE POLICY lider_gestiona_asignaciones
ON public.evento_asignaciones
FOR ALL TO authenticated
USING (
  ministerio_id IS NOT NULL
  AND public.lidera(ministerio_id)
)
WITH CHECK (
  ministerio_id IS NOT NULL
  AND public.lidera(ministerio_id)
);

DROP POLICY IF EXISTS ver_asignaciones
ON public.evento_asignaciones;

CREATE POLICY ver_asignaciones
ON public.evento_asignaciones
FOR SELECT TO authenticated
USING (
  profile_id = auth.uid()
  OR (
    ministerio_id IS NOT NULL
    AND public.lidera(ministerio_id)
  )
);

-- 6. Solicitudes ministeriales:
-- quitar el privilegio global de Pastor.
DROP POLICY IF EXISTS pastor_resuelve_solicitudes
ON public.solicitudes;

DROP POLICY IF EXISTS ver_propias_solicitudes
ON public.solicitudes;

CREATE POLICY ver_propias_solicitudes
ON public.solicitudes
FOR SELECT TO public
USING (
  solicitado_por = auth.uid()
  OR public.lidera(ministerio_id)
);
