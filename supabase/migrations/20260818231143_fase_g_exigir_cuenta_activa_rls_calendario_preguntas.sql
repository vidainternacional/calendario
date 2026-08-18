-- FASE G — endurecimiento localizado de sesiones autenticadas antiguas.
-- Aprobado explícitamente por el usuario el 2026-08-18.
-- No modifica funciones, datos, roles, liderazgos ni membresías.

ALTER POLICY subscriptions_manage_admin
ON public.calendar_subscriptions
USING (
  (mi_rol() = 'administrador'::rol_app)
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.activo = true
      AND p.estado_cuenta = 'activo'
  )
)
WITH CHECK (
  (mi_rol() = 'administrador'::rol_app)
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.activo = true
      AND p.estado_cuenta = 'activo'
  )
);

ALTER POLICY calendars_manage_authorized
ON public.calendars
USING (
  (
    (mi_rol() = 'administrador'::rol_app)
    OR (
      EXISTS (
        SELECT 1
        FROM public.calendar_subscriptions s
        WHERE s.calendar_id = calendars.id
          AND s.user_id = auth.uid()
          AND s.can_edit = true
      )
      AND (ministerio_id IS NULL OR lidera(ministerio_id))
    )
  )
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.activo = true
      AND p.estado_cuenta = 'activo'
  )
)
WITH CHECK (
  (
    (mi_rol() = 'administrador'::rol_app)
    OR (
      EXISTS (
        SELECT 1
        FROM public.calendar_subscriptions s
        WHERE s.calendar_id = calendars.id
          AND s.user_id = auth.uid()
          AND s.can_edit = true
      )
      AND (ministerio_id IS NULL OR lidera(ministerio_id))
    )
  )
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.activo = true
      AND p.estado_cuenta = 'activo'
  )
);

ALTER POLICY reminders_insert_editable
ON public.calendar_reminders
WITH CHECK (
  created_by = auth.uid()
  AND (
    (mi_rol() = 'administrador'::rol_app)
    OR EXISTS (
      SELECT 1
      FROM public.calendar_subscriptions s
      JOIN public.calendars c ON c.id = s.calendar_id
      WHERE s.calendar_id = calendar_reminders.calendar_id
        AND s.user_id = auth.uid()
        AND s.can_edit = true
        AND (c.ministerio_id IS NULL OR lidera(c.ministerio_id))
    )
  )
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.activo = true
      AND p.estado_cuenta = 'activo'
  )
);

ALTER POLICY reminders_update_editable
ON public.calendar_reminders
USING (
  (
    (mi_rol() = 'administrador'::rol_app)
    OR EXISTS (
      SELECT 1
      FROM public.calendar_subscriptions s
      JOIN public.calendars c ON c.id = s.calendar_id
      WHERE s.calendar_id = calendar_reminders.calendar_id
        AND s.user_id = auth.uid()
        AND s.can_edit = true
        AND (c.ministerio_id IS NULL OR lidera(c.ministerio_id))
    )
  )
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.activo = true
      AND p.estado_cuenta = 'activo'
  )
)
WITH CHECK (
  (
    (mi_rol() = 'administrador'::rol_app)
    OR EXISTS (
      SELECT 1
      FROM public.calendar_subscriptions s
      JOIN public.calendars c ON c.id = s.calendar_id
      WHERE s.calendar_id = calendar_reminders.calendar_id
        AND s.user_id = auth.uid()
        AND s.can_edit = true
        AND (c.ministerio_id IS NULL OR lidera(c.ministerio_id))
    )
  )
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.activo = true
      AND p.estado_cuenta = 'activo'
  )
);

ALTER POLICY reminders_delete_editable
ON public.calendar_reminders
USING (
  (
    (mi_rol() = 'administrador'::rol_app)
    OR EXISTS (
      SELECT 1
      FROM public.calendar_subscriptions s
      JOIN public.calendars c ON c.id = s.calendar_id
      WHERE s.calendar_id = calendar_reminders.calendar_id
        AND s.user_id = auth.uid()
        AND s.can_edit = true
        AND (c.ministerio_id IS NULL OR lidera(c.ministerio_id))
    )
  )
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.activo = true
      AND p.estado_cuenta = 'activo'
  )
);

ALTER POLICY evento_calendarios_insert
ON public.evento_calendarios
WITH CHECK (
  (
    (mi_rol() = 'administrador'::rol_app)
    OR EXISTS (
      SELECT 1
      FROM public.calendars c
      JOIN public.calendar_subscriptions s ON s.calendar_id = c.id
      WHERE c.id = evento_calendarios.calendar_id
        AND s.user_id = auth.uid()
        AND s.can_edit = true
        AND (c.ministerio_id IS NULL OR lidera(c.ministerio_id))
    )
  )
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.activo = true
      AND p.estado_cuenta = 'activo'
  )
);

ALTER POLICY evento_calendarios_delete
ON public.evento_calendarios
USING (
  (
    (mi_rol() = 'administrador'::rol_app)
    OR EXISTS (
      SELECT 1
      FROM public.calendars c
      JOIN public.calendar_subscriptions s ON s.calendar_id = c.id
      WHERE c.id = evento_calendarios.calendar_id
        AND s.user_id = auth.uid()
        AND s.can_edit = true
        AND (c.ministerio_id IS NULL OR lidera(c.ministerio_id))
    )
  )
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.activo = true
      AND p.estado_cuenta = 'activo'
  )
);

ALTER POLICY editor_autorizado_gestiona_eventos
ON public.eventos
USING (
  (
    (mi_rol() = 'administrador'::rol_app)
    OR (
      EXISTS (
        SELECT 1
        FROM public.calendar_subscriptions s
        JOIN public.calendars c ON c.id = s.calendar_id
        WHERE s.calendar_id = eventos.calendar_id
          AND s.user_id = auth.uid()
          AND s.can_edit = true
          AND (c.ministerio_id IS NULL OR lidera(c.ministerio_id))
      )
      AND (ministerio_id IS NULL OR lidera(ministerio_id))
    )
  )
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.activo = true
      AND p.estado_cuenta = 'activo'
  )
)
WITH CHECK (
  (
    (mi_rol() = 'administrador'::rol_app)
    OR (
      EXISTS (
        SELECT 1
        FROM public.calendar_subscriptions s
        JOIN public.calendars c ON c.id = s.calendar_id
        WHERE s.calendar_id = eventos.calendar_id
          AND s.user_id = auth.uid()
          AND s.can_edit = true
          AND (c.ministerio_id IS NULL OR lidera(c.ministerio_id))
      )
      AND (ministerio_id IS NULL OR lidera(ministerio_id))
    )
  )
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.activo = true
      AND p.estado_cuenta = 'activo'
  )
);

ALTER POLICY admin_full_eventos
ON public.eventos
USING (
  (mi_rol() = 'administrador'::rol_app)
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.activo = true
      AND p.estado_cuenta = 'activo'
  )
);

ALTER POLICY "Admins y pastores ven todas las preguntas"
ON public.preguntas_congregacion
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND (
        profiles.rol = ANY (ARRAY['administrador'::rol_app, 'pastor'::rol_app])
        OR profiles.es_pastor_general = true
      )
  )
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.activo = true
      AND p.estado_cuenta = 'activo'
  )
);

ALTER POLICY "Admins y pastores pueden actualizar preguntas"
ON public.preguntas_congregacion
USING (
  estado = 'pendiente'::text
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        p.rol = ANY (ARRAY['administrador'::rol_app, 'pastor'::rol_app])
        OR p.es_pastor_general = true
      )
  )
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.activo = true
      AND p.estado_cuenta = 'activo'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        p.rol = ANY (ARRAY['administrador'::rol_app, 'pastor'::rol_app])
        OR p.es_pastor_general = true
      )
  )
  AND (
    (
      estado = 'respondida'::text
      AND respondida_por = auth.uid()
      AND length(trim(coalesce(respuesta, ''::text))) > 0
    )
    OR (
      estado = 'archivada'::text
      AND respuesta IS NULL
      AND respondida_por IS NULL
    )
  )
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.activo = true
      AND p.estado_cuenta = 'activo'
  )
);

-- Rollback: recrear/alterar estas 11 políticas con sus expresiones previas,
-- eliminando únicamente el EXISTS que exige profiles.activo=true y
-- profiles.estado_cuenta='activo'. No hay datos que restaurar.
