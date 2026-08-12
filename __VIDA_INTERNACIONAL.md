# VIDA INTERNACIONAL — Documento maestro de fases

Última actualización: 2026-08-12

Fase / prioridad activa: **FASE D — UX Y NAVEGACIÓN FINAL DEL CENTRO DE ESTUDIO**

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
7. Durante la UX final del Centro de Estudio, preservar íntegramente la cobertura bíblica aprobada y no reabrir importaciones/auditorías salvo bug de datos comprobable.
8. Una capa bíblica ausente no debe sustituirse por texto explicando que falta. Si no existe información aprobada, la capa simplemente no se muestra.
9. El rediseño debe mejorar presentación y navegación sin cambiar la procedencia, significado o nivel de certeza de los datos.

## Estado de fases

| Fase | Objetivo principal | Estado |
|---|---|---|
| FASE A | Experiencia profesional mobile first | COMPLETADA |
| FASE B | Optimización de UX, transiciones, carga, errores y retroalimentación | COMPLETADA |
| FASE C | Panel Pastoral, versículos, bosquejos, biblioteca y materiales | **COMPLETADA — 2026-07-29** |
| FASE D | IA Bíblica Avanzada, fuentes, contexto, comparaciones, cronologías y mapas | **ACTIVA — UX FINAL DEL CENTRO DE ESTUDIO** |
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

# FASE D — COBERTURA BÍBLICA — COMPLETADA Y APROBADA

El 2026-08-11 el usuario autorizó explícitamente completar toda la información bíblica faltante y auditarla antes de continuar con presentación, navegación o diseño del Centro de Estudio. La auditoría técnica integral terminó el 2026-08-12 y el checklist funcional fue aprobado expresamente por el usuario el 2026-08-12.

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

Producción `main` incluye la corrección validada para omitir capas ausentes y soportar evidencia multilingüe, además de RV1909 para versículos y capítulos.

- Se eliminó el uso de síntesis contextual como sustituto de texto original/traducción.
- Las capas textuales ausentes devuelven vacío y no deben renderizar tarjetas de “no disponible”, “próximamente” o equivalentes.
- El resolver textual soporta referencias multilingües reales como Daniel 2:4.
- RV1909 se muestra como traducción bíblica española separada de la secuencia literal de estudio.
- Preview y producción compilaron correctamente con Next.js 16.2.10 y TypeScript; 34/34 páginas estáticas generadas.
- Vercel no reportó errores de runtime en las comprobaciones posteriores al despliegue.

## Muestras técnicas verificadas y aprobadas

Las siguientes referencias tienen texto original, análisis palabra por palabra, RV1909 y contexto aprobados:

- Génesis 1:1 — Pentateuco — hebreo.
- Josué 1:1 — Históricos — hebreo.
- Salmos 23:1 — Poesía — hebreo.
- Isaías 6:1 — Profeta mayor — hebreo.
- Daniel 2:4 — Profeta mayor/multilingüe — hebreo + arameo.
- Jonás 1:1 — Profeta menor — hebreo.
- Juan 3:16 — Evangelios — griego.
- Hechos 28:16 — Hechos — griego.
- Romanos 1:1 / Romanos 1 — Cartas — griego + piloto Roma.
- Apocalipsis 1:1 — Apocalipsis — griego.

Geografía solo aparece cuando existe una relación real; no debe mostrarse una tarjeta de ausencia cuando no exista relación geográfica aprobada.

# CHECKLIST FINAL DE COBERTURA — COMPLETADO Y APROBADO — 2026-08-12

El usuario aprobó expresamente el cierre del checklist en producción. Quedan validados:

1. Texto original hebreo, arameo y griego donde corresponde.
2. Transliteración y análisis palabra por palabra.
3. Daniel 2:4 como referencia multilingüe hebreo + arameo.
4. Cobertura representativa de Pentateuco, históricos, poesía, profetas, Evangelios, Hechos, cartas y Apocalipsis.
5. Glosas/traducción literal solo donde existen capas aprobadas; no se fabrican capas ausentes.
6. RV1909 como traducción española completa disponible para versículos y capítulos.
7. NVI/RVR1960 permanecen sin texto completo mientras estén pendientes de licencia.
8. Cronología/Mapa de Roma sigue operativo en los rangos aprobados.
9. Las referencias sin geografía no muestran placeholders de mapa.
10. No se muestran mensajes tipo “no disponible”, “próximamente” o equivalentes como sustituto de datos.
11. Navegación entre referencias sin errores visibles ni pantallas rotas durante la validación.

# FASE D — BLOQUE ACTIVO — UX Y NAVEGACIÓN FINAL DEL CENTRO DE ESTUDIO

Con la cobertura ya cerrada, se reabre exclusivamente la UX del ecosistema bíblico/Estudio. Este bloque debe consumir los datos ya aprobados sin reabrir auditorías de cobertura.

## Objetivos autorizados

1. Convertir Estudio en una superficie tipo dashboard profesional y móvil, manteniendo identidad VIDA e integración natural con Biblia.
2. Organizar las capas en bloques/acordeones claros: traducción española, texto original, transliteración, palabra por palabra, variantes, contexto, cronología/geografía, intención, cautelas, explicación y reflexión, mostrando únicamente las que tengan datos.
3. Añadir una vista **Ver todo** que reúna el estudio completo de forma ordenada.
4. Para capítulos largos, mantener la traducción española y demás bloques extensos plegables por defecto; para versículos individuales, priorizar acceso inmediato al contenido principal.
5. Mantener explícitamente separadas: **texto original**, **transliteración**, **secuencia literal de estudio** y **traducción bíblica española**.
6. Integrar mapas históricos en la superficie del estudio cuando exista geografía aprobada, conservando certeza, aproximación y debate; no inventar rutas ni precisión.
7. Preparar la futura ayuda de pronunciación/voz para hebreo, arameo y griego como requisito de UX, sin afirmar una pronunciación histórica única cuando exista debate.
8. Preservar compartir, PDF, historial y notas existentes; la reorganización profunda de notas sigue reservada para su bloque documentado/FASE F.
9. No activar todavía analytics de estudios; se mantiene diferido hasta después del cierre de UX final.
10. No mezclar en este bloque navegación de ministerios, filtros de Avisos ni onboarding general; esos requisitos siguen documentados en `docs/REQUISITOS_DIFERIDOS_UX_2026-08-12.md` y deberán abrirse mediante prioridad propia.

# Requisito diferido — Centro de Estudio y analíticas

Después de cerrar cobertura y UX final, el Centro de Estudio debe evolucionar el historial existente para registrar de forma útil y respetuosa qué pasajes, libros, temas y preguntas se estudian, recurrencia, búsquedas sin resultado, secciones utilizadas y tiempo aproximado de permanencia. El tiempo no debe contarse cuando la app esté en segundo plano. Las notas personales no forman parte de la telemetría. Las superficies pastorales priorizarán tendencias agregadas, no vigilancia individual.

# Notas bíblicas y futura FASE F

**Biblia → Notas** ya es la base funcional del cuaderno. La FASE F no debe crear otro cuaderno; se redefine como evolución del espacio existente con sincronización entre dispositivos, respaldo en Supabase, número correlativo de prédica, fecha, serie, lugar, predicador, estado y exportación.

# Siguiente punto autorizado

**Iniciar exclusivamente la UX y navegación final del Centro de Estudio sobre la cobertura bíblica ya aprobada.** Comenzar por la jerarquía visual y los acordeones del estudio, incluyendo traducción española del pasaje, evidencia textual real, contexto y cronología/geografía, sin modificar ni reabrir las fuentes de datos ya cerradas.