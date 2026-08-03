# FASE D · Bloque 5 — Contrato de lectura y recuperación de Roma

Fecha: 2026-08-03

## Lectura

`lib/estudios/biblical-chronology-maps.ts` es un servicio `server-only` que:

- exige una sesión autenticada;
- consulta únicamente eventos, relaciones, lugares y periodos `approved` y habilitados;
- conserva RLS como control principal;
- no utiliza `service_role` para lectura funcional;
- devuelve fuente, atribución, licencia, precisión, certeza y hashes;
- genera una versión determinista del paquete recuperado;
- no está conectado todavía a una Server Action ni a la interfaz.

Como las seis filas de `rome-pilot-v1` siguen `pending` y deshabilitadas, el contrato devuelve un estado vacío para usuarios normales.

## Recuperación

`lib/estudios/biblical-chronology-recovery.ts` también es `server-only` y no está expuesto mediante Server Action, ruta API o componente cliente.

Controles:

- exige sesión autenticada;
- exige que el UUID del usuario esté incluido en `BIBLICAL_DATA_ADMIN_USER_IDS`;
- exige la confirmación literal `RECOVER_ROME_PILOT_V1`;
- exige el hash global exacto del paquete;
- opera en modo `dryRun` por defecto;
- verifica 1 lugar, 1 periodo, 2 eventos y 2 relaciones;
- solo considera filas `pending` y deshabilitadas;
- elimina en orden seguro relaciones, eventos, periodo y lugar;
- verifica cero residuos después de una recuperación real.

La variable de autorización no se configura durante este incremento. Por tanto, la recuperación productiva permanece bloqueada incluso desde el servidor hasta una autorización y configuración posteriores.

## Validación

`scripts/fase_d/validate_rome_server_contract.py` comprueba aislamiento `server-only`, filtros de publicación, ausencia de `service_role` en lectura, autorización explícita de recuperación, modo seco predeterminado, estados permitidos y orden de eliminación.

## Fuera de alcance

- aprobar o habilitar las seis filas;
- mostrar cronologías o mapas en la interfaz;
- añadir una Server Action pública;
- ejecutar recuperación en producción;
- conectar datos a IA;
- avanzar al Bloque 6.
