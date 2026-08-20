# FASE H — CHECKPOINT ACTUAL DE CONTINUIDAD

Fecha del checkpoint: 2026-08-19
Zona horaria de referencia: America/El_Salvador

Este archivo es el handoff operativo estable de FASE H. Existe para que una conversación nueva pueda reconstruir el estado del proyecto aunque el chat anterior termine por límite de contexto.

## 0. Orden obligatorio al retomar

1. Leer primero `__VIDA_INTERNACIONAL.md`.
2. Leer después este archivo completo.
3. Revisar el estado REAL de `main`, la rama activa, PR #286, commits posteriores a este checkpoint, CI y Vercel.
4. Continuar exclusivamente desde el siguiente punto pendiente de la fase/bloque activos.
5. No reabrir superficies ya aprobadas salvo bug reproducible o instrucción expresa del maestro.
6. Si el head real es posterior a este archivo, inspeccionar esos commits antes de asumir que el checkpoint es el último cambio.

## 1. Estado formal

- Fase activa: **FASE H — CENTRO DE HEBREO BÍBLICO**.
- Bloque 1: **COMPLETADO Y APROBADO — 2026-08-19**.
- Bloque activo: **Bloque 2 — Fundamentos de lectura y gramática progresiva**.
- FASE I permanece planificada para después del cierre formal de FASE H.
- No iniciar FASE I.

El maestro ya refleja Bloque 1 cerrado y Bloque 2 activo.

## 2. Repositorio / rama / PR

- Repositorio: `vidainternacional/calendario`.
- Rama: `agent/fase-h-hebreo-biblico`.
- PR: **#286 — `feat(fase-h): Centro de Hebreo Bíblico`**.
- Estado: OPEN · DRAFT · no mergeado.
- Base: `main`.
- Último head funcional validado antes de este commit documental: `b74b33a1d80dfeaad734da1337da8f8e86eb659d`.
- Commit anterior de gramática: `3b6ee64ce3afb9163d70eaa40d40ec268ae8b338`.
- Corrección de regresión: `6563e753d9bab8302a22580b3dd6ecfe553a1877`.
- Repaso avanzado: `b74b33a1d80dfeaad734da1337da8f8e86eb659d`.
- No fusionar PR #286 sin aprobación explícita del usuario.
- No actualizar producción sin aprobación explícita del usuario.

## 3. Reglas del usuario / guardias

- Trabajar únicamente la fase y bloque activos del maestro.
- No reiniciar auditorías generales.
- No modificar áreas ya aprobadas salvo bug comprobable.
- Mantener calidad visual mobile-first tipo app iOS: limpia, táctil, integrada, sin card-in-card innecesario.
- Todos los textos pedagógicos de Hebreo Bíblico deben permanecer visualmente centrados; buscadores/campos de escritura pueden conservar la alineación funcional necesaria para RTL/cursor.
- No generar imágenes salvo petición explícita del usuario.
- No hacer cambios sensibles de Supabase/RLS/grants/roles/permisos/funciones sin presentar cambio exacto, motivo, impacto, riesgo y reversión y obtener aprobación explícita.
- No inventar raíces, traducciones, audio ni datos lingüísticos.
- Evitar commits/deployments innecesarios.
- No hacer deploy manual de Vercel si Git integration funciona.

## 4. Contrato visual aprobado

Documento: `docs/FASE_H_CONTRATO_VISUAL_APP_HEBREO_2026-08-19.md`.

Patrón:

**Fichas para memorizar + Tablas para comparar + Listas nativas para recorrer + Detalle para profundizar**.

Reglas visuales:

- hebreo/signo como información primaria;
- español y explicación como capa secundaria;
- superficies integradas con separadores y jerarquía tipográfica;
- tablas móviles pueden usar scroll horizontal antes que comprimir el hebreo;
- evitar doble borde/ring;
- evitar espacios vacíos sin función didáctica/táctil;
- mantener altura de línea suficiente para niqqud;
- botones con áreas táctiles cómodas;
- no levantar la navegación inferior global sobre el teclado iOS.

El centrado transversal vive en `app/(app)/estudios/hebreo/hebreo.module.css` y aplica también a nuevas superficies.

## 5. Navegación y módulos actuales

Accesos superiores:

- Aprender.
- Materiales y curso.
- Prueba tu progreso.
- Biblia en hebreo.

Ruta Aprender:

1. Alef-Bet.
2. Vocales.
3. Palabras.
4. Lectura.
5. Reglas.
6. Repaso.

## 6. Bloque 1 — ya cerrado y no reabrir sin bug

### Alef-Bet

- 22 letras base.
- 5 formas finales.
- Tarjetas · Lista · Detalle.
- filtros pedagógicos preservados.
- expansión/retracción en la misma fila.
- flip frente/reverso.
- Shin/Sin permanecen una sola letra base.
- letras y detalle con jerarquía visual grande.

### Vocales

- 12 signos.
- Básicas = 8.
- Reducidas = 3.
- Sheva = 1.
- Todas = 12.
- Tarjetas · Lista · Detalle.
- la Lista aplica el signo sobre una consonante real.
- no atribuir gematría al niqqud.

### Palabras

- catálogo real.
- categorías, búsqueda y paginación.
- Con niqqud / Sin niqqud.
- Tarjetas · Lista · Detalle.
- búsqueda hebrea tolera omitir niqqud.
- búsqueda española actual usa glosas preparadas y, como fallback, contexto RV1909 con etiqueta cautelosa; una coincidencia contextual no debe presentarse como equivalencia léxica uno-a-uno.

### Lectura

- frases/oraciones/versículos reales del corpus.
- filtros por longitud/nivel.
- Con niqqud / Sin niqqud.
- Tarjetas · Lista · Detalle.
- búsqueda/paginación.
- comparación RV1909.

### Reglas

- Tablas · Fichas · Detalle.
- prefijos, género/número, posesivos, constructo, Qere/Ketiv y reglas iniciales.

### Repaso base

- sesión local breve.
- Mostrar respuesta.
- Lo sé · Necesito practicar · Repasar después.
- resumen solo de la sesión.
- no existe progreso persistente todavía.

### Teclado hebreo VIDA

- 22 letras + 5 formas finales + niqqud.
- escribe en el último input/textarea enfocado y en práctica libre.
- compatible con teclado nativo del teléfono; la app no puede forzar el cambio del teclado del sistema.
- apagado por defecto.
- activable/desactivable desde la zona superior.
- acceso flotante solo cuando está activo y colocado más arriba de la navegación inferior.
- práctica libre no persistente.
- no toca Supabase.

## 7. Bloque 2 — fundamentos ya implementados

### Sofit

Comparación normal → final:

- כ → ך
- מ → ם
- נ → ן
- פ → ף
- צ → ץ

Incluye sonido y valor. Los valores 500–900 se presentan únicamente como **convención ampliada de gematría**, separados del valor ordinario.

### Dagesh / Begadkefat

Comparaciones:

- ב / בּ
- ג / גּ
- ד / דּ
- כ / כּ
- פ / פּ
- ת / תּ

La explicación distingue aprendizaje inicial de diferencias históricas/tradicionales y no afirma que todas las tradiciones modernas mantengan los mismos contrastes fonéticos.

### Matres lectionis

- א
- ה
- ו
- י

Se enseñan como consonantes que en ciertos contextos ayudan a señalar vocales, no como vocales independientes universales.

### Niqqud avanzado

Implementado en `NiqqudReadingRules.tsx`:

- sheva vocal vs silencioso;
- qamats común vs qamats qatan;
- pataj furtivo;
- consonante → consonante+vocal → sílaba → palabra → palabra sin niqqud.

Ejemplos clave:

- sheva vocal inicial: `בְּרֵאשִׁית`.
- sheva silencioso: `מַלְכָּה` → lectura orientativa mal-ká.
- qamats qatan: `כָּל` → kol.
- pataj furtivo: `רוּחַ`, `גָּבוֹהַּ`.
- lectura gradual: `מ → מֶ → לֶ → מֶלֶךְ → מלך`.

Cautela: estas son reglas pedagógicas iniciales; no convertirlas en algoritmos universales sin contexto/estructura/tradición.

## 8. Auditoría nominal/morfológica read-only

No hubo escrituras de Supabase. Proyecto consultado: `calendariovida` / ref `atjtjpchslxbseayzflz`.

Componentes hebreos aprobados aproximados:

- `word`: 300,370.
- `prefix`: 120,154.
- `suffix`: 40,477.
- `connector`: 8.

Sustantivos aproximados:

- singular absoluto: 43,693.
- singular constructo: 39,556.
- plural absoluto: 13,485.
- plural constructo: 16,552.
- formas con marca masculina: 95,029.
- formas con marca femenina: 29,551.

Ejemplos reales de posesivos/segmentación:

- `בֵּן + ־ִי → בְּנִי`.
- `פֶּה + ־ִי → פִּי`.
- `פֶּה + ־וֹ → פִּיו`.
- `אָב + ־וֹ → אָבִיו`.
- `אָב + ־נוּ → אֲבוֹתֵינוּ` en forma plural ligada.

Ejemplos reales de constructo:

`בֵּן`
- absoluta sg: `בֵּן`.
- constructa sg: `בֶּן`.
- absoluta pl: `בָנִים`.
- constructa pl: `בְּנֵי`.

`דָּבָר`
- absoluta sg: `דָּבָר`.
- constructa sg: `דְּבַר`.
- absoluta pl: `דְּבָרִים`.
- constructa pl: `דִּבְרֵי`.

Decisión pedagógica: enseñar **base → cambio → resultado**, no “pegar una terminación” como regla universal.

Documento detallado: `docs/FASE_H_BLOQUE_2_GRAMATICA_MORFOLOGIA_2026-08-19.md`.

## 9. Auditoría de raíces — decisión vigente

Read-only sobre `biblical_lexical_entries`, `biblical_word_occurrences` y metadata.

Resultado:

- no existe columna de raíz explícita;
- metadata tampoco aporta raíz léxica explícita verificable;
- no deducir raíces eliminando prefijos/sufijos ni tomando tres consonantes;
- raíces quedan bloqueadas hasta incorporar una fuente que las entregue de forma explícita, trazable y compatible.

Documento: `docs/FASE_H_BLOQUE_2_RAICES_AUDITORIA_2026-08-19.md`.

## 10. Sistema verbal — auditoría y UI Qal ya implementadas

Cobertura aproximada de binyanim en hebreo aprobado:

- Qal: 50,186.
- Hiphil: 9,404.
- Piel: 6,759.
- Niphal: 4,148.
- Hithpael: 1,000.
- Pual: 511.
- Hophal: 417.

Formas Qal aproximadas:

- wayyiqtol: 11,499.
- qatal: 9,677.
- yiqtol: 8,609.
- participio activo: 5,526.
- infinitivo constructo: 4,901.
- weqatal: 4,259.
- imperativo: 2,876.
- participio pasivo: 978.
- yusivo: 775.
- infinitivo absoluto: 489.
- cohortativo `Vqh`: 0 en la importación actual.

OSHB contempla cohortativo, pero VIDA no debe mostrarlo como dato disponible del corpus hasta aclarar por qué la importación actual no contiene `Vqh`.

### Hilo conductor

`H0559`:

- lema: `אָמַר`.
- español pedagógico ya existente: `decir`.
- pronunciación pedagógica: `amár`.

Formas verificadas usadas en la UI:

Qatal:
- `אָמַר` 3ms.
- `אָמְרָה` 3fs.
- `אָמַרְתָּ` 2ms.
- `אָמַרְתְּ` 2fs.
- `אָמַרְתִּי` 1cs.
- `אָמְרוּ` 3cp.
- `אֲמַרְתֶּם` 2mp.
- `אָמַרְנוּ` 1cp.

Yiqtol:
- `יֹאמַר` 3ms.
- `תֹּאמַר` / `תֹאמַר` 3fs/2ms según morfología/contexto.
- `תֹאמְרִי` 2fs.
- `אֹמַר` 1cs.
- `נֹאמַר` 1cp.
- `יֹאמְרוּ` 3mp.
- `תֹאמְרוּ` 2mp.

Otras:
- imperativo `אֱמֹר`.
- participio activo `אֹמֵר`.
- infinitivo constructo con ל: `לֵאמֹר`.
- wayyiqtol reconstruido por grupo: `וַיֹּאמֶר`.
- weqatal reconstruido por grupo: `וְאָמַרְתָּ`.

Referencias de muestra verificadas:

- qatal `אָמַר`: 1 Crónicas 15:2.
- yiqtol `יֹאמַר`: 1 Reyes 1:36.
- imperativo `אֱמֹר`: 1 Reyes 12:23.
- participio `אֹמֵר`: 1 Reyes 5:5.
- `לֵאמֹר`: 1 Crónicas 4:9.
- `וַיֹּאמֶר`: 1 Crónicas 10:4.
- `וְאָמַרְתָּ`: 1 Crónicas 17:4.

### UI implementada en Reglas

`GrammarExplorer.tsx` ahora incluye filtro:

**Básicas · Prefijos · Nombres · Verbos · Frase · Todas**.

Conteo de fichas protegido:

- Básicas: 2.
- Prefijos: 3.
- Nombres: 2.
- Verbos: 8.
- Frase: 2.
- Total: 17.

Tablas nuevas/ampliadas:

- Base → sufijo → palabra real.
- Estado constructo con ejemplos reales.
- Primer mapa verbal Qal con `אָמַר`.
- Qatal: persona/número.
- Yiqtol: persona/prefijos.

Cautelas obligatorias visibles:

- no enseñar `qatal = pasado`.
- no enseñar `yiqtol = futuro`.
- no enseñar `wayyiqtol = ו + futuro convertido en pasado`.
- forma morfológica → marcas personales → función discursiva → contexto → traducción final.

### Binyanim posteriores preparados pero no abiertos todos al principiante

- Niphal: `נִלְחַם` de `לָחַם`.
- Piel: `דִּבֶּר` de `דָבַר`.
- Pual: `מְבֹרָךְ` de `בָּרַךְ`.
- Hiphil: formas de `בּוֹא`, por ejemplo `יְבִיאוּ`.
- Hophal: `יוּמַת` relacionado con `מוּת`.
- Hithpael: `הִתְפַּלֵּל`, `מִתְפַּלֵּל`, `יִתְפַּלֵּל` de `פָּלַל`.

Orden pedagógico futuro: Qal → Niphal → Piel/Pual → Hiphil/Hophal → Hithpael. No mostrar siete paradigmas de golpe.

## 11. Repaso — integración avanzada ya implementada

`ReviewExplorer.tsx` conserva las áreas anteriores y añade:

- Mixto.
- Letras.
- Vocales.
- Palabras.
- Lectura.
- Reglas.
- **Verbos**.

Mixto usa una selección deliberada de hasta 8 elementos e incluye al menos una práctica verbal.

Prácticas nuevas de Vocales:

- sheva vocal en `בְּרֵאשִׁית`.
- sheva silencioso en `מַלְכָּה`.
- qamats qatan en `כָּל`.
- pataj furtivo en `רוּחַ`.

Prácticas nuevas de Reglas:

- `בְּנִי` — base + sufijo.
- `אָבִיו` — sufijo 3ms.
- `דָּבָר → דְּבַר` — absoluta → constructa.
- `בְּנֵי` — plural constructo.

Prácticas de Verbos — 8 elementos:

1. qatal vs yiqtol: `אָמַר · יֹאמַר`.
2. qatal 1cs: `אָמַרְתִּי`.
3. yiqtol 1cs: `אֹמַר`.
4. imperativo: `אֱמֹר`.
5. participio: `אֹמֵר`.
6. infinitivo constructo: `לֵאמֹר`.
7. wayyiqtol: `וַיֹּאמֶר`.
8. weqatal: `וְאָמַרְתָּ`.

Sigue sin persistencia, sin Supabase y sin audio. Las marcas solo existen durante la sesión.

## 12. Buscador/diccionario — dirección acordada pendiente de motor profundo

Arquitectura objetivo:

`Español → léxico inverso multisentido → lema hebreo → morfología + ocurrencias → traducciones como contexto`.

Principios:

- el lema hebreo es la unidad central;
- español funciona como búsqueda inversa hacia candidatos/sentidos;
- una traducción bíblica no es autoridad léxica única;
- morfología y ocurrencias respaldan resultados;
- RV1909 puede servir como contexto aprobado;
- traducciones adicionales requieren licencia/autorización;
- IA puede interpretar consulta/rankear candidatos, pero no inventar significado, raíz o forma.

La evolución profunda de este motor sigue pendiente dentro de FASE H y no debe mezclarse con el cierre del Bloque 2 si el maestro no lo autoriza.

## 13. Fuentes

Reutilizar:

- `biblical_verse_texts`.
- `biblical_word_occurrences`.
- `biblical_lexical_entries`.
- Estudio Profundo.
- morfología existente.
- transliteración.
- metadata fuente/licencia/versificación.

Fuente principal aprobada:

- STEPBible / STEPBible-Data / TAHOT — CC BY 4.0.

Traducción española aprobada:

- RV1909 — dominio público.

No fabricar traducción literal española del AT.

## 14. Referencia pedagógica aportada por el usuario

Documento Hoshiah Na:
`https://www.scribd.com/document/469832642/HEBREO-1-HOSHIAH-NA-CURSOS-DE-HEBREO`

Uso:

- referencia pedagógica/visual;
- no copiar texto/tablas/páginas protegidas;
- contrastar datos con fuentes aprobadas.

Documento VIDA:
`docs/FASE_H_REFERENCIA_PEDAGOGICA_HOSHIAH_NA_2026-08-19.md`.

Los 11 videos aportados siguen en `lib/hebreo/material-apoyo.ts` con `verificacion: 'pendiente'`; no sustituirlos silenciosamente.

## 15. Estado técnico actual validado

Head funcional: `b74b33a1d80dfeaad734da1337da8f8e86eb659d`.

CI temporal:

- run #2356.
- regresiones: SUCCESS.
- lint: SUCCESS.
- build Next.js: SUCCESS.

Validadores del mismo head:

- documento maestro run #113: SUCCESS.
- TAHOT Obadías run #264: SUCCESS.
- esquema observado TAHOT run #242: SUCCESS.

La regresión anterior del commit `3b6ee64c…` era únicamente una expectativa case-sensitive sobre el texto “No deduciremos raíces”; se corrigió en `6563e753…` sin alterar la regla pedagógica.

## 16. Vercel actual

El bloqueo `build-rate-limit` quedó resuelto.

Deployment exacto del head funcional:

- id: `dpl_AWEBo93tmi98577DU9FgmbfqnFRL`.
- commit: `b74b33a1d80dfeaad734da1337da8f8e86eb659d`.
- mensaje: `feat(fase-h): llevar gramática avanzada a Repaso`.
- estado: **READY**.
- source: git.
- aliasError: null.

Branch alias:

`https://calendario-git-agent-fase-h-hebreo-biblico-vida-internacional.vercel.app/estudios/hebreo`

La tarea `Vercel Build Watch` cumplió su objetivo y quedó desactivada para no seguir revisando innecesariamente.

## 17. Gate actual — lo siguiente es checklist móvil, no más auditoría general

El Bloque 2 ya tiene contenido y práctica suficiente para entrar al gate móvil.

Checklist versionado:

`docs/FASE_H_BLOQUE_2_CHECKLIST_MOVIL.md`

El usuario debe recorrerlo en iPhone sobre un Preview cuyo commit coincida con el head validado. El objetivo es clasificar hallazgos como:

- OK.
- VISUAL.
- BUG.

Solo corregir bugs reproducibles o ajustes visuales concretos encontrados en ese recorrido. No reabrir áreas aprobadas sin hallazgo.

Alcance principal del checklist:

- teclado opcional/no regresión;
- centrado transversal;
- Sofit;
- Dagesh/Begadkefat;
- Matres;
- sheva, qamats qatan y pataj furtivo;
- lectura silábica;
- prefijos/género/número;
- posesivos y constructo;
- filtro Verbos;
- Qal con `אָמַר`;
- qatal/yiqtol persona/número;
- Repaso avanzado y área Verbos;
- smoke rápido de Palabras/Lectura;
- móvil/scroll/niqqud/áreas táctiles.

## 18. Cierre esperado de Bloque 2

No marcar completado todavía.

Para proponer su cierre se necesita:

1. head exacto con CI verde;
2. Preview Vercel READY del mismo commit;
3. checklist móvil recorrido;
4. corrección de bugs reproducibles encontrados;
5. aprobación explícita del usuario;
6. actualización formal de `__VIDA_INTERNACIONAL.md`.

Solo después el maestro podrá definir/activar el siguiente bloque de FASE H.

## 19. Pendientes mayores posteriores de FASE H — NO abrir todavía sin maestro

Una vez cerrado formalmente Bloque 2, todavía quedan dentro del alcance general de FASE H:

- convertir `Prueba tu progreso` en evaluación real;
- diseñar progreso personal persistente privado; si requiere Supabase/RLS, presentar propuesta exacta antes de cualquier cambio;
- pronunciación/audio con fuente/metodología confiable y licencia compatible;
- evolucionar `Biblia en hebreo` hacia lector completo del AT hebreo y segmentos arameos con ayudas graduables;
- evolución profunda del diccionario/buscador español↔hebreo;
- verificar/materializar materiales administrables;
- validación integral final en iPhone;
- cierre de FASE H;
- solo después FASE I.

## 20. Documentos de evidencia relevantes

- `__VIDA_INTERNACIONAL.md` — autoridad formal de fase/bloque.
- `docs/FASE_H_CHECKPOINT_ACTUAL.md` — este handoff operativo.
- `docs/FASE_H_CONTRATO_VISUAL_APP_HEBREO_2026-08-19.md`.
- `docs/FASE_H_ARQUITECTURA_UX_APRENDIZAJE_2026-08-18.md`.
- `docs/FASE_H_REFERENCIA_PEDAGOGICA_HOSHIAH_NA_2026-08-19.md`.
- `docs/FASE_H_BLOQUE_2_RAICES_AUDITORIA_2026-08-19.md`.
- `docs/FASE_H_BLOQUE_2_GRAMATICA_MORFOLOGIA_2026-08-19.md`.
- `docs/FASE_H_BLOQUE_2_CHECKLIST_MOVIL.md`.
- `docs/REGLAS_OPERATIVAS_USUARIO.md`.

## 21. Prompt mínimo de emergencia

Si el chat se corta por límite, iniciar uno nuevo con:

> Continuamos VIDA Internacional. Lee primero `__VIDA_INTERNACIONAL.md` y después `docs/FASE_H_CHECKPOINT_ACTUAL.md` del repositorio `vidainternacional/calendario`. Verifica el estado real de `main`, la rama activa, PR #286, commits posteriores al checkpoint, CI y Vercel. Continúa exclusivamente desde el siguiente punto pendiente documentado. No reinicies auditorías generales, no reabras partes aprobadas y no hagas cambios sensibles de Supabase ni merge/producción sin mi aprobación explícita.

El contexto completo debe vivir en documentos versionados, no depender del chat.

## 22. Regla de mantenimiento de este checkpoint

Antes de cerrar una sesión importante, cambiar de bloque, fusionar PR o cuando haya riesgo de alcanzar el límite de conversación:

- actualizar este mismo archivo;
- mantener `__VIDA_INTERNACIONAL.md` como autoridad formal;
- registrar aquí head/CI/Vercel/gate y decisiones relevantes;
- comprobar commits posteriores al checkpoint en una sesión nueva;
- crear un archivo histórico separado solo cuando convenga preservar un hito cerrado.
