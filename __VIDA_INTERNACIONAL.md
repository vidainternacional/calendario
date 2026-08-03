# VIDA INTERNACIONAL — Documento maestro de fases

Última actualización: 2026-08-03

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
| FASE D | IA Bíblica Avanzada, nuevas fuentes, contexto histórico, comparaciones, cronologías, mapas y herramientas de estudio | **ACTIVA — BLOQUE 5** |
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
- Bloque 4 — Comparaciones y herramientas ampliadas: **COMPLETADO — 2026-08-03**.
- Bloque 5 — Cronologías y mapas: **ACTIVO**.
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

### Bloque 4 — objetivo cerrado

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

### Avance confirmado del Bloque 4 — paquete TAHOT reproducible de Rut v2

Rut quedó generado y auditado con el extractor TAHOT actual, después de validar funcionalmente Abdías como primer libro completo del Antiguo Testamento.

Resultado:

- capítulos: 4;
- referencias: 85;
- filas fuente: 1,294;
- palabras visibles: 1,293;
- componentes morfológicos: 2,029;
- filas con variantes: 19;
- casos Qere: 13;
- omisiones Qere: 1;
- filas hebreas: 1,293;
- filas arameas: 0;
- desalineaciones: 0;
- hashes de línea inválidos: 0.

La omisión Qere de Rut 3:12 conserva evidencia Ketiv de `אִם`, pero no genera forma visible, índice de lectura ni palabra artificial.

Reproducibilidad:

- dos generaciones produjeron archivos y manifiestos idénticos;
- tamaño de `rut.json.gz`: 247,609 bytes;
- SHA-256: `80a79abd038de9159a90e7aa572f1d4ff6a0c7f1ca8bfb4195875ffd5a7ca20c`;
- PR #70;
- commit `715c9192724faa95cc25c96a74acc2307ef43e78`;
- workflow final `30774042371` — `success`;
- ejecución documentada `30773995300` — `success`;
- artefacto `stepbible-tahot-ruth-package-v2`;
- digest documentado `sha256:68513b8267fe04356453652a0d85f2269720b4195df93ce0a376064e2e0b23d3`;
- `docs/FASE_D_PAQUETE_TAHOT_RUT_V2.md`.

No se modificó Supabase, la interfaz, RLS ni producción durante este incremento.

### Avance confirmado del Bloque 4 — payload TAHOT reproducible de Rut

El payload determinista de Rut quedó construido y validado fuera de producción.

Resultado:

- referencias: 85;
- palabras visibles: 1,293;
- ocurrencias morfológicas: 2,026;
- identificadores léxicos: 373;
- filas fuente con variantes: 19;
- variantes estructuradas: 29;
- omisiones Qere: 1;
- raíces/palabras: 1,295;
- prefijos: 559;
- sufijos: 172.

La omisión Qere de Rut 3:12 se representa como variante `addition`, con lectura base y ancla visibles nulas, Ketiv `אִם` y cero ocurrencias artificiales.

Reproducibilidad:

- paquete `rut.json.gz`: `80a79abd038de9159a90e7aa572f1d4ff6a0c7f1ca8bfb4195875ffd5a7ca20c`;
- archivo payload: `454d57e805cd55eaf59d1d7635eb2fe913858ff03f293b18d0db315222178913`;
- huella interna: `d88763cef355dc05d3251438f3adce08a99feed389b82502e8c8f1263d7b79ee`;
- PR #73;
- commit `0cd0aca0758c2bd8b92ee9a0378053ca7c4d6f32`;
- workflow final `30774849778` — `success`;
- `docs/FASE_D_PAYLOAD_TAHOT_RUT.md`.

No se modificó Supabase, RLS, la interfaz ni producción durante este incremento.

### Avance confirmado del Bloque 4 — importador transaccional de Rut validado

El importador TAHOT generalizado para Abdías y Rut quedó derivado, versionado y validado fuera de producción en PostgreSQL 16.

Contratos cerrados:

- Abdías: 21 referencias, 291 palabras visibles, 434 ocurrencias, 184 identificadores léxicos y 3 variantes;
- Rut: 85 referencias, 1,293 palabras visibles, 2,026 ocurrencias, 373 identificadores léxicos y 29 variantes;
- identidad completa fijada por libro, código STEPBible, dataset, archivo fuente, paquete y payload;
- ningún tercer libro ni combinación parcial es aceptada.

Validación de Rut:

- payload adulterado rechazado sin escrituras parciales;
- rollback explícito aprobado;
- importación exacta aprobada;
- segunda ejecución idempotente;
- campos editoriales españoles nulos;
- `anon` y `authenticated` sin permiso de ejecución;
- `service_role` con permiso de ejecución;
- Rut 3:12 conserva el Ketiv `אִם` como variante `addition`, sin lectura base, ancla ni ocurrencia artificial.

Evidencia:

- PR #76;
- commit `b1765bdd1ce9143f9f9f6a342bc56747ba5dc418`;
- workflow final `30775560259` — `success`;
- artefacto `stepbible-ruth-importer-validation`;
- digest `sha256:55b34064b60fe3b0f8426b1c70d6d9d30a1d4f7d50c431353f31ab84219dbb43`;
- `docs/FASE_D_IMPORTADOR_TAHOT_RUT.md`;
- borrador `supabase/migration-drafts/20260803003000_importador_payload_tahot_rut.sql`.

No se modificó Supabase, RLS, la interfaz ni producción durante esta validación.

### Avance confirmado del Bloque 4 — Rut importado y auditado en Supabase

La migración activa del importador TAHOT generalizado y el payload canónico de Rut fueron aplicados de forma controlada al proyecto Supabase `calendariovida`.

Resultado auditado:

- capítulos: 4;
- textos aprobados y habilitados: 85;
- palabras visibles: 1,293;
- ocurrencias morfológicas: 2,026;
- identificadores léxicos utilizados: 373;
- variantes aprobadas y habilitadas: 29;
- lotes de importación: 1;
- hashes inválidos: 0;
- campos editoriales españoles añadidos sin revisión: 0;
- registros marcados como generados por IA: 0.

Rut 3:12 conserva el Ketiv `אִם` como única variante `addition`, sin lectura base, ancla ni ocurrencia visible artificial. La distribución total es de 18 variantes ortográficas, 10 sustituciones y 1 adición.

Seguridad y recuperación:

- `anon` y `authenticated` no pueden ejecutar el importador;
- únicamente `service_role` conserva `EXECUTE`;
- RLS continúa activo en las cuatro tablas textuales;
- la recuperación permanece en módulos `server-only` y exige una sesión autenticada;
- el catálogo `RUT` está aprobado y habilitado con los alias `Rut` y `Ruth`;
- el puente temporal de transferencia quedó inerte, exige JWT y responde únicamente HTTP 410.

Evidencia:

- PR #78;
- commit `2b66b5dad77e1b1bef9b48cafd79f61611cddc4e`;
- migración `generalizar_importador_payload_tahot_rut` aplicada correctamente;
- workflow `30776001163` — `success`;
- artefacto `stepbible-ruth-active-migration-validation`;
- digest `sha256:e340c24ead2fd67a712b8e4a6a201f23ef8f1a696d90e86ddfed9e6e946daf99`;
- `docs/FASE_D_APLICACION_RUT_SUPABASE.md`.

### Avance confirmado del Bloque 4 — validación funcional de Rut aprobada

La validación manual de Rut fue aprobada por el usuario el 2026-08-02.

Cobertura confirmada:

- Rut 1:1: hebreo RTL, 19 palabras base, transliteración, Strong, lema, morfología, fuente y licencia;
- Rut 1:8: 18 palabras base, variante ortográfica y sustitución Ketiv sin duplicar el texto principal;
- Rut 3:12: 11 palabras base y una adición Ketiv `אִם`, sin ancla ni palabra visible artificial;
- Rut 4:22: 8 palabras base, análisis completo y ausencia correcta de variantes;
- Rut 1:1, 1:8 y 3:12 recuperados correctamente en Estudio Profundo;
- regresión aprobada para Abdías 1:1 y Juan 3:16;
- sin pantallas en blanco, cargas infinitas ni cambios no aprobados de interfaz.

La indicación «Secuencia literal de glosas: No disponible» permanece deliberadamente cuando la capa editorial española no ha sido revisada.

Evidencia permanente:

- PR #79 y commit `8db47f7b816a8e89f4c2c6eb683a61f30e892e23` para la aplicación y auditoría técnica;
- `docs/FASE_D_APLICACION_RUT_SUPABASE.md`, actualizado con la aprobación funcional.

La importación, auditoría técnica, recuperación segura y visualización funcional de Rut están completas.

### Avance confirmado del Bloque 4 — Hageo seleccionado como tercer libro

Se evaluaron los 37 libros restantes del Antiguo Testamento mediante una auditoría reproducible de solo lectura sobre las cuatro fuentes TAHOT fijadas.

La política priorizó integridad estructural sobre tamaño: cero desalineaciones e idiomas desconocidos, seguida por ausencia de omisiones Qere, arameo, texto restaurado y adiciones LXX; después se compararon referencias, Qere, variantes, morfemas y filas fuente.

Hageo (`Hag`) quedó seleccionado con:

- 2 capítulos;
- 38 referencias;
- 600 palabras visibles;
- 911 componentes morfológicos;
- 2 filas con variantes;
- 1 fila Qere;
- 0 omisiones Qere;
- 0 filas arameas;
- 0 texto restaurado;
- 0 adiciones reconstruidas desde la LXX;
- 0 desalineaciones;
- 0 idiomas desconocidos.

Evidencia:

- PR #81;
- workflow `Seleccionar tercer libro TAHOT`;
- ejecución `30777005082` — `success`;
- artefacto `stepbible-next-ot-book-selection`;
- ID `8842366155`;
- digest `sha256:bad8cb7ec61bb24768b9fdecdb295afecfa6651ac66314e772cb8964102cb35a`;
- `docs/FASE_D_SELECCION_TERCER_LIBRO.md`.

Esta auditoría no generó paquetes, payloads o migraciones y no modificó Supabase, RLS, la interfaz ni producción.

### Avance confirmado del Bloque 4 — paquete TAHOT reproducible de Hageo

Hageo quedó habilitado en el extractor genérico y fue generado dos veces con bytes, manifiestos y auditorías idénticos.

Resultado:

- 2 capítulos;
- 38 referencias;
- 600 filas fuente y palabras visibles;
- 911 componentes morfológicos;
- 2 filas con variantes;
- 1 Qere;
- 0 omisiones Qere;
- 0 filas arameas;
- 0 texto restaurado;
- 0 adiciones reconstruidas desde la LXX;
- 0 desalineaciones;
- 0 idiomas desconocidos;
- 0 hashes de línea inválidos;
- 0 palabras visibles artificiales.

Reproducibilidad:

- archivo `hag.json.gz`: 113,722 bytes;
- SHA-256: `bc8e1caebce9a2e55d34b3be4770f3591e430b3aa217208324dee1bdbdd54e38`;
- Hageo 1:8 conserva el Qere `וְאֶכָּבְדָ֖ה` y el Ketiv `וְאֶכָּבֵד` en el índice visible 9;
- Hageo 1:10 conserva la variante ortográfica `שָמַ֖יִם` / `שָׁמַ֖יִם` en el índice visible 5.

Evidencia:

- PR #82;
- workflow `Validar paquete TAHOT de Hageo`;
- ejecución `30777253377` — `success`;
- artefacto `stepbible-haggai-package`;
- ID `8842436792`;
- digest `sha256:154835a7fede83e2784328db06223aa0a9426e806f68ed4058727306e4f45e1e`;
- `docs/FASE_D_PAQUETE_TAHOT_HAGEO.md`.

No se generó payload, no se modificó el importador y no se escribió en Supabase, RLS, interfaz o producción.

### Avance confirmado del Bloque 4 — política canónica de afijos de Hageo

El paquete reproducible de Hageo fue inspeccionado componente por componente antes de construir un payload.

Resultado:

- identificadores léxicos distintos: 235;
- con lema hebreo explícito en la fuente: 224;
- requieren política canónica explícita: 11;
- conflictos de lema fuente: 0;
- identificadores requeridos y proporcionados: 11 de 11;
- claves faltantes: 0;
- claves sobrantes: 0;
- valores inválidos o no hebreos: 0;
- estado: `approved_for_payload_build`.

Política fijada:

- `H9020 → ־י`;
- `H9023 → ־וֹ`;
- `H9024 → ־הָ`;
- `H9026 → ־כֶם`;
- `H9028 → ־הֶם`;
- `H9030 → ־נִי`;
- `H9031 → ־ךָ`;
- `H9033 → ־וֹ`;
- `H9036 → ־כֶם`;
- `H9046 → ־כֶם`;
- `H9048 → ־ם`.

Nueve decisiones reutilizan lemas ya aprobados en el catálogo textual. `H9026` y `H9046` se fijaron únicamente para la forma y función 2mp observadas en Hageo.

Evidencia:

- PR #83;
- workflow `Inspeccionar política de afijos de Hageo`;
- ejecución final `30777536703` — `success`;
- artefacto `haggai-affix-policy-inspection`;
- ID `8842543159`;
- digest `sha256:f845a51406148e8f5da171e7ffd242012fa6e20e8c8a54e9fa80c35c477d39d7`;
- `docs/FASE_D_POLITICA_AFIJOS_HAGEO.md`.

No se construyó payload, no se modificó el importador y no se escribió en Supabase, RLS, interfaz o producción.

### Avance confirmado del Bloque 4 — payload TAHOT reproducible de Hageo

El paquete reproducible de Hageo y su política canónica de afijos fueron transformados en un payload determinista fuera de producción.

Resultado:

- referencias y textos: 38;
- palabras visibles: 600;
- ocurrencias morfológicas: 911;
- identificadores léxicos: 235;
- filas fuente con variantes: 2;
- variantes estructuradas: 3;
- omisiones Qere: 0;
- roles: 600 palabras/raíces, 268 prefijos y 43 sufijos;
- duplicados de ocurrencias o variantes: 0;
- hashes inválidos: 0;
- palabras visibles artificiales: 0;
- campos editoriales españoles no autorizados: 0.

Reproducibilidad:

- paquete: `bc8e1caebce9a2e55d34b3be4770f3591e430b3aa217208324dee1bdbdd54e38`;
- archivo payload: 1,052,343 bytes;
- SHA-256 del archivo: `c24d50fbbe01ecb47ec5a818c8a0f8cbdebae1451f2c9cd2b446234f02516ec6`;
- huella canónica interna: `db6510d6e971e672c2fac244b406ffd1f704ac49d4fc3b3bbca3b1c5cde71fa9`.

Variantes fijadas:

- Hageo 1:8: variante ortográfica `וְאֶכָּבְדָ֖ה` / `וְאֶכָּבְדָ֖`;
- Hageo 1:8: sustitución Qere/Ketiv `וְאֶכָּבְדָ֖ה` / `וְאֶכָּבֵד`;
- Hageo 1:10: variante ortográfica `שָמַ֖יִם` / `שָׁמַ֖יִם`.

Evidencia:

- PR #84;
- workflow `Validar payload de importación de Hageo`;
- ejecución inicial `30777802369` — `success`;
- artefacto `stepbible-haggai-import-payload`;
- ID `8842631101`;
- digest `sha256:32dc56f668eeb7b01f62b54447fee73ac0d0be0443e76b6438da4847d4cbe7b5`;
- `docs/FASE_D_PAYLOAD_TAHOT_HAGEO.md`.

No se modificó el importador activo y no se escribió en Supabase, RLS, interfaz o producción durante la construcción del payload.

### Avance confirmado del Bloque 4 — importador transaccional de Hageo validado

La ampliación del importador TAHOT para aceptar exactamente Hageo quedó diseñada y validada fuera de producción en PostgreSQL 16.

Contrato cerrado:

- función base OBA/RUT: `dad481d9de705efc566dfa1beaa68cba99b85de069f241733183e33c3b04b381`;
- código interno `HAG` y código STEPBible `Hag`;
- dataset `TAHOT Isa-Mal`;
- paquete `bc8e1caebce9a2e55d34b3be4770f3591e430b3aa217208324dee1bdbdd54e38`;
- archivo payload `c24d50fbbe01ecb47ec5a818c8a0f8cbdebae1451f2c9cd2b446234f02516ec6`;
- huella interna `db6510d6e971e672c2fac244b406ffd1f704ac49d4fc3b3bbca3b1c5cde71fa9`;
- 38 referencias, 600 palabras visibles, 911 ocurrencias, 235 identificadores y 3 variantes.

PostgreSQL 16 aprobó:

- payload adulterado rechazado sin escrituras;
- rollback completo;
- importación exacta;
- segunda ejecución idempotente;
- reutilización no destructiva de entradas existentes;
- tres variantes exactas en Hageo 1:8 y 1:10;
- campos editoriales españoles nulos para los datos nuevos;
- `anon` y `authenticated` sin ejecución;
- `service_role` con ejecución.

Evidencia:

- PR #85;
- workflow `Validar importador transaccional de Hageo`;
- ejecución inicial `30778074154` — `success`;
- artefacto `stepbible-haggai-importer-validation`;
- ID `8842724863`;
- digest `sha256:62e980c02974c77859b6ccc5ea270d11f04a7c86688c2556595a045cca110029`;
- borrador `supabase/migration-drafts/20260803020000_importador_payload_tahot_hageo.sql`;
- `docs/FASE_D_IMPORTADOR_TAHOT_HAGEO.md`.

No se aplicó el borrador a Supabase y no se modificó producción durante la validación externa.

### Avance confirmado del Bloque 4 — Hageo importado y auditado en Supabase

La migración activa del importador TAHOT y el payload canónico de Hageo fueron aplicados de forma controlada al proyecto Supabase `calendariovida`.

La primera aplicación fue rechazada por una cita SQL incorrecta en la comprobación final. PostgreSQL revirtió completamente la transacción: la función conservó la huella OBA/RUT y Hageo permaneció con cero datos. El PR #88 corrigió esa única cita y añadió una comprobación estática antes de repetir la validación y aplicación.

Resultado auditado:

- capítulos: 2;
- textos aprobados y habilitados: 38;
- palabras visibles: 600;
- ocurrencias morfológicas: 911;
- identificadores léxicos utilizados: 235;
- variantes aprobadas y habilitadas: 3;
- lotes de importación: 1;
- hashes inválidos: 0;
- campos editoriales españoles añadidos sin revisión: 0;
- registros marcados como generados por IA: 0.

Variantes confirmadas:

- Hageo 1:8, ortográfica: `וְאֶכָּבְדָ֖ה` / `וְאֶכָּבְדָ֖`, testigo `L`;
- Hageo 1:8, sustitución Qere/Ketiv: `וְאֶכָּבְדָ֖ה` / `וְאֶכָּבֵד`, testigo `K`;
- Hageo 1:10, ortográfica: `שָמַ֖יִם` / `שָׁמַ֖יִם`, testigo `ABH`.

Seguridad y recuperación:

- función activa: `619b0249f70e6ac373256da724a89033cb3ecb566ad26f2ac9709ee0b6f9977d`;
- `anon` y `authenticated` no pueden ejecutar el importador;
- únicamente `service_role` conserva `EXECUTE`;
- RLS continúa activo en las cuatro tablas textuales;
- el RPC público temporal fue eliminado;
- las Edge Functions temporales de Hageo quedaron inertes, exigen JWT y responden HTTP 410;
- una función adicional sin JWT y con capacidad de escritura fue descubierta durante la auditoría y desactivada inmediatamente;
- los conteos permanecieron exactos después del cierre de seguridad.

Evidencia:

- PR #87 y commit `c5514ccf4c77e9d3d85fc9e32460d0ff1fdee0a0` para la migración activa;
- PR #88 y commit `0d6d78cb47083be8b6e67c1e63f59f848585c7a6` para el hotfix;
- workflow final `30778552986` — `success`;
- artefacto `stepbible-haggai-active-migration-validation`;
- ID `8842866884`;
- digest `sha256:b6365795fd24f1828680bd68f649508fa177e68f7189dfbe75f37d18b90d2a02`;
- `docs/FASE_D_APLICACION_HAGEO_SUPABASE.md`.

### Avance confirmado del Bloque 4 — validación funcional de Hageo aprobada

La validación manual de Hageo fue aprobada por el usuario el 2026-08-02.

Cobertura confirmada:

- Hageo 1:1: hebreo RTL, 28 palabras base, transliteración, Strong, lema, morfología, fuente y licencia;
- Hageo 1:8: 11 palabras base, variante ortográfica y sustitución Qere/Ketiv en la palabra 9, sin duplicar el texto principal;
- Hageo 1:10: 9 palabras base y una variante ortográfica en la palabra 5;
- Hageo 2:23: 20 palabras base, análisis completo y ausencia correcta de variantes;
- Hageo 1:1, 1:8 y 1:10 recuperados correctamente en Estudio Profundo;
- regresión aprobada para Rut 3:12, Abdías 1:1 y Juan 3:16;
- sin pantallas en blanco, cargas infinitas, desbordamiento lateral ni cambios no aprobados de interfaz.

La indicación «Secuencia literal de glosas: No disponible» permanece deliberadamente cuando la capa editorial española no ha sido revisada.

Evidencia permanente:

- PR #89 y documento `docs/FASE_D_APLICACION_HAGEO_SUPABASE.md` para la aplicación y auditoría técnica;
- validación funcional aprobada por el usuario el 2026-08-02.

La importación, auditoría técnica, recuperación segura y visualización funcional de Hageo están completas.

### Avance confirmado del Bloque 4 — Nahúm seleccionado como cuarto libro

Se evaluaron los 36 libros restantes de TAHOT mediante la misma auditoría reproducible de solo lectura usada para seleccionar Hageo. Abdías, Rut y Hageo fueron excluidos porque su importación y validación funcional ya están completas.

La política exigió referencias válidas, cero desalineaciones y cero idiomas desconocidos; después priorizó ausencia de omisiones Qere, arameo, texto restaurado y adiciones LXX antes del tamaño y la complejidad textual.

Nahúm (`Nam`) quedó seleccionado con:

- 3 capítulos;
- 47 referencias;
- 558 filas fuente y palabras visibles;
- 828 componentes morfológicos;
- 4 filas con variantes;
- 4 filas Qere;
- 0 omisiones Qere;
- 0 filas arameas;
- 0 texto restaurado;
- 0 adiciones reconstruidas desde la LXX;
- 0 idiomas desconocidos;
- 0 desalineaciones.

Jonás quedó segundo con 48 referencias. Aunque no contiene Qere o variantes, la política compara el menor número de referencias después de superar todos los controles estructurales y de riesgo prioritario.

Evidencia:

- PR #93;
- workflow `Seleccionar cuarto libro TAHOT`;
- ejecución `30779908366` — `success`;
- artefacto `stepbible-fourth-ot-book-selection`;
- ID `8843282870`;
- digest `sha256:ec5fa55b98a28f7d0d3cd8072e222c926114d157d2987403d5178ea270b32989`;
- `docs/FASE_D_SELECCION_CUARTO_LIBRO.md`.

Esta auditoría no generó paquetes, payloads o migraciones y no modificó Supabase, RLS, interfaz o producción.

### Avance confirmado del Bloque 4 — paquete TAHOT reproducible de Nahúm

Nahúm (`Nam` / `NAM`) quedó habilitado en el extractor genérico y fue generado dos veces con bytes, manifiestos y auditorías idénticos.

Resultado:

- 3 capítulos;
- 47 referencias;
- 558 filas fuente y palabras visibles;
- 828 componentes morfológicos;
- 4 filas con variantes, todas Qere;
- 0 omisiones Qere;
- 0 filas arameas;
- 0 texto restaurado;
- 0 adiciones reconstruidas desde la LXX;
- 0 idiomas desconocidos;
- 0 desalineaciones;
- 0 hashes de línea inválidos;
- 0 palabras visibles artificiales.

Reproducibilidad:

- archivo `nam.json.gz`: 110,590 bytes;
- SHA-256: `60e280a6d94abc8788b7cc9647e4dfa0f679e0a9708a1adf00be30abfc23b7f5`;
- Nahúm 1:3 conserva Qere `וּגְדָל` y Ketiv `וּגְדוֹל` en el índice visible 4;
- Nahúm 1:15 conserva Qere `לַֽעֲבָר` y Ketiv `לַעֲבוֹר` en el índice 17;
- Nahúm 2:5 conserva Qere `בַּהֲלִֽיכָתָ֑ם` y Ketiv `בַהֲלִכוֹתָם` en el índice 4;
- Nahúm 3:3 conserva Qere `וְכָשְׁל֖וּ` y Ketiv `יִכְשְׁלוּ` en el índice 14.

Evidencia:

- PR #96;
- workflow `Validar paquete TAHOT de Nahúm`;
- ejecución final `30780924959` — `success`;
- artefacto `stepbible-nahum-package`;
- ID `8843576939`;
- digest `sha256:afda8649db99fbfc0ebbd42bb4c3f5ce9f2f96463d43bfaac58b105fc176c29b`;
- `docs/FASE_D_PAQUETE_TAHOT_NAHUM.md`.

No se construyó payload, no se modificó el importador y no se escribió en Supabase, RLS, interfaz o producción.

### Avance confirmado del Bloque 4 — política canónica de afijos de Nahúm

El paquete reproducible de Nahúm fue inspeccionado componente por componente antes de construir un payload.

Resultado:

- identificadores léxicos distintos: 387;
- con lema hebreo explícito en la fuente: 373;
- requieren política canónica explícita: 14;
- conflictos de lema fuente: 0;
- identificadores requeridos y proporcionados: 14 de 14;
- claves faltantes: 0;
- claves sobrantes: 0;
- valores inválidos o no hebreos: 0;
- estado: `approved_for_payload_build`.

Trece decisiones reutilizan lemas ya aprobados y habilitados en el catálogo textual. `H9040 → ־נִי` es la única decisión nueva y se restringe a dos ocurrencias `Sp1bs`, ambas con forma `נִי`.

Evidencia:

- PR #100;
- workflow `Inspeccionar política de afijos de Nahúm`;
- ejecución final `30781392252` — `success`;
- artefacto final `nahum-affix-policy-inspection`;
- `docs/FASE_D_POLITICA_AFIJOS_NAHUM.md`.

No se construyó payload durante la inspección léxica y no se escribió en Supabase, RLS, interfaz o producción.

### Avance confirmado del Bloque 4 — payload TAHOT reproducible de Nahúm

El paquete reproducible de Nahúm y su política canónica de afijos fueron transformados en un payload determinista fuera de producción.

Resultado:

- referencias y textos: 47;
- palabras visibles: 558;
- ocurrencias morfológicas: 828;
- identificadores léxicos: 387;
- filas fuente con variantes: 4;
- variantes estructuradas: 8;
- variantes ortográficas: 4;
- sustituciones Qere/Ketiv: 4;
- omisiones Qere: 0;
- roles: 558 palabras/raíces, 175 prefijos y 95 sufijos;
- duplicados, hashes inválidos y palabras artificiales: 0;
- campos editoriales españoles no autorizados: 0.

Reproducibilidad:

- paquete: `60e280a6d94abc8788b7cc9647e4dfa0f679e0a9708a1adf00be30abfc23b7f5`;
- archivo payload: 1,066,318 bytes;
- SHA-256 del archivo: `0c041041155152e1fb63cb568efa1530724bea7fa729b4ed8815dcbaaf666000`;
- huella canónica interna: `43a5ab1b8c9cf773e218c73eab3def49715ac7c0511a04ee9cae3990be4a8a99`.

El generador separa correctamente el Ketiv `K` cuando comparte el campo ortográfico con otros testigos, incluido Nahúm 1:15. Los payloads aprobados de Rut y Hageo conservaron exactamente sus hashes anteriores mediante regresiones obligatorias.

Evidencia:

- PR #105;
- commit `33155cb94e61cab23d26cb3d1ea396b0d46b6997`;
- workflow `Validar payload de importación de Nahúm`;
- ejecución final `30782244984` — `success`;
- `docs/FASE_D_PAYLOAD_TAHOT_NAHUM.md`.

No se modificó el importador durante la construcción del payload y no se escribió en Supabase, RLS, interfaz o producción.

### Avance confirmado del Bloque 4 — importador transaccional de Nahúm validado

La ampliación del importador TAHOT para aceptar exactamente Nahúm fue derivada mecánicamente desde la migración activa de Hageo y validada fuera de producción en PostgreSQL 16.

Contrato cerrado:

- función base OBA/RUT/HAG: `619b0249f70e6ac373256da724a89033cb3ecb566ad26f2ac9709ee0b6f9977d`;
- función resultante OBA/RUT/HAG/NAM: `69045240e658995cd0e1ba3557e54a2700b623078b36125e73ed1ada64f5139c`;
- paquete: `60e280a6d94abc8788b7cc9647e4dfa0f679e0a9708a1adf00be30abfc23b7f5`;
- archivo payload: `0c041041155152e1fb63cb568efa1530724bea7fa729b4ed8815dcbaaf666000`;
- huella interna: `43a5ab1b8c9cf773e218c73eab3def49715ac7c0511a04ee9cae3990be4a8a99`;
- 47 referencias, 558 palabras visibles, 828 ocurrencias, 387 identificadores y 8 variantes.

PostgreSQL 16 aprobó:

- derivación byte a byte del borrador desde la migración activa;
- payload adulterado rechazado sin escrituras;
- rollback completo;
- importación exacta;
- segunda ejecución idempotente;
- ocho variantes exactas, con cuatro ortográficas y cuatro sustituciones Qere/Ketiv;
- reutilización no destructiva de `H3068G`;
- campos editoriales españoles nulos para los datos nuevos;
- `anon` y `authenticated` sin ejecución;
- `service_role` con ejecución.

La evidencia inicial fue corregida porque un pipeline con `tee` ocultó un código de salida y el validador ordenaba claves como texto. La ejecución limpia final usa salida JSON persistida y orden numérico por capítulo, versículo y tipo.

Evidencia:

- PR #109;
- commit `f9140b97e9bcea3ad511761ee15536e21de3c52e`;
- workflow `Validar importador transaccional de Nahúm`;
- ejecución limpia `30783144402` — `success`;
- reconfirmación final `30783199006` — `success`;
- artefacto `stepbible-nahum-importer-validation`, ID `8844339116`;
- digest `sha256:5ab2dcd687706b4d6ae05dcf4912f77086fdac6f627dc0b3a38a19518f0857ea`;
- `docs/FASE_D_IMPORTADOR_TAHOT_NAHUM.md`;
- borrador `supabase/migration-drafts/20260803040000_importador_payload_tahot_nahum.sql`.

No se creó una migración activa durante la validación del borrador y no se importó Nahúm en Supabase.

### Avance confirmado del Bloque 4 — migración activa de Nahúm validada

El borrador aprobado de Nahúm fue convertido mecánicamente en una migración activa versionada y validado nuevamente en PostgreSQL 16.

Resultado:

- migración activa: `supabase/migrations/20260803043000_generalizar_importador_payload_tahot_nahum.sql`;
- función base OBA/RUT/HAG: `619b0249f70e6ac373256da724a89033cb3ecb566ad26f2ac9709ee0b6f9977d`;
- función resultante OBA/RUT/HAG/NAM: `69045240e658995cd0e1ba3557e54a2700b623078b36125e73ed1ada64f5139c`;
- 47 textos, 558 palabras visibles, 828 ocurrencias, 387 identificadores y 8 variantes;
- cuatro variantes ortográficas y cuatro sustituciones Qere/Ketiv;
- payload adulterado rechazado sin escrituras;
- rollback completo;
- importación exacta e idempotencia aprobadas;
- `anon` y `authenticated` sin ejecución;
- `service_role` como único rol con `EXECUTE`.

La conversión inicial fue comparada byte a byte con el borrador. Después se retiraron el borrador, el activador, el marcador y los workflows temporales. El repositorio conserva una sola ruta activa y la validación permanente se ejecuta directamente sobre ella.

Evidencia:

- PR #113;
- commit `dce300122738ccdb1f6d38ca66b8917dc69671f0`;
- workflow `Validar migración activa TAHOT de Nahúm`;
- ejecución inicial `30783726966` — `success`;
- ejecución limpia `30784026725` — `success`;
- reconfirmación final `30784093014` — `success`;
- artefacto limpio `stepbible-nahum-active-migration-validation`, ID `8844622756`;
- digest limpio `sha256:6d177970ef2bf6811a00eaeab392b8592c38e26737bf21dcb9360ae7352cc380`;
- `docs/FASE_D_MIGRACION_ACTIVA_NAHUM.md`.

La migración todavía no se había aplicado a Supabase durante su validación externa.

### Avance confirmado del Bloque 4 — Nahúm importado y auditado en Supabase

La migración activa y el payload canónico de Nahúm fueron aplicados de forma controlada al proyecto Supabase `calendariovida`.

Resultado auditado:

- función activa OBA/RUT/HAG/NAM: `69045240e658995cd0e1ba3557e54a2700b623078b36125e73ed1ada64f5139c`;
- textos aprobados y habilitados: 47;
- palabras visibles: 558;
- ocurrencias morfológicas: 828;
- identificadores léxicos utilizados: 387;
- variantes: 8, con cuatro ortográficas y cuatro sustituciones Qere/Ketiv;
- lotes de importación: 1;
- hashes inválidos: 0;
- campos editoriales españoles no revisados añadidos: 0;
- segunda ejecución idempotente: aprobada.

Integridad y seguridad:

- Abdías, Rut y Hageo conservaron sus conteos exactos;
- 155 entradas léxicas fueron reutilizadas sin modificación y 232 se crearon para Nahúm;
- no existen duplicados por fuente e identificador léxico;
- `anon` y `authenticated` no pueden ejecutar el importador;
- únicamente `service_role` conserva `EXECUTE`;
- RLS y las políticas de lectura permanecen sin ampliación;
- el RPC, token y tabla temporales fueron eliminados;
- la Edge Function temporal quedó inerte, exige JWT y responde HTTP 410.

La prueba de recuperación eliminó temporalmente dentro de una subtransacción 8 variantes, 828 ocurrencias, 47 textos, 1 lote y 232 entradas exclusivas, preservó 155 entradas compartidas y revirtió completamente al estado productivo exacto.

La ruta funcional fue verificada bajo el rol real `authenticated`:

- `Nahúm`, `Nahum`, `Nah` y `NAM` resuelven el código canónico `NAM`;
- Biblia → Estudio y Estudio Profundo usan la misma evidencia textual aprobada;
- Nahúm dispone de contexto aprobado para los capítulos 1–3;
- Nahúm 1:1, 1:3, 1:15, 2:5 y 3:3 recuperan edición hebrea RTL, transliteración, Strong, lemas y morfología;
- las ocho variantes se recuperan en sus anclas exactas;
- fuente, atribución y licencia CC BY 4.0 son visibles para el panel.

Evidencia permanente:

- PR #113 y commit `dce300122738ccdb1f6d38ca66b8917dc69671f0` para la migración activa;
- migración Supabase `20260803042730_generalizar_importador_payload_tahot_nahum`;
- respuestas idempotentes `pg_net` 331 y 332;
- `docs/FASE_D_APLICACION_NAHUM_SUPABASE.md`.

La importación, auditoría técnica, recuperación segura y validación funcional de datos están completas.

### Avance confirmado del Bloque 4 — validación funcional de Nahúm aprobada

La validación manual de Nahúm fue aprobada por el usuario el 2026-08-02.

Cobertura confirmada:

- Nahúm 1:1: 6 palabras base y ausencia correcta de variantes;
- Nahúm 1:3: 15 palabras base y dos variantes en la posición 4;
- Nahúm 1:15: 21 palabras base y dos variantes en la posición 17;
- Nahúm 2:5: 8 palabras base y dos variantes en la posición 4;
- Nahúm 3:3: 15 palabras base y dos variantes en la posición 14;
- cuatro variantes ortográficas y cuatro sustituciones Qere/Ketiv visibles sin duplicación artificial;
- hebreo RTL, transliteración, Strong, lemas, morfología, fuente, atribución y licencia visibles;
- Nahúm 1:3 y 1:15 recuperados correctamente en Estudio Profundo;
- regresión aprobada para Hageo 1:8, Rut 3:12, Abdías 1:1 y Juan 3:16;
- sin pantallas en blanco, cargas infinitas, desbordamiento lateral ni cambios no aprobados de interfaz.

La indicación «Secuencia literal de glosas: No disponible» permanece deliberadamente mientras esa capa editorial española no haya sido revisada.

Evidencia permanente:

- `docs/FASE_D_APLICACION_NAHUM_SUPABASE.md`;
- validación funcional aprobada por el usuario el 2026-08-02.

La importación, auditoría técnica, recuperación segura y visualización funcional de Nahúm están completas.

### Avance confirmado del Bloque 4 — Jonás seleccionado como quinto libro

Se evaluaron los 35 libros restantes de TAHOT mediante la misma auditoría reproducible de solo lectura usada para seleccionar Hageo y Nahúm. Abdías, Rut, Hageo y Nahúm fueron excluidos porque su importación y validación funcional ya están completas.

La política exigió referencias válidas, cero desalineaciones y cero idiomas desconocidos; después priorizó ausencia de omisiones Qere, arameo, texto restaurado y adiciones LXX antes del tamaño y la complejidad textual.

Jonás (`Jon`) quedó seleccionado con:

- 4 capítulos;
- 48 referencias;
- 688 filas fuente y palabras visibles;
- 1,080 componentes morfológicos;
- 0 filas con variantes;
- 0 filas Qere;
- 0 omisiones Qere;
- 0 filas arameas;
- 0 texto restaurado;
- 0 adiciones reconstruidas desde la LXX;
- 0 idiomas desconocidos;
- 0 desalineaciones.

Jonás ocupa el primer lugar porque supera todos los controles estructurales y de riesgo prioritario y tiene el menor número de referencias entre los candidatos restantes. Su ausencia total de Qere y variantes reduce además el riesgo del paquete siguiente.

Evidencia:

- PR #119;
- workflow `Seleccionar quinto libro TAHOT`;
- ejecución `30787248088` — `success`;
- artefacto `stepbible-fifth-ot-book-selection`;
- ID `8845674061`;
- digest `sha256:e4f5b2b564c03141a0153d43e051105aeb4657a6b17cdec695952bee3e94d68a`;
- `docs/FASE_D_SELECCION_QUINTO_LIBRO.md`.

Esta auditoría no generó paquetes, payloads o migraciones y no modificó Supabase, RLS, interfaz o producción.

### Avance confirmado del Bloque 4 — paquete TAHOT reproducible de Jonás

Jonás (`Jon` / `JON`) fue habilitado en el extractor genérico y generado dos veces de forma independiente desde la fuente TAHOT fijada.

Resultado estructural:

- 4 capítulos y 48 referencias completas;
- 688 filas fuente y palabras visibles;
- 1,080 componentes morfológicos;
- estado textual `leningrad` en las 688 filas;
- 0 variantes;
- 0 filas Qere y 0 omisiones Qere;
- 0 filas arameas;
- 0 texto restaurado;
- 0 adiciones reconstruidas desde la LXX;
- 0 idiomas desconocidos;
- 0 desalineaciones;
- 688 hashes de línea válidos y únicos;
- 0 palabras visibles artificiales.

Reproducibilidad fijada:

- archivo `jon.json.gz`;
- tamaño exacto: 131,092 bytes;
- SHA-256: `083b869fe7d10493deaeee392babd9811e9dffb91f0db816d2f21a22b2135915`;
- paquete, manifiesto y auditoría idénticos byte a byte en dos ejecuciones;
- fuente `TAHOT Isa-Mal` con SHA-256 `f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5`.

El primer auditor esperaba incorrectamente el estado `base`; CI lo detuvo al observar `leningrad` en Jonás 1:1. La regla fue corregida para reflejar el contrato real de TAHOT sin modificar el extractor, los datos, los conteos o la huella del paquete. La validación completa posterior aprobó.

Evidencia:

- PR #120;
- workflow `Validar paquete TAHOT de Jonás`;
- primera generación reproducible `30787726852`;
- validación completa `30787820694` — `success`;
- artefacto `stepbible-jonah-package`;
- ID `8845878474`;
- digest `sha256:10b71681dd4dda3ddfff617631998a34d105ffcaa208ffa04d40264fc0881ad0`;
- `docs/FASE_D_PAQUETE_TAHOT_JONAS.md`.

Este incremento no construyó payload, no modificó el importador y no escribió en Supabase, RLS, interfaz o producción.

### Avance confirmado del Bloque 4 — política canónica de afijos de Jonás

El paquete reproducible de Jonás fue inspeccionado componente por componente antes de construir un payload.

Resultado:

- identificadores léxicos distintos: 288;
- con lema hebreo explícito en la fuente: 275;
- requieren política canónica explícita: 13;
- conflictos de lema fuente: 0;
- identificadores requeridos y proporcionados: 13 de 13;
- claves faltantes: 0;
- claves sobrantes: 0;
- valores inválidos o no hebreos: 0;
- estado: `approved_for_payload_build`.

Las trece decisiones reutilizan lemas ya aprobados y habilitados en el catálogo textual. No fue necesaria ninguna decisión nueva.

Evidencia:

- PR #121;
- workflow `Inspeccionar política de afijos de Jonás`;
- inspección inicial `30788172076` — `success`;
- validación final `30788289087` — `success`;
- artefacto final `jonah-affix-policy-inspection`, ID `8846060972`;
- digest `sha256:204af7ce019c01827f77eb1979f9feddb5b73df37ec94cb8c86caf9b74d18ea4`;
- `docs/FASE_D_POLITICA_AFIJOS_JONAS.md`.

No se construyó payload, no se modificó el importador y no se escribió en Supabase, RLS, interfaz o producción.

### Avance confirmado del Bloque 4 — payload TAHOT reproducible de Jonás

El paquete reproducible de Jonás y su política canónica de afijos fueron transformados en dos payloads independientes con bytes idénticos, fuera de producción.

Resultado:

- 48 textos;
- 688 palabras visibles;
- 1,080 ocurrencias morfológicas;
- 288 identificadores léxicos;
- roles: 688 palabras, 310 prefijos y 82 sufijos;
- estado textual `leningrad` en las 1,080 ocurrencias;
- 0 filas fuente con variantes;
- 0 variantes estructuradas;
- 0 omisiones Qere;
- 0 claves de ocurrencia o variante duplicadas;
- 0 hashes inválidos;
- 0 palabras artificiales;
- 0 campos editoriales españoles no autorizados.

Reproducibilidad fijada:

- archivo `import-payload.json`;
- tamaño 1,248,309 bytes;
- SHA-256 del archivo `e6bd082a446d29becbafb35a22b94ef9e260e447fe7fc7cea4361d98c5bb835b`;
- huella canónica interna `f986bdd833c86f9f239ddd26e4594aeb33d48a89f72fb05dcc853dbd1d512fc4`;
- estado `validated_outside_production`.

La primera auditoría esperaba incorrectamente el estado `base`; CI la detuvo después de que la doble generación ya había aprobado. La regla se corrigió a `leningrad` sin modificar el generador, los datos, los conteos o las huellas.

Evidencia:

- PR #122;
- workflow `Validar payload de importación de Jonás`;
- corrección validada `30788708776` — `success`;
- validación exacta documentada `30788854404` — `success`;
- reconfirmación final `30788912496` — `success`;
- artefacto `stepbible-jonah-import-payload`, ID `8846266421`;
- digest `sha256:517574fa159fb46a39b951d1fdd90e7e4b2d19554932e24111491065137c3026`;
- `docs/FASE_D_PAYLOAD_TAHOT_JONAS.md`.

No se modificó el importador, no se creó una migración y no se escribió en Supabase, RLS, interfaz o producción.

### Avance confirmado del Bloque 4 — importador transaccional de Jonás validado

La ampliación del importador TAHOT para aceptar exactamente Jonás fue derivada desde la migración activa de Nahúm y validada fuera de producción en PostgreSQL 16.

Contrato:

- función base OBA/RUT/HAG/NAM: `69045240e658995cd0e1ba3557e54a2700b623078b36125e73ed1ada64f5139c`;
- función resultante OBA/RUT/HAG/NAM/JON: `0d65c4d8e8ac81368cea6e5b6fd3fb104156cc3e3e3f299426b20752eef7f062`;
- 48 textos;
- 688 palabras visibles;
- 1,080 ocurrencias;
- 288 identificadores léxicos;
- 0 variantes;
- 1 lote.

Controles aprobados:

- derivación byte a byte del borrador;
- payload adulterado rechazado sin escrituras;
- variante artificial rechazada sin escrituras;
- rollback completo;
- importación exacta;
- segunda ejecución idempotente;
- reutilización no destructiva de `H3068G` y `H9020`;
- campos editoriales españoles nulos para los datos nuevos;
- `anon` y `authenticated` sin ejecución;
- `service_role` como único rol con `EXECUTE`.

La primera ejecución detectó una expectativa incorrecta en la prueba: `display_word_index` se reinicia por versículo y no puede contarse globalmente. La consulta fue corregida para contar capítulo, versículo e índice visible; el borrador, payload y contrato no cambiaron.

Evidencia:

- PR #123;
- workflow `Validar importador transaccional de Jonás`;
- ejecución aprobada `30789918273` — `success`;
- ejecución limpia `30790108172` — `success`;
- reconfirmación documental `30790197401` — `success`;
- artefacto limpio `stepbible-jonah-importer-validation`, ID `8846702429`;
- digest `sha256:ec6daf133ce112726d8d1ab017a4a386ba9c91240d40d453426cd52e1d770856`;
- borrador `supabase/migration-drafts/20260803060000_importador_payload_tahot_jonas.sql`;
- `docs/FASE_D_IMPORTADOR_TAHOT_JONAS.md`.

No se creó una migración activa, no se aplicó el borrador y no se importó Jonás en Supabase.

### Avance confirmado del Bloque 4 — migración activa de Jonás validada

El borrador transaccional aprobado fue convertido mecánicamente en la migración activa `supabase/migrations/20260803063000_generalizar_importador_payload_tahot_jonas.sql` y validado nuevamente en PostgreSQL 16.

Resultado:

- SHA-256 de la migración activa: `2d1122d5fc2502365c28797e33cd6bc36e2cca1fe0a535e5be94527790fb09d9`;
- función base OBA/RUT/HAG/NAM: `69045240e658995cd0e1ba3557e54a2700b623078b36125e73ed1ada64f5139c`;
- función resultante OBA/RUT/HAG/NAM/JON: `0d65c4d8e8ac81368cea6e5b6fd3fb104156cc3e3e3f299426b20752eef7f062`;
- rechazo de payload adulterado y variante artificial: aprobado sin escrituras;
- rollback: aprobado sin residuos;
- importación exacta: 48 textos, 688 palabras visibles, 1,080 ocurrencias, 288 identificadores, 0 variantes y 1 lote;
- segunda ejecución: idempotente;
- permisos: únicamente `service_role` conserva `EXECUTE`;
- reutilización no destructiva de `H3068G` y `H9020`.

Evidencia:

- PR #124;
- commit `cd08de555190b41f158f4cec5a009b61756956f1`;
- workflow `Validar migración activa TAHOT de Jonás`;
- ejecuciones limpias `30791489223` y `30791535253` — `success`;
- `docs/FASE_D_MIGRACION_ACTIVA_JONAS.md`.

### Avance confirmado del Bloque 4 — Jonás importado y auditado en producción

La migración activa fue aplicada de forma controlada y el payload canónico fue importado dos veces con resultado idempotente.

Resultado: 48 textos, 688 palabras visibles, 1,080 ocurrencias, 288 identificadores léxicos, 0 variantes, 1 lote, 0 hashes inválidos y 0 campos editoriales españoles no revisados.

La función activa conserva SHA-256 `0d65c4d8e8ac81368cea6e5b6fd3fb104156cc3e3e3f299426b20752eef7f062`. Abdías, Rut, Hageo y Nahúm conservaron sus conteos. Se reutilizaron 171 entradas sin modificación y se crearon 117 nuevas, sin duplicados.

RLS permanece activo; `anon` y `authenticated` no pueden ejecutar el importador; `service_role` es el único rol autorizado. Los RPC temporales fueron retirados, la función temporal quedó inerte con JWT y la prueba de recuperación pasó con reversión completa.

Evidencia: `docs/FASE_D_JONAS_PRODUCCION.md`.

### Avance confirmado del Bloque 4 — validación funcional de Jonás aprobada

La validación manual de Jonás fue aprobada por el usuario el 2026-08-03.

Cobertura confirmada:

- Jonás 1:1, 2:1, 3:1 y 4:11 revisados en **Biblia → Estudio**;
- las mismas referencias recuperadas correctamente en **Estudio Profundo**;
- hebreo RTL, transliteración, números Strong, lemas, morfología, fuente STEPBible Data y licencia CC BY 4.0 visibles;
- ausencia correcta del panel de variantes, porque el corpus importado de Jonás contiene 0 variantes y 0 casos Qere/Ketiv;
- sin pantallas en blanco, cargas infinitas, errores visibles de hidratación, desbordamientos laterales ni regresiones de interfaz.

Evidencia permanente:

- PR #130 y commit de fusión `f38b8ef3da46f028f581007a72af00ed7db05ee6`;
- `docs/FASE_D_VALIDACION_VISUAL_JONAS_2026-08-03.md`;
- `docs/FASE_D_JONAS_PRODUCCION.md`.

La selección, paquete reproducible, política de afijos, payload, importador, migración activa, importación productiva, auditoría técnica, recuperación autenticada y visualización funcional de Jonás están completas.

### Cierre confirmado del Bloque 4 — Comparaciones y herramientas ampliadas

La auditoría consolidada del Bloque 4 quedó aprobada y fusionada mediante el PR #132, commit de fusión `5826b544f703a3487f33e485a2fbc6f6c2de3215`.

El cierre confirma:

- cobertura contextual completa para 66 libros y 1,189 capítulos;
- corpus textual completo del Nuevo Testamento, con 27 libros, 7,958 referencias TAGNT, 138,096 palabras base, 4,000 lecturas adicionales y 6,409 variantes documentadas;
- cuatro fuentes TAHOT verificadas para los 39 libros del Antiguo Testamento y 23,261 referencias fuente;
- cinco libros completos del Antiguo Testamento importados y validados: Abdías, Rut, Hageo, Nahúm y Jonás;
- 239 textos, 3,430 palabras visibles, 5,279 ocurrencias y 43 variantes en ese piloto completo del Antiguo Testamento;
- fuentes, atribuciones, licencias, hashes, importadores, idempotencia, RLS, permisos y recuperación segura documentados;
- visualización funcional aprobada en **Biblia → Estudio** y **Estudio Profundo**;
- ausencia de conexión de los datos textuales y léxicos a proveedores de IA;
- ausencia de contenido editorial español presentado como revisado cuando no lo está.

Evidencia permanente: `docs/FASE_D_AUDITORIA_CIERRE_BLOQUE_4.md`.

El Bloque 4 queda oficialmente **COMPLETADO — 2026-08-03**.

### Bloque activo

**Bloque 5 — Cronologías y mapas.**

El primer incremento autorizado debe:

- inventariar las cronologías, mapas, coordenadas, componentes y fuentes geográficas ya existentes en el repositorio;
- definir el modelo mínimo para eventos, periodos, lugares, relaciones bíblicas, fuentes y nivel de certeza;
- evaluar fuentes compatibles con las reglas de atribución, licencia y privacidad del Bloque 2;
- reutilizar la navegación de **Biblia → Estudio** y **Estudio Profundo**, sin crear una sección duplicada;
- no importar todavía corpus geográficos o cronológicos completos;
- no conectar estos datos a la IA;
- no usar APIs externas de pago ni realizar escrituras en producción durante el diagnóstico inicial.

No avanzar al Bloque 6 hasta que cronologías y mapas estén documentados, implementados, validados funcionalmente y registrados aquí.
