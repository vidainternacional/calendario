-- ============================================================
-- FASE 1 — Gestión correcta de usuarios, roles y aprobaciones
-- Ejecutar COMPLETO en el SQL Editor de Supabase (una sola vez)
-- ============================================================

-- ------------------------------------------------------------
-- 1) ESTADO DE CUENTA en profiles
--    pendiente  → recién registrado, espera aprobación
--    activo     → aprobado, acceso normal
--    suspendido → bloqueado temporalmente por un admin
--    rechazado  → solicitud denegada
-- ------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS estado_cuenta text NOT NULL DEFAULT 'pendiente'
  CHECK (estado_cuenta IN ('pendiente', 'activo', 'suspendido', 'rechazado'));

-- Backfill: todos los usuarios EXISTENTES quedan activos
-- (solo aplica a quienes ya estaban antes de esta migración)
UPDATE public.profiles SET estado_cuenta = 'activo' WHERE estado_cuenta = 'pendiente';

-- ------------------------------------------------------------
-- 2) EMAIL en profiles (copiado desde auth.users)
--    Necesario para que el admin identifique cuentas al aprobar
-- ------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id AND p.email IS NULL;

-- ------------------------------------------------------------
-- 3) SUPERADMIN configurable (el correo sale del código)
-- ------------------------------------------------------------
INSERT INTO public.app_settings (clave, valor)
VALUES ('superadmin_email', '"publiartsv.info@gmail.com"'::jsonb)
ON CONFLICT (clave) DO NOTHING;

CREATE OR REPLACE FUNCTION public.protect_superadmin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_super text;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.id;

  SELECT trim(both '"' from valor::text) INTO v_super
  FROM public.app_settings WHERE clave = 'superadmin_email';

  IF v_super IS NOT NULL AND v_email = v_super AND NEW.rol != 'administrador' THEN
    RAISE EXCEPTION 'protected: La cuenta % está protegida y siempre debe tener rol administrador.', v_email;
  END IF;

  -- El superadmin tampoco puede ser suspendido ni rechazado
  IF v_super IS NOT NULL AND v_email = v_super AND NEW.estado_cuenta != 'activo' THEN
    RAISE EXCEPTION 'protected: La cuenta % está protegida y no puede ser desactivada.', v_email;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_superadmin_role ON public.profiles;
CREATE TRIGGER trg_protect_superadmin_role
  BEFORE UPDATE OF rol, estado_cuenta ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_superadmin_role();

-- ------------------------------------------------------------
-- 4) PERFIL AUTOMÁTICO al crear usuario (adiós usuarios fantasma)
--    Si el insert del perfil fallaba antes, el usuario quedaba
--    autenticado pero sin perfil. Ahora la BD lo garantiza.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre_completo, email, rol, estado_cuenta)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.email,
    'servidor',
    'pendiente'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------
-- 5) GUARDIA ANTI-ESCALADA DE ROLES (a nivel base de datos)
--    Solo un ADMINISTRADOR puede:
--      a) otorgar el rol 'administrador'
--      b) quitar el rol a un 'administrador' existente
--    Un pastor NO puede crear admins. Cierre del hueco de seguridad.
--    (auth.uid() NULL = service role / SQL editor → permitido)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_rol text;
BEGIN
  IF NEW.rol IS DISTINCT FROM OLD.rol THEN
    IF auth.uid() IS NOT NULL THEN
      SELECT rol INTO v_caller_rol FROM public.profiles WHERE id = auth.uid();

      IF (NEW.rol = 'administrador' OR OLD.rol = 'administrador')
         AND v_caller_rol IS DISTINCT FROM 'administrador' THEN
        RAISE EXCEPTION 'escalation: Solo un administrador puede otorgar o revocar el rol administrador.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_role_escalation ON public.profiles;
CREATE TRIGGER trg_guard_role_escalation
  BEFORE UPDATE OF rol ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_role_escalation();

-- ------------------------------------------------------------
-- Verificación rápida (opcional, puedes ejecutarla después):
-- SELECT nombre_completo, email, rol, estado_cuenta FROM public.profiles;
-- ============================================================
