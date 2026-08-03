#!/usr/bin/env python3
"""Registra la validación externa del importador de Jonás en el documento maestro."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """El Bloque 4 continúa activo. El siguiente incremento autorizado es diseñar y validar fuera de producción la ampliación transaccional e idempotente del importador para aceptar exactamente Jonás. No aplicar migraciones ni importar Jonás hasta aprobar rechazo de payload adulterado, rollback, conteos, hashes, permisos e idempotencia en PostgreSQL 16.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """### Avance confirmado del Bloque 4 — importador transaccional de Jonás validado

La ampliación del importador TAHOT para aceptar exactamente Jonás fue derivada desde la migración activa de Nahúm y validada fuera de producción en PostgreSQL 16.

Contrato:

- función base OBA/RUT/HAG/NAM: `69045240e658995cd0e1ba3557e54a2700b623078b36125e73ed1ada64f5139c`;
- función resultante OBA/RUT/HAG/NAM/JON: `0d65c4d8e8ac81368cea6e5b6fd3fb104156cc3e3e3f299426b20752eef7f062`;
- 48 textos;
- 688 palabras visibles;
- 1,080 ocurrencias;
- 288 identificadores léxicos;
- 0 variantes;
- 1 lote.

Controles aprobados:

- derivación byte a byte del borrador;
- payload adulterado rechazado sin escrituras;
- variante artificial rechazada sin escrituras;
- rollback completo;
- importación exacta;
- segunda ejecución idempotente;
- reutilización no destructiva de `H3068G` y `H9020`;
- campos editoriales españoles nulos para los datos nuevos;
- `anon` y `authenticated` sin ejecución;
- `service_role` como único rol con `EXECUTE`.

La primera ejecución detectó una expectativa incorrecta en la prueba: `display_word_index` se reinicia por versículo y no puede contarse globalmente. La consulta fue corregida para contar capítulo, versículo e índice visible; el borrador, payload y contrato no cambiaron.

Evidencia:

- PR #123;
- workflow `Validar importador transaccional de Jonás`;
- ejecución aprobada `30789918273` — `success`;
- ejecución limpia `30790108172` — `success`;
- reconfirmación documental `30790197401` — `success`;
- artefacto limpio `stepbible-jonah-importer-validation`, ID `8846702429`;
- digest `sha256:ec6daf133ce112726d8d1ab017a4a386ba9c91240d40d453426cd52e1d770856`;
- borrador `supabase/migration-drafts/20260803060000_importador_payload_tahot_jonas.sql`;
- `docs/FASE_D_IMPORTADOR_TAHOT_JONAS.md`.

No se creó una migración activa, no se aplicó el borrador y no se importó Jonás en Supabase.

El Bloque 4 continúa activo. El siguiente incremento autorizado es convertir mecánicamente este borrador validado en una migración activa versionada y repetir la prueba completa sobre ese archivo exacto. No aplicar la migración ni importar Jonás en Supabase hasta registrar esa segunda validación.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""


def main() -> int:
    text = MASTER.read_text(encoding="utf-8")
    if NEW in text:
        print("Documento maestro ya actualizado")
        return 0
    if text.count(OLD) != 1:
        raise SystemExit("No se encontró un único marcador del importador de Jonás")
    MASTER.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    print("Documento maestro actualizado con el importador de Jonás")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
