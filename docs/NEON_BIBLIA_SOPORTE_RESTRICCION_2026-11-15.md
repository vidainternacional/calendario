# Solicitud preparada para Supabase — no enviada

Canal: https://supabase.help

Asunto: Revisar restricción `exceed_db_size_quota` tras reducir la base a 319 MB, conservando plan Free

Proyecto: **calendariovida**, referencia **atjtjpchslxbseayzflz**. Organización: **rrsbznnpptcxqizrcunp**.

El 15 de noviembre de 2026 migramos y verificamos íntegramente el corpus bíblico compartido en dos proyectos Neon. Conservamos Supabase Auth, perfiles, permisos, notas y progreso personal. Tenemos respaldo completo cotejado y no solicitamos cambio de plan ni desactivar límites de gasto.

Tras autorización del propietario y despliegue del lector nuevo, vaciamos exclusivamente `public.biblical_word_occurrences`. La base pasó de **1,277,684,883 bytes** a **319,425,683 bytes**, por debajo de 500 MB. Se recuperaron **958,259,200 bytes físicos**. La tabla vaciada ocupa ahora 49,152 bytes, no hay filas pendientes de eliminación en ella. `default_transaction_read_only` es `off` y el proyecto aparece `ACTIVE_HEALTHY`.

Sin embargo, `GET /auth/v1/health` sigue devolviendo **HTTP 402**:

> Service for this project is restricted due to the following violations: exceed_db_size_quota. The project owner must upgrade their plan or remove spend caps to restore service.

Solicitamos revisar o recalcular la medición de tamaño y levantar la restricción cuando corresponda, **sin contratar un plan de pago ni desactivar spend caps**. Por favor indiquen si el bloqueo requiere intervención o cuál es el momento de liberación aplicable. No asumimos que el cambio de tamaño levante inmediatamente una restricción ligada al ciclo.

Mediciones reproducibles de solo lectura:

```sql
SELECT pg_database_size(current_database());
SELECT pg_total_relation_size('public.biblical_word_occurrences');
SELECT count(*) FROM public.biblical_word_occurrences;
SELECT count(*) FROM public.biblical_verse_texts;
SHOW default_transaction_read_only;
```

Resultados posteriores al vaciado: `319425683`, `49152`, `0`, `124504`, `off`. No adjuntar contraseñas, claves de API, credenciales Neon ni datos personales al ticket.
