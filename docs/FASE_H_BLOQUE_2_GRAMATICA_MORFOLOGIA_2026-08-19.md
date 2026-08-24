# FASE H — BLOQUE 2 — GRAMÁTICA Y MORFOLOGÍA VERIFICADA — 2026-08-19

## Propósito

Documentar la evidencia read-only utilizada para ampliar FASE H / Bloque 2 sin inventar raíces, traducciones ni categorías morfológicas inexistentes en la importación actual.

Este documento complementa `docs/FASE_H_CHECKPOINT_ACTUAL.md`. El maestro sigue siendo `__VIDA_INTERNACIONAL.md`.

## Estado formal

- FASE H activa.
- Bloque 1 completado y aprobado.
- Bloque 2 — Fundamentos de lectura y gramática progresiva — activo.
- PR #286 permanece DRAFT y sin merge.
- No iniciar FASE I.
- No hubo migraciones, DDL, RLS, grants, roles ni cambios de datos durante esta auditoría.
- Todas las consultas de Supabase fueron exclusivamente read-only.

## 1. Prefijos y sufijos reales del corpus

Sobre ocurrencias hebreas aprobadas y habilitadas se verificó:

- `token_kind = prefix`: 120,154 componentes.
- `token_kind = suffix`: 40,477 componentes.
- `token_kind = word`: 300,370 componentes.
- `token_kind = connector`: 8 componentes.

Entre los prefijos más frecuentes aparecen, según la segmentación importada:

- `ו` — conjunción / componente secuencial según código morfológico.
- `ה` — artículo definido y otras funciones marcadas por morfología.
- `ל` — preposición.
- `ב` — preposición.
- `מ` — preposición.
- `כ` — preposición.

La interfaz no debe traducir cada prefijo con una equivalencia española rígida. La morfología identifica la pieza; la traducción final depende del contexto.

## 2. Sufijos pronominales / posesivos

El corpus separa explícitamente sufijos con códigos como:

- `Sp1bs` — primera persona singular común.
- `Sp2ms` — segunda masculina singular.
- `Sp2fs` — segunda femenina singular.
- `Sp3ms` — tercera masculina singular.
- `Sp3fs` — tercera femenina singular.
- `Sp1bp` — primera plural común.
- `Sp2mp` — segunda masculina plural.
- `Sp3mp` — tercera masculina plural.
- `Sp3fp` — tercera femenina plural.

Ejemplos reales reconstruidos a partir de `word_group_key` y `morpheme_index`:

- `בֵּן + ־י → בְּנִי`.
- `פֶּה + ־י → פִּי`.
- `פֶּה + ־וֹ → פִּיו`.
- `אָב + ־וֹ → אָבִיו`.
- `אָב + ־נוּ → אֲבוֹתֵינוּ` en forma plural ligada.

Decisión pedagógica: enseñar **base → sufijo → palabra resultante** y remarcar que la base puede cambiar; no limitarse a pegar visualmente una terminación.

## 3. Género, número y estado constructo

Conteos aproximados en sustantivos hebreos aprobados:

- singular absoluto: 43,693.
- singular constructo: 39,556.
- plural absoluto: 13,485.
- plural constructo: 16,552.
- formas con marca morfológica masculina: 95,029.
- formas con marca morfológica femenina: 29,551.

Ejemplos reales útiles para comparación:

### בֵּן

- absoluta singular: `בֵּן`.
- constructa singular: `בֶּן`.
- absoluta plural: `בָנִים`.
- constructa plural: `בְּנֵי`.

### דָּבָר

- absoluta singular: `דָּבָר`.
- constructa singular: `דְּבַר`.
- absoluta plural: `דְּבָרִים`.
- constructa plural: `דִּבְרֵי`.

Decisión pedagógica: las terminaciones de género/número son pistas útiles, pero el estado constructo y las excepciones demuestran por qué no deben enseñarse como algoritmos infalibles.

## 4. Sistema verbal — cobertura real

Conteos aproximados de binyanim hebreos aprobados:

- Qal: 50,186.
- Hiphil: 9,404.
- Piel: 6,759.
- Niphal: 4,148.
- Hithpael: 1,000.
- Pual: 511.
- Hophal: 417.

El orden pedagógico acordado sigue siendo:

1. Qal.
2. Niphal.
3. Piel / Pual.
4. Hiphil / Hophal.
5. Hithpael.

No presentar siete paradigmas simultáneamente a un principiante.

## 5. Qal — formas verificadas

Cobertura aproximada:

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

El estándar OSHB contempla cohortativo, pero VIDA no debe presentarlo como categoría disponible del corpus hasta aclarar por qué la importación actual no contiene esos códigos.

## 6. Hilo conductor: אָמַר

`H0559` ya existe en la capa pedagógica española como:

- hebreo: `אָמַר`.
- español: `decir`.
- pronunciación pedagógica: `amár`.

Formas reales observadas y reconstruidas desde el corpus:

- qatal 3ms: `אָמַר`.
- qatal 3fs: `אָמְרָה`.
- qatal 2ms: `אָמַרְתָּ`.
- qatal 2fs: `אָמַרְתְּ`.
- qatal 1cs: `אָמַרְתִּי`.
- qatal 3cp: `אָמְרוּ`.
- qatal 2mp: `אֲמַרְתֶּם`.
- qatal 1cp: `אָמַרְנוּ`.
- yiqtol 3ms: `יֹאמַר`.
- yiqtol 3fs: `תֹּאמַר`.
- yiqtol 2ms: `תֹאמַר`.
- yiqtol 2fs: `תֹאמְרִי`.
- yiqtol 1cs: `אֹמַר`.
- yiqtol 1cp: `נֹאמַר`.
- yiqtol 3mp: `יֹאמְרוּ`.
- yiqtol 2mp: `תֹאמְרוּ`.
- imperativo 2ms: `אֱמֹר`.
- participio activo ms: `אֹמֵר`.
- infinitivo constructo con ל: `לֵאמֹר` = `ל` + infinitivo constructo de `אָמַר`.
- wayyiqtol 3ms reconstruido por grupo: `וַיֹּאמֶר`.
- weqatal 2ms reconstruido por grupo: `וְאָמַרְתָּ`.

Referencias de muestra verificadas durante la auditoría:

- qatal `אָמַר`: 1 Crónicas 15:2.
- yiqtol `יֹאמַר`: 1 Reyes 1:36.
- imperativo `אֱמֹר`: 1 Reyes 12:23.
- participio `אֹמֵר`: 1 Reyes 5:5.
- `לֵאמֹר`: 1 Crónicas 4:9.
- `וַיֹּאמֶר`: 1 Crónicas 10:4.
- `וְאָמַרְתָּ`: 1 Crónicas 17:4.

## 7. Cautela temporal obligatoria

VIDA no enseñará:

- qatal = pasado.
- yiqtol = futuro.
- wayyiqtol = «ו + futuro convertido en pasado».

La app enseñará primero **forma morfológica → marcas de persona/género/número → función discursiva → contexto**, y solo entonces la traducción española adecuada para una ocurrencia concreta.

## 8. Ejemplos preparados para binyanim posteriores

- Niphal: `נִלְחַם` de `לָחַם`.
- Piel: `דִּבֶּר` de `דָבַר`.
- Pual: `מְבֹרָךְ` de `בָּרַךְ`.
- Hiphil: formas de `בּוֹא`, por ejemplo `יְבִיאוּ`.
- Hophal: `יוּמַת`, relacionado léxicamente con `מוּת`.
- Hithpael: `הִתְפַּלֵּל`, `מִתְפַּלֵּל`, `יִתְפַּלֵּל` de `פָּלַל`.

Estos ejemplos quedan preparados, pero no deben abrirse visualmente todos a la vez en el primer nivel de verbos.

## 9. Cambios de interfaz incluidos en el paquete

`components/hebreo/GrammarExplorer.tsx` amplía Reglas con:

- filtro `Verbos`.
- fichas para lema/forma, Qal qatal, Qal yiqtol, imperativo, participio, infinitivo constructo, wayyiqtol y weqatal.
- tabla `Base → sufijo → palabra real`.
- estado constructo ampliado con `בֵּן` y `דָּבָר`.
- tabla `Primer mapa verbal: Qal con אָמַר`.
- tabla de persona/número para qatal.
- tabla de persona para yiqtol.
- cautelas visibles contra la equivalencia automática pasado/futuro.

## 10. Regresiones

`tests/regression/fase-h-visual-app.test.mjs` protege:

- 2 reglas Básicas.
- 3 reglas de Prefijos.
- 2 reglas de Nombres.
- 8 reglas de Verbos.
- 2 reglas de Frase.
- 17 reglas totales.
- presencia de las tablas nominales/verbal nuevas.
- presencia de ejemplos `בְּנִי`, `פִּיו`, `וַיֹּאמֶר`, `וְאָמַרְתָּ`, `אֱמֹר`, `אֹמֵר`, `לֵאמֹר`.
- cautelas explícitas contra qatal=pasado y yiqtol=futuro.
- bloqueo pedagógico de raíces no verificadas.

## 11. Gate de prueba móvil pendiente

Cuando Vercel vuelva a aceptar builds, el checklist móvil del Bloque 2 deberá recorrer al menos:

1. Alef-Bet → Sofit.
2. Alef-Bet → Dagesh/Begadkefat.
3. Alef-Bet → Matres lectionis.
4. Vocales → sheva vocal/silencioso.
5. Vocales → qamats qatan.
6. Vocales → pataj furtivo.
7. Vocales → signo → sílaba → palabra → sin niqqud.
8. Reglas → prefijos.
9. Reglas → género/número.
10. Reglas → sufijos posesivos.
11. Reglas → Base → sufijo → palabra real.
12. Reglas → estado constructo.
13. Reglas → filtro Verbos.
14. Verbos → fichas Qal.
15. Verbos → mapa Qal con אָמַר.
16. Verbos → qatal persona/número.
17. Verbos → yiqtol persona/prefijos.
18. Confirmar que ninguna explicación diga simplemente qatal=pasado o yiqtol=futuro.
19. Confirmar centrado transversal, hebreo legible, scroll horizontal útil en tablas y ausencia de card-in-card innecesario.
20. Confirmar que el teclado hebreo opcional y Repaso no se degradaron.

## 12. Estado de Vercel al preparar este paquete

El head anterior continuaba con estado Vercel `failure` por `build-rate-limit`, no por fallo de compilación del proyecto. El último deployment READY observado seguía apuntando a `4a1e4881c5d9f4b9fb1245e366c22328f0bf54b2`.

No hacer deploy manual ni producción. Esperar el desbloqueo y generar un único Preview agrupado.
