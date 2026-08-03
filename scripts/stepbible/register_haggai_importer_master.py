#!/usr/bin/env python3
"""Registra el importador transaccional validado de Hageo en el documento maestro."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """No se modificó el importador, no se creó una migración y no se escribió en Supabase, RLS, interfaz o producción.

El Bloque 4 continúa activo. El siguiente incremento autorizado es diseñar y validar fuera de producción la ampliación transaccional e idempotente del importador para aceptar exactamente Hageo. No aplicar migraciones ni importar Hageo hasta aprobar rechazo de payload adulterado, rollback, conteos, hashes, permisos e idempotencia en PostgreSQL 16.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """No se modificó el importador activo y no se escribió en Supabase, RLS, interfaz o producción durante la construcción del payload.

### Avance confirmado del Bloque 4 — importador transaccional de Hageo validado

La ampliación del importador TAHOT para aceptar exactamente Hageo quedó diseñada y validada fuera de producción en PostgreSQL 16.

Contrato cerrado:

- función base OBA/RUT: `dad481d9de705efc566dfa1beaa68cba99b85de069f241733183e33c3b04b381`;
- código interno `HAG` y código STEPBible `Hag`;
- dataset `TAHOT Isa-Mal`;
- paquete `bc8e1caebce9a2e55d34b3be4770f3591e430b3aa217208324dee1bdbdd54e38`;
- archivo payload `c24d50fbbe01ecb47ec5a818c8a0f8cbdebae1451f2c9cd2b446234f02516ec6`;
- huella interna `db6510d6e971e672c2fac244b406ffd1f704ac49d4fc3b3bbca3b1c5cde71fa9`;
- 38 referencias, 600 palabras visibles, 911 ocurrencias, 235 identificadores y 3 variantes.

PostgreSQL 16 aprobó:

- payload adulterado rechazado sin escrituras;
- rollback completo;
- importación exacta;
- segunda ejecución idempotente;
- reutilización no destructiva de entradas existentes;
- tres variantes exactas en Hageo 1:8 y 1:10;
- campos editoriales españoles nulos para los datos nuevos;
- `anon` y `authenticated` sin ejecución;
- `service_role` con ejecución.

Evidencia:

- PR #85;
- workflow `Validar importador transaccional de Hageo`;
- ejecución inicial `30778074154` — `success`;
- artefacto `stepbible-haggai-importer-validation`;
- ID `8842724863`;
- digest `sha256:62e980c02974c77859b6ccc5ea270d11f04a7c86688c2556595a045cca110029`;
- borrador `supabase/migration-drafts/20260803020000_importador_payload_tahot_hageo.sql`;
- `docs/FASE_D_IMPORTADOR_TAHOT_HAGEO.md`.

No se aplicó el borrador a Supabase y no se modificó producción.

El Bloque 4 continúa activo. El siguiente incremento autorizado es convertir el borrador validado en una migración activa versionada y validarla nuevamente desde la función OBA/RUT exacta. Solo después podrá aplicarse de forma controlada a Supabase e importarse Hageo con auditoría independiente.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""


def main() -> int:
    text = MASTER.read_text(encoding="utf-8")
    if NEW in text:
        print("Documento maestro ya actualizado")
        return 0
    if text.count(OLD) != 1:
        raise SystemExit("No se encontró un único marcador del importador de Hageo")
    MASTER.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    print("Documento maestro actualizado con el importador de Hageo")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
