# FASE H — CHECKPOINT ACTUAL DE CONTINUIDAD

Fecha del checkpoint: 2026-08-20
Zona horaria de referencia: America/El_Salvador

Este archivo es el handoff operativo estable de FASE H. Existe para que una conversación nueva pueda reconstruir el estado del proyecto aunque el chat anterior termine por límite de contexto.

## 0. Orden obligatorio al retomar

1. Leer primero `__VIDA_INTERNACIONAL.md`.
2. Leer después este archivo completo.
3. Revisar el estado REAL de `main`, la rama activa, PR #286, commits posteriores a este checkpoint, CI y Vercel.
4. Continuar exclusivamente desde el siguiente punto pendiente del bloque activo.
5. No reabrir superficies aprobadas salvo bug reproducible o instrucción expresa del maestro.
6. Si el head real es posterior a este archivo, inspeccionar esos commits antes de asumir que este checkpoint contiene el último cambio.

## 1. Estado formal

- Fase activa: **FASE H — CENTRO DE HEBREO BÍBLICO**.
- Bloque 1 — Línea base de fuentes y arquitectura didáctica: **COMPLETADO Y APROBADO — 2026-08-19**.
- Bloque 2 — Fundamentos de lectura y gramática progresiva: **COMPLETADO Y APROBADO — 2026-08-19**.
- Bloque activo: **Bloque 3 — Cobertura léxica progresiva y búsqueda inteligente**.
- FASE I permanece planificada para después del cierre formal de FASE H.
- No iniciar FASE I.

El cierre de Bloque 2 fue autorizado después de que el usuario recorriera el checklist móvil y confirmara: **“Perfecto! Todo está bien, continuemos”**.

Documento de validación de Bloque 2:

- `docs/FASE_H_BLOQUE_2_CHECKLIST_MOVIL.md`.

## 2. Repositorio / rama / PR

- Repositorio: `vidainternacional/calendario`.
- Rama activa: `agent/fase-h-hebreo-biblico`.
- PR: **#286 — `feat(fase-h): Centro de Hebreo Bíblico`**.
- Base: `main`.
- PR debe permanecer **OPEN · DRAFT · sin merge** hasta aprobación explícita.
- No actualizar producción sin aprobación explícita.

Head técnico validado inmediatamente antes de este checkpoint:

`7e7f3dfe068efee0c97a54e981d88eac42d69d3b`

Ese head contiene el motor de búsqueda progresiva y sus regresiones finales. El commit de este checkpoint es documental y puede ser posterior.

## 3. Reglas operativas que deben preservarse

- Trabajar solo sobre la fase/bloque activos del maestro.
- No reiniciar auditorías generales.
- No reabrir áreas aprobadas salvo bug comprobable.
- Mantener experiencia mobile-first tipo app iOS: limpia, táctil, integrada y sin tarjetas anidadas innecesarias.
- Textos pedagógicos visibles centrados; campos editables pueden conservar alineación funcional RTL/cursor.
- No generar imágenes salvo petición explícita del usuario.
- No hacer cambios sensibles de Supabase/RLS/grants/roles/permisos sin presentar antes cambio exacto, motivo, impacto, riesgo y reversión y obtener aprobación explícita.
- No hacer merge de PR #286 ni producción sin aprobación explícita.
- Evitar commits/deployments innecesarios.
- Teclado hebreo VIDA opcional y apagado por defecto.
- No presentar inferencias lingüísticas como datos de fuente.
- No fabricar traducción literal española del AT.
- No presentar coincidencia contextual RV1909 como equivalencia léxica uno-a-uno.

## 4. Contrato visual/didáctico aprobado

Patrón transversal:

**Fichas para memorizar + Tablas para comparar + Listas nativas para recorrer + Detalle para profundizar**.

Ruta `Aprender` aprobada:

1. Alef-Bet.
2. Vocales.
3. Palabras.
4. Lectura.
5. Reglas.
6. Repaso.

Accesos principales conservados:

- Aprender.
- Materiales y curso.
- Prueba tu progreso.
- Biblia en hebreo.

Documentos de referencia:

- `docs/FASE_H_ARQUITECTURA_UX_APRENDIZAJE_2026-08-18.md`;
- `docs/FASE_H_CONTRATO_VISUAL_APP_HEBREO_2026-08-19.md`;
- `docs/FASE_H_REFERENCIA_PEDAGOGICA_HOSHIAH_NA_2026-08-19.md`.

## 5. Bloque 1 — cerrado y no reabrir salvo bug

Quedaron establecidos y aprobados:

- Alef-Bet de 22 letras, 5 Sofit y filtros pedagógicos;
- Vocales/Niqqud inicial;
- Palabras con catálogo real;
- Lectura con corpus real y RV1909;
- Reglas con Tablas/Fichas/Detalle;
- Repaso local;
- teclado hebreo VIDA opcional;
- centrado pedagógico transversal;
- integración con Estudios sin crear un segundo motor bíblico;
- uso de STEPBible/TAHOT y estructuras bíblicas existentes.

## 6. Bloque 2 — cerrado y aprobado

### Fundamentos de lectura

- Sofit: כ→ך, מ→ם, נ→ן, פ→ף, צ→ץ.
- Gematría ordinaria separada de la convención ampliada 500–900.
- Dagesh/Begadkefat con cautelas históricas/tradicionales.
- Matres lectionis: א, ה, ו, י como función de lectura según contexto, no vocales independientes universales.
- Sheva vocal/silencioso.
- Qamats qatan.
- Pataj furtivo.
- Lectura progresiva signo → sílaba → palabra → palabra sin niqqud.

### Gramática nominal

- artículo, conjunción y prefijos inseparables;
- género/número como pistas, no reglas absolutas;
- sufijos posesivos;
- transformaciones reales, por ejemplo `בֵּן + ־ִי → בְּנִי` y `פֶּה + ־וֹ → פִּיו`;
- estado constructo con formas reales;
- no deducción heurística de raíces.

### Primer mapa verbal Qal

Hilo conductor principal: **אָמַר — decir**.

Se incorporaron:

- lema vs. forma flexionada;
- qatal;
- yiqtol;
- imperativo `אֱמֹר`;
- participio `אֹמֵר`;
- infinitivo constructo `לֵאמֹר`;
- wayyiqtol;
- weqatal;
- persona/género/número mediante tablas.

Cautelas obligatorias:

- no enseñar `qatal = pasado`;
- no enseñar `yiqtol = futuro`;
- no enseñar `wayyiqtol = ו + futuro convertido en pasado`.

### Repaso

Repaso incluye:

- Mixto;
- Letras;
- Vocales;
- Palabras;
- Lectura;
- Reglas;
- Verbos.

Continúa local/no persistente y no pretende guardar progreso real todavía.

### Raíces

Auditoría read-only confirmó:

- `biblical_lexical_entries` no tiene columna de raíz explícita;
- metadata tampoco entrega una raíz explícita verificable;
- VIDA no elimina prefijos/sufijos ni toma tres consonantes para fabricar una raíz.

Documento:

- `docs/FASE_H_BLOQUE_2_RAICES_AUDITORIA_2026-08-19.md`.

## 7. Bloque 3 — objetivo activo

Objetivo: hacer que `Palabras` abarque más búsquedas y que las resoluciones verificadas puedan reutilizarse con el tiempo, **sin convertir lo aprendido por el buscador en un segundo léxico autoritativo**.

El usuario preguntó específicamente si la base puede actualizarse para que, cuando alguien busque una palabra, VIDA la resuelva y posteriormente cubra esa búsqueda de forma más automática. Se propuso un índice derivado y el usuario respondió **“Ok avancemos”**, autorizando el diseño sensible presentado.

## 8. Buscador previo al Bloque 3

Antes de este bloque el catálogo ya resolvía:

- lema hebreo, ignorando niqqud;
- Strong;
- español curado;
- `display_gloss_es` aprobada;
- fallback contextual español mediante RV1909 + ocurrencias hebreas del mismo versículo.

El fallback contextual ya protegía la semántica mostrando una nota equivalente a:

`Relacionado con «búsqueda»` y aclarando que no es equivalencia uno-a-uno mientras no exista glosa española aprobada.

Problema anterior: la resolución contextual se recalculaba cada vez; la base no aprendía/reutilizaba esa resolución.

## 9. Migración sensible aprobada y aplicada

Migración aplicada en Supabase:

`fase_h_busqueda_lexica_progresiva`

Versión registrada:

`20260820060448`

Archivo versionado:

`supabase/migrations/20260820060448_fase_h_busqueda_lexica_progresiva.sql`

Tabla creada:

`public.biblical_hebrew_search_resolutions`

### Campos

- `id uuid`;
- `search_key text`;
- `search_kind`: `spanish | hebrew | transliteration | strong`;
- `lexical_entry_id` FK → `biblical_lexical_entries(id)`;
- `relation_kind`: `lemma | strong | curated_spanish | editorial_spanish | transliteration | inflected_form | contextual`;
- `confidence` 0–100;
- `evidence_count`;
- `provenance jsonb`;
- `status`: `derived | approved | rejected`;
- `enabled`;
- timestamps.

Unicidad:

`search_key + search_kind + lexical_entry_id + relation_kind`.

### Separación del léxico fuente

La tabla es un **índice derivado y reversible**.

No modifica:

- lema;
- Strong;
- glosa fuente;
- definición;
- `display_gloss_es`;
- `review_status`;
- `enabled` de `biblical_lexical_entries`.

Eliminar o dejar de consultar el índice devuelve el buscador al motor previo sin pérdida del corpus.

## 10. Seguridad del índice derivado

Verificado después de aplicar la migración:

- RLS: **ON**;
- `anon`: sin acceso;
- `authenticated`: **SELECT solamente**;
- `service_role`: escritura administrativa/server-only;
- no existen políticas INSERT/UPDATE/DELETE para `authenticated`;
- SELECT exige cuenta activa y entrada hebrea vinculada aprobada/habilitada;
- no existe `profile_id`, `user_id`, `searched_by`, `created_by` ni identidad equivalente;
- `provenance` está destinada solo a evidencia técnica de resolución y no a historial personal.

La escritura se realiza desde `lib/supabase/service.ts`, que está marcado `server-only` y utiliza `SUPABASE_SERVICE_ROLE_KEY` solo del lado servidor.

### Revisión de advisors post-DDL

Se ejecutaron advisors de seguridad y rendimiento después de la migración.

Resultado relevante para la tabla nueva:

- no apareció advertencia nueva de RLS/permisos para `biblical_hebrew_search_resolutions`;
- los dos índices nuevos aparecen temporalmente como `unused_index` porque la tabla todavía tiene 0 filas antes de la prueba funcional; esto no es un fallo y se reevaluará después de uso real;
- los demás avisos reportados pertenecen a estructuras históricas fuera del alcance de Bloque 3 y no se reabren aquí.

## 11. Motor progresivo implementado

Archivo:

`lib/hebreo/word-catalog.ts`

### Escritura de resoluciones

`persistSearchResolutions()`:

- normaliza la clave;
- recibe candidatos respaldados por el motor;
- escribe con `createServiceClient()`;
- hace upsert solo sobre `biblical_hebrew_search_resolutions`;
- guarda relación, confianza, evidencia y procedencia;
- una falla de escritura de caché no debe romper el resultado de búsqueda.

### Lectura reutilizable

`cachedResolutionSearch()`:

- busca la clave normalizada + tipo;
- ordena por confianza/evidencia;
- vuelve a cargar las entradas desde `biblical_lexical_entries` aprobadas;
- las relaciones contextuales siguen mostrando la cautela contextual cuando no existe glosa española aprobada.

### Hebreo directo

- búsqueda de lema conserva comportamiento sin niqqud;
- una resolución directa puede registrarse como `lemma`.

### Strong

- se normaliza a formato `H...`;
- una resolución directa puede registrarse como `strong`.

### Español directo

- primero usa el vocabulario español pedagógico curado;
- después `display_gloss_es` aprobada;
- relaciones registradas como `curated_spanish` o `editorial_spanish`.

### Español contextual

- usa RV1909 aprobada;
- recupera referencias donde aparece el término;
- obtiene ocurrencias hebreas de esos versículos;
- rankea por evidencia/frecuencia;
- solo guarda candidatos contextuales reutilizables con evidencia suficiente;
- mantiene explícitamente que la relación no es una traducción uno-a-uno.

### Forma hebrea flexionada → lema

Nuevo resolver `inflectedHebrewSearch()`.

La heurística de prefijos/sufijos **solo genera candidatos de búsqueda**. No se acepta una relación por esa heurística.

La verificación real:

1. localiza morfemas candidatos en `biblical_word_occurrences`;
2. utiliza `word_group_key`;
3. reúne todos los morfemas del mismo grupo;
4. ordena por `morpheme_index`;
5. reconstruye la superficie completa;
6. elimina únicamente marcas de vocalización/cantillación para comparar consonantes;
7. acepta la relación solo si la palabra reconstruida coincide exactamente con la entrada buscada;
8. retorna el `lexical_entry_id` real del morfema tipo `word`.

Una forma como `וַיֹּאמֶר`/`ויאמר` puede por tanto llevar al lema aprobado `אָמַר` (`H0559`) sin afirmar una raíz inventada.

Relación guardada: `inflected_form`.

### Transliteración

Nuevo resolver `transliterationSearch()`:

- usa `biblical_word_occurrences.occurrence_transliteration`;
- normaliza mayúsculas, diacríticos, puntos/espacios/puntuación;
- descubre candidatos y después exige coincidencia normalizada exacta;
- rankea por frecuencia;
- guarda relación `transliteration`.

### Orden latino conservador

Para proteger al usuario hispanohablante:

1. español directo aprobado/curado;
2. resolución española ya guardada;
3. fallback contextual RV1909;
4. resolución de transliteración ya guardada;
5. búsqueda nueva por transliteración.

Así una palabra española conocida tiene prioridad sobre una coincidencia accidental de transliteración.

## 12. Regresiones de Bloque 3

Nuevo archivo:

`tests/regression/fase-h-busqueda-lexica-progresiva.test.mjs`

Protege:

- separación índice derivado ↔ léxico autoritativo;
- RLS/permisos;
- ausencia de identidad personal;
- escritura mediante service-role server-only;
- reconstrucción exacta de forma flexionada;
- transliteración desde ocurrencias aprobadas;
- cautela contextual RV1909;
- consulta de caché antes de los fallbacks costosos.

También se alinearon guardias históricas que antes prohibían cualquier escritura de base. Ahora permiten únicamente la escritura derivada aprobada y siguen prohibiendo escrituras sobre `biblical_lexical_entries`.

## 13. Validación técnica actual

Head técnico:

`7e7f3dfe068efee0c97a54e981d88eac42d69d3b`

GitHub Actions:

- CI temporal **#2374 — SUCCESS**;
- regresiones: **270/270 SUCCESS**;
- lint: **SUCCESS**;
- build Next.js: **SUCCESS**;
- validador maestro #122: **SUCCESS**;
- TAHOT Obadías #273: **SUCCESS**;
- esquema observado TAHOT #251: **SUCCESS**.

## 14. Vercel / Preview

El deployment de producto más reciente con el motor de Bloque 3 está READY:

- deployment: `dpl_H4HHMvW1kB7VnTDcmEgKeReikz8m`;
- commit: `8d963256c377b6bc3de47633289cf9be2666ee85`;
- estado: **READY**;
- source: git;
- alias de rama asignado sin error.

Preview:

`https://calendario-git-agent-fase-h-hebreo-biblico-vida-internacional.vercel.app/estudios/hebreo`

Los tres commits posteriores hasta `7e7f3dfe…` modifican únicamente archivos de regresión. `GitHub.compare_commits(8d963… → 7e7f3dfe…)` confirmó que no existen diferencias de producto entre el deployment READY y el head técnicamente validado.

## 15. Estado del índice antes de prueba funcional

Consulta read-only posterior a CI:

`select count(*) from biblical_hebrew_search_resolutions`

Resultado:

**0 filas**.

Esto es intencional: no se sembraron asociaciones manualmente. El objetivo de la prueba funcional es demostrar que una búsqueda real desde una cuenta VIDA crea la resolución derivada automáticamente.

## 16. Gate funcional inmediato de Bloque 3

No cerrar Bloque 3 todavía.

Se necesita una prueba real desde el Preview con sesión VIDA. Casos recomendados:

1. **Español directo:** `rey`.
2. **Hebreo lema sin niqqud:** `מלך`.
3. **Strong:** `H4428`.
4. **Forma flexionada:** `ויאמר` o `וַיֹּאמֶר`; debe llevar a `אָמַר` / H0559.
5. **Transliteración:** usar una forma no ambigua del corpus; si una búsqueda coincide con una palabra española, español conserva prioridad.
6. **Español contextual:** una búsqueda sin glosa directa debe conservar la etiqueta/notificación contextual y no fingir equivalencia uno-a-uno.

Después de ejecutar esas búsquedas, hacer una consulta read-only a `biblical_hebrew_search_resolutions` y verificar:

- nuevas filas creadas automáticamente;
- `search_kind`/`relation_kind` correctos;
- confianza/evidencia razonables;
- `provenance` técnica;
- ausencia de identidad personal;
- repetir una búsqueda reutiliza la resolución guardada.

Si la prueba pasa, documentar la evidencia. No cerrar Bloque 3 hasta decidir si quedan mejoras de cobertura dentro del alcance del maestro.

## 17. Puntos de FASE H todavía pendientes después de Bloque 3

Sin asumir orden futuro hasta que el maestro lo documente, el alcance general de FASE H todavía contempla:

- `Prueba tu progreso` como evaluación real con corrección/puntuación/recomendación;
- progreso personal persistente, con propuesta separada de privacidad/RLS antes de cualquier Supabase sensible;
- pronunciación/audio con metodología y licencia confiables;
- `Biblia en hebreo` como lector completo del AT hebreo y segmentos arameos con ayudas graduables;
- mejora adicional del diccionario si la validación de Bloque 3 descubre vacíos reales;
- verificación/administración de materiales y los 11 videos aportados por el usuario;
- validación integral final de FASE H;
- cierre formal de FASE H;
- solo después FASE I.

## 18. Fuentes/datos que deben seguir reutilizándose

- `biblical_verse_texts`;
- `biblical_word_occurrences`;
- `biblical_lexical_entries`;
- STEPBible / STEPBible-Data / TAHOT, CC BY 4.0;
- morfología y transliteración existentes;
- RV1909 de dominio público como traducción española de comparación/contexto.

No crear un segundo corpus bíblico ni un léxico paralelo autoritativo.

## 19. Prompt mínimo de emergencia

Si el chat termina por límite, iniciar la nueva conversación con:

> Continuamos VIDA Internacional. Lee primero `__VIDA_INTERNACIONAL.md` y después `docs/FASE_H_CHECKPOINT_ACTUAL.md` del repositorio `vidainternacional/calendario`. Verifica el estado real de `main`, la rama activa, PR #286, CI, Vercel, Supabase y commits posteriores al checkpoint. Continúa exclusivamente desde el siguiente punto pendiente documentado. No reinicies auditorías generales, no reabras partes aprobadas y no hagas cambios sensibles de Supabase, merge ni producción sin mi aprobación explícita.

## 20. Regla de mantenimiento

Antes de cerrar una sesión importante, cambiar de bloque, fusionar PR o cuando exista riesgo de agotar el límite:

- actualizar este mismo archivo;
- mantener `__VIDA_INTERNACIONAL.md` como autoridad formal de fase/bloque;
- registrar aquí head, CI, Vercel, Supabase, decisiones y gate funcional;
- no crear checkpoints paralelos salvo hito histórico deliberado.
