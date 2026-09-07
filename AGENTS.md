<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Proyecto: Vida Internacional (App de iglesia)

Contexto obligatorio para cualquier asistente o agente de IA trabajando en este repo:

- **Qué es:** PWA de gestión interna de iglesia (ministerios, eventos, avisos, solicitudes, intercambios de turnos, estudios bíblicos con IA, push).
- **ÚNICA memoria oficial y fuente de prioridad:** `__VIDA_INTERNACIONAL.md` en `main`. Leer SIEMPRE antes de tocar código. Si otro documento contradice al maestro, manda `__VIDA_INTERNACIONAL.md`.
- `docs/DOCUMENTO-TECNICO.md` puede usarse como referencia técnica histórica, pero NO define prioridad, bloque activo ni autorización para reabrir áreas cerradas.

## Guardrails obligatorios antes de modificar

1. Leer `__VIDA_INTERNACIONAL.md` desde `main`.
2. Leer `.vida/guardrails.json`.
3. Leer `.vida/change-scope.json` y limitar el diff literalmente a ese alcance.
4. Si el pedido cambia, actualizar primero `.vida/change-scope.json`; no ampliar alcance por iniciativa propia.
5. Ejecutar `node scripts/vida-guardrails.mjs` antes de push. CI vuelve a ejecutarlo automáticamente.

## Reglas técnicas existentes

1. Toda mutación pasa por server actions (`app/actions/`) con verificación de sesión + rol.
2. `SUPABASE_SERVICE_ROLE_KEY` y `GEMINI_API_KEY` jamás llegan al cliente.
3. Migraciones SQL nuevas van numeradas en `supabase/migrations/`.
4. La seguridad se implementa doble: en la action Y en la base de datos (RLS/triggers).
5. Idioma de la UI y de los comentarios: español.
6. El usuario dueño del proyecto no es programador profesional: explicar cambios en lenguaje simple.
7. No tocar visual, organización ni lógica ya aprobada si no aparece literalmente en el alcance vigente.
8. Nuevos desplegables inician cerrados; fondos claros usan texto oscuro; evitar cajas anidadas como patrón visual por defecto.
