-- ============================================================
-- Trigger de protección de cuenta superadmin
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Función que rechaza cualquier intento de cambiar el rol
-- del correo superadmin a algo que no sea 'administrador'
CREATE OR REPLACE FUNCTION public.protect_superadmin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email text;
BEGIN
  -- Obtener el email del usuario que está siendo modificado
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = NEW.id;

  -- Si es el superadmin, forzar que su rol sea siempre 'administrador'
  IF v_email = 'publiartsv.info@gmail.com' AND NEW.rol != 'administrador' THEN
    RAISE EXCEPTION 'protected: La cuenta % está protegida y siempre debe tener rol administrador.', v_email;
  END IF;

  RETURN NEW;
END;
$$;

-- Asociar la función como trigger BEFORE UPDATE en profiles
DROP TRIGGER IF EXISTS trg_protect_superadmin_role ON public.profiles;

CREATE TRIGGER trg_protect_superadmin_role
  BEFORE UPDATE OF rol ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_superadmin_role();

-- Verificación: el rol actual del superadmin debería ser administrador
-- SELECT id, rol FROM public.profiles
-- JOIN auth.users ON profiles.id = auth.users.id
-- WHERE auth.users.email = 'publiartsv.info@gmail.com';
