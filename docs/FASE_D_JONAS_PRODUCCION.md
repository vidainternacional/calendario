# FASE D · Bloque 4 — Jonás en producción

Fecha: 2026-08-03

La migración activa de Jonás fue aplicada de forma controlada en Supabase y el payload canónico fue importado dos veces con resultado idempotente.

Resultado verificado:

- 48 textos;
- 688 palabras visibles;
- 1,080 ocurrencias;
- 288 identificadores léxicos;
- 0 variantes;
- 1 lote;
- 0 hashes inválidos;
- 0 campos editoriales españoles no revisados.

La función activa quedó con SHA-256 `0d65c4d8e8ac81368cea6e5b6fd3fb104156cc3e3e3f299426b20752eef7f062`.

Las huellas aprobadas son:

- paquete: `083b869fe7d10493deaeee392babd9811e9dffb91f0db816d2f21a22b2135915`;
- archivo payload: `e6bd082a446d29becbafb35a22b94ef9e260e447fe7fc7cea4361d98c5bb835b`;
- huella interna: `f986bdd833c86f9f239ddd26e4594aeb33d48a89f72fb05dcc853dbd1d512fc4`.

Preservación:

- Abdías: 21 textos, 434 ocurrencias y 3 variantes;
- Rut: 85 textos, 2,026 ocurrencias y 29 variantes;
- Hageo: 38 textos, 911 ocurrencias y 3 variantes;
- Nahúm: 47 textos, 828 ocurrencias y 8 variantes.

Reutilización léxica:

- 171 entradas compartidas permanecieron intactas;
- 117 entradas nuevas fueron creadas;
- 0 duplicados por fuente;
- `H3068G` y `H9020` conservaron sus datos previos.

Seguridad:

- RLS permanece activo;
- `anon` y `authenticated` no pueden ejecutar el importador;
- `service_role` es el único rol autorizado;
- los RPC temporales fueron retirados;
- la Edge Function temporal quedó inerte con JWT obligatorio.

La prueba de recuperación pasó y revirtió completamente al estado productivo.

## Lectura autenticada

Se ejecutó una lectura controlada bajo el rol PostgreSQL `authenticated`, con `auth.uid()` asociado a una cuenta activa existente. La transacción fue de solo lectura y terminó con `ROLLBACK`.

Jonás 1:1 quedó recuperable con:

- libro `JON`, nombre `Jonás`, 4 capítulos;
- texto hebreo completo;
- transliteración del versículo;
- 8 palabras visibles y 10 componentes morfológicos;
- lemas, transliteraciones, números Strong, morfología y tipo de componente;
- fuente STEPBible Data;
- atribución CC BY 4.0;
- versión fijada `STEPBible-Data@b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39`.

La política RLS confirmó `cuenta_activa() = true` y permitió únicamente la lectura de filas aprobadas y habilitadas. No se alteraron usuarios, perfiles, sesiones ni datos bíblicos.

## Validación funcional y visual

El usuario aprobó la validación manual en producción el 2026-08-03.

Cobertura confirmada:

- Biblia → Estudio: Jonás 1:1, 2:1, 3:1 y 4:11;
- Estudio Profundo: recuperación correcta de las mismas referencias;
- hebreo RTL, transliteración, Strong, lemas, morfología, fuente y licencia visibles;
- ausencia correcta del panel de variantes, porque Jonás contiene cero variantes Qere/Ketiv;
- sin pantallas en blanco, cargas infinitas, desbordamiento lateral ni cambios de interfaz no aprobados.

La auditoría técnica, la recuperación autenticada y la validación funcional y visual quedan aprobadas. Jonás está completo dentro del Bloque 4.

Evidencia complementaria: `docs/FASE_D_VALIDACION_VISUAL_JONAS_2026-08-03.md`.

No se autoriza avanzar al Bloque 5 por inferencia. El siguiente punto deberá determinarse exclusivamente al actualizar y releer `__VIDA_INTERNACIONAL.md`.