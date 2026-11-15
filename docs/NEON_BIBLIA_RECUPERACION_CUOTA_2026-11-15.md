# Recuperación de cuota — propuesta, NO ejecutada

## Cambio propuesto y alcance exacto

Después de aprobar y validar el Preview, autorizar por separado la publicación del lector Neon y el vaciado **únicamente** de `public.biblical_word_occurrences` en Supabase `atjtjpchslxbseayzflz`. No retirar textos, tablas, esquema, índices, RLS, grants, usuarios, perfiles, notas, progreso, ministerios ni el índice derivado de búsqueda.

El vaciado de las 611,398 ocurrencias del origen sería destructivo y requiere aprobación explícita adicional. La autorización del respaldo o del Preview **no** lo autoriza.

## Evidencia y efecto esperado

- 611,398 ocurrencias certificadas en los destinos asignados por los 66 libros; 0 diferencias de UUID/contenido según las huellas completas.
- Respaldo local autorizado: `/workspace/vida-respaldo-biblia-2026-11-15.jsonl.gz`, 132,154,798 bytes; manifiesto adyacente y SHA-256 `494b4f1d4d43b8275ece416190da60bf7974b103a819c7f11821367353f798c6`.
- Base Supabase observada: 1,277,684,883 bytes. Tabla de ocurrencias con índices: 958,308,352 bytes. Remanente estimado tras recuperar sus archivos: aproximadamente 319,376,531 bytes, sujeto a crecimiento y medición posterior.
- Catálogo consultado: 0 claves foráneas entrantes y 0 triggers no internos sobre la tabla. No usar CASCADE.
- Esto aborda espacio de almacenamiento; no supone reiniciar cuotas de transferencia o cómputo.

## Condiciones previas obligatorias

1. Preview exacto construido y validado: login real, lectura AT/NT, Biblia y Estudio, Hebreo, notas y progreso conservados.
2. Publicación de la integración autorizada por separado, con secretos de producción configurados expresamente y tráfico usando Neon. No vaciar mientras producción siga leyendo ocurrencias en Supabase.
3. Conservar fuera del entorno temporal una copia descargada del respaldo y su manifiesto; comprobar SHA-256 y disponibilidad de ambas bases Neon.
4. Revalidar conteos y huellas si hubo modificaciones editoriales desde este checkpoint.
5. Confirmar autorización explícita para este vaciado y coordinar una ventana breve: TRUNCATE requiere bloqueo exclusivo. No ejecutarlo si otros procesos migran o escriben el corpus.

## Operación que se presentaría para autorización

```sql
BEGIN;
SET LOCAL lock_timeout = '5s';
TRUNCATE ONLY public.biblical_word_occurrences;
COMMIT;
```

El plazo de bloqueo hace que la operación falle antes de bloquear indefinidamente una tabla ocupada. TRUNCATE libera sus archivos; DELETE ordinario no garantiza reducir el tamaño físico. No cambiar políticas, roles o licencias ni eliminar la tabla. Después medir tamaño y estado de cuota, y comprobar login y funcionalidades reales. Si el proveedor demora en actualizar el estado, no anunciar recuperación sin probarlo.

## Reversión

Mantener Neon activo mientras se restaura. Verificar el SHA-256 del archivo, descomprimir JSONL y reinsertar lotes editoriales con `jsonb_populate_recordset(NULL::public.biblical_word_occurrences, payload)` y `ON CONFLICT(id) DO NOTHING`, conservando números, UUID y marcas temporales. Repetir los 66 conteos y huellas antes de volver a Supabase. Este formato se usó y verificó durante la copia; no se hizo un ensayo destructivo de restauración.

Restaurar el corpus volvería a consumir aproximadamente el espacio original y podría reactivar la restricción de cuota. No desactivar Neon ni cambiar el lector de producción hasta completar y aprobar esa reversión.
