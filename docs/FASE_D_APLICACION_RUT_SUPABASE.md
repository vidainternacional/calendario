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

## Estado pendiente

La importación y la auditoría técnica están completas. Falta la validación funcional manual en producción de:

- Biblia → Estudio;
- Estudio Profundo;
- texto hebreo RTL y transliteración;
- agrupación palabra por palabra;
- Strong, lemas y morfología;
- variantes de muestra;
- Rut 3:12 sin palabra visible artificial;
- regresión de Abdías y Juan 3:16.

No ampliar a otro libro ni avanzar al Bloque 5 hasta registrar esa validación funcional.
