# FASE D · Bloque 4 — Aplicación controlada de Rut

Fecha: 2026-08-02

## Resultado

La migración activa del importador TAHOT generalizado y el payload canónico de Rut fueron aplicados de forma controlada al proyecto Supabase `calendariovida`.

## Artefactos fijados

- migración activa: `supabase/migrations/20260803011000_generalizar_importador_payload_tahot_rut.sql`;
- PR de activación: #78;
- commit de fusión: `2b66b5dad77e1b1bef9b48cafd79f61611cddc4e`;
- workflow final: `30776001163` — `success`;
- artefacto de validación: `stepbible-ruth-active-migration-validation`;
- digest del artefacto: `sha256:e340c24ead2fd67a712b8e4a6a201f23ef8f1a696d90e86ddfed9e6e946daf99`;
- paquete: `80a79abd038de9159a90e7aa572f1d4ff6a0c7f1ca8bfb4195875ffd5a7ca20c`;
- archivo payload: `454d57e805cd55eaf59d1d7635eb2fe913858ff03f293b18d0db315222178913`;
- huella canónica interna: `d88763cef355dc05d3251438f3adce08a99feed389b82502e8c8f1263d7b79ee`;
- archivo fuente TAHOT Jos–Est: `195fee1dc3653bab33701f170734eb894ed647c10cd08cc61749375fe8b73775`.

## Aplicación

La migración `generalizar_importador_payload_tahot_rut` fue registrada en el historial de Supabase. Antes de modificar la función, verificó la huella SHA-256 de la definición activa de Abdías y abortaría ante cualquier diferencia.

El payload se transfirió desde el artefacto canónico, se descomprimió y se validó antes de llamar al importador interno. El puente temporal de transferencia quedó reemplazado por una versión inerte que:

- exige JWT;
- responde únicamente HTTP 410;
- no contiene URL de artefacto, credenciales ni lógica de importación.

## Auditoría posterior independiente

- capítulos: 4;
- textos de versículo: 85;
- textos aprobados y habilitados: 85;
- palabras visibles: 1,293;
- ocurrencias morfológicas: 2,026;
- identificadores léxicos utilizados: 373;
- variantes estructuradas: 29;
- variantes aprobadas y habilitadas: 29;
- lotes de importación: 1;
- hashes inválidos de textos: 0;
- hashes inválidos de ocurrencias: 0;
- hashes inválidos de entradas léxicas: 0;
- hashes inválidos de variantes: 0.

El lote quedó con estado `imported`, sin error, y conserva los conteos y las huellas del paquete, payload, archivo fuente y commit STEPBible.

## Qere y variantes

Distribución:

- variantes ortográficas: 18;
- sustituciones: 10;
- adiciones: 1.

Rut 3:12 conserva exactamente una variante `addition` con:

- lectura base nula;
- Ketiv `אִם`;
- ancla visible nula;
- testigo `K`;
- cero ocurrencias artificiales asociadas a la omisión Qere.

## Integridad editorial

- traducciones literales españolas añadidas: 0;
- glosas españolas de ocurrencia añadidas: 0;
- explicaciones españolas de variantes añadidas: 0;
- glosas españolas nuevas en entradas léxicas del paquete: 0;
- textos, ocurrencias o variantes marcados como generados por IA: 0.

## Seguridad y recuperación

- `anon` no puede ejecutar el importador;
- `authenticated` no puede ejecutar el importador;
- únicamente `service_role` conserva `EXECUTE`;
- RLS continúa activo en las cuatro tablas textuales;
- las políticas exigen usuario autenticado con cuenta activa y registros, fuentes, libros y dependencias aprobados y habilitados;
- `lib/estudios/biblical-textual-study.ts` y `lib/estudios/resolved-biblical-textual-study.ts` son módulos `server-only`;
- la Server Action `analizarPasaje()` exige una sesión autenticada y usa el resolver textual genérico;
- el catálogo canónico de Rut está aprobado, habilitado y contiene los alias `Rut` y `Ruth`.

El asesor de seguridad no produjo hallazgos asociados al importador TAHOT ni a sus tablas. Los avisos existentes pertenecen a otras áreas históricas del proyecto.

## Validación funcional completada

La validación manual fue aprobada por el usuario el 2026-08-02.

Referencias verificadas en Biblia → Estudio:

- Rut 1:1: texto hebreo RTL, 19 palabras base, transliteración, Strong, lema, morfología, fuente y licencia;
- Rut 1:8: 18 palabras base, variante ortográfica y sustitución Ketiv sin duplicar el texto principal;
- Rut 3:12: 11 palabras base y una adición Ketiv `אִם`, sin ancla ni palabra visible artificial;
- Rut 4:22: 8 palabras base, análisis completo y ausencia correcta de variantes.

También se aprobó:

- recuperación de Rut 1:1, 1:8 y 3:12 en Estudio Profundo;
- conservación de dirección RTL y análisis palabra por palabra;
- visualización de fuente, licencia y variantes;
- regresión de Abdías 1:1;
- regresión del análisis griego de Juan 3:16 y sus variantes del Nuevo Testamento;
- ausencia de pantallas en blanco, cargas infinitas o cambios no aprobados de interfaz.

La indicación «Secuencia literal de glosas: No disponible» permanece deliberadamente cuando la capa editorial española no ha sido revisada.

## Estado

La importación, auditoría técnica, recuperación segura y validación funcional de Rut están completas.

El Bloque 4 permanece activo. El siguiente incremento debe seleccionar y auditar fuera de producción un tercer libro pequeño del Antiguo Testamento con criterios explícitos de tamaño, variantes, Qere/Ketiv y compatibilidad con el importador. No generar payload, activar migraciones ni escribir en Supabase hasta que ese paquete haya sido reproducido y auditado.

No avanzar al Bloque 5.