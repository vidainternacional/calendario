# FASE C — Almacenamiento y límites operativos

Fecha de revisión inicial: 2026-07-26  
Última verificación en producción: 2026-07-29

Estado: DOCUMENTADO CON DATOS REALES DE PRODUCCIÓN.

## Alcance

Este documento registra los límites aplicables a la Biblioteca Pastoral y a los recursos utilizados por los paquetes pastorales. Su objetivo es evitar suposiciones, prevenir cargas excesivas y dejar una referencia verificable para futuras sesiones.

## Configuración vigente de Vida Internacional

Bucket de Supabase Storage:

- Nombre: `pastoral-library`.
- Visibilidad: privada.
- Límite técnico por archivo: `26,214,400` bytes, equivalentes a **25 MiB**.
- Texto funcional mostrado al usuario: **25 MB**.
- Acceso: políticas RLS y enlaces firmados temporales.
- Duración actual del enlace firmado generado por la aplicación: **1 hora**.
- Organización: carpeta privada por `profile_id`.

El límite real de una carga es siempre el menor entre el límite global del proyecto y el límite configurado en el bucket.

Tipos MIME permitidos actualmente:

- PDF.
- Word: `.doc` y `.docx`.
- PowerPoint: `.ppt` y `.pptx`.
- Texto plano.
- Imágenes JPEG, PNG y WebP.
- Audio MP3 y MP4.
- Video MP4.

El límite de Vida es deliberadamente menor que el máximo general del proveedor para mejorar la experiencia móvil, reducir fallos por conectividad y controlar el consumo de almacenamiento.

## Consumo observado en producción

Corte realizado el 2026-07-29:

- Objetos almacenados en `pastoral-library`: **1**.
- Registros de archivo en `pastoral_biblioteca`: **1**.
- Enlaces externos registrados: **0**.
- Espacio ocupado: **20,272 bytes**, aproximadamente **19.80 KiB**.
- Archivo más grande: **20,272 bytes**.
- Registros de archivo sin objeto físico: **0**.
- Objetos físicos sin registro en Biblioteca: **0**.

El consumo actual es mínimo y no requiere ampliación.

## Integridad del flujo pastoral

La auditoría de producción no detectó incidencias en:

- paquetes vinculados a bosquejos de otro propietario;
- paquetes vinculados a colecciones de otro propietario;
- identificadores inexistentes dentro de `recurso_ids`;
- recursos de otro propietario vinculados a un paquete;
- PDF de presentación perteneciente a otra cuenta;
- paquetes publicados sin `public_slug`;
- archivos huérfanos en Storage o en la tabla pastoral.

Conteo funcional al momento de la revisión:

- Bosquejos: **1**.
- Colecciones: **2**.
- Versículos pastorales: **3**.
- Recursos de Biblioteca: **1**.
- Paquetes pastorales: **1**.

## Límites oficiales del proveedor

Según la documentación oficial de Supabase consultada el 2026-07-29:

### Plan Free

- Almacenamiento de archivos incluido: **1 GB** por organización.
- Egress sin caché incluido: **5 GB**.
- Egress con caché incluido: **5 GB**.
- Límite global máximo configurable por archivo: **50 MB**.
- Los proyectos pueden pausarse después de una semana de inactividad.

### Plan Pro o Team

- Almacenamiento de archivos incluido: **100 GB** por organización.
- Egress sin caché incluido: **250 GB**.
- Egress con caché incluido: **250 GB**.
- Límite global máximo configurable por archivo: **500 GB**.
- Almacenamiento adicional de referencia: **$0.0213 por GB al mes**.
- Egress adicional de referencia: **$0.09 por GB sin caché** y **$0.03 por GB con caché**.

Un bucket puede imponer un límite menor que el límite global. Por ello, aunque el plan permita archivos mayores, Vida mantiene inicialmente el límite de **25 MiB**.

El plan exacto de la organización no se expone mediante la conexión de base de datos y debe confirmarse en el panel de facturación antes de calcular porcentaje de cuota o aprobar una ampliación.

Fuentes oficiales de referencia:

- Supabase Storage — Limits: https://supabase.com/docs/guides/storage/uploads/file-limits
- Supabase Storage — Pricing: https://supabase.com/docs/guides/storage/pricing
- Supabase Billing and Quotas: https://supabase.com/docs/guides/platform/billing-on-supabase
- Supabase Storage Size Usage: https://supabase.com/docs/guides/platform/manage-your-usage/storage-size
- Supabase Egress Usage: https://supabase.com/docs/guides/platform/manage-your-usage/egress

Estas cifras son externas y pueden cambiar. Antes de modificar límites, presupuesto o plan, debe revisarse nuevamente la documentación oficial y la página Usage de la organización.

## Consumo mensual

El tamaño vivo de los archivos puede medirse desde Postgres, pero el consumo mensual facturable de Storage y egress se calcula a nivel de organización y no está disponible mediante las tablas del proyecto.

La comprobación mensual debe realizarse en:

1. Supabase Dashboard.
2. Organización del proyecto.
3. Usage o Billing.
4. Revisar `Storage Size GB-Hrs`, egress sin caché y egress con caché.
5. Registrar fecha, plan activo, cuota, consumo y porcentaje utilizado.

## Reglas operativas

1. No aumentar el límite de 25 MiB sin revisar primero:
   - cuota disponible;
   - conectividad móvil;
   - tiempo de carga;
   - tipos MIME permitidos;
   - seguridad del bucket;
   - experiencia de apertura y descarga.
2. No usar enlaces públicos permanentes para archivos pastorales privados.
3. Mantener políticas por propietario y acceso firmado temporal.
4. Eliminar archivos huérfanos cuando se confirme que ningún registro pastoral los utiliza.
5. Evitar duplicar el mismo archivo en varios paquetes; debe reutilizarse desde Biblioteca cuando sea posible.
6. Evitar almacenar videos largos de actividades completas; utilizar los canales oficiales y registrar el enlace en la Biblioteca.
7. Registrar cualquier cambio de proveedor, plan, bucket o límite en la memoria técnica y en el changelog.

## Umbrales operativos

Los porcentajes deben calcularse contra la cuota real del plan confirmado:

- **Menos de 70 %:** funcionamiento normal.
- **70 % a 84 %:** revisar archivos grandes, duplicados y videos.
- **85 % a 94 %:** preparar limpieza o ampliación antes de cargas masivas.
- **95 % o más:** detener cargas no esenciales y ampliar capacidad o liberar espacio.

## Monitoreo recomendado

Revisión mensual o antes de una carga masiva:

- almacenamiento total utilizado;
- archivos de mayor tamaño;
- archivos sin registro asociado;
- objetos sin registro en la Biblioteca;
- recursos inexistentes vinculados en paquetes;
- relaciones entre contenido de distintos propietarios;
- consumo de egress;
- errores de carga;
- tiempo de apertura en móvil;
- cuota restante del plan.

## Estrategia de crecimiento

Orden recomendado:

1. Eliminar archivos sin uso mediante el flujo de la aplicación.
2. Comprimir imágenes, PDF, audio y presentaciones antes de subirlos.
3. Eliminar duplicados y reutilizar recursos desde la Biblioteca.
4. Conservar videos largos en los canales oficiales y registrar enlaces.
5. Mantener Storage para documentos privados, imágenes, audio breve y materiales reutilizables.
6. Actualizar el plan cuando el crecimiento sea sostenido y exista una necesidad pastoral aprobada.

## Estado para cierre de FASE C

- Límite funcional de la aplicación documentado: **COMPLETADO**.
- Configuración real del bucket verificada: **COMPLETADO**.
- Consumo actual y archivos huérfanos revisados: **COMPLETADO**.
- Integridad de relaciones pastorales revisada: **COMPLETADO**.
- Límites externos y regla de reverificación documentados: **COMPLETADO**.
- Estrategia de monitoreo y ampliación documentada: **COMPLETADO**.
- Plan activo y consumo mensual exacto: **REQUIERE CONSULTA EN SUPABASE DASHBOARD**.

La FASE C no debe aumentar el límite de archivos ni cambiar de proveedor. Cualquier ampliación futura debe preservar bucket privado, RLS por propietario y enlaces firmados temporales.
