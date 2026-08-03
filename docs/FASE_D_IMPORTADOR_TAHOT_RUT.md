# FASE D — Importador transaccional TAHOT de Rut

Fecha: 2026-08-02  
Fase: **FASE D — IA Bíblica Avanzada**  
Bloque: **Bloque 4 — Comparaciones y herramientas ampliadas**

## Objetivo

Generalizar fuera de producción el importador TAHOT validado con Abdías para aceptar el payload reproducible de Rut, manteniendo contratos cerrados por libro y sin aplicar todavía cambios a Supabase.

## Contratos autorizados

El borrador acepta exclusivamente dos combinaciones completas:

### Abdías

- código interno: `OBA`;
- código STEPBible: `Oba`;
- dataset: `TAHOT Isa-Mal`;
- referencias: 21;
- palabras visibles: 291;
- ocurrencias: 434;
- identificadores léxicos: 184;
- filas fuente con variantes: 2;
- variantes: 3;
- paquete: `b49dee68303e243c0c2ef4ff3366cbd955a4a8a9b14114eb761a8f174e25940e`;
- payload: `502eade2003802940dd79d386073e4b9817ae5f0668fd341b84ae6ea9e828652`.

### Rut

- código interno: `RUT`;
- código STEPBible: `Rut`;
- dataset: `TAHOT Jos-Est`;
- referencias: 85;
- palabras visibles: 1,293;
- ocurrencias: 2,026;
- identificadores léxicos: 373;
- filas fuente con variantes: 19;
- variantes: 29;
- paquete: `80a79abd038de9159a90e7aa572f1d4ff6a0c7f1ca8bfb4195875ffd5a7ca20c`;
- payload: `d88763cef355dc05d3251438f3adce08a99feed389b82502e8c8f1263d7b79ee`.

No se acepta un tercer libro, una fuente distinta ni una combinación parcial de conteos y hashes.

## Omisión Qere de Rut 3:12

El importador exige exactamente una variante con:

- tipo `addition`;
- lectura base nula;
- lectura alternativa `אִם`;
- ancla visible nula;
- testigo `K`;
- ninguna ocurrencia asociada a la misma línea fuente.

Una alteración controlada de esa lectura fue rechazada antes de insertar datos.

## Validación en PostgreSQL 16

Workflow: `Validar importador transaccional de Rut`  
Ejecución inicial: `30775456091` — `success`.

Resultado:

- payload adulterado rechazado;
- cero escrituras parciales tras el rechazo;
- rollback explícito aprobado;
- importación válida con 373 entradas léxicas, 2,026 ocurrencias, 85 textos, 29 variantes y 1 lote;
- segunda ejecución con conteos idénticos;
- campos editoriales españoles permanecen nulos;
- `anon` sin ejecución;
- `authenticated` sin ejecución;
- `service_role` con ejecución;
- Rut 3:12 conserva la evidencia Ketiv sin crear palabra artificial.

Artefacto inicial:

- nombre: `stepbible-ruth-importer-validation`;
- ID: `8841876140`;
- digest: `sha256:29801d1f0b9318af83b8f7c63800cead2e9cd2d16e180346a0efa370b5360cb5`.

## Archivos

- `scripts/stepbible/build_ruth_importer_draft.py`;
- `scripts/stepbible/test_ruth_importer_draft.py`;
- `supabase/migration-drafts/20260803003000_importador_payload_tahot_rut.sql`;
- `.github/workflows/validate-ruth-importer-draft.yml`.

## Seguridad y alcance

El SQL permanece en `supabase/migration-drafts/`. No se aplicó a Supabase, no se modificó RLS, no se desplegó interfaz y no se avanzó al Bloque 5.

El siguiente incremento solo podrá convertir este borrador en migración activa después de que el mismo commit documentado vuelva a aprobar CI. La aplicación a Supabase deberá realizarse como operación separada y controlada, seguida de una auditoría independiente antes de solicitar pruebas visuales al usuario.
