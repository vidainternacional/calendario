from pathlib import Path

MASTER = Path('__VIDA_INTERNACIONAL.md')
MARKER = '### Avance confirmado del Bloque 5 — piloto de Roma aplicado y auditado'
BLOCK = r'''

### Avance confirmado del Bloque 5 — piloto de Roma aplicado y auditado

El paquete fijado `rome-pilot-v1` fue aplicado en Supabase de producción el 2026-08-03 después de autorización explícita del usuario.

Resultado:

- 1 lugar, 1 periodo, 2 eventos y 2 relaciones;
- 6 filas totales;
- todas las filas con `review_status = pending`;
- todas las filas con `enabled = false`;
- hash global `67efcaa4e4cae2ec6f908f60a97850a1b7fd6ee223496fbc17438a87ea3a0550`;
- hashes individuales verificados;
- RLS y privilegios intactos;
- filas invisibles para usuarios normales;
- recuperación operativa disponible y condicionada al estado pendiente/deshabilitado.

Evidencia:

- PR #155 y commit de fusión `c6b48c87bf3277e8b01ff633eaa60223c50765de`;
- PR #156 y commit de fusión `e9819fbef8f0941a8873dcefa9af976a0b94e81f`;
- `docs/FASE_D_BLOQUE_5_PREFLIGHT_IMPORTACION_ROMA.md`;
- `docs/FASE_D_BLOQUE_5_APLICACION_PILOTO_ROMA.md`;
- `supabase/migrations/20260803162000_import_rome_pilot_v1.sql`;
- `supabase/recovery/20260803162000_recover_rome_pilot_v1.sql`.

Vercel volvió a aceptar compilaciones y existen deployments de producción en estado `READY`. Este hito no habilitó filas ni conectó la interfaz.

**Siguiente punto autorizado:** diseñar y validar fuera de producción la recuperación exclusivamente desde servidor y el contrato de lectura para cronologías y mapas, limitado inicialmente al piloto de Roma. No aprobar ni habilitar las seis filas, no exponerlas en la interfaz y no avanzar al Bloque 6 hasta que el servicio de recuperación, sus pruebas y la revisión editorial del piloto estén documentados y aprobados. Las instrucciones anteriores del Bloque 5 quedan subordinadas a este estado más reciente.
'''

text = MASTER.read_text(encoding='utf-8')
if MARKER not in text:
    text = text.rstrip() + BLOCK + '\n'
    MASTER.write_text(text, encoding='utf-8')
