# FASE D · Bloque 4 — Aplicación controlada de Nahúm

Fecha: 2026-08-02

## Resultado

La migración activa del importador TAHOT y el payload canónico de Nahúm fueron aplicados de forma controlada al proyecto Supabase `calendariovida`.

La importación, la auditoría técnica, la prueba de recuperación y el cierre de seguridad están completos. Queda pendiente únicamente la validación visual manual en la aplicación.

## Artefactos fijados

- migración activa: `supabase/migrations/20260803043000_generalizar_importador_payload_tahot_nahum.sql`;
- versión registrada por Supabase: `20260803042730_generalizar_importador_payload_tahot_nahum`;
- paquete: `60e280a6d94abc8788b7cc9647e4dfa0f679e0a9708a1adf00be30abfc23b7f5`;
- archivo payload: `0c041041155152e1fb63cb568efa1530724bea7fa729b4ed8815dcbaaf666000`;
- huella canónica interna: `43a5ab1b8c9cf773e218c73eab3def49715ac7c0511a04ee9cae3990be4a8a99`;
- fuente TAHOT Isa–Mal: `f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5`;
- commit STEPBible: `b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39`;
- archivo ZIP transferido: `aead5384c01d293de4514e3971d6c1866ae801836525b2963f6010b8485a6449`.

## Comprobación previa

Antes de cualquier escritura se confirmó:

- función activa OBA/RUT/HAG: `619b0249f70e6ac373256da724a89033cb3ecb566ad26f2ac9709ee0b6f9977d`;
- Nahúm con 0 textos, 0 ocurrencias, 0 variantes y 0 lotes;
- libro `NAM` aprobado, habilitado y con tres capítulos;
- RLS activo en las cuatro tablas textuales;
- `anon` y `authenticated` sin permiso para ejecutar el importador;
- `service_role` como único rol con `EXECUTE`.

La migración contiene una guarda sobre la huella de la función anterior y habría abortado ante cualquier desviación.

## Aplicación de la migración

La migración fue aplicada correctamente mediante el historial de migraciones de Supabase.

Después de aplicarla:

- la función quedó con SHA-256 `69045240e658995cd0e1ba3557e54a2700b623078b36125e73ed1ada64f5139c`;
- Nahúm continuó con cero datos antes de transferir el payload;
- los permisos permanecieron restringidos a `service_role`.

## Importación controlada e idempotencia

El payload fue transferido desde el artefacto canónico mediante un puente temporal con estas defensas:

- nombre exclusivo para Nahúm;
- token temporal con usos limitados y vencimiento corto;
- verificación SHA-256 del ZIP;
- verificación SHA-256 del archivo payload;
- verificación de la huella interna, libro, fuente y conteos;
- rechazo de cualquier estado parcial;
- RPC ejecutable únicamente por `service_role`.

Las dos llamadas se completaron con HTTP 200:

- respuesta `pg_net` 331: importación inicial;
- respuesta `pg_net` 332: segunda ejecución idempotente.

Ambas devolvieron:

- dataset: `TAHOT Isa-Mal`;
- libro: `NAM`;
- referencias: 47;
- palabras visibles: 558;
- ocurrencias: 828;
- identificadores léxicos: 387;
- filas fuente con variantes: 4;
- variantes estructuradas: 8;
- hashes inválidos: 0;
- operación idempotente: sí.

El lote conserva estado `imported`, sin error, con las huellas y conteos fijados.

## Auditoría posterior independiente

Los libros anteriores permanecieron intactos:

| Libro | Textos | Ocurrencias | Variantes | Lotes |
|---|---:|---:|---:|---:|
| Abdías | 21 | 434 | 3 | 1 |
| Rut | 85 | 2,026 | 29 | 1 |
| Hageo | 38 | 911 | 3 | 1 |
| Nahúm | 47 | 828 | 8 | 1 |

Resultado específico de Nahúm:

- textos aprobados y habilitados: 47;
- palabras visibles: 558;
- ocurrencias: 828;
- identificadores léxicos distintos: 387;
- roles: 558 palabras/raíces, 175 prefijos y 95 sufijos;
- variantes ortográficas: 4;
- sustituciones Qere/Ketiv: 4;
- adiciones, omisiones y transposiciones: 0;
- variantes sin ancla: 0;
- hashes con formato inválido: 0;
- traducciones literales españolas no revisadas: 0;
- glosas españolas de ocurrencia no revisadas: 0;
- explicaciones españolas de variantes no revisadas: 0;
- filas no aprobadas o deshabilitadas: 0.

## Variantes textuales confirmadas

Las ocho variantes almacenadas coinciden exactamente con el payload aprobado:

1. Nahúm 1:3, posición 4:
   - ortográfica: `וּגְדָל` / `וּגְדָול־`, testigo `L`;
   - sustitución Qere/Ketiv: `וּגְדָל` / `וּגְדוֹל`, testigo `K`.
2. Nahúm 1:15, posición 17:
   - ortográfica: `לַֽעֲבָר` / `לַֽעֲבָור־`, testigo `L`;
   - sustitución Qere/Ketiv: `לַֽעֲבָר` / `לַעֲבוֹר`, testigo `K`.
3. Nahúm 2:5, posición 4:
   - ortográfica: `בַּהֲלִֽיכָתָ֑ם` / `בַּהֲלִֽכָותָ֑ם`, testigo `L`;
   - sustitución Qere/Ketiv: `בַּהֲלִֽיכָתָ֑ם` / `בַהֲלִכוֹתָם`, testigo `K`.
4. Nahúm 3:3, posición 14:
   - ortográfica: `וְכָשְׁל֖וּ` / `יְכָשְׁל֖וּ`, testigo `L`;
   - sustitución Qere/Ketiv: `וְכָשְׁל֖וּ` / `יִכְשְׁלוּ`, testigo `K`.

## Integridad léxica

- entradas utilizadas por Nahúm: 387;
- entradas reutilizadas sin modificación: 155;
- entradas nuevas: 232;
- entradas compartidas actualizadas durante la importación: 0;
- duplicados por fuente e identificador léxico: 0;
- campos editoriales españoles añadidos a entradas nuevas: 0.

`H3068G` fue reutilizado sin alterar su contenido editorial existente y continúa compartido por varios libros.

`H9040` fue creado con lema `־נִי`, permanece exclusivo de Nahúm y aparece exactamente en dos ocurrencias.

## Seguridad y cierre de puentes

Después de confirmar la segunda ejecución idempotente:

- el RPC público temporal fue eliminado;
- la función interna de consumo de token fue eliminada;
- la tabla de autorización temporal fue eliminada;
- la Edge Function `import-nahum-once-20260803` fue reemplazada por una versión inerte;
- la versión inerte exige JWT y responde HTTP 410;
- no contiene payload, token ni capacidad de escritura;
- los conteos productivos permanecieron exactos después del cierre.

El importador permanente continúa disponible únicamente para `service_role`. RLS permanece activo y las políticas de lectura no fueron ampliadas.

Los asesores de Supabase no produjeron hallazgos nuevos asociados a Nahúm, al importador o al puente temporal. Los avisos restantes corresponden a deuda histórica del proyecto fuera del alcance de este incremento.

## Recuperación segura

Se ejecutó una prueba de recuperación dentro de una subtransacción que fue revertida deliberadamente.

La prueba eliminó temporalmente y verificó:

- 8 variantes;
- 828 ocurrencias;
- 47 textos;
- 1 lote;
- 232 entradas léxicas exclusivas de Nahúm.

También confirmó que 155 entradas léxicas compartidas permanecían intactas. Después del rollback, el estado productivo volvió exactamente a 47 textos, 828 ocurrencias, 8 variantes, 1 lote y 387 identificadores.

Estado: `passed_and_rolled_back`.

## Validación funcional técnica de las rutas de lectura

Se revisó el flujo real de código:

- Biblia → Estudio usa `cargarEvidenciaTextualBiblica()`;
- Estudio Profundo usa `analizarPasaje()`;
- ambos llaman a `getResolvedBiblicalTextualStudy()`;
- el analizador canónico reconoce `Nahúm`, `Nahum`, `Nah` y `NAM` desde el catálogo aprobado;
- al no existir un mapeo especial de versificación, el resolvedor usa correctamente `getInternalBiblicalTextualStudy()`;
- todas las consultas exigen usuario autenticado y respetan RLS.

La lectura fue probada bajo el rol real `authenticated` con una cuenta activa, no mediante privilegios administrativos.

Referencias representativas:

| Referencia | Palabras base | Morfemas base | Variantes |
|---|---:|---:|---:|
| Nahúm 1:1 | 6 | 7 | 0 |
| Nahúm 1:3 | 15 | 23 | 2 |
| Nahúm 1:15 | 21 | 27 | 2 |
| Nahúm 2:5 | 8 | 14 | 2 |
| Nahúm 3:3 | 15 | 24 | 2 |

En las cinco referencias se confirmó:

- una edición visible;
- dirección `rtl`;
- estado `verified`;
- texto original presente;
- transliteración de edición presente;
- transliteración en todos los morfemas base;
- lema en todos los morfemas base;
- número Strong en todos los morfemas base;
- morfología en todos los morfemas base;
- fuente STEPBible visible;
- atribución visible;
- licencia CC BY 4.0 visible.

Nahúm también dispone de un perfil de libro y dos unidades contextuales aprobadas que cubren los capítulos 1–3. Por ello, Estudio Profundo no debe caer en el mensaje de contenido interno ausente.

La indicación «Secuencia literal de glosas: No disponible» es deliberada mientras esa capa editorial española no haya sido revisada.

## Estado pendiente

Falta validar manualmente en producción:

- Biblia → Estudio: Nahúm 1:1, 1:3, 1:15, 2:5 y 3:3;
- Estudio Profundo: al menos Nahúm 1:1, 1:3 y 1:15;
- texto hebreo RTL y transliteración;
- agrupación palabra por palabra;
- Strong, lemas y morfología;
- las ocho variantes en sus cuatro referencias;
- ausencia correcta de variantes en Nahúm 1:1;
- fuente, atribución y licencia;
- regresión de Hageo 1:8, Rut 3:12, Abdías 1:1 y Juan 3:16;
- ausencia de pantallas en blanco, cargas infinitas, desbordamiento lateral o cambios no aprobados de interfaz.

No ampliar a otro libro ni avanzar al Bloque 5 hasta registrar esa validación funcional.