# FASE H — CHECKPOINT ACTUAL DE CONTINUIDAD

Fecha del checkpoint: 2026-08-19
Zona horaria de referencia: America/El_Salvador

Este archivo existe para que una conversación nueva pueda reconstruir el estado exacto del proyecto sin depender del historial del chat. Al iniciar una nueva sesión de VIDA Internacional se debe:

1. leer primero `__VIDA_INTERNACIONAL.md`;
2. leer después este archivo completo;
3. verificar el estado REAL de GitHub, PR, CI y Vercel antes de modificar código;
4. continuar únicamente desde el siguiente punto pendiente de la fase/bloque activos;
5. no reabrir superficies ya aprobadas salvo bug comprobable o instrucción expresa del maestro.

## 1. Fase y bloque activos

- Fase activa: **FASE H — CENTRO DE HEBREO BÍBLICO**.
- Bloque 1: **COMPLETADO Y APROBADO — 2026-08-19**.
- Bloque activo: **Bloque 2 — Fundamentos de lectura y gramática progresiva**.
- No iniciar FASE I.

El maestro ya refleja formalmente Bloque 1 cerrado y Bloque 2 activo.

## 2. Repositorio, rama y PR

- Repositorio: `vidainternacional/calendario`.
- Rama activa: `agent/fase-h-hebreo-biblico`.
- PR activo: **#286 — `feat(fase-h): Centro de Hebreo Bíblico`**.
- Estado del PR al crear este checkpoint: **OPEN · DRAFT · no mergeado · mergeable**.
- Base: `main`.
- Head funcional inmediatamente anterior al commit de este checkpoint: `2ad29d617115913427c0e80140172cfd9a29f16e`.
- No fusionar PR #286 sin aprobación explícita del usuario.
- No actualizar producción sin aprobación explícita del usuario.

## 3. Reglas del usuario que deben preservarse

- Trabajar exclusivamente sobre la fase/bloque activos del maestro.
- No reiniciar auditorías generales.
- No volver a trabajar áreas ya aprobadas salvo bug comprobable.
- Mantener calidad visual tipo app móvil/iOS, minimalista, táctil y coherente.
- Evitar tarjetas anidadas innecesarias y espacios vacíos sin función.
- Los textos pedagógicos de Hebreo Bíblico deben permanecer visualmente centrados de forma transversal; buscadores/campos de escritura pueden conservar alineación funcional RTL/cursor.
- No generar imágenes salvo petición explícita del usuario.
- No hacer cambios sensibles de Supabase/RLS/grants/roles/permisos sin presentar previamente el cambio exacto, motivo, impacto, riesgo y reversión y esperar aprobación explícita.
- Evitar deployments/commits innecesarios en Vercel.
- El teclado hebreo VIDA debe ser opcional, apagado por defecto y activable/desactivable por el usuario.

## 4. Estado aprobado de la experiencia de Hebreo Bíblico

### Navegación principal

Dentro de Hebreo Bíblico se conservan:

- Aprender.
- Materiales y curso.
- Prueba tu progreso.
- Biblia en hebreo.

Ruta didáctica actual dentro de Aprender:

1. Alef-Bet.
2. Vocales.
3. Palabras.
4. Lectura.
5. Reglas.
6. Repaso.

### Contrato visual transversal aprobado

Patrón obligatorio:

**Fichas para memorizar + Tablas para comparar + Listas nativas para recorrer + Detalle para profundizar**.

Además:

- el hebreo/signo es información primaria y recibe jerarquía tipográfica fuerte;
- textos de ayuda, explicación, cautela e instrucciones están centrados;
- tablas pueden usar desplazamiento horizontal corto en móvil antes que comprimir hebreo;
- evitar doble borde/ring y card-in-card;
- respetar niqqud con suficiente altura de línea;
- cualquier superficie nueva de FASE H debe seguir este contrato.

Documento asociado: `docs/FASE_H_CONTRATO_VISUAL_APP_HEBREO_2026-08-19.md`.

## 5. Bloque 1 — funcionalidades ya cerradas/aprobadas

### Alef-Bet

- 22 letras.
- filtros existentes preservados.
- Tarjetas · Lista · Detalle.
- fichas grandes y centradas.
- expansión/retracción en la misma fila.
- flip frente/reverso.
- jerarquía tipográfica aumentada.
- listas móviles más parecidas a una superficie nativa y menos a una tabla web comprimida.

### Vocales / Niqqud

- 12 signos actuales.
- filtros Básicas · Reducidas · Sheva · Todas.
- Tarjetas · Lista · Detalle.
- niqqud visible aplicado a consonante real en Lista.
- Básicas = 8; Reducidas = 3; Sheva = 1; Todas = 12.
- no atribuir gematría a signos vocálicos.

### Palabras

- catálogo real existente.
- búsqueda.
- categorías.
- paginación.
- Con niqqud / Sin niqqud.
- Tarjetas · Lista · Detalle.
- hebreo aumentado tipográficamente.
- no usar códigos Strong como sustituto de la experiencia pedagógica.

### Lectura

- frases/oraciones/versículos reales del corpus.
- filtros Iniciales/Cortas/Medias/Largas/Todas.
- Con niqqud / Sin niqqud.
- Tarjetas · Lista · Detalle.
- comparación española RV1909.
- búsqueda y paginación.

### Reglas

- Tablas · Fichas · Detalle.
- prefijos inseparables, género/número, posesivos, constructo, Qere/Ketiv y reglas iniciales ya existentes.
- explicaciones pedagógicas centradas.
- no enseñar una equivalencia española mecánica cuando la función depende del contexto.

### Repaso

Repaso ya no es placeholder. Tiene sesión local breve con:

- Mixto;
- Letras;
- Vocales;
- Palabras;
- Lectura;
- Reglas.

Flujo:

- intentar responder;
- Mostrar respuesta;
- Lo sé;
- Necesito practicar;
- Repasar después.

No existe todavía progreso persistente. No fingir que el resumen local equivale a historial real del usuario.

### Teclado hebreo VIDA

- componente reutilizable dentro del Centro de Hebreo.
- 22 letras + 5 formas finales + niqqud.
- puede escribir en buscadores/campos enfocados y en práctica libre.
- respeta el teclado hebreo nativo del teléfono cuando el usuario lo prefiera.
- la app no puede forzar a iOS/Android a cambiar el teclado nativo del sistema.
- apagado por defecto.
- activable/desactivable desde una herramienta visible en la parte superior del Centro de Hebreo.
- solo cuando está activo aparece el acceso flotante.
- el acceso flotante fue subido para no quedar pegado a la barra inferior.
- práctica libre no persistente.
- no toca Supabase.

## 6. Referencia pedagógica

Referencia aportada por el usuario:

`https://www.scribd.com/document/469832642/HEBREO-1-HOSHIAH-NA-CURSOS-DE-HEBREO`

Uso autorizado dentro de VIDA:

- referencia pedagógica/visual;
- no copiar páginas, tablas ni texto protegido literalmente;
- contrastar datos lingüísticos con fuentes aprobadas.

Ruta pedagógica deseada:

1. Alef-Bet.
2. Sofit.
3. Dagesh / indicaciones de lectura.
4. Niqqud completo.
5. combinaciones y lectura.
6. inseparables.
7. género/número.
8. sufijos posesivos.
9. raíces verificadas.
10. sistema verbal por capas.
11. Qere/Ketiv.
12. lectura bíblica aplicada.

Existen 11 videos aportados por el usuario en `lib/hebreo/material-apoyo.ts`; siguen individualmente con `verificacion: 'pendiente'` hasta revisión específica.

## 7. Bloque 2 — ya implementado en la rama

### Sofit

Se añadieron comparaciones normal → final para:

- כ → ך
- מ → ם
- נ → ן
- פ → ף
- צ → ץ

Incluye sonido y valores. Los valores 500–900 se tratan únicamente como **convención ampliada de gematría**, no como valor ordinario principal.

### Dagesh / Begadkefat

Se prepararon comparaciones pedagógicas:

- ב / בּ
- ג / גּ
- ד / דּ
- כ / כּ
- פ / פּ
- ת / תּ

La enseñanza debe distinguir contrastes pedagógicos actuales de diferencias históricas/tradicionales; no afirmar que todas las tradiciones modernas mantienen el mismo contraste fonético.

### Matres lectionis

Se incorporó la explicación de:

- א
- ה
- ו
- י

como consonantes que en determinados contextos también ayudan a representar/indicar vocales. No llamarlas simplemente “vocales” independientes en todos los contextos.

### Niqqud avanzado

Ya está integrado en la rama:

- sheva vocal vs. silencioso;
- qamats qatan;
- pataj furtivo;
- lectura progresiva signo → sílaba → palabra → palabra sin niqqud.

Cautelas:

- no convertir reglas de sheva en fórmulas universales sin contexto;
- qamats qatan debe distinguirse del qamats común;
- pataj furtivo se explica como vocal pronunciada antes de la consonante gutural final aunque visualmente esté escrita debajo de ella.

## 8. Auditoría de raíces — decisión cerrada por ahora

Se auditó en modo read-only:

- `public.biblical_lexical_entries`;
- `public.biblical_word_occurrences`;
- metadata de entradas hebreas aprobadas.

Resultado:

- no existe columna explícita de raíz;
- metadata tampoco incluye una raíz léxica explícita verificable;
- no se deducirá raíz eliminando prefijos/sufijos ni tomando tres consonantes del lema;
- el subpunto de raíces queda pendiente de una fuente compatible que entregue raíz explícita y trazable.

Documento asociado: `docs/FASE_H_BLOQUE_2_RAICES_AUDITORIA_2026-08-19.md`.

## 9. Auditoría morfológica/verbal read-only — preparada, todavía no implementada visualmente

La morfología aprobada permite continuar el sistema verbal sin inventar raíces.

### Cobertura aproximada de binyanim en hebreo aprobado

- Qal: 50,186 ocurrencias.
- Hiphil: 9,404.
- Piel: 6,759.
- Niphal: 4,148.
- Hithpael: 1,000.
- Pual: 511.
- Hophal: 417.

### Formas Qal relevantes

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
- cohortativo (`Vqh`): 0 en la importación actual.

Cautela: el estándar OSHB contempla cohortativo, pero VIDA no debe mostrarlo como dato disponible del corpus mientras la importación actual no lo identifique.

### Hilo conductor elegido para enseñar Qal

Usar principalmente el lema:

**אָמַר — decir**

porque aparece abundantemente en varias formas y permite comparar el mismo verbo sin mezclar vocabulario.

Formas reales observadas en el corpus incluyen:

- `אָמַר` — qatal.
- `יֹאמַר / תֹאמַר` — yiqtol.
- formas wayyiqtol de אמר.
- formas weqatal de אמר.
- `אֱמֹר` — imperativo.
- formas participiales de אמר.
- infinitivo constructo de אמר según segmentación del corpus.

### Ejemplos preparados para binyanim posteriores

- Niphal: `נִלְחַם` de `לָחַם`.
- Piel: `דִּבֶּר` de `דָבַר`.
- Pual: `מְבֹרָךְ` de `בָּרַךְ`.
- Hiphil: formas de `בּוֹא`, por ejemplo `יְבִיאוּ`.
- Hophal: `יוּמַת` relacionado léxicamente con `מוּת`.
- Hithpael: `הִתְפַּלֵּל / מִתְפַּלֵּל / יִתְפַּלֵּל` de `פָּלַל`.

## 10. Orden pedagógico verbal preparado

Todavía NO implementado visualmente. Cuando se retome código, el orden debe ser:

1. lema vs. forma conjugada;
2. Qal qatal ↔ yiqtol;
3. persona, género y número dentro de qatal/yiqtol;
4. imperativo;
5. participio;
6. infinitivo constructo;
7. wayyiqtol y weqatal dentro de lectura narrativa/discursiva;
8. yusivo como capa posterior;
9. después introducir binyanim progresivamente: Qal → Niphal → Piel/Pual → Hiphil/Hophal → Hithpael;
10. ejemplo bíblico real + reconocimiento + práctica después de cada capa.

No enseñar qatal/yiqtol simplemente como “pasado/futuro”. El valor temporal/aspectual y discursivo depende del contexto.

## 11. Buscador/diccionario — dirección acordada, todavía pendiente de implementación profunda

El usuario preguntó cómo trabajan diccionarios hebreos modernos. Dirección acordada:

- el lema hebreo debe ser el centro;
- una traducción española no debe ser la autoridad única del diccionario;
- español debe funcionar como búsqueda inversa hacia posibles lemas/sentidos;
- morfología y ocurrencias bíblicas deben respaldar la respuesta;
- traducciones españolas sirven como evidencia contextual;
- IA, si se usa, debe ayudar a encontrar candidatos, no inventar significados finales.

Arquitectura objetivo futura:

`Español → léxico inverso multisentido → lema hebreo → morfología + ocurrencias → traducciones/contexto`

No confundir esta dirección acordada con una funcionalidad ya completada: la evolución profunda del motor de búsqueda sigue pendiente dentro de FASE H.

## 12. Fuentes y datos que deben reutilizarse

Reutilizar primero:

- `biblical_verse_texts`;
- `biblical_word_occurrences`;
- `biblical_lexical_entries`;
- Estudio Profundo;
- morfología existente;
- transliteración;
- metadata de fuente/licencia/versificación.

Fuente principal aprobada:

- STEPBible / STEPBible-Data / TAHOT, CC BY 4.0.

Traducción española aprobada para comparación:

- RV1909, dominio público.

No fabricar traducción literal española del AT.

## 13. Estado de CI

Último head plenamente validado antes de este checkpoint:

`2ad29d617115913427c0e80140172cfd9a29f16e`

CI temporal:

- run #2348;
- regresiones críticas: SUCCESS;
- lint: SUCCESS;
- build Next.js: SUCCESS;
- validación del documento maestro: SUCCESS;
- validadores TAHOT observados: SUCCESS.

El producto no presenta un fallo de compilación conocido en ese head.

## 14. Estado de Vercel

Branch alias habitual:

`https://calendario-git-agent-fase-h-hebreo-biblico-vida-internacional.vercel.app/estudios/hebreo`

Último deployment READY observado:

- deployment `dpl_B9urTafMfyMt63KgcmVXzcYFUaib`;
- commit `4a1e4881c5d9f4b9fb1245e366c22328f0bf54b2`;
- mensaje: `feat(fase-h): añadir tablas de Sofit Dagesh y Matres`.

Ese deployment NO contiene necesariamente todos los commits posteriores del Bloque 2.

Estado del head `2ad29d617115913427c0e80140172cfd9a29f16e` al crear este checkpoint:

- status Vercel: failure por **build-rate-limit**;
- no es un error de código/build del proyecto;
- no hacer deploy manual innecesario;
- agrupar el siguiente paquete útil y producir un solo Preview cuando el límite vuelva a permitirlo.

Existe una tarea programada llamada **Vercel Build Watch**, con comprobación horaria y modo condicional. Solo debe avisar cuando el bloqueo `build-rate-limit` desaparezca o un nuevo Preview Git-linked pueda crearse correctamente.

## 15. Qué falta inmediatamente en el Bloque 2

El siguiente trabajo no debe abrir una nueva fase. Prioridad:

1. esperar/confirmar que Vercel vuelva a aceptar builds;
2. generar un único Preview con TODO el estado actual de Sofit/Dagesh/Matres + niqqud avanzado/lectura silábica;
3. validar visualmente en iPhone ese paquete;
4. si queda aprobado, implementar el primer mapa verbal Qal según el orden pedagógico preparado;
5. añadir prácticas de reconocimiento y ejemplos reales;
6. después continuar binyanim por capas;
7. mantener raíces bloqueadas hasta tener fuente explícita;
8. no abrir persistencia/audio todavía.

Mientras Vercel siga limitado sí se puede avanzar con auditoría read-only, selección de ejemplos, diseño pedagógico y preparación local sin push, pero no conviene generar una cadena de commits que intente disparar más Preview builds.

## 16. Pendientes mayores posteriores dentro de FASE H

Después de completar el Bloque 2 todavía quedan dentro de FASE H, según el alcance maestro:

- evaluación real en `Prueba tu progreso`;
- propuesta de progreso personal persistente con privacidad/RLS y aprobación previa si requiere Supabase;
- pronunciación/audio con fuente/metodología confiable y licencia compatible;
- evolución de `Biblia en hebreo` hacia lector completo del AT hebreo y segmentos arameos con ayudas graduables;
- mejora profunda del diccionario/buscador;
- materiales administrables/verificación de recursos;
- validación integral final en iPhone;
- cierre formal de FASE H;
- solo después considerar FASE I.

## 17. Prompt mínimo de emergencia para una conversación nueva

Si una conversación termina sin poder generar un prompt largo actualizado, el usuario NO necesita reconstruir todo manualmente. Debe iniciar una nueva conversación con algo equivalente a:

> Continuamos VIDA Internacional. Lee primero `__VIDA_INTERNACIONAL.md` y después `docs/FASE_H_CHECKPOINT_ACTUAL.md` del repositorio `vidainternacional/calendario`. Verifica el estado real de `main`, la rama activa, PR #286, CI y Vercel. Continúa exclusivamente desde el siguiente punto pendiente documentado. No reinicies auditorías generales, no reabras partes aprobadas y no hagas cambios sensibles de Supabase ni merge/producción sin mi aprobación explícita.

Este prompt deliberadamente es corto: el contexto completo debe vivir en los documentos versionados, no en el chat.

## 18. Regla de mantenimiento de este checkpoint

Antes de cerrar una sesión importante, cambiar de bloque, fusionar PR o cuando exista riesgo de agotar el límite de conversación:

- actualizar este mismo archivo `docs/FASE_H_CHECKPOINT_ACTUAL.md`;
- mantener `__VIDA_INTERNACIONAL.md` como autoridad formal de fase/bloque;
- registrar aquí estado técnico/visual/operativo suficientemente detallado para reconstruir la sesión;
- no crear nuevos archivos de checkpoint por cada conversación salvo que se necesite conservar un hito histórico.
