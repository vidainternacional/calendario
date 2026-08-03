# VIDA INTERNACIONAL — Documento maestro de fases

Última actualización: 2026-08-02

Fase activa: **FASE D — IA Bíblica Avanzada**

Este archivo es el control oficial y versionado del proyecto. Antes de trabajar debe leerse este estado y continuar únicamente con la fase marcada como activa.

## Reglas de ejecución

1. Trabajar exclusivamente sobre los objetivos de la fase activa.
2. No iniciar una fase posterior mientras la actual no figure como completada aquí.
3. Cada cierre debe incluir evidencia técnica, validación funcional y documentación.
4. Los hallazgos fuera de alcance se documentan para una fase posterior, sin ampliar la fase actual.
5. Los detalles históricos y técnicos permanecen en los documentos de `docs/` y en el historial de Git.

## Estado de fases

| Fase | Objetivo principal | Estado |
|---|---|---|
| FASE A | Experiencia profesional mobile first | COMPLETADA |
| FASE B | Optimización de UX, transiciones, carga, errores y retroalimentación | COMPLETADA |
| FASE C | Panel Pastoral, versículos, bosquejos, biblioteca y materiales | **COMPLETADA — 2026-07-29** |
| FASE D | IA Bíblica Avanzada, nuevas fuentes, contexto histórico, comparaciones, cronologías, mapas y herramientas de estudio | **ACTIVA — BLOQUE 4** |
| FASE E | Optimización General: rendimiento, seguridad, escalabilidad, pruebas y documentación | PENDIENTE |
| FASE F | Cuaderno correlativo de prédicas y notas | PENDIENTE |

## Cierre confirmado de FASE C

La Fase C fue cerrada después de confirmar:

- recorrido funcional completo del Centro Pastoral;
- acceso asignable y revocación inmediata;
- aislamiento de contenido por propietario;
- Biblia general completa dentro del proyecto pastoral;
- experiencia móvil de las herramientas;
- materiales publicados y navegación interna;
- estados de carga, error y vacío;
- integridad de relaciones, archivos y Storage;
- ausencia de errores recientes en producción.

Documentos de cierre:

- `docs/FASE_C_PANEL_PASTORAL.md`
- `docs/FASE_C_AUDITORIA_CIERRE.md`
- `docs/FASE_C_VALIDACION_ACCESO_2026-07-29.md`
- `docs/FASE_C_ALMACENAMIENTO_Y_LIMITES.md`

La auditoría detallada de textos, fuentes, alineaciones y espacios de toda la aplicación queda reservada para la Fase E.

## FASE D — Objetivo activo

Construir herramientas avanzadas de estudio bíblico apoyadas por fuentes verificables y una arquitectura segura, sin deteriorar la Biblia general ni las funciones pastorales terminadas.

### Alcance autorizado

- Diagnóstico del sistema actual de Biblia y Estudio Profundo.
- Inventario y evaluación de fuentes bíblicas e históricas.
- Contexto histórico y cultural con atribución clara.
- Comparaciones bíblicas y herramientas de estudio ampliadas.
- Cronologías y mapas.
- IA bíblica avanzada con controles de privacidad, costo y calidad.

### Fuera de alcance durante esta fase

- Auditoría visual y editorial global de la aplicación.
- Optimización general de rendimiento, seguridad y escalabilidad de la Fase E.
- Cuaderno correlativo de prédicas de la Fase F.
- Cambios amplios en la Biblia estable sin una necesidad demostrada y una validación aislada.

### Bloques

- Bloque 1 — Diagnóstico y arquitectura: **COMPLETADO**.
- Bloque 2 — Fuentes, atribución y privacidad: **COMPLETADO — 2026-07-31**.
- Bloque 3 — Contexto histórico y cultural: **COMPLETADO — 2026-08-01**.
- Bloque 4 — Comparaciones y herramientas ampliadas: **ACTIVO**.
- Bloque 5 — Cronologías y mapas: PENDIENTE.
- Bloque 6 — IA bíblica avanzada y proveedores: PENDIENTE.
- Bloque 7 — Pruebas, documentación y cierre: PENDIENTE.

### Evidencia del Bloque 1

- `docs/FASE_D_DIAGNOSTICO_Y_ARQUITECTURA.md`
- modelo de IA configurable y actualizado;
- esquema y validación de respuesta;
- caché versionado;
- RLS de propiedad corregida;
- preview `dpl_9Mfawd7aiUCvCtjqD2cQR4TRPMZZ` — `READY`.

### Evidencia del Bloque 2

- `docs/FASE_D_REGISTRO_FUENTES.md`;
- tabla `public.biblical_sources` y migración `registro_fuentes_biblicas`;
- matriz de seguridad 4 de 4;
- servicio de lectura exclusivamente en servidor;
- atribución y licencia visibles en Estudio Profundo;
- preview `dpl_BHyb9dnF9UGFvcsq3N9BLRgUmdGq` — `READY`;
- producción `dpl_DN5g5tLwJdhNLbkMngMsjUJJcn5V` — `READY`;
- commit `d33daca536549b912a4f9a9fb246e1060fb0ee77`;
- confirmación visual recibida el 2026-07-31.

### Evidencia del Bloque 3

- `docs/FASE_D_CONTEXTO_HISTORICO.md`;
- tabla `public.biblical_context_fragments` y relación obligatoria con fuentes aprobadas;
- RLS de solo lectura y recuperación exclusiva en servidor;
- fuente Pleiades aprobada con atribución y licencia CC BY 3.0;
- fragmentos iniciales de Roma para Romanos y Hechos 28;
- visualización en `/estudios/profundo` y en **Biblia → Estudio**;
- PR #22 y commit `307388550a9aa8ca1c50f2d75e664dc4906ef074`;
- producción inicial `dpl_s4hkspuCczLhsZPVMHmkPvrLjXnB` — `READY`;
- estado final validado en producción: commit `73f8458e316f1e0d4931456ccad02ef45cabc23e`, deployment `dpl_9iHrXP25gb2MG16DeTRNKiohmE6P` — `READY`;
- confirmación visual y funcional recibida el 2026-08-01.

### Bloque activo

**Bloque 4 — Comparaciones y herramientas ampliadas.**

Ampliar la experiencia de estudio dentro de la Biblia unificada con comparaciones estables y herramientas lingüísticas verificables, sin duplicar secciones ni presentar significados generados sin fuente.

El primer incremento debe:

- inventariar las comparaciones y herramientas ya existentes;
- definir el modelo mínimo para palabras originales, transliteración, significado contextual, referencias y fuente;
- evaluar fuentes léxicas y de concordancia compatibles con las reglas de atribución, licencia y privacidad del Bloque 2;
- mantener las herramientas dentro de **Biblia → Estudio**;
- no conectar todavía estos datos a la IA;
- no importar léxicos completos ni material con licencia incompatible.

### Avance confirmado del Bloque 4 — cobertura contextual completa

El corpus contextual interno ya cubre los 66 libros y los 1,189 capítulos del canon usado por la aplicación.

Validación del 2026-08-02:

- libros aprobados: 66;
- libros con contexto: 66;
- perfiles activos: 66;
- secciones activas: 239;
- unidades contextuales activas: 305;
- capítulos cubiertos: 1,189 de 1,189;
- capítulos sin cobertura: 0;
- hashes inválidos: 0;
- unidades sin declaración de asistencia editorial: 0;
- rangos exactos duplicados: 0;
- secciones activas solapadas: 0.

Integridad adicional:

- índice parcial contra duplicados exactos activos;
- trigger que rechaza nuevas secciones activas solapadas;
- prueba controlada del trigger completada;
- RLS y lectura exclusiva de contenido aprobado para cuentas activas;
- importador restringido al esquema `internal`;
- ninguna llamada a un proveedor de IA durante la recuperación.

Transparencia:

- `vida-contexto-editorial` se identifica como síntesis editorial asistida por IA y pendiente de revisión humana;
- no se presenta como fuente primaria ni como comentario académico especializado;
- STEPBible, Pleiades y otras fuentes externas conservan atribución y licencia separadas.

Documentación principal:

- `docs/FASE_D_COBERTURA_CONTEXTUAL_BIBLIA_COMPLETA.md`;
- documentos parciales del Pentateuco, históricos, poesía y sabiduría, profetas, Evangelios, cartas paulinas y cartas generales.

### Avance confirmado del Bloque 4 — corpus textual del Nuevo Testamento

La extracción completa de los 27 libros del Nuevo Testamento desde TAGNT quedó validada y versionada.

Fuente fijada:

- repositorio `STEPBible/STEPBible-Data`;
- commit `b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39`;
- licencia CC BY 4.0;
- hashes de los archivos Mateo–Juan y Hechos–Apocalipsis verificados.

Conteos validados:

- libros: 27;
- capítulos: 260;
- referencias TAGNT: 7,958;
- palabras de lectura base: 138,096;
- lecturas adicionales: 4,000;
- filas textuales totales: 142,096;
- referencias que utilizan una edición de respaldo porque NA28 no contiene el texto: 16.

Se detectaron diferencias de versificación en 2 Corintios, 3 Juan y Apocalipsis. Estas referencias deberán resolverse mediante perfiles de versificación asociados a la traducción seleccionada en la Biblia general; no se aplicará una conversión global.

Documentación:

- `docs/FASE_D_IMPORTACION_TEXTUAL_NT.md`;
- `docs/FASE_D_IMPORTACION_TEXTUAL_NT_CHECKLIST.md`.

### Avance confirmado del Bloque 4 — Filemón textual completo

Filemón es el primer libro completo importado mediante el proceso automático.

Resultado validado:

- textos de versículo: 25;
- palabras base: 335;
- lecturas adicionales: 14;
- ocurrencias totales: 349;
- variantes documentadas: 18;
- hashes inválidos: 0;
- edición base: NA28 en las 25 referencias.

La importación se realiza mediante `internal.import_stepbible_tagnt_book`, que descarga la fuente oficial, verifica el SHA-256, extrae solamente el libro solicitado, crea las relaciones léxicas y cancela toda la transacción si un conteo no coincide.

Seguridad confirmada:

- `anon` sin acceso;
- usuarios autenticados únicamente con `SELECT` sobre contenido aprobado;
- importador sin permiso de ejecución desde clientes;
- control de lotes en el esquema `internal`;
- RLS activo;
- sin proveedor de IA.

Documentación:

- `docs/FASE_D_IMPORTACION_TEXTUAL_FILEMON.md`.

### Avance confirmado del Bloque 4 — Nuevo Testamento textual visible

Los 27 libros del Nuevo Testamento ya están importados y recuperables mediante el perfil de versificación de la traducción seleccionada.

Resultado acumulado:

- capítulos: 260;
- referencias TAGNT: 7,958;
- palabras base: 138,096;
- lecturas adicionales: 4,000;
- ocurrencias: 142,096;
- variantes documentadas: 6,409;
- hashes inválidos: 0.

La visualización general está integrada en **Biblia → Estudio** y **Estudio Profundo** con texto original, transliteración, glosas, Strong, morfología, variantes, edición base, fuente y licencia. Los ejemplos de Juan 3:16, 3 Juan 1:14 y Apocalipsis 13:1 fueron revisados y aprobados visualmente por el usuario el 2026-08-02.

Evidencia:

- PR #58;
- commit `8286d80495defd21e01c0c27854253bd93d143a2`;
- preview `dpl_4yJHqNwqRfx1nMtPfqevHL1TT5E4` — `READY`;
- `docs/FASE_D_VISUALIZACION_TEXTUAL_NT.md`.

### Avance confirmado del Bloque 4 — fuentes textuales del Antiguo Testamento

Las cuatro fuentes TAHOT fijadas al commit de STEPBible fueron descargadas y validadas antes de diseñar la importación masiva.

Resultado:

- archivos: 4;
- libros esperados y encontrados: 39;
- referencias distintas de la fuente: 23,261;
- filas con referencia explícita: 305,652;
- filas continuadas: 46,517;
- cabeceras repetidas identificadas: 23,257;
- filas de preámbulo: 283;
- tamaño total: 70,208,423 bytes;
- cuatro hashes SHA-256 fijados;
- ninguna modificación de Supabase, interfaz o producción durante esta inspección.

Las referencias son las de la fuente hebrea y no se asumirán como numeración global de las traducciones. Las correspondencias se resolverán según la traducción activa.

Documentación:

- `docs/FASE_D_FUENTES_TEXTUALES_AT.md`;
- `docs/FASE_D_VALIDACION_FUENTES_TAHOT.md`.

### Avance confirmado del Bloque 4 — esquema y contrato TAHOT

La estructura tabulada de los cuatro archivos TAHOT quedó interpretada y validada de forma reproducible.

Resultado:

- 12 columnas activas y 5 columnas reservadas vacías;
- 80 filas tabuladas pertenecientes únicamente al preámbulo;
- 46,517 separadores vacíos posteriores a los datos;
- 0 filas lingüísticas sin referencia explícita;
- 300,811 filas hebreas identificadas por `Grammar=H...`;
- 4,827 filas arameas identificadas por `Grammar=A...`;
- 14 posiciones Qere sin forma visible, conservadas como omisiones con Ketiv variante;
- tratamiento separado para Leningrado, Qere/Ketiv, texto restaurado y adiciones reconstruidas desde la LXX;
- referencias inglesas y hebreas alternativas preservadas por separado;
- contrato reutilizable en `scripts/stepbible/tahot_schema.py`.

Validación:

- PR #60;
- workflow `Validar esquema observado de TAHOT`;
- ejecución `30768672102` — `success`;
- artefacto `stepbible-ot-schema-observation`;
- digest `sha256:1645c2707ea3d2760bfc181235991a8600e802ed94a3a38dc7bbb8a2f4abde53`;
- `docs/FASE_D_ESQUEMA_TAHOT.md`.

No se modificó Supabase, la interfaz ni producción durante esta validación.

### Avance confirmado del Bloque 4 — primer paquete textual completo del Antiguo Testamento

Obadías quedó generado y auditado como primer paquete completo construido desde TAHOT, todavía sin importarlo a Supabase.

Resultado:

- capítulos: 1;
- referencias: 21 de 21;
- filas fuente: 291;
- palabras visibles: 291;
- componentes morfológicos: 434;
- filas hebreas: 291;
- filas arameas: 0;
- filas con variantes: 2;
- lecturas Qere: 1;
- omisiones Qere: 0;
- texto restaurado: 0;
- adiciones reconstruidas desde la LXX: 0;
- desalineaciones entre columnas: 0;
- idiomas desconocidos: 0;
- hashes inválidos: 0.

Variantes verificadas:

- Obadías 1:8 conserva una diferencia ortográfica documentada;
- Obadías 1:11 conserva Qere como lectura principal y Ketiv como variante separada.

Reproducibilidad:

- dos ejecuciones independientes produjeron exactamente 55,413 bytes;
- SHA-256 estable de `oba.json.gz`: `b49dee68303e243c0c2ef4ff3366cbd955a4a8a9b14114eb761a8f174e25940e`;
- manifiestos y bytes comprimidos idénticos;
- 291 hashes de línea y 21 hashes de versículo recalculados sin diferencias.

Validación final:

- PR #61;
- workflow `Validar paquete TAHOT de Obadías`;
- ejecución `30769691488` — `success`;
- commit `e5ae0d8c89982a8e4148118bc2034498e87067c9`;
- artefacto `stepbible-obadiah-package`;
- digest del contenedor de GitHub Actions `sha256:aef89da8f2a9d4e23dfb804a67db387a310a76ba19cf351af517989e5b8d8455`;
- `docs/FASE_D_PAQUETE_TAHOT_OBADIAS.md`;
- `docs/FASE_D_REPRODUCIBILIDAD_OBADIAS.md`.

No se modificó Supabase, la interfaz ni producción durante este incremento. Las glosas inglesas se conservan como dato fuente y todavía no constituyen una traducción literal española aprobada.

### Avance confirmado del Bloque 4 — compatibilidad de Obadías con Supabase

El paquete textual de Obadías quedó auditado contra el modelo real de Supabase sin escribir datos ni cambiar el esquema.

Resultado:

- el modelo es estructuralmente compatible y no necesita DDL;
- entradas léxicas únicas: 184;
- entradas existentes reutilizables: 2;
- entradas nuevas máximas: 182;
- ocurrencias morfológicas: 434;
- raíces: 291;
- prefijos: 103;
- sufijos: 40;
- textos de versículo: 21;
- filas fuente con variantes: 2;
- variantes estructuradas: 3;
- claves duplicadas: 0;
- identificadores inválidos: 0;
- números Strong inválidos: 0;
- idiomas desconocidos: 0.

Compatibilidad confirmada:

- `biblical_lexical_entries`: admite los 184 identificadores después de normalizar llaves y etiquetas de puntuación;
- `biblical_word_occurrences`: admite los 434 morfemas usando `word_index`, `display_word_index` y `morpheme_index`;
- `biblical_verse_texts`: admite 21 textos hebreos RTL;
- `biblical_textual_variants`: admite una variante ortográfica en 1:8 y dos variantes separadas en 1:11;
- `biblical_verse_mappings`: Obadías usa correspondencia directa con R09 y no necesita filas `identity`;
- RLS, permisos y políticas existentes permanecen suficientes.

Controles obligatorios antes de importar:

1. reutilizar entradas existentes sin sobrescribirlas;
2. aplicar una política canónica para lemas de prefijos y sufijos —especialmente `H9020`, donde TAHOT entrega `Ps1c` pero la base conserva `־י`—;
3. mantener glosas inglesas como fuente y contenido español como capa editorial separada;
4. exigir en una sola transacción 21 textos, 291 palabras visibles, 434 ocurrencias, 184 identificadores y 3 variantes.

Validación:

- PR #63;
- workflow `Validar compatibilidad de Obadías con Supabase`;
- ejecución `30770632659` — `success`;
- commit `aa0e7ff9259780d27fafb80cf13a8f6e613b0423`;
- artefacto `obadiah-supabase-compatibility`;
- digest `sha256:9128d581500334677ac2c72cfbab74ad3a0f1f8fc7fdaacd8ac414bdff8982d9`;
- `docs/FASE_D_COMPATIBILIDAD_OBADIAS_SUPABASE.md`.

No se modificó Supabase, la interfaz ni producción durante esta auditoría.

### Avance confirmado del Bloque 4 — migración piloto de Obadías validada

El borrador de importación transaccional e idempotente de Obadías quedó validado en PostgreSQL 16 sin aplicarse todavía a Supabase.

Resultado:

- instalación del borrador SQL aprobada;
- rollback forzado sin residuos;
- segunda ejecución idempotente;
- 21 textos;
- 291 palabras visibles;
- 434 ocurrencias;
- 184 identificadores léxicos;
- 3 variantes estructuradas;
- 1 lote de importación;
- 0 duplicados tras la segunda ejecución;
- `anon` y `authenticated` sin permiso de ejecución;
- política canónica de afijos conservada;
- campos ingleses de fuente separados de la capa editorial española.

Validación:

- PR #64;
- commit `7cc40f55cb40d86e3a397438aa49276a8ce77802`;
- workflow `Validar borrador de migración de Obadías`;
- ejecución `30771903625` — `success`;
- artefacto `obadiah-migration-draft-validation`;
- digest `sha256:43a7ecf6f4a8bc853f583aa7684b1edf17b61b87dceb0dc37f77f3e447b74632`;
- `docs/FASE_D_MIGRACION_PILOTO_OBADIAS.md`.

El SQL continúa en `supabase/migration-drafts`; no se modificó Supabase, la interfaz ni producción durante esta validación.

### Avance confirmado del Bloque 4 — Abdías aplicado y validado en la aplicación

El primer libro completo del Antiguo Testamento quedó importado, recuperable desde el servidor y validado funcionalmente en la aplicación.

Resultado técnico:

- textos de versículo: 21;
- palabras visibles: 291;
- ocurrencias morfológicas: 434;
- identificadores léxicos usados: 184;
- variantes estructuradas: 3;
- lotes: 1;
- hashes inválidos: 0;
- campos editoriales españoles inventados: 0;
- segunda ejecución idempotente sin duplicados.

Seguridad y recuperación:

- recuperación únicamente mediante código `server-only` y Server Actions;
- usuario autenticado y cuenta activa obligatorios;
- RLS conserva lectura únicamente de contenido aprobado;
- `anon` y `authenticated` no pueden ejecutar el importador;
- `service_role` conserva el único permiso de ejecución.

Validación funcional:

- se corrigió la resolución entre el nombre canónico español `Abdías` y las denominaciones `Obadías`/`Obadias` usadas por la interfaz;
- Abdías 1:1 fue confirmado en producción con texto hebreo RTL, transliteración, 18 palabras base, análisis palabra por palabra, fuente, licencia y contexto;
- las 21 referencias del libro están disponibles para consulta;
- Abdías 1:8 conserva la variante ortográfica;
- Abdías 1:11 conserva Qere como lectura principal y Ketiv como variante separada;
- el usuario confirmó la visualización funcional el 2026-08-02.

Evidencia:

- PR #67 y commit `8705ffd9044bacec0d15495ca0b82c186cf53455`;
- PR #68 y commit `d4ce2f1f172bd8f178fcc5b8421bc76826977b4b`;
- migraciones `importador_payload_tahot_obadias` y `agregar_alias_obadias_a_abdias`;
- `docs/FASE_D_APLICACION_OBADIAS_SUPABASE.md`.

El Bloque 4 continúa activo. El siguiente incremento autorizado es preparar una ampliación controlada del corpus textual del Antiguo Testamento reutilizando el importador validado, comenzando por un libro pequeño y sin avanzar todavía al Bloque 5.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción.
