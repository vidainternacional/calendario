# Vida Internacional — Documento Técnico
**Versión 2.1 · Fases 1–7 completadas — SQL aplicado en Supabase**

App PWA de gestión interna para la iglesia Vida Internacional: ministerios, servidores, eventos, avisos, solicitudes, intercambios de turnos, estudios bíblicos con IA y notificaciones push.

---

## 1. Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, `proxy.ts` como middleware) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS 4 |
| Base de datos | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (email/contraseña) |
| IA | Google Gemini (`gemini-2.0-flash`, free tier) |
| Push | Web Push (VAPID) + Service Worker |
| Deploy | Vercel · Repositorio: GitHub |

## 2. Roles y jerarquía

| Rol | Puede |
|---|---|
| **servidor** | Ver su calendario, avisos, solicitar, intercambiar turnos, estudios |
| **lider** | Lo anterior + gestionar su(s) ministerio(s) (máx. 2), aprobar solicitudes e ingresos, publicar avisos |
| **pastor** | Todo en cualquier ministerio + aprobar cuentas + asignar roles servidor/líder/pastor |
| **administrador** | Acceso total + único que otorga/revoca rol administrador + settings de la app |

**Protecciones a nivel de base de datos (triggers):**
- `protect_superadmin_role` — el superadmin (correo en `app_settings.superadmin_email`) siempre es administrador activo.
- `guard_role_escalation` — nadie que no sea administrador puede otorgar o revocar el rol administrador (cierra escalada pastor→admin).
- `handle_new_user` — todo usuario de auth recibe su perfil automáticamente (sin usuarios fantasma).

## 3. Ciclo de vida de una cuenta (Fase 1)

```
Registro → estado_cuenta = 'pendiente' → /pendiente (sala de espera)
   → Admin/Pastor aprueba  → 'activo'    → acceso completo
   → Admin/Pastor rechaza  → 'rechazado' → sin acceso
Cuenta activa → puede ser 'suspendido' ↔ reactivada por admin/pastor
```

El middleware (`lib/supabase/middleware.ts`) verifica `estado_cuenta` en cada navegación: los no-activos solo ven `/pendiente`.

## 4. Estructura del proyecto

```
app/
  (auth)/login, signup      → públicas
  pendiente/                → sala de espera (autenticado, sin nav)
  (app)/                    → requiere sesión + cuenta activa
    inicio, calendario, avisos, estudios, perfil (bottom nav)
    solicitudes, intercambios, ministerios/[id], preguntas
    admin/                  → solo pastor/administrador
  actions/                  → server actions (toda mutación pasa por aquí)
  api/icon/[filename]/      → redirección de íconos según variante activa
components/                 → UI por dominio (admin, auth, calendario, pwa…)
lib/supabase/               → clientes browser/server/middleware (patrón SSR oficial)
lib/webpush.ts              → envío de notificaciones push
supabase/                   → SQL histórico (bloques) 
supabase/migrations/        → migraciones numeradas desde Fase 1
public/sw.js, manifest.json → PWA
docs/                       → este documento
```

## 5. Base de datos (tablas principales)

`profiles` (rol, estado_cuenta, email, es_pastor_general) · `ministerios` (jerárquicos, colores) · `ministerio_miembros` (es_lider, máx 2 liderazgos) · `eventos` (ministerio_id NULL = global) · `evento_asignaciones` · `intercambios` (swap directo entre servidores) · `solicitudes` (aprueba líder) · `publicaciones` (con estado de aprobación) · `ministerio_solicitudes_ingreso` · `preguntas_congregacion` · `estudios_profundos_ia` (caché compartido de Gemini) · `notas_estudio` · `push_subscriptions` · `app_settings` (ícono activo, prompt IA, superadmin_email).

Todas con RLS habilitado.

## 6. Variables de entorno (7)

Ver `.env.local.example`. Supabase ×3, `GEMINI_API_KEY`, VAPID ×3, `CRON_SECRET` (debe coincidir con el header configurado en pg_cron). La service role y la llave de Gemini viven SOLO en el servidor.

## 7. Historial de fases

| Fase | Contenido | Estado |
|---|---|---|
| **F0** | App base: módulos, PWA, push, Gemini (construida previamente) | ✅ |
| **F1 — Gestión de usuarios y roles** | Aprobación de cuentas (pendiente/activo/suspendido/rechazado), sala de espera, perfil automático por trigger, email en profiles, superadmin configurable, guardia anti-escalada de roles, buscador + filtros + suspender en admin, `.env.local.example`, este documento | ✅ v1.1 |
| **F1.1 — Concordancia BD** | Limpieza de 15 tablas de la app vieja, candado anti-auto-promoción (protect_profile_columns), pastores pueden aprobar/gestionar, tabla ministerio_solicitudes_ingreso creada, intercambios reparados (políticas de traspaso), líderes gestionan eventos/asignaciones, cuenta_activa() bloquea lecturas de cuentas no activas | ✅ v1.2 |
| **F1.2 — Endurecimiento** | search_path fijado, REVOKE de funciones trigger, preguntas y estudios solo cuentas activas. Linter de Supabase: 0 críticos | ✅ v1.2 |
| **F2 — Salud técnica** | Ruta de íconos con llave anónima + caché 5 min | ✅ v2.0 |
| **F3 — Gemini blindado** | Límite de 10 estudios nuevos/día por usuario (el caché comunitario no cuenta) | ✅ v2.0 |
| **F4 — QR Inteligente** | `/contactos`: pestañas Mi QR (api.qrserver.com) / Escanear (cámara + jsqr) / Contactos. Solicitud → push al destinatario → aceptar/rechazar → push de confirmación. Acceso desde Perfil | ✅ v2.0 |
| **F5 — Biblia** | `/biblia`: +traducciones en español (Free Use Bible API), dropdowns versión/libro/capítulo, audio por voz del navegador (es), botón "Estudiar con IA" que precarga el pasaje en Estudio Profundo. Tarjeta en Estudios | ✅ v2.0 |
| **F6 — Recordatorios** | pg_cron (Supabase) llama cada hora a `/api/cron/recordatorios` (1 día y 1 hora antes, banderas anti-duplicado, hora de El Salvador) y los lunes a `/api/cron/resumen-semanal` ("Tienes X eventos esta semana"). Protegidos con CRON_SECRET | ✅ v2.0 |
| **F7 — Biblia Pro** | Tocar un versículo → escuchar desde ahí o guardar como ⭐ favorito (tabla versiculos_favoritos); panel de favoritos con salto directo al pasaje; la app recuerda dónde quedaste leyendo (posición local); Estudiar con IA usa el versículo seleccionado | ✅ v2.1 |
| F8 — Futuro | Chat entre contactos, fotos con expiración de 2h (Supabase Storage), modo TV lobby, prédicas en video | Ideas |

## 8. Método de trabajo

Cada fase se entrega como **zip con solo los archivos nuevos/modificados** (rutas preservadas) + SQL de migración si aplica + este documento actualizado. El zip se descomprime sobre el repo, se revisa el diff, se sube a GitHub y Vercel despliega. Las migraciones SQL se ejecutan en el SQL Editor de Supabase **antes** de desplegar el código que las usa.
