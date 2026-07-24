# FASE C — Panel Pastoral

Estado: ACTIVA — DEFINICIÓN DE ACCESO Y ESTRUCTURA

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
2. Definición de permisos, navegación y estructura del panel. — EN PROGRESO
3. Gestión de versículos y colecciones pastorales.
4. Creación y organización de bosquejos.
5. Biblioteca de materiales.
6. Materiales de estudio y distribución.
7. Revisión integral, pruebas y cierre documental.

## Diagnóstico técnico y funcional

### Base existente reutilizable

- Los perfiles ya distinguen los roles `servidor`, `lider`, `pastor` y `administrador`.
- Varias acciones de servidor ya autorizan a `pastor` y `administrador` para gestión de contenido y ministerios.
- Existe el indicador `es_pastor_general`, cuya asignación está restringida al rol administrador.
- El panel administrativo ya consulta perfiles, ministerios, pendientes y configuración de Estudio Profundo.
- El módulo Biblia ya permite guardar y recuperar versículos favoritos personales mediante `versiculos_favoritos`.
- Estudios ya ofrece Biblia y Estudio Profundo como herramientas activas.
- La FASE B dejó disponibles estados de carga, error recuperable, vacíos, toasts, transiciones y reglas táctiles reutilizables.

### Vacíos identificados

- No existe una ruta independiente `/pastoral` ni una navegación pastoral diferenciada.
- El panel administrativo mezcla gestión operativa con algunas funciones de contenido espiritual.
- No existe una puerta central de ruta que valide explícitamente `pastor` o `administrador` antes de renderizar un panel pastoral.
- Los favoritos bíblicos actuales son personales; todavía no existen colecciones pastorales nombradas.
- No existen tablas o acciones específicas para bosquejos pastorales.
- No existe una biblioteca pastoral unificada para archivos, enlaces y materiales.
- No existe todavía un flujo de preparación y distribución de materiales de estudio dentro del alcance de esta fase.

### Decisiones de arquitectura

- El Panel Pastoral será independiente de `/admin` para no mezclar cuidado y preparación espiritual con gestión general del sistema.
- Podrán acceder los roles `pastor` y `administrador`.
- `es_pastor_general` se conservará como atributo adicional, no como requisito para entrar al panel.
- La autorización se comprobará en servidor antes de renderizar la ruta.
- La primera pantalla será un centro pastoral con accesos a Versículos, Bosquejos, Biblioteca y Materiales.
- Cada módulo deberá conservar el estándar UX establecido en la FASE B.

## Primer cambio verificable

Crear la ruta protegida `/pastoral` con:

- validación de sesión;
- validación de rol `pastor` o `administrador`;
- rechazo seguro para usuarios sin permiso;
- encabezado y resumen pastoral;
- accesos visuales a los cuatro módulos de la fase;
- estados claramente marcados como disponibles o próximos, sin simular funciones todavía inexistentes.

## Criterios de cierre

- El pastor puede acceder al panel con permisos correctos.
- Puede crear, editar, organizar y recuperar bosquejos.
- Puede organizar versículos y materiales pastorales.
- La biblioteca permite localizar contenido de forma clara.
- Los materiales de estudio pueden prepararse y distribuirse según el alcance definido.
- Los estados de carga, error, vacío y retroalimentación conservan el estándar de la FASE B.
- La evidencia final queda registrada antes de actualizar el documento maestro.

## Próximo bloque

Implementar y desplegar la puerta de acceso y la pantalla inicial de `/pastoral`, sin crear todavía tablas ni funciones de los módulos posteriores.

## Registro de despliegue

- 2026-07-24: reintento solicitado después del bloqueo temporal `build-rate-limit` de Vercel. El commit incluye los cambios pendientes del buscador avanzado y la integración pastoral con Biblia.
