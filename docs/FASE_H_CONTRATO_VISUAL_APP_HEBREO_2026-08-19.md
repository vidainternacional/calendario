# FASE H — Contrato visual tipo app para Hebreo Bíblico

Fecha: 2026-08-19
Estado: aprobado como criterio transversal de diseño para el área de Hebreo Bíblico.

## Propósito

Toda la experiencia de Hebreo Bíblico debe sentirse como una aplicación móvil de aprendizaje y no como una página web con cuadros pequeños dentro de otros cuadros.

Este contrato aplica a las superficies actuales y a cualquier superficie nueva que se incorpore durante FASE H.

## 1. Hebreo protagonista

- Letras, signos, palabras y frases hebreas son el contenido principal y deben dominar visualmente.
- En tablas/listas didácticas, una letra o signo aislado debe mostrarse aproximadamente entre `3.5rem` y `4rem` cuando el ancho lo permita.
- En tarjetas de vocabulario, la palabra hebrea debe rondar `3rem` o más.
- En detalle, la palabra/forma principal puede crecer a `4.5rem–5.5rem` según longitud.
- En frases y oraciones, el tamaño debe crecer respecto de una lista web tradicional y conservar interlineado cómodo para niqqud.
- El español, pronunciación y etiquetas son secundarios y no deben competir visualmente con el hebreo.

## 2. Tablas y listas de ancho útil

- Una tabla pedagógica puede llegar a los bordes útiles del módulo en móvil.
- No encerrar una tabla ancha dentro de un pequeño recuadro centrado solo para conservar márgenes decorativos.
- Cuando cinco o más columnas necesiten espacio, preferir ancho mínimo + scroll horizontal natural antes que comprimir texto y signos.
- En móvil, las tablas pueden usar `-mx-4`/full-bleed dentro del contenedor del módulo y recuperar borde redondeado en pantallas mayores.
- El desplazamiento horizontal debe ser corto, predecible y compatible con iOS (`-webkit-overflow-scrolling: touch`).

## 3. Fichas

Las fichas se conservan donde ayudan a memorizar.

- No eliminar Alef-Bet, Vocales, Palabras o Reglas por adoptar tablas.
- Reducir espacio blanco que no cumple una función pedagógica.
- Preferir una sola superficie, un solo borde y una sombra editorial suave.
- Evitar `ring` decorativo adicional cuando produce efecto de “ficha doble”.
- El contenido principal debe crecer antes de aumentar la altura total de la tarjeta.
- La ficha expandida debe sentirse densa pero respirable: nombre/forma → ejemplo → pronunciación → significado → explicación.

## 4. Niqqud

- En listas/tablas, un signo combinante no debe verse como un pequeño círculo punteado aislado si eso dificulta reconocerlo.
- Mostrarlo aplicado a una consonante pedagógica (`לַ`, `לָ`, `לֶ`, etc.) para que su posición sea evidente.
- El signo aislado puede conservarse dentro de una explicación especializada, pero no como la única representación visual de una fila.
- `Valor` sigue mostrando `—`: el niqqud no recibe gematría inventada.

## 5. Alef-Bet

- Las mini-fichas mantienen tres columnas, pero la letra debe ocupar claramente más superficie que el nombre.
- La ficha ampliada conserva Libro · Cuadrada · Manuscrita, Sonido y Significado.
- Reducir altura fija/espacio vacío cuando el contenido no lo necesita.
- Eliminar el efecto visual de doble borde/ring.
- La vista Lista conserva `Signo · Nombre · Valor · Sonido · Significado`, usando ancho útil y signo grande.

## 6. Palabras

- Tarjeta: hebreo grande → pronunciación → español.
- Lista: hebreo grande y pronunciación a la izquierda; español a la derecha.
- Detalle: hebreo aún mayor, sin datos técnicos innecesarios.
- La lista debe sentirse integrada al flujo de la app, no como una tarjeta web adicional.

## 7. Lectura

- Las frases/oraciones deben crecer en Tarjetas, Lista y Detalle.
- El niqqud necesita interlineado suficiente; aumentar tamaño no debe provocar superposición vertical.
- Lista puede ser full-bleed con separadores, como una lista nativa.

## 8. Reglas

- Vista predeterminada: Tablas.
- Tablas = comparación; Fichas = memoria; Detalle = una regla por vez.
- Las tablas se muestran como superficies amplias y desplazables, no como tabla dentro de tarjeta dentro de tarjeta.
- Formas hebreas dentro de fichas y tablas deben ser claramente mayores que las etiquetas españolas.
- `Básicas` debe ser un subconjunto real; `Todas` debe representar el conjunto completo. Si ambos filtros terminaran mostrando lo mismo, debe considerarse regresión.

## 9. Superficies que ya tienen tamaño suficiente

No aumentar indiscriminadamente todo el texto.

- Sonido y Significado pueden mantener tamaños cercanos a `15–17px` cuando ya son legibles.
- Encabezados, explicaciones y navegación no necesitan escalar al tamaño de las letras hebreas.
- La prioridad es corregir la relación entre tamaño del contenido principal y espacio disponible, no hacer toda la app gigante.

## 10. Regla para componentes nuevos

Todo componente nuevo de Hebreo Bíblico debe decidir explícitamente:

1. cuál es el elemento hebreo protagonista;
2. si la comparación necesita tabla o ficha;
3. si puede usar ancho completo en móvil;
4. si existe espacio blanco sin función;
5. si hay contenedores/bordes duplicados que puedan eliminarse.

Antes de aprobar una nueva superficie, debe verse bien en iPhone sin depender de zoom del navegador.

## 11. Patrón general

`HEBREO GRANDE → INFORMACIÓN SECUNDARIA → COMPARACIÓN/EXPLICACIÓN`

Más específicamente:

`Fichas para memorizar + Tablas para comparar + Listas nativas para recorrer + Detalle para profundizar`.

Este patrón se aplica a Alef-Bet, Vocales, Palabras, Lectura, Reglas y futuras superficies de Repaso/práctica dentro de FASE H.

## 12. Alineación pedagógica transversal

- Los títulos, subtítulos, explicaciones, instrucciones, cautelas, ayudas, respuestas didácticas y notas visibles del Centro de Hebreo Bíblico se presentan centrados.
- Las tablas/listas didácticas centran encabezados y celdas para conservar la misma lectura visual del Alef-Bet.
- El hebreo mantiene dirección semántica `rtl`, pero cuando se presenta como contenido de aprendizaje se centra visualmente dentro de su superficie.
- En disclosures como “¿Qué es…?” o “¿Cómo vamos a aprender…?”, el título permanece centrado aunque el chevrón de abrir/cerrar se conserve en el extremo.
- Los campos de búsqueda y práctica de escritura son la excepción funcional: conservan la alineación necesaria para escribir y posicionar el cursor correctamente según el idioma/dirección del contenido.
- Este criterio es transversal: toda nueva superficie creada dentro de FASE H debe heredarlo sin volver a decidirlo pantalla por pantalla.
