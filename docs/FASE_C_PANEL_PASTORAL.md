# FASE C — Panel Pastoral

Estado: ACTIVA — REVISIÓN INTEGRAL Y CIERRE DOCUMENTAL EN PROGRESO

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

- El panel debe servir a las personas autorizadas para preparar enseñanza y no agregar carga administrativa innecesaria.
- El contenido debe poder encontrarse y reutilizarse con facilidad.
- Las funciones pastorales deben conservar un lenguaje humano, espiritual y claro.
- Los permisos deben limitar el acceso a roles o cuentas expresamente autorizadas.
- Cada bloque debe ser pequeño, verificable y documentado.

## Orden de trabajo

1. Diagnóstico del estado actual del área pastoral. — COMPLETADO
2. Definición de permisos, navegación y estructura del panel. — COMPLETADO
3. Gestión de versículos y colecciones pastorales. — COMPLETADO
4. Creación y organización de bosquejos. — COMPLETADO
5. Biblioteca de materiales. — COMPLETADO
6. Materiales de estudio y distribución. — COMPLETADO
7. Revisión integral, pruebas y cierre documental. — EN PROGRESO

## Diagnóstico técnico y funcional

### Base existente reutilizable

- Los perfiles distinguen los roles `servidor`, `lider`, `pastor` y `administrador`.
- `pastor` y `administrador` activos conservan acceso automático al Centro Pastoral.
- Una cuenta activa con otro rol puede recibir el permiso explícito `acceso_centro_pastoral` sin cambiar su rol global.
- Existe el indicador `es_pastor_general` como atributo adicional.
- Biblia, favoritos y Estudio Profundo se reutilizan dentro del contexto pastoral.
- La FASE B aporta estados de carga, error, vacío, toasts, transiciones y reglas táctiles.

### Decisiones de arquitectura

- El Centro Pastoral es independiente de `/admin`.
- Pueden acceder `pastor` y `administrador` activos, además de otras cuentas activas autorizadas individualmente por un administrador.
- La autorización se comprueba en servidor, acciones, RLS y Storage.
- Conceder acceso pastoral no concede funciones administrativas ni cambia el rol global.
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
- Agregar versículos desde Biblia cuando se entra desde el Centro Pastoral.
- Regresar directamente al Centro Pastoral desde Biblia y Estudio Profundo sin alterar la navegación normal.

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
- Conservar notas privadas visibles únicamente para la cuenta propietaria.
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

- Crear y organizar archivos y enlaces privados por cuenta autorizada.
- Clasificar mediante categoría, descripción y etiquetas.
- Buscar y filtrar recursos desde una interfaz responsive.
- Abrir, editar y eliminar recursos con permisos por propietario.
- Almacenar imágenes, PDF, documentos, presentaciones, audio y video de hasta 25 MB por archivo.
- Generar accesos temporales firmados para los archivos privados.
- Seleccionar recursos desde los paquetes pastorales.
- Subir archivos y agregar enlaces directamente desde `Preparar`, registrándolos también en la Biblioteca Pastoral.
- Utilizar imágenes en diapositivas y relacionar un PDF de presentación.
- Mostrar miniaturas seguras para imágenes y documentos.
- Abrir recursos dentro de la aplicación.
- Mantener centrados y utilizables los formularios de Archivo y Enlace en móvil y escritorio.

### Evidencia

- Acciones seguras de biblioteca: `3fd8f2983c6e4ba8cd8f5809b174c7f71ce118ea`.
- Interfaz y página: `08adb21ccf8667e78a6b13c160e473b925d01a6a` y `ea8259061b56ceeb3f456b9063f2cfcd2b6300b2`.
- Acceso desde el Centro Pastoral: `652ca2393350bc267e42e16dd8db5305f7ff1`.
- Carga directa desde paquetes: `0f7a39c6131c5faec8b02d09fb87ff890f83cf4e` y `15493dd9424846ccb86c8cd19903e45f97382f0d`.
- Vistas previas y apertura interna: `71590a977eb6ca75b3c451a2cce37604b8adee35`, `57c488e3fa27c78c9799b5dbcba8e7d0475d95c9` y `0cbc7a52a9b3ca4c8764a919b0a8ed2782d15001`.
- Modales centrados: `81941241a5498c95ebbf0eb59fe816dfd97b40f0`.
- Despliegue consolidado: `dpl_2BFvs9KHFaSvUfVxL9ZrwKViiuV5` — `READY`.
- Validación visual y funcional confirmada por el usuario el 2026-07-24.

## Bloque completado: materiales de estudio y distribución

### Funciones disponibles

- Reunir bosquejo, colección de versículos y recursos en un paquete pastoral.
- Preparar una guía congregacional y una presentación independiente.
- Publicar materiales dentro del Inicio de la aplicación.
- Controlar audiencia y permisos de acceso.
- Abrir publicaciones usando `public_slug` o el `id` antiguo del paquete.
- Conservar el destino correcto cuando el material requiere inicio de sesión.
- Imprimir o guardar la guía como PDF.
- Copiar el contenido completo.
- Compartir desde el dispositivo y usar el enlace como opción secundaria.
- Mantener el material dentro de la aplicación durante el flujo normal.

### Evidencia

- Publicación segura y permisos: `2d8b1199eb2d53239ac5c66c45dbf9735c179c12`, `805e23a07bd1f035d5c23468d8724852d4a5a642` y `0b27f1b941209ca30f260b8998f0f78e93d77e57`.
- Publicación dentro de Inicio: `07918bf16e54bc10d0fe15e89b5c9746d1d456c6`, `d006e0b3f348545b1f307f8df9f9cf6555ab061a` y `0b35f8e11466d815cfb67a51e87341b0c21131ea`.
- Compatibilidad de enlaces y control de acceso: `ec92ddc6a542e4057ef8306df0cb213e1eccd9ce` y `fe19a45842e4d0406a45dfc7ac2017b3de86bac5`.
- Despliegue consolidado: `dpl_AhRdaZqPBCM4Gy6cRZWAeNJQohKw` — producción.
- Validación funcional confirmada por el usuario el 2026-07-24.

## Bloque complementario: acceso pastoral asignable

- Administración puede conceder o retirar acceso al Centro Pastoral a líderes, servidores u otras cuentas activas.
- La persona conserva su rol global y no recibe acceso al panel administrativo.
- La autorización se aplica en páginas, acciones, RLS y Storage.
- El contenido continúa aislado por propietario.
- Una cuenta común no puede concederse el permiso a sí misma.

Evidencia:

- integración consolidada: `9f3918d5673926f4f45f6df6323c37367922c169`;
- documentación: `docs/FASE_C_ACCESO_PASTORAL_ASIGNABLE.md`;
- producción: `dpl_28siKGg7ic5a327nVHBhQNGNfouK` — `READY`;
- pruebas transaccionales de concesión, aislamiento y revocación completadas sin dejar datos temporales;
- matriz repetida en producción el 2026-07-29: 9 de 9 comprobaciones correctas;
- evidencia detallada: `docs/FASE_C_VALIDACION_ACCESO_2026-07-29.md`.

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

## Decisión sobre la auditoría visual y editorial final

- La base visual pastoral desplegada en producción se considera suficiente para continuar con el cierre funcional.
- La auditoría detallada de textos, alineaciones, espacios y tipografías se realizará cuando estén terminadas las demás funciones de la aplicación.
- Esa auditoría podrá realizarla directamente el responsable del proyecto o una herramienta especializada como Comet.
- La FASE C no seguirá ampliando ajustes editoriales o gráficos, salvo que exista un defecto funcional, de accesibilidad o de comprensión grave.
- Esta decisión queda documentada en `docs/FASE_C_SISTEMA_VISUAL_PASTORAL.md` y no impide el cierre funcional de la fase.

## Criterios de cierre de fase

- Una cuenta autorizada puede acceder al Centro Pastoral con permisos correctos.
- Puede crear, editar, organizar y recuperar bosquejos.
- Puede organizar versículos y materiales pastorales.
- La biblioteca permite localizar contenido de forma clara.
- Los materiales de estudio pueden prepararse y distribuirse según el alcance definido.
- Los módulos pastorales pueden relacionarse y reunirse en un paquete final compartible.
- El Centro Pastoral presenta el flujo completo como una sola experiencia de trabajo.
- Los estados de carga, error, vacío y retroalimentación conservan el estándar de la FASE B.
- La evidencia final queda registrada antes de actualizar el documento maestro.

## Revisión integral en progreso

- No se detectaron grupos recientes de errores de ejecución en las rutas pastorales durante la revisión del 2026-07-29.
- La publicación por `public_slug` y por `id` antiguo fue validada con un paquete real.
- La apertura segura, los permisos y el regreso al material después del login quedaron corregidos.
- El skeleton está alineado con la anchura y estructura del Centro Pastoral real.
- Las consultas principales ya diferencian un estado vacío legítimo de un error al recuperar datos.
- Los enlaces de regreso de las áreas principales utilizan consistentemente `Centro Pastoral`.
- El bucket privado, el límite de 25 MiB, los tipos permitidos y el consumo actual fueron verificados directamente en producción.
- No se detectaron archivos huérfanos, recursos inexistentes ni relaciones pastorales cruzadas entre propietarios.
- El consumo observado es de 20,272 bytes con un archivo; no requiere ampliación.
- Los límites, costos de referencia, umbrales y procedimiento mensual quedaron registrados en `docs/FASE_C_ALMACENAMIENTO_Y_LIMITES.md`.
- Preview integral: `dpl_9pgNUsoKUaAZ7CjUZZzjmEQU3PnR` — `READY`, con compilación y TypeScript correctos.
- Sistema visual pastoral integrado: `9784b641af0a0e8fc46c0eac1f738bb6bfa421fa`.
- Producción del sistema visual: `dpl_EWmZpUG1PBw55cj5EaXexNzED9x1` — `READY`, con 32 de 32 rutas y TypeScript correcto.
- La base visual fue aceptada provisionalmente por el usuario el 2026-07-29; la auditoría fina quedó diferida al cierre global.
- La matriz de concesión y revocación de acceso pastoral pasó 9 de 9 comprobaciones en producción y restauró el estado original.

## Próximo bloque

Confirmar únicamente el recorrido funcional en producción `Centro Pastoral → Bosquejos → Versículos → Biblioteca → Paquetes → Materiales`. La matriz de acceso y revocación ya está completada. La auditoría fina de textos, alineaciones, espacios y tipografías queda fuera de este cierre y se realizará al final de la aplicación. Después de la confirmación funcional se propondrá el cierre de la FASE C en `__VIDA_INTERNACIONAL.md`. No iniciar la fase siguiente hasta que el documento maestro refleje explícitamente ese cierre.