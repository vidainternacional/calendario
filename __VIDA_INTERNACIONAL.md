# VIDA INTERNACIONAL — Documento maestro de fases

Última actualización: 2026-08-19

Fase / prioridad activa: **FASE H — CENTRO DE HEBREO BÍBLICO**

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
7. Durante FASE E, preservar íntegramente las funcionalidades y UX aprobadas; optimizar sin degradar comportamientos cerrados.
8. No reabrir cobertura bíblica, Programación Ministerial, Calendario, Notificaciones u otras prioridades cerradas salvo bug comprobable.
9. Los cambios sensibles de seguridad/RLS/grants deben presentarse con alcance y recuperación antes de aplicarse cuando puedan afectar producción.
10. **Principio visual global:** priorizar superficies integradas, jerarquía por espaciado, tipografía, color y separadores; evitar contenedores o tarjetas anidadas tipo “cuadro dentro de cuadro” cuando no exista una necesidad funcional clara. En móvil, conservar la mayor superficie útil posible sin reducir las áreas táctiles a tamaños incómodos.
11. **Navegación móvil global:** la barra principal pertenece al layout de la aplicación y no a cada módulo. La aparición del teclado no debe levantarla ni hacerla flotar sobre el contenido de trabajo; en iOS debe permanecer en el borde inferior del layout y quedar cubierta por el teclado cuando corresponda.
12. **Historial reversible:** cuando una superficie exponga Deshacer/Rehacer, toda acción que modifique contenido o metadatos creados por el usuario debe entrar en el mismo historial reversible; no limitar el historial únicamente al texto visible.
13. **Imágenes:** no generar imágenes para el proyecto salvo petición explícita del usuario; las capturas aportadas se usan únicamente como referencia visual para modificar la app.

## Estado de fases

| Fase | Objetivo principal | Estado |
|---|---|---|
| FASE A | Experiencia profesional mobile first | COMPLETADA |
| FASE B | Optimización de UX, transiciones, carga, errores y retroalimentación | COMPLETADA |
| FASE C | Panel Pastoral, versículos, bosquejos, biblioteca y materiales | **COMPLETADA — 2026-07-29** |
| FASE D | IA Bíblica Avanzada, fuentes, contexto, comparaciones, cronologías y mapas | **COMPLETADA — 2026-08-12** |
| FASE E | Rendimiento, seguridad, escalabilidad, pruebas y documentación | **COMPLETADA — 2026-08-13** |
| FASE F | Evolución correlativa de Biblia → Notas | **COMPLETADA — 2026-08-17** |
| FASE G | Validación integral y cierre de deudas transversales | **COMPLETADA — 2026-08-18** |
| FASE H | Centro de Hebreo Bíblico | **ACTIVA — 2026-08-18** |
| FASE I | Guía interactiva y ayuda contextual por rol | **PLANIFICADA — posterior a FASE H** |

# PRIORIDADES RECIENTES CERRADAS

## Programación Ministerial: Alabanza y equipos de servicio

Cerrada el 2026-08-11 tras validación funcional, endurecimiento RLS de reemplazos, protección del historial y producción READY. La migración final está versionada en `supabase/migrations/20260811140500_endurecer_rls_intercambios_programacion.sql`. No reabrir salvo bug comprobable.

## Administración: control y eliminación permanente

Cerrada el 2026-08-09. Administrador conserva eliminación permanente protegida de usuarios/ministerios, Centro de Análisis, fichas administrativas y navegación modular. No reabrir salvo bug comprobable.

## Notificaciones y Badges Reales

Cerrada el 2026-08-11 tras validación funcional en iPhone. Pushes, destinos directos, solicitudes de ingreso, bienvenida ministerial, identidades de Avisos y badges derivados de estado real quedaron operativos. Producción validada en `48efda443e719279fac267e64931b1c5f36e8a07`.

Pendiente transversal diferido: optimizar al final la latencia ocasional de badges/push entre Supabase, cliente, service worker, segundo plano, red e iOS, sin parches aislados por pantalla. Este pendiente pasa formalmente a FASE G y queda cerrado en su evidencia final.

## Identidad Comunitaria y Perfil

Cerrada y validada. `profiles.avatar_url`, almacenamiento de avatar, encuadre, ficha integral de miembro y reutilización de identidad visual permanecen como comportamiento aprobado.

## Pulido de experiencia / Calendario e Inicio

Cerrado y estabilizado. Calendario conserva su base móvil aprobada y no debe degradarse.

# PILOTO OPERATIVO — EN PAUSA

Estado desde 2026-08-07: **PAUSADO POR DECISIÓN DEL USUARIO**.

Se conservan tablas, RLS, Centro de Análisis, datos, reportes, onboarding y Ayuda Solidaria, pero no debe ejecutarse telemetría exclusiva del piloto ni reactivarse P1/P2/P3 mientras esta prioridad siga en pausa. La futura guía interactiva por rol de FASE I sustituye la necesidad práctica de usar el piloto como mecanismo principal de orientación dentro de la app, sin borrar la evidencia histórica del piloto.

# FASE D — COMPLETADA Y APROBADA — 2026-08-12

FASE D queda formalmente cerrada. Incluye la cobertura bíblica integral auditada y la UX/navegación final del Centro de Estudio aprobadas. No reabrir salvo bug comprobable o una prioridad futura explícitamente documentada.

## Cobertura final auditada

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
- El hebreo/arameo conserva glosa fuente trazable, pero no existe en la fuente aprobada una traducción española universal equivalente.
- La interfaz omite la glosa española cuando no existe una traducción editorial aprobada.

### Traducción literal de estudio

- Los 7,958 segmentos griegos/NT cuentan con `literal_translation_es` aprobada.
- El AT no recibe una traducción literal fabricada a partir de síntesis contextual o traducciones publicadas.

### Traducciones españolas

- Reina-Valera 1909 (`spaRV1909`) importada y aprobada como traducción española de dominio público.
- 31,084 versículos con texto real visibles.
- 0 textos vacíos visibles.
- NVI y RVR1960 permanecen preparados pero sin texto completo mientras no exista licencia/autorización verificable.

### Variantes, geografía y cronología

- 9,326 variantes textuales aprobadas y trazadas.
- 1,343 lugares visibles/aprobados.
- 8,742 relaciones lugar↔versículo aprobadas.
- 5,616 versículos distintos con relación geográfica explícita.
- El piloto visible de Roma conserva 2 eventos aprobados.
- 450 eventos narrativos Theographic permanecen staged/deshabilitados con 17,570 relaciones evento↔versículo mientras no se localice/audite su presentación final.
- No se exponen fechas absolutas dudosas como hechos.

### Integridad y seguridad auditadas en FASE D

- 0 duplicados funcionales detectados en textos y ocurrencias.
- 0 ocurrencias léxicas huérfanas.
- 0 hashes inválidos en las capas auditadas.
- RLS activa en las tablas bíblicas principales.
- `anon` no tiene grants directos sobre las tablas bíblicas auditadas.
- Las funciones de importación TAHOT/OpenBible/Theographic auditadas no son ejecutables por `anon` ni `authenticated`.
- Los grants redundantes heredados de concordancias quedan expresamente diferidos a FASE E para revisión de seguridad, sin asumir que deban modificarse hasta evaluar impacto y reversión.

## UX y navegación final del Centro de Estudio — cierre aprobado

Queda aprobado y preservado:

1. Estudio Profundo como superficie tipo dashboard profesional y móvil integrada con Biblia.
2. Capas organizadas y mostradas únicamente cuando existe información real aprobada.
3. Vista **Ver todo** para reunir el estudio completo de forma ordenada.
4. Tratamiento diferenciado de versículos individuales y capítulos extensos mediante contenido principal y bloques plegables.
5. Separación explícita entre texto original, transliteración, secuencia literal de estudio y traducción bíblica española.
6. Traducción española RV1909 integrada como capa propia.
7. Evidencia textual hebrea, aramea y griega integrada según corresponda.
8. Análisis palabra por palabra y variantes textuales conservados como capas diferenciadas.
9. Contexto histórico/judío, intención, cautelas, explicación y reflexión organizados dentro del mismo estudio.
10. Cronología/geografía y mapas mostrados únicamente cuando existe evidencia aprobada, conservando certeza y precisión editorial.
11. Concordancias relacionadas y búsqueda asistida integradas al flujo del estudio.
12. Navegación directa Biblia → Estudio Profundo conservando la referencia actual.
13. Compartir, exportación PDF/impresión, historial y notas existentes preservados.
14. Las capas inexistentes se omiten completamente; no se utilizan placeholders como sustituto de datos.
15. Las notas personales de Estudio permanecen asociadas al usuario autenticado y a su referencia; su evolución profunda quedó desarrollada en FASE F.

## Decisiones diferidas al cerrar FASE D

### Pronunciación y voz

La ayuda de pronunciación/voz para hebreo, arameo y griego no se integrará como una función aislada dentro de la Biblia principal. El aprendizaje de lectura y pronunciación del hebreo pasa a formar parte del Centro de Hebreo Bíblico planificado para FASE H.

### Centro de Estudio y analíticas

La evolución del historial hacia analíticas de pasajes, libros, temas, preguntas, recurrencia, búsquedas sin resultado, secciones utilizadas y tiempo aproximado de permanencia queda diferida. Las notas personales no formarán parte de la telemetría y las superficies pastorales priorizarán tendencias agregadas, no vigilancia individual.

### Cuaderno personal / FASE F

El cuaderno personal único por usuario, origen/contexto, privacidad por defecto, sincronización entre dispositivos, respaldo en Supabase, predicación correlativa, metadatos y exportación fueron desarrollados y cerrados en FASE F.

# FASE E — COMPLETADA — RENDIMIENTO, SEGURIDAD, ESCALABILIDAD, PRUEBAS Y DOCUMENTACIÓN — 2026-08-13

FASE E se abrió formalmente el 2026-08-12 después del cierre aprobado de FASE D y queda cerrada el 2026-08-13 tras completar auditoría, cambios seguros, validación funcional y documentación.

La evidencia consolidada se conserva en:

- `docs/FASE_E_LINEA_BASE_TECNICA_2026-08-12.md`;
- `docs/FASE_E_CIERRE_TECNICO_2026-08-13.md`.

## Resultado final de FASE E

1. Rendimiento auditado sobre superficies principales, navegación y consultas reales; se optimizó precarga y se eliminaron llamadas duplicadas verificables sin degradar UX.
2. Seguridad de Supabase revisada y endurecida de forma conservadora: grants redundantes, funciones SECURITY DEFINER y RPC internas quedaron restringidas según su uso legítimo, con migraciones versionadas.
3. Escalabilidad revisada con tamaños y `pg_stat_statements`; no se añadieron índices especulativos donde el volumen y latencia actuales no los justifican.
4. Regresiones críticas automatizadas con `node:test` e integradas al CI antes de lint/build.
5. Runtime y recuperación de red revisados; la PWA recupera Avisos al reconectar, enfocar o volver visible sin exigir recarga manual.
6. Latencia transversal de badges/push corregida para que badge y contenido visible compartan señales de refresco y no dependan de la llegada final del push en iOS.
7. Validación funcional real en iPhone completada: tras reconexión/reanudación, badge de Avisos y `Avisos para ti` actualizaron rápido y prácticamente al mismo tiempo.
8. Producción, CI y documentación técnica quedaron alineados. El warning Node `DEP0169` asociado a la dependencia de Web Push queda documentado como deuda no bloqueante, sin error funcional comprobado; su eliminación pasa a FASE G.
9. El Piloto Operativo continúa pausado y no ejecuta telemetría exclusiva mientras el documento maestro no lo reactive.

# FASE F — COMPLETADA — EVOLUCIÓN CORRELATIVA BIBLIA → NOTAS — 2026-08-17

FASE F queda formalmente cerrada y no debe reabrirse salvo bug comprobable.

Resultado consolidado:
- Cuaderno único, privado por usuario y reutilizado desde Biblia, Estudio Profundo y Estudios.
- Editor WYSIWYG móvil con estilos, énfasis, listas, tareas, citas, referencias y salida segura.
- Deshacer/Rehacer global, historial reversible de contenido y metadatos, conversión a predicación y retorno reversible.
- Sincronización offline/online por usuario, tombstones, cola local, recuperación al reanudar y shell React compartido sin cachear datos privados.
- Identidad/origen canónico de notas y filtros Biblia · Estudio Profundo · Cuaderno.
- Predicación con metadatos, correlativo seguro y exportación.
- IA de organización con propuesta antes de aplicar y fallback entre proveedores.
- Validación integral y producción cerradas el 2026-08-17.

# FASE G — COMPLETADA — 2026-08-18

FASE G queda cerrada y no debe reabrirse salvo bug reproducible. Incluyó deudas transversales de seguridad/estabilidad, endurecimiento localizado de cuenta activa en 11 políticas RLS aprobadas, limpieza del warning DEP0169, validación final de Cuaderno/PWA y cierre de los bloques pendientes heredados.

# FASE H — CENTRO DE HEBREO BÍBLICO — ACTIVA

## Objetivo

Construir un sector moderno y progresivo para **leer, pronunciar y comprender hebreo bíblico**, reutilizando el motor bíblico existente y sin mezclarlo con un curso de hebreo moderno conversacional.

## Orden didáctico vigente

1. Alef-Bet.
2. Vocales / niqqud.
3. Palabras — vocabulario/diccionario.
4. Lectura — frases, oraciones y versículos.
5. Reglas — gramática esencial aplicada.
6. Repaso.

## Estado confirmado — 2026-08-19

- **Alef-Bet:** validado visualmente.
- **Vocales / niqqud:** validado visualmente.
- **Palabras:** dirección visual/pedagógica aprobada; catálogo paginado y búsqueda implementados.
- **Lectura:** dirección visual/pedagógica aprobada; frases/oraciones reales y corpus paginado implementados.
- **Reglas:** implementación técnica completada y CI verde; pendiente revisión visual móvil.
- **Repaso:** siguiente gate después de aprobar Reglas.
- **Prueba tu progreso:** arquitectura de 15 preguntas y ficha final definida, pero todavía sin calificación/persistencia real.
- **Audio/pronunciación:** pendiente de fuente confiable aprobada; no usar `speechSynthesis` como sustituto.
- **Materiales:** 11 enlaces externos conservados en estado pendiente de corroboración individual.
- **Biblia en hebreo:** reutiliza el motor existente; debe evolucionar hacia lector completo con ayudas graduables.

## Gate actual

**Validación visual móvil de Aprender → Reglas.**

No avanzar todavía a Repaso, audio, progreso persistente ni evaluación almacenada hasta validar este gate.

## Evidencia técnica del último bloque

- `components/hebreo/GrammarExplorer.tsx`.
- Tarjetas · Lista · Detalle.
- filtros Básicas · Prefijos · Nombres · Frase · Todas.
- primera capa: artículo, conjunción, preposiciones, preposición + artículo, género/número, concordancia sustantivo-adjetivo y cadena constructa.
- no deduce raíces no verificadas.
- CI temporal #2216: **SUCCESS** (regresiones, lint y build).
- El check de Vercel del último head quedó bloqueado por **build rate limit** de la plataforma; no se considera fallo de código.

## Guardias de FASE H

- no crear un segundo motor bíblico;
- no fabricar traducción literal española del AT;
- no presentar historia/pictografía como significado teológico automático;
- no usar audio sintético no aprobado;
- no simular progreso;
- no implementar persistencia nueva/RLS sin alcance, impacto y reversión previamente aprobados;
- no generar imágenes salvo petición explícita del usuario;
- PR #286 permanece DRAFT y sin merge hasta aprobación explícita.

# FASE I — PLANIFICADA

Guía interactiva y ayuda contextual por rol. No iniciar mientras FASE H permanezca activa.
