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

La auditoría técnica queda aprobada. El siguiente paso permitido es validar Jonás con una sesión autenticada en Biblia → Estudio y Estudio Profundo. No avanzar a otro libro ni al Bloque 5 hasta registrar esa validación.