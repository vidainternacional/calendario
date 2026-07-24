# FASE C — Panel Pastoral

Estado: ACTIVA — BLOQUE DE BOSQUEJOS PENDIENTE

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
4. Creación y organización de bosquejos. — PENDIENTE
5. Biblioteca de materiales. — PENDIENTE
6. Materiales de estudio y distribución. — PENDIENTE
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
- Colecciones pastorales funciona como módulo principal de preparación y distribución.

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
- Commit de despliegue consolidado: `681dbaba0beb95e7ea1de756ec9f7f5869a80255`.
- Validación funcional en producción confirmada por el usuario el 2026-07-24.

## Criterios de cierre de fase

- El pastor puede acceder al panel con permisos correctos.
- Puede crear, editar, organizar y recuperar bosquejos.
- Puede organizar versículos y materiales pastorales.
- La biblioteca permite localizar contenido de forma clara.
- Los materiales de estudio pueden prepararse y distribuirse según el alcance definido.
- Los estados de carga, error, vacío y retroalimentación conservan el estándar de la FASE B.
- La evidencia final queda registrada antes de actualizar el documento maestro.

## Próximo bloque

Diseñar e implementar la creación y organización de bosquejos pastorales, manteniendo el mismo modelo de permisos, recuperación y distribución.