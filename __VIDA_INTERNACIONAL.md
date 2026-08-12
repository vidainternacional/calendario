# VIDA INTERNACIONAL — Documento maestro de fases

Última actualización: 2026-08-12

Fase / prioridad activa: **FASE D — CHECKLIST FINAL DE COBERTURA BÍBLICA**

Este archivo es el control oficial y versionado del proyecto. Antes de trabajar debe leerse este estado y continuar únicamente con la fase o prioridad marcada como activa.

El registro técnico acumulado hasta el 2026-08-03 se conserva íntegro en:

- `docs/VIDA_INTERNACIONAL_HISTORICO_2026-08-03.md`.

La evidencia del piloto operativo iniciado el 2026-08-04 se conserva en:

- `docs/PILOTO_IGLESIA_ACTIVO_2026-08-04.md`;
- `docs/MANUAL_PILOTO_POR_ROLES_2026-08-04.md`;
- `docs/PILOTO_P1_PRODUCCION_Y_CALENDARIO_2026-08-04.md`.

## Reglas de ejecución

1. Trabajar exclusivamente sobre los objetivos de la prioridad activa.
2. No reanudar una fase o prioridad en pausa mientras este documento no lo autorice expresamente.
3. Cada cierre debe incluir evidencia técnica, validación funcional y documentación.
4. Los hallazgos fuera de alcance se documentan para una fase posterior, sin ampliar el bloque activo.
5. No borrar datos, migraciones o estructuras de una fase pausada cuando basta con desactivar su experiencia visible.
6. Los cambios de permisos, roles, liderazgo o datos sensibles requieren una decisión explícita y recuperación definida.
7. Durante el checklist final de cobertura bíblica, **no iterar UX, navegación o presentación salvo que sea indispensable para corregir un fallo de datos comprobado**.
8. Una capa bíblica ausente no debe sustituirse por texto explicando que falta. Si no existe información aprobada, la capa simplemente no se muestra.

## Estado de fases

| Fase | Objetivo principal | Estado |
|---|---|---|
| FASE A | Experiencia profesional mobile first | COMPLETADA |
| FASE B | Optimización de UX, transiciones, carga, errores y retroalimentación | COMPLETADA |
| FASE C | Panel Pastoral, versículos, bosquejos, biblioteca y materiales | **COMPLETADA — 2026-07-29** |
| FASE D | IA Bíblica Avanzada, fuentes, contexto, comparaciones, cronologías y mapas | **ACTIVA — CHECKLIST FINAL DE COBERTURA** |
| FASE E | Rendimiento, seguridad, escalabilidad, pruebas y documentación | PENDIENTE |
| FASE F | Evolución correlativa de Biblia → Notas | PENDIENTE |

# PRIORIDADES RECIENTES CERRADAS

## Programación Ministerial: Alabanza y equipos de servicio

Cerrada el 2026-08-11 tras validación funcional, endurecimiento RLS de reemplazos, protección del historial y producción READY. La migración final está versionada en `supabase/migrations/20260811140500_endurecer_rls_intercambios_programacion.sql`. No reabrir salvo bug comprobable.

## Administración: control y eliminación permanente

Cerrada el 2026-08-09. Administrador conserva eliminación permanente protegida de usuarios/ministerios, Centro de Análisis, fichas administrativas y navegación modular. No reabrir salvo bug comprobable.

## Notificaciones y Badges Reales

Cerrada el 2026-08-11 tras validación funcional en iPhone. Pushes, destinos directos, solicitudes de ingreso, bienvenida ministerial, identidades de Avisos y badges derivados de estado real quedaron operativos. Producción validada en `48efda443e719279fac267e64931b1c5f36e8a07`.

Pendiente transversal diferido: optimizar al final la latencia ocasional de badges/push entre Supabase, cliente, service worker, segundo plano, red e iOS, sin parches aislados por pantalla.

## Identidad Comunitaria y Perfil

Cerrada y validada. `profiles.avatar_url`, almacenamiento de avatar, encuadre, ficha integral de miembro y reutilización de identidad visual permanecen como comportamiento aprobado.

## Pulido de experiencia / Calendario e Inicio

Cerrado y estabilizado. Calendario conserva su base móvil aprobada y no debe degradarse.

# PILOTO OPERATIVO — EN PAUSA

Estado desde 2026-08-07: **PAUSADO POR DECISIÓN DEL USUARIO**.

Se conservan tablas, RLS, Centro de Análisis, datos, reportes, onboarding y Ayuda Solidaria, pero no debe ejecutarse telemetría exclusiva del piloto ni reactivarse P1/P2/P3 mientras esta prioridad siga en pausa.

# FASE D — ACTIVA — CHECKLIST FINAL DE COBERTURA BÍBLICA

El 2026-08-11 el usuario autorizó explícitamente completar toda la información bíblica faltante y auditarla antes de continuar con presentación, navegación o diseño del Centro de Estudio. La auditoría técnica integral terminó el 2026-08-12 y la prioridad pasa a validación funcional mediante checklist del usuario.

## Cobertura final auditada — 2026-08-12

### Canon y contexto

- 66 libros aprobados y habilitados.
- 1,189 capítulos canónicos.
- 0 capítulos sin cobertura contextual aprobada.
- Se conserva contexto histórico, cultural/judío, literario, intención autoral, reflexión teológica y cautelas interpretativas según las unidades editoriales disponibles.

### Texto original y análisis palabra por palabra

Fuente principal: STEPBible Data (`STEPBible-Data@b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39`, CC BY 4.0).

- 31,104 segmentos textuales aprobados sobre 31,103 referencias distintas.
- 22,878 segmentos hebreos.
- 268 segmentos arameos.
- 7,958 segmentos griegos.
- 0 segmentos sin transliteración.
- Daniel 2:4 conserva correctamente dos segmentos dentro de la misma referencia: hebreo + arameo.
- 610,657 componentes/ocurrencias morfológicas.
- 0 ocurrencias huérfanas.
- 0 ocurrencias sin transliteración.
- 8 componentes sin código morfológico; todos son conectores ortográficos maqaf (`־`, `H9014`, `token_kind=connector`) y no deben recibir morfología inventada.
- 0 duplicados funcionales de textos u ocurrencias.

### Léxico y glosas

- 16,946 entradas léxicas aprobadas.
- 0 entradas sin lema.
- 0 entradas sin glosa fuente.
- 5,464 entradas cuentan actualmente con glosa española editorial aprobada, concentradas principalmente en la capa griega/NT.
- El hebreo/arameo conserva glosa fuente trazable, pero **no existe en la fuente aprobada una traducción española universal equivalente**. No se generará una traducción masiva opaca solo para rellenar la interfaz.
- La interfaz debe omitir la glosa española cuando no exista una traducción editorial aprobada.

### Traducción literal de estudio

- Los 7,958 segmentos griegos/NT cuentan con `literal_translation_es` aprobada.
- El AT no recibe una “traducción literal” fabricada a partir de una síntesis contextual o de una traducción bíblica publicada.
- Si en el futuro se incorpora una capa literal española del hebreo/arameo, deberá tener procedencia, metodología y revisión propias.

### Traducciones españolas

- **Reina-Valera 1909 (`spaRV1909`)**: importada y aprobada como traducción española de dominio público.
- 31,084 versículos con texto real visibles.
- 0 textos vacíos visibles.
- Los marcadores de versificación sin contenido permanecen deshabilitados y no se presentan como versículos vacíos.
- **NVI**: slot preparado, sin texto, `restricted/pending`, pendiente de licencia del titular.
- **RVR1960**: slot preparado, sin texto, `restricted/pending`, pendiente de autorización/licencia del titular.
- No importar NVI/RVR1960 completas mientras no exista permiso verificable.

### Variantes textuales

- 9,326 variantes textuales aprobadas y trazadas entre AT/NT según la fuente disponible.
- 0 hashes inválidos detectados en la tabla de variantes.

### Geografía bíblica

- 1,343 lugares visibles/aprobados en total, incluyendo el piloto de Roma y la capa de OpenBible.info.
- 8,742 relaciones lugar↔versículo aprobadas.
- 5,616 versículos distintos con relación geográfica explícita.
- La ausencia de un lugar para un versículo/libro no se sustituye con geografía inventada.
- Se conserva certeza/precisión y alternativas de identificación cuando la fuente las ofrece.

### Cronología

- El piloto visible de Roma conserva 2 eventos aprobados y sirve como prueba funcional.
- 450 eventos narrativos Theographic permanecen **staged/deshabilitados** con 17,570 relaciones evento↔versículo mientras no se localice/audite su presentación final.
- 0 fechas absolutas dudosas de Theographic se exponen como hechos.
- Los eventos staged pueden utilizar orden narrativo y referencias en una etapa posterior, pero no deben activarse con cronologías absolutas no verificadas.

### Integridad, hashes y seguridad

- 0 duplicados funcionales detectados en textos y ocurrencias.
- 0 ocurrencias léxicas huérfanas.
- 0 hashes inválidos en textos, ocurrencias, léxico, variantes, referencias geográficas y referencias cronológicas auditadas.
- RLS activa en las tablas bíblicas principales.
- `anon` no tiene grants directos sobre las tablas bíblicas auditadas.
- Las funciones de importación TAHOT/OpenBible/Theographic auditadas no son ejecutables por `anon` ni `authenticated`.
- Las tablas de concordancia conservan grants SQL amplios heredados para `authenticated`, pero RLS solo define políticas `SELECT`, por lo que no existe una política de escritura efectiva para clientes autenticados. El endurecimiento de grants redundantes se difiere a seguridad/FASE E salvo aprobación explícita para cambiar permisos.

### Motor de Estudio

Producción `main` incluye el paquete validado en `89a8855eaa38ca40fdf341e9fdaae4d407e3ce9d`.

- Se eliminó el uso de síntesis contextual como sustituto de texto original/traducción.
- Las capas textuales ausentes devuelven vacío y no deben renderizar tarjetas de “no disponible”, “próximamente” o equivalentes.
- El resolver textual soporta referencias multilingües reales como Daniel 2:4.
- La búsqueda de código en `main` no encontró frases residuales `no disponible`, `próximamente`, `aparecerá cuando` o `Seleccione un versículo` en las superficies auditadas.
- Preview y producción compilaron correctamente con Next.js 16.2.10 y TypeScript; 34/34 páginas estáticas generadas.
- Vercel no reportó errores de runtime en la comprobación final posterior al despliegue.

## Muestras técnicas ya verificadas

Las siguientes referencias tienen texto original, análisis palabra por palabra, RV1909 y contexto aprobados:

- Génesis 1:1 — Pentateuco — hebreo.
- Josué 1:1 — Históricos — hebreo.
- Salmos 23:1 — Poesía — hebreo.
- Isaías 6:1 — Profeta mayor — hebreo.
- Daniel 2:4 — Profeta mayor/multilingüe — hebreo + arameo.
- Jonás 1:1 — Profeta menor — hebreo.
- Juan 3:16 — Evangelios — griego.
- Hechos 28:16 — Hechos — griego.
- Romanos 1:1 — Cartas — griego.
- Apocalipsis 1:1 — Apocalipsis — griego.

Geografía solo aparece en esas muestras cuando existe una relación real; por ejemplo Daniel 2:4 y Hechos 28:16 sí tienen referencias geográficas, mientras otras muestras no deben mostrar mapa/lugar si la fuente no los relaciona.

# CHECKLIST FINAL ACTIVO — VALIDACIÓN DEL USUARIO

No cerrar FASE D hasta completar este checklist en producción:

1. **Génesis 1:1** — confirmar texto original hebreo, transliteración y análisis palabra por palabra; no debe aparecer una traducción literal española inventada si no existe.
2. **Salmos 23:1** — confirmar hebreo, transliteración, morfología y contexto; no mostrar capas vacías.
3. **Daniel 2:4** — confirmar que aparecen hebreo y arameo como segmentos reales de la misma referencia, sin mezclarlos ni sustituirlos por explicación de ausencia.
4. **Jonás 1:1** — confirmar cobertura de profeta menor y análisis textual real.
5. **Juan 3:16** — confirmar griego, transliteración, palabra por palabra, glosa española disponible y traducción literal de estudio.
6. **Hechos 28:16** — confirmar texto griego y geografía cuando corresponda; el piloto de Roma debe continuar funcionando en Hechos 28 dentro de su rango aprobado.
7. **Romanos 1** / **Romanos 1:1** — confirmar contexto y que Cronología/Mapa de Roma siga disponible según el piloto aprobado.
8. **Apocalipsis 1:1** — confirmar cobertura textual y contextual del extremo final del canon.
9. **Una referencia sin geografía** — confirmar que no aparece una tarjeta diciendo que el mapa “no está disponible”.
10. **Una capa léxica sin glosa española AT** — confirmar que la interfaz muestra únicamente los datos reales (lema/transliteración/morfología/glosa fuente si la superficie la admite) y no fabrica una traducción española.
11. **RV1909** — confirmar que puede leerse como traducción española completa disponible y que no aparecen versículos vacíos de versificación.
12. **NVI/RVR1960** — confirmar que no se presenta su texto completo mientras estén pendientes de licencia.
13. Recorrer Estudio con varias referencias y confirmar que no aparezcan mensajes tipo **“no disponible”**, **“próximamente”** o **“aparecerá cuando exista”** como sustituto de datos.
14. Confirmar que no haya errores visibles, pantallas rotas o pérdida de navegación al cambiar entre referencias durante estas pruebas.

## Fuera de alcance mientras el checklist esté activo

- no seguir refinando acordeones, dashboard o navegación del Estudio;
- no rediseñar Centro Pastoral ni Biblia → Notas;
- no implementar todavía navegación especial entre ministerios, filtros de Avisos, recorrido interactivo, pronunciación/voz, Centro de Historia Bíblica o reorganización de notas; estos requisitos están documentados en `docs/REQUISITOS_DIFERIDOS_UX_2026-08-12.md`;
- no abrir FASE E o FASE F;
- no activar analytics de estudios todavía;
- no importar traducciones con copyright sin licencia.

# Requisito diferido — Centro de Estudio y analíticas

Después de cerrar cobertura y UX final, el Centro de Estudio debe evolucionar el historial existente para registrar de forma útil y respetuosa qué pasajes, libros, temas y preguntas se estudian, recurrencia, búsquedas sin resultado, secciones utilizadas y tiempo aproximado de permanencia. El tiempo no debe contarse cuando la app esté en segundo plano. Las notas personales no forman parte de la telemetría. Las superficies pastorales priorizarán tendencias agregadas, no vigilancia individual.

# Notas bíblicas y futura FASE F

**Biblia → Notas** ya es la base funcional del cuaderno. La FASE F no debe crear otro cuaderno; se redefine como evolución del espacio existente con sincronización entre dispositivos, respaldo en Supabase, número correlativo de prédica, fecha, serie, lugar, predicador, estado y exportación.

# Siguiente punto autorizado

**Ejecutar exclusivamente el checklist final de cobertura bíblica con el usuario.** Corregir únicamente fallos comprobados de datos/recuperación derivados de ese checklist. Solo después de que el usuario valide el checklist se podrá actualizar este documento para reabrir UX/navegación y decidir formalmente el siguiente bloque de FASE D.