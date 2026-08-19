# FASE G — Línea base de producción

Fecha: 2026-08-17
Estado: **LÍNEA BASE REGISTRADA**

## Producción

- El deployment actual de `main` correspondiente a la activación de FASE G está `READY`.
- En las 24 horas previas a esta revisión, Vercel no reportó clusters de errores de runtime.
- En la misma ventana no se encontraron logs de nivel `warning`.
- En la misma ventana no se encontraron respuestas `5xx` registradas por runtime.

Esta línea base no demuestra que todos los flujos estén validados. Sirve para distinguir fallos preexistentes de problemas que puedan aparecer durante las pruebas integrales de FASE G.

## Cobertura real disponible para pruebas

Consulta agregada, sin registrar PII en este documento:

- 2 cuentas activas con rol Administrador.
- 1 cuenta activa con rol Pastor.
- 2 cuentas activas con rol Líder.
- 2 cuentas activas con rol Servidor.
- 4 usuarios activos con liderazgo contextual en al menos un ministerio.
- 1 cuenta activa no Pastor/Administrador con acceso explícito al Centro Pastoral.
- 10 ministerios activos.
- 14 membresías ministeriales.
- 15 asignaciones de eventos.
- 3 intercambios existentes.
- 11 solicitudes de ingreso ministerial existentes.
- 4 solicitudes operativas existentes.
- 5 suscripciones push registradas.
- 22 publicaciones aprobadas.

Actualmente no existen casos registrados en `contacto_solicitudes` ni `solicitudes_ayuda_solidaria`; esos recorridos requerirán una prueba controlada cuando corresponda.

## Primera conclusión

Existe cobertura real suficiente para validar los cuatro roles y los recorridos principales sin crear una población artificial de usuarios. Contactos y Ayuda Solidaria son las dos excepciones detectadas en la línea base de datos.
