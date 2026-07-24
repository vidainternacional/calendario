# FASE C — Panel Pastoral

Estado: ACTIVA — MATERIALES DE ESTUDIO Y DISTRIBUCIÓN EN PROGRESO

Objetivo: construir herramientas pastorales para preparar, organizar, conservar y distribuir contenido espiritual dentro de Vida Internacional.

## Alcance autorizado

- Versículos.
- Bosquejos.
- Biblioteca.
- Material de estudio.

## Fuera de alcance durante esta fase

- IA bíblica avanzada.
- Nuevas fuentes históricas, mapas y cronologías de la FASE D.
- Optimización general de rendimiento, seguridad y escalabilidad de la FASE E.
- Cuaderno correlativo de prédicas y notas de la FASE F.

## Principios

- El panel debe servir al pastor y no agregar carga administrativa innecesaria.
- El contenido debe poder encontrarse y reutilizarse con facilidad.
- Las funciones pastorales deben conservar un lenguaje humano, espiritual y claro.
- Los permisos deben limitar el acceso a los roles autorizados.
- Cada bloque debe ser pequeño, verificable y documentado.

## Orden de trabajo

1. Diagnóstico del estado actual del área pastoral. — COMPLETADO
2. Definición de permisos, navegación y estructura del panel. — COMPLETADO
3. Gestión de versículos y colecciones pastorales. — COMPLETADO
4. Creación y organización de bosquejos. — COMPLETADO
5. Biblioteca de materiales. — COMPLETADO
6. Materiales de estudio y distribución. — EN PROGRESO
7. Revisión integral, pruebas y cierre documental. — PENDIENTE

## Diagnóstico técnico y funcional

### Base existente reutilizable

- Los perfiles distinguen los roles `servidor`, `lider`, `pastor` y `administrador`.
- Las acciones pastorales autorizan a `pastor` y `administrador` activos.
- Existe el indicador `es_pastor_general` como atributo adicional.
- Biblia, favoritos y Estudio Profundo se reutilizan dentro del contexto pastoral.
- La FASE B aporta estados de carga, error, vacío, toasts, transiciones y reglas táctiles.

### Decisiones de arquitectura

- El Panel Pastoral es independiente de `/admin`.
- Pueden acceder `pastor` y `administrador`.
- La autorización se comprueba en servidor.
- Biblia y Estudio Profundo se muestran como accesos rápidos secundarios.
- Colecciones pastorales y bosquejos funcionan como módulos centrales de preparación.

## Decisión de integración pastoral final

- El Centro Pastoral no se considerará una colección de módulos aislados.
- Colecciones, bosquejos, biblioteca y materiales de estudio formarán un solo flujo de preparación pastoral.
- Un bosquejo deberá poder vincular versículos, colecciones y recursos de biblioteca.
- El resultado final deberá poder reunirse como un paquete de prédica o estudio.
- El paquete final deberá admitir distribución a la iglesia según permisos y audiencia.
- La publicación normal de un material deberá aparecer dentro del Inicio de la aplicación; el enlace será una opción secundaria para compartir.
- La distribución deberá contemplar, como mínimo, aparición dentro de la app, impresión/PDF, copia, compartir por enlace y envío desde el dispositivo.
- Al completar los módulos funcionales, el dashboard se rediseñará como un centro de trabajo complementario que muestre progreso, recursos relacionados y acciones siguientes.
- La capacidad de almacenamiento, consumo mensual, límites del plan y opciones de ampliación se documentarán antes del cierre de la fase, sin bloquear la implementación actual.

## Bloque completado: colecciones y versículos

### Funciones disponibles

- Crear, abrir, editar y eliminar colecciones pastorales.
- Asignar nombre, introducción y color.
- Agregar y eliminar versículos con nota pastoral.
- Imprimir o guardar como PDF desde el navegador.
- Copiar, compartir y preparar correo con la guía completa.
- Buscar por referencia mediante selección guiada de traducción, libro, capítulo y versículo.
- Buscar por concordancia usando palabras o frases.
- Previsualizar resultados antes de agregarlos.
- Agregar versículos desde Biblia cuando se entra desde el Panel Pastoral.
- Regresar directamente al Panel Pastoral desde Biblia y Estudio Profundo sin alterar la navegación normal.

### Evidencia

- Buscador rápido por referencia: `415b86b9c38a555a4b2b1bb9064b07b57e634357`.
- Centro pastoral reorganizado: `58e4932c477a31f35d9479fc87b42bfe2bcacce6`.
- Integración contextual con Biblia: `42bb1302ba053f805f63be5021061b34c06b8d48` y `2a87fc30b18e99951456f1e5ed9e9f2c206b0ccf`.
- Buscador avanzado de referencia y concordancia: `81df75b121b6ff1d8412b73ce85dfb42c07f53e4` y `776a8a8bcd260d76507bc1ccadd8409c20f6b53f`.
- Despliegue consolidado: `dpl_9tE8LRX7YPXumtcF6CuEfZxNPLU9` — `READY`.
- Validación funcional en producción confirmada por el usuario el 2026-07-24.

## Bloque completado: bosquejos pastorales

### Funciones disponibles

- Crear, buscar, abrir, editar y eliminar bosquejos.
- Guardar título, tema, pasaje base, propósito, introducción, puntos, conclusión, estado y fecha de predicación.
- Organizar hasta doce puntos principales.
- Conservar notas privadas visibles únicamente para el pastor.
- Usar los modos `Editar`, `Predicar` y `Presentar`.
- Leer el bosquejo con tipografía amplia y jerarquía clara.
- Presentar una diapositiva por vez con navegación táctil y mediante teclado.
- Entrar a pantalla completa y saltar entre diapositivas mediante miniaturas.
- Imprimir o guardar como PDF, copiar y compartir.
- Adaptar el editor y las vistas a móvil, tablet y computadora.
- Proteger cada bosquejo mediante permisos y RLS por propietario.

### Evidencia

- Acciones seguras: `3c43536f729d2f5922369b798cc4a15b4dc9c809`.
- Listado y página principal: `f22883ae76e77dd7ec4e367486e3e801615f3edd` y `38d288e6cd2f2c405d6175b042d070f94a6851de`.
- Editor estructurado y detalle: `84bb80dea7c6586eaf45d9e454a2bc21ed3c4e80` y `7fa345f8ae4e9d15c095a5d2dbc3d94cc8afbdd2`.
- Acceso desde el Centro Pastoral: `83471f7f2ba8402c0703ac8b16dd8db5305f7ff1`.
- Modos de prédica y presentación: `117d2d9f55e5382da454c4532ef3c4a78fb69250`.
- Notas privadas y expansión responsive: `7b5fdd4a8ae3272328b434ffa614ccd675b9456b` y `803d11a6c99ee2bf8433cbb1a79474961df8feb6`.
- Profesionalización final responsive: `9445818c980c84177b94c752eb283d31dfe43c53`.
- Despliegue final: `dpl_5DzC2kwYcLgBf4rQVrKTSdz8FdRC` — `READY`.
- Validación funcional en producción confirmada por el usuario el 2026-07-24.

## Bloque completado: Biblioteca Pastoral

### Funciones disponibles

- Crear y organizar archivos y enlaces privados por pastor.
- Clasificar mediante categoría, descripción y etiquetas.
- Buscar y filtrar recursos desde una interfaz responsive.
- Abrir, editar y eliminar recursos con permisos por propietario.
- Almacenar imágenes, PDF, documentos, presentaciones, audio y video de hasta 25 MB por archivo.
- Generar accesos temporales firmados para los archivos privados.
- Seleccionar recursos desde los paquetes pastorales.
- Subir archivos y agregar enlaces directamente desde `Preparar`, registrándolos también en la Biblioteca Pastoral.
- Utilizar imágenes en diapositivas y relacionar un PDF de presentación.

### Evidencia

- Acciones seguras de biblioteca: `3fd8f2983c6e4ba8cd8f5809b174c7f71ce118ea`.
- Interfaz y página: `08adb21ccf8667e78a6b13c160e473b925d01a6a` y `ea8259061b56ceeb3f456b9063f2cfcd2b6300b2`.
- Acceso desde el Centro Pastoral: `652ca2393350bc267e42e16ef97fcb399bf3c5b3`.
- Carga directa desde paquetes: `0f7a39c6131c5faec8b02d09fb87ff890f83cf4e` y `15493dd9424846ccb86c8cd19903e45f97382f0d`.
- Despliegue consolidado: `dpl_BMuGcKqvTbTrz5i8Zsxg48k7TwYH` — `READY`.
- Validación visual y funcional confirmada por el usuario el 2026-07-24.

## Requisitos transversales registrados para fases posteriores

- Las notificaciones deberán ser un sistema general de la aplicación, no limitado a mensajes: avisos, alertas, eventos, publicaciones, ayuda, cumpleaños y cambios relevantes.
- Toda persona de la congregación podrá registrarse y utilizar la aplicación aunque no pertenezca a un ministerio.
- Los perfiles deberán poder aportar los datos necesarios, con permisos y privacidad, para atención pastoral y felicitaciones.
- Los cumpleaños deberán poder aparecer en el calendario general.
- El sistema deberá admitir una felicitación general para la congregación y una notificación personal para el cumpleañero.
- Deberá existir seguimiento pastoral responsable de personas con ausencias, sin conclusiones automáticas ni exposición pública.
- Las necesidades de ayuda y situaciones específicas deberán poder gestionarse con audiencia, responsables, estados y confidencialidad.
- Las festividades y mensajes especiales deberán ser administrables por pastores o administradores, sin modificar código y de acuerdo con la doctrina de Vida Internacional.
- Los canales oficiales de YouTube, Facebook, Instagram y TikTok podrán integrarse dentro de la aplicación; solo estos destinos externos podrán sacar al usuario cuando corresponda.
- La Biblioteca Pastoral deberá incorporar miniaturas o vistas previas para imágenes y documentos, similares a una biblioteca visual.
- El panel administrativo futuro deberá medir actividad agregada, uso de funciones, consumo de IA y tendencias, protegiendo datos pastorales sensibles.

## Decisión gradual para presentaciones y proyección

- Vida mantendrá una vista propia de presentación a pantalla completa, controlable desde teléfono, tablet o computadora.
- La primera implementación no dependerá de Holyrics ni de una API externa para evitar fragilidad y retrasos.
- Se priorizará exportar la presentación pastoral a formatos reutilizables, comenzando por PDF e imágenes por diapositiva.
- Los archivos exportados podrán enviarse manualmente a Holyrics o a la computadora de proyección.
- Una integración automática con Holyrics solo se evaluará si existe una API pública, estable y documentada que permita importar y controlar presentaciones sin depender de automatizaciones frágiles de interfaz.
- Se añadirán plantillas visuales simples y editables: fondo, imagen, alineación, tamaño de texto y contraste.
- La asistencia mediante IA se limitará inicialmente a proponer estructura, texto breve y estilo; no bloqueará la edición manual ni será requisito para presentar.
- El control remoto avanzado entre dispositivos se evaluará en un incremento posterior mediante una sesión local segura, sin mezclarlo con el cierre básico de Materiales de Estudio.

## Criterios de cierre de fase

- El pastor puede acceder al panel con permisos correctos.
- Puede crear, editar, organizar y recuperar bosquejos.
- Puede organizar versículos y materiales pastorales.
- La biblioteca permite localizar contenido de forma clara.
- Los materiales de estudio pueden prepararse y distribuirse según el alcance definido.
- Los módulos pastorales pueden relacionarse y reunirse en un paquete final compartible.
- El Centro Pastoral presenta el flujo completo como una sola experiencia de trabajo.
- Los estados de carga, error, vacío y retroalimentación conservan el estándar de la FASE B.
- La evidencia final queda registrada antes de actualizar el documento maestro.

## Próximo bloque

Completar la publicación interna de Materiales de Estudio en el Inicio de la aplicación y añadir vistas previas seguras en la Biblioteca Pastoral. El enlace externo permanecerá como opción secundaria de distribución.
