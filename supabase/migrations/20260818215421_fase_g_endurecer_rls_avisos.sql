DROP POLICY IF EXISTS pastor_actualiza_publicaciones
ON public.publicaciones;

DROP POLICY IF EXISTS autor_gestiona_publicacion
ON public.publicaciones;

DROP POLICY IF EXISTS autor_elimina_publicacion
ON public.publicaciones;


-- Un autor puede editar su propio aviso mientras siga pendiente,
-- pero no puede autoaprobarlo.
CREATE POLICY autor_actualiza_publicacion_pendiente
ON public.publicaciones
FOR UPDATE
TO authenticated
USING (
  autor_id = auth.uid()
  AND estado = 'pendiente'
)
WITH CHECK (
  autor_id = auth.uid()
  AND estado = 'pendiente'
);


-- Solo Administrador o Pastor General pueden pasar
-- una publicación pendiente a aprobada/rechazada.
CREATE POLICY revisor_actualiza_publicacion
ON public.publicaciones
FOR UPDATE
TO authenticated
USING (
  estado = 'pendiente'
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.activo = true
      AND p.estado_cuenta = 'activo'
      AND (
        p.rol = 'administrador'
        OR p.es_pastor_general = true
      )
  )
)
WITH CHECK (
  estado IN ('aprobado', 'rechazado')
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.activo = true
      AND p.estado_cuenta = 'activo'
      AND (
        p.rol = 'administrador'
        OR p.es_pastor_general = true
      )
  )
);


-- Cada autor puede borrar lo suyo.
-- Administrador conserva control global mediante su política existente.
CREATE POLICY autor_elimina_publicacion
ON public.publicaciones
FOR DELETE
TO authenticated
USING (
  autor_id = auth.uid()
  OR public.mi_rol() = 'administrador'
);
