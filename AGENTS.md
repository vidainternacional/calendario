<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Proyecto: Vida Internacional (App de iglesia)

Contexto obligatorio para cualquier asistente o agente de IA trabajando en este repo:

- **Qué es:** PWA de gestión interna de iglesia (ministerios, eventos, avisos, solicitudes, intercambios de turnos, estudios bíblicos con IA, push).
- **Primera lectura de continuidad:** `docs/CONTINUIDAD_VIDA.md`. Contiene el estado operativo, la tarea pendiente y las referencias verificadas para retomar sin reiniciar.
- **Documento maestro de decisiones aprobadas:** `__VIDA_INTERNACIONAL.md` en `main`. Leer SIEMPRE antes de tocar código. La bitácora no sustituye sus reglas ni autoriza cambios sensibles. Si su estado formal es anterior a integraciones verificadas, consultar esas evidencias y las instrucciones actuales del usuario; no reiniciar fases ya integradas ni modificar el maestro sin aprobación expresa.
- `docs/DOCUMENTO-TECNICO.md` puede usarse como referencia técnica histórica, pero NO define prioridad, bloque activo ni autorización para reabrir áreas cerradas.

## Continuidad obligatoria entre conversaciones

1. Al abrir este repositorio, incluso si el usuario solo dice «continuemos», leer primero `docs/CONTINUIDAD_VIDA.md`, después el maestro y los guardrails. No pedir que vuelva a contar todo el proyecto.
2. Revisar `git status` y la rama actual. Actualizar referencias remotas cuando haya conexión y contrastar la bitácora de `origin/main` con la rama activa. No cambiar de rama sobre archivos sin guardar ni integrar trabajo pendiente automáticamente.
3. Leer el checkpoint específico de la tarea indicada y comprobar los PR relevantes antes de intervenir. Si falta acceso, declarar qué no pudo verificarse; no convertir un registro histórico en una comprobación actual.
4. Conservar funciones y diseños aprobados. Probar el cambio y los recorridos afectados; no pedir otra validación completa de todos los módulos sin evidencia de regresión.
5. Antes de cerrar un bloque que cambie el estado real, actualizar `docs/CONTINUIDAD_VIDA.md` con fecha, resultado comprobado, rama/PR, pruebas, pendientes, autorizaciones concretas y siguiente paso. Incluirlo en el alcance del bloque. Si queda sin publicar o solo en una rama, decirlo y dejar un enlace accesible; no afirmar que otra conversación leerá cambios locales automáticamente.
6. No actualizar la bitácora por conversaciones sin cambios relevantes ni crear despliegues o commits repetitivos para registrar que no ocurrió nada. Nunca guardar claves, tokens, contraseñas ni datos personales en ella.
7. La bitácora registra autorizaciones con su alcance; no concede permisos nuevos. No mezclar ramas Draft con correcciones pequeñas. Mantener las restricciones de publicación y de datos indicadas por el usuario.

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
