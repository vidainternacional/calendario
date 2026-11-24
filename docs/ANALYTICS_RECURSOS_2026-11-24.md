# Analytics · Recursos y cuotas · 24-11-2026

Implementación en `agent/analytics-recursos-20261124`, basada exclusivamente en main `bd7aa236`. No integra el Draft #319 de badges ni otras funciones. Maestro, RLS, datos, planes y producción intactos.

## Implementado

Centro de Análisis existente `/admin/analisis`: sección Recursos y cuotas para administradores; endpoint requiere administrador activo y autentica contra ccvida antes de consultar proveedores/caché. No devuelve credenciales ni respuestas internas. Caché técnica de 300 segundos; respuesta HTTP privada sin caché. Actualización al abrir y botón manual; no polling, cron ni notificaciones externas nuevas.

Cuotas independientes con porcentaje, margen y aviso a 70/85/95%. Valores ausentes permanecen null, no cero. Fallos por servicio aislados, fecha de consulta y enlace al proveedor. Cuenta R2 completa evita olvidar otros buckets; no confundir consumo actual con GB-mes facturados. No garantiza impedir cargos/bloqueos.

- Supabase: Management API endpoint de solo lectura, tamaño PostgreSQL y agregado de metadata.size Storage. Referencia DB conservadora 500000000 bytes. No lee filas de personas ni archivos.
- Neon A/B: API de proyecto y rama principal, sin despertar cómputo. No usa synthetic_storage_size ni cpu_used_sec (campos heredados observados en cero). Usa logical_size de rama, branch_logical_size_limit_bytes y compute_time_seconds / 3600, transferencia y período. Free v3: referencias documentadas 100 CU-h y 5 GB/mes; otros planes requieren cuotas explícitas. No suma tamaños entre proyectos ni compara tamaño lógico con facturación histórica.
- R2: endpoint GET accounts/:account/r2/metrics, Standard publicado payloadSize. Excluye cargas incompletas/metadatos/Infrequent Access y lo indica; referencia preventiva 10 GB, no representa un tope gratuito rígido. Operaciones y facturación todavía requieren panel del proveedor.

## Conexiones pendientes (bloqueo de medición dentro de VIDA)

Conectores de ChatGPT NO transmiten sus credenciales a Vercel. No se crearon/copiaron/descifraron tokens en este bloque. Variables exclusivamente de servidor, nunca NEXT_PUBLIC:

- VIDA_SUPABASE_METRICS_TOKEN: acceso Management API al proyecto ccvida, con mínimo acceso de lectura necesario. No es service_role.
- VIDA_NEON_METRICS_TOKEN: acceso de lectura a ambos proyectos bíblicos.
- VIDA_CLOUDFLARE_METRICS_TOKEN y VIDA_CLOUDFLARE_ACCOUNT_ID: lectura de métricas de la cuenta de iglesia. No son las credenciales S3 para subir archivos.
- VIDA_SUPABASE_STORAGE_LIMIT_BYTES: límite confirmado de Storage de su plan. No inventar por confundir tamaño DB con Storage.
- VIDA_NEON_A_COMPUTE_LIMIT_CUH, VIDA_NEON_B_COMPUTE_LIMIT_CUH, VIDA_NEON_A_TRANSFER_LIMIT_BYTES, VIDA_NEON_B_TRANSFER_LIMIT_BYTES: opcionales si corresponde sustituir referencias Free v3 por límites confirmados.

Hasta configurarlas, aparece «Pendiente de conexión» y «Sin datos». No pedir al usuario pegar secretos al chat. Configuración del servidor, prueba autenticada y publicación pendientes; el permiso para desarrollar el panel no autoriza merge/producción.

## Comprobación directa independiente de los conectores

24-11-2026: ccvida 251377331 bytes PostgreSQL; Storage 1 objeto, 446694 bytes. Neon A rama principal 750895104 bytes, límite de rama 1073741824; compute_time_seconds 24069; transferencia 1025007350. Neon B 452444160 bytes, mismo límite de rama; cómputo 23049 segundos ponderados; transferencia 307134700. Período Neon 01-11 a 01-12. Estas mediciones NO se incorporan como números fijos al panel. R2 no conectado/medido.

## Verificación y límites

Pruebas aisladas cubren umbrales, null/cero, unidades, fallos parciales, credenciales ausentes, agregados de solo lectura y autorización anónimo/pastor/inactivo/admin. No usar datos simulados como prueba autenticada real. TypeScript, lint específico y build se registran al completar. CI histórico general conserva tres fallos conocidos, fuera del alcance.

Vigilancia diaria Supabase existente se conserva; este panel no extiende todavía esa automatización a Neon/R2. Tráfico/Auth/WAL de Supabase, operaciones R2 e historial de crecimiento/facturación no se certifican por medir almacenamiento. Para incorporarlos con cifras reales se requieren fuentes y alcances del plan, sin duplicar cron ni reactivar telemetría del piloto.

Reversión: retirar sección, endpoint y módulos de recursos; no hay migración ni datos que revertir.

Fuentes revisadas: https://supabase.com/docs/reference/api/v1-read-only-query · https://developers.cloudflare.com/api/resources/r2/subresources/buckets/subresources/metrics/ · https://developers.cloudflare.com/r2/pricing/ · https://neon.com/platforms · https://neon.com/docs/introduction/plans
