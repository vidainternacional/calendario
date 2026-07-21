<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Proyecto: Vida Internacional (App de iglesia)

Contexto para asistentes de IA trabajando en este repo:

- **Qué es:** PWA de gestión interna de iglesia (ministerios, eventos, avisos, solicitudes, intercambios de turnos, estudios bíblicos con IA, push).
- **Documento maestro:** `docs/DOCUMENTO-TECNICO.md` — leer SIEMPRE antes de tocar código. Contiene roles, ciclo de vida de cuentas, estructura y el historial de fases.
- **Reglas del proyecto:**
  1. Toda mutación pasa por server actions (`app/actions/`) con verificación de sesión + rol.
  2. `SUPABASE_SERVICE_ROLE_KEY` y `GEMINI_API_KEY` jamás llegan al cliente.
  3. Migraciones SQL nuevas van numeradas en `supabase/migrations/`.
  4. La seguridad se implementa doble: en la action Y en la base de datos (RLS/triggers).
  5. Idioma de la UI y de los comentarios: español.
  6. El usuario dueño del proyecto no es programador profesional: explicar cambios en lenguaje simple.
