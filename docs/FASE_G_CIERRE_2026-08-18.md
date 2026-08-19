# FASE G — CIERRE FORMAL

Fecha de cierre: 2026-08-18  
Rama de trabajo: `agent/fase-g-validacion-integral`  
PR de integración: #285  
Estado: **COMPLETADA Y APROBADA**

## Objetivo cerrado

FASE G validó VIDA Internacional como un solo sistema por rol y por flujo real, cerró bugs transversales reproducibles y dejó documentadas las deudas que no justificaban cambios especulativos.

## Evidencia funcional

1. **Fronteras por rol y liderazgo contextual**
   - Administrador conserva el único acceso global a `/admin`.
   - Pastor y Líder no acceden a Administración general.
   - `ministerio_miembros.es_lider=true` sigue siendo la fuente de verdad del liderazgo contextual.
   - Líder y Pastor con liderazgo contextual ven controles únicamente en los ministerios que realmente lideran.

2. **Programación ministerial**
   - Programación, repertorio, tonalidad, paleta, solicitudes, reemplazos e historial fueron recorridos y aprobados por el usuario.
   - No se fabricaron eventos futuros en producción solo para completar pruebas.
   - La evidencia histórica existente se conservó sin destruir asignaciones o reemplazos previos.

3. **Centro Pastoral y Administración**
   - Centro Pastoral validado en iPhone: Bosquejos, Colecciones, Biblioteca, Materiales, Preguntas/Buzón, Ayuda Solidaria y navegación asociada.
   - Administración validada en modo lectura: Usuarios, Ministerios, Solicitudes, Avisos, Buzón, Análisis, Ayuda Solidaria, Accesos pastorales y Configuración avanzada.
   - No se ejecutaron acciones destructivas durante estos recorridos.

4. **PWA, offline y cambio de cuenta**
   - Se corrigió la pantalla negra de navegación offline mediante caché privada por usuario y fallback controlado.
   - Inicio, Calendario, Avisos, Estudios, Perfil y Ministerios se preparan para lectura/navegación offline cuando han sido cacheados para la cuenta activa.
   - API, Supabase y respuestas remotas no se guardan en el shell público.
   - La caché privada se aísla por UUID y se elimina al cerrar sesión/cambiar de cuenta.
   - Cuaderno conserva su modelo offline-first, sincronización posterior y privacidad por usuario.

5. **Cuaderno — bugs reproducibles encontrados en FASE G**
   - Se eliminó la herencia accidental del tema oscuro/sepia de Biblia sobre Cuaderno.
   - Skeleton de entrada aprobado en tema claro.
   - Botón `Nueva` queda fuera de la pista elástica y permanece fijo.
   - Las notas hacen scroll únicamente horizontal, conservan rebote nativo de iOS y desaparecen bajo una cobertura blanca con transición suave aprobada por el usuario.
   - El pulido final del carrusel fue aprobado explícitamente en iPhone.

6. **Push, Avisos y badges**
   - El usuario validó entrega push real desde la PWA del Preview final mediante `Perfil → Enviar notificación de prueba`.
   - El circuito actual conserva refresco forzado de indicadores pendientes y contador de Avisos al recibir `VIDA_PUSH_RECEIVED`, con coalescencia para evitar llamadas duplicadas.
   - La evidencia real de FASE E para badge/contenido, junto con el circuito actual sin regresión, evita crear avisos artificiales únicamente para repetir una prueba ya aprobada.

## Seguridad y Supabase

Cambios sensibles aplicados durante FASE G únicamente con aprobación explícita:

- `20260818020500_fase_g_separar_admin_liderazgo_ministerial.sql`;
- `20260818024001_fase_g_endurecer_rls_roles_ministeriales.sql`;
- `20260818231143_fase_g_exigir_cuenta_activa_rls_calendario_preguntas.sql`.

Se preservaron las funciones y superficies pastorales legítimas. No se crearon políticas permisivas únicamente para silenciar Security Advisor. Los avisos heredados sin impacto comprobado permanecen documentados para análisis futuro antes de cualquier cambio sensible.

## Deuda Node DEP0169

La deuda `DEP0169` asociada a Web Push quedó cerrada mediante parche reproducible de `web-push 3.6.7` alineado con upstream. CI/build dejaron de presentar el warning sin degradar TTL, urgencia, entrega o recuperación de suscripción.

## Validación técnica previa al cierre documental

- Head funcional aprobado: `c1835f60aca48d872c7530ca62b0320d25ade88f`.
- GitHub Actions `CI temporal` run #2006 / `32204896869`: **success**.
- Regresiones críticas: **success**.
- Lint informativo: **success**.
- Build Next.js: **success**.
- Preview Vercel final: **READY**.
- Runtime del Preview revisado sin errores/fatales en la ventana posterior al deploy.

## Decisiones preservadas

- El Piloto Operativo continúa **PAUSADO**.
- FASES cerradas no se reabren salvo bug comprobable.
- No se avanza una fase sin que `__VIDA_INTERNACIONAL.md` la marque formalmente como activa.
- La mejora de Inicio para recordar el último ministerio visitado por usuario permanece diferida; no altera roles ni liderazgo y no forma parte de FASE H.

## Resultado

**FASE G queda COMPLETADA Y APROBADA — 2026-08-18.**

El siguiente trabajo autorizado es **FASE H — Centro de Hebreo Bíblico**, comenzando por una línea base de fuentes, contrato didáctico y arquitectura de integración antes de implementar nuevas estructuras o datos.
