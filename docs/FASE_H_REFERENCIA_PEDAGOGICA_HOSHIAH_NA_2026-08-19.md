# FASE H — Referencia pedagógica: Hoshiah Na / Hebreo 1

Fecha: 2026-08-19
Estado: referencia pedagógica aprobada por el usuario para orientar la UX de aprendizaje.

## 1. Fuente de referencia

Documento indicado por el usuario:

- `Hebreo 1 Hoshiah Na (Cursos de Hebreo)` — Scribd, 38 páginas.
- URL entregada por el usuario: `https://www.scribd.com/document/469832642/HEBREO-1-HOSHIAH-NA-CURSOS-DE-HEBREO`.
- Scribd marca el material como `All Rights Reserved`.

VIDA no copiará páginas, tablas ni texto extenso de ese material. Se reutiliza únicamente su **lógica pedagógica y tipos de comparación**, redactando contenido propio y contrastando los datos lingüísticos con fuentes ya aprobadas o académicas.

## 2. Decisión didáctica principal

No forzar una sola interfaz para todo.

Cada contenido usará la representación que mejor ayude a aprender:

1. **Fichas** — memoria y reconocimiento de un elemento individual.
2. **Tablas** — comparación de formas, terminaciones, prefijos, sufijos o cambios visibles.
3. **Transformación** — mostrar `forma base → cambio → resultado`.
4. **Ejemplo** — palabra o frase real.
5. **Práctica** — reconocer lo aprendido sin exponer demasiada información simultánea.
6. **Lectura aplicada** — encontrar la misma regla dentro del texto bíblico.

Las fichas ya aprobadas del Alef-Bet **se conservan**. No se eliminan por introducir tablas.

## 3. Secuencia pedagógica ampliada

La progresión interna debe poder cubrir, por capas:

1. Introducción al hebreo bíblico y dirección RTL.
2. Alef-Bet.
3. Formas finales / Sofit.
4. Dagesh y diferencias de sonido.
5. Letras que pueden participar en la indicación vocálica / matres lectionis.
6. Niqqud completo.
7. Sheva, qamats qatan y pataj furtivo dentro de palabras reales.
8. Combinación consonante + vocal + sílaba.
9. Palabras y vocabulario por categorías.
10. Lectura de frases y oraciones.
11. Inseparables: artículo, conjunción y preposiciones prefijadas.
12. Género y número.
13. Concordancia sustantivo + adjetivo.
14. Sufijos posesivos.
15. Estado constructo.
16. Raíces / shoresh cuando exista respaldo verificable.
17. Sistema verbal por capas posteriores.
18. Qere / Ketiv.
19. Lectura bíblica aplicada con ayudas graduables.
20. Repaso y evaluación.

## 4. Contrato de tablas

### 4.1 Alef-Bet

Las fichas continúan siendo la vista principal para aprender cada letra.

Las tablas se usan cuando comparar sea la tarea:

- letra normal ↔ forma Sofit;
- nombre;
- valor ordinario;
- cuando se mencione una convención ampliada de gematría, debe aparecer etiquetada como tal y separada del valor ordinario;
- sonido;
- comportamiento especial.

### 4.2 Niqqud

Tabla de referencia:

`Signo · Nombre · Familia · Sonido · Combinación · Ejemplo · Regla/cautela`

No asignar valor gemátrico a los signos vocálicos.

Las reglas especiales deben incluir progresivamente:

- sheva vocal / silencioso;
- qamats qatan;
- pataj furtivo;
- shuruq;
- holam con mater cuando corresponda.

### 4.3 Inseparables

Usar transformación visible:

`Forma base → función → combinación → resultado → pronunciación → español → excepción/cautela`

Primera capa:

- `הַ` artículo definido;
- `וְ` conjunción;
- `בְּ`;
- `לְ`;
- `כְּ`;
- `מִן`;
- combinación de preposición + artículo.

### 4.4 Género y número

Presentar lado a lado:

- masculino singular;
- femenino singular;
- masculino plural;
- femenino plural.

Las terminaciones son **pistas frecuentes**, no reglas universales.

### 4.5 Sufijos posesivos

Tabla por persona:

`Persona · sufijo · idea española · transformación visible · ejemplo`

Aclarar que el sustantivo puede cambiar de forma al recibir el sufijo.

### 4.6 Estado constructo

Comparar:

`forma absoluta → forma constructa → cadena completa → significado`

El alumno debe aprender a reconocer que el primer sustantivo queda ligado al segundo.

### 4.7 Qere / Ketiv

Lección y tabla propia:

- Ketiv = lo escrito;
- Qere = lo leído;
- lectura masorética y señalización correspondiente;
- ejemplos reales no controversiales antes de introducir casos religiosos sensibles.

No convertir una postura religiosa particular sobre una lectura en regla lingüística obligatoria.

## 5. Fichas que permanecen

Las fichas se mantienen al menos en:

- Alef-Bet — contrato visual ya aprobado;
- opcionalmente Vocales para reconocimiento individual;
- Reglas como modo secundario `Fichas` para memorizar una regla concreta.

En Reglas, la vista principal pasa a ser **Tablas** porque el objetivo es comprender transformaciones y contrastes.

## 6. Contenido histórico y simbólico

Cuando una letra tenga origen pictográfico o asociación histórica:

- etiquetar como `Origen histórico/pictográfico`;
- separar de `Significado actual de la letra`;
- separar de `Significado de una palabra bíblica`;
- no derivar automáticamente significados teológicos o secretos.

## 7. Pronunciación

El curso debe llevar progresivamente a leer en voz alta y pronunciar hebreo bíblico.

Hasta aprobar una fuente/metodología de audio:

- mostrar pronunciación textual pedagógica;
- no usar `speechSynthesis` como audio oficial;
- no mostrar botones de audio falsos.

## 8. Aplicación en el código

Desde este contrato:

- `AlefBetExplorer` conserva fichas + tabla/lista comparativa + detalle.
- `NiqqudExplorer` conserva fichas + tabla/lista comparativa + detalle.
- `GrammarExplorer` usa por defecto **Tablas**, conserva **Fichas** como modo secundario y **Detalle** para recorrer una regla por vez.
- `ReadingWordsExplorer` sigue siendo vocabulario/diccionario.
- `ReadingSentencesExplorer` sigue siendo lectura de frases/oraciones reales.

## 9. Gate actual

Validar visualmente el rediseño mixto de **Reglas** antes de abrir Repaso.

No introducir persistencia, nuevas tablas de Supabase, RLS, grants, audio oficial ni evaluación almacenada durante este gate.
