-- FASE G — roles globales y liderazgo ministerial
-- Aprobado explícitamente: Administrador es el único gestor global.
-- Pastor conserva su rol pastoral, pero no privilegios administrativos globales.
-- El liderazgo ministerial se mantiene en ministerio_miembros.es_lider y deja de tener límite de 2 ministerios.

DROP TRIGGER IF EXISTS trg_max_liderazgos
ON public.ministerio_miembros;

DROP FUNCTION IF EXISTS public.check_max_liderazgos();

DROP POLICY IF EXISTS pastor_gestiona_perfiles
ON public.profiles;

DROP POLICY IF EXISTS pastor_gestiona_miembros
ON public.ministerio_miembros;

DROP POLICY IF EXISTS pastor_gestiona_ministerios
ON public.ministerios;
