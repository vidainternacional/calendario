-- FASE E — seguridad de concordancias bíblicas
-- Aplicada en Supabase el 2026-08-12 como migración
-- fase_e_restringir_escritura_concordancias_authenticated.
--
-- Objetivo:
-- conservar la lectura autenticada aprobada y retirar privilegios de escritura
-- redundantes que no forman parte del contrato funcional de Concordancias.
--
-- Validación previa:
-- - RLS activa en las tres tablas;
-- - políticas existentes únicamente de lectura de contenido aprobado;
-- - authenticated tenía SELECT + INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER.
--
-- Validación posterior:
-- - authenticated conserva únicamente SELECT;
-- - RLS y las políticas de lectura permanecen intactas;
-- - sesión autenticada activa sigue viendo 34 términos, 305 alias y 174 ocurrencias;
-- - no se modificaron filas, service_role ni estructura de tablas.
--
-- Reversión, únicamente si fuera necesaria:
-- GRANT INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
-- ON TABLE public.biblical_concordance_terms,
--          public.biblical_concordance_aliases,
--          public.biblical_concordance_occurrences
-- TO authenticated;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON TABLE public.biblical_concordance_terms,
         public.biblical_concordance_aliases,
         public.biblical_concordance_occurrences
FROM authenticated;

GRANT SELECT
ON TABLE public.biblical_concordance_terms,
         public.biblical_concordance_aliases,
         public.biblical_concordance_occurrences
TO authenticated;
