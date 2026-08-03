#!/usr/bin/env python3
"""Registra la validación externa del importador de Nahúm en el maestro."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """No se modificó el importador, no se creó una migración y no se escribió en Supabase, RLS, interfaz o producción.

El Bloque 4 continúa activo. El siguiente incremento autorizado es diseñar y validar fuera de producción la ampliación transaccional e idempotente del importador para aceptar exactamente Nahúm. No aplicar migraciones ni importar Nahúm hasta aprobar rechazo de payload adulterado, rollback, conteos, hashes, permisos e idempotencia en PostgreSQL 16.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """No se modificó el importador durante la construcción del payload y no se escribió en Supabase, RLS, interfaz o producción.

### Avance confirmado del Bloque 4 — importador transaccional de Nahúm validado

La ampliación del importador TAHOT para aceptar exactamente Nahúm fue derivada mecánicamente desde la migración activa de Hageo y validada fuera de producción en PostgreSQL 16.

Contrato cerrado:

- función base OBA/RUT/HAG: `619b0249f70e6ac373256da724a89033cb3ecb566ad26f2ac9709ee0b6f9977d`;
- función resultante OBA/RUT/HAG/NAM: `69045240e658995cd0e1ba3557e54a2700b623078b36125e73ed1ada64f5139c`;
- paquete: `60e280a6d94abc8788b7cc9647e4dfa0f679e0a9708a1adf00be30abfc23b7f5`;
- archivo payload: `0c041041155152e1fb63cb568efa1530724bea7fa729b4ed8815dcbaaf666000`;
- huella interna: `43a5ab1b8c9cf773e218c73eab3def49715ac7c0511a04ee9cae3990be4a8a99`;
- 47 referencias, 558 palabras visibles, 828 ocurrencias, 387 identificadores y 8 variantes.

PostgreSQL 16 aprobó:

- derivación byte a byte del borrador desde la migración activa;
- payload adulterado rechazado sin escrituras;
- rollback completo;
- importación exacta;
- segunda ejecución idempotente;
- ocho variantes exactas, con cuatro ortográficas y cuatro sustituciones Qere/Ketiv;
- reutilización no destructiva de `H3068G`;
- campos editoriales españoles nulos para los datos nuevos;
- `anon` y `authenticated` sin ejecución;
- `service_role` con ejecución.

La evidencia inicial fue corregida porque un pipeline con `tee` ocultó un código de salida y el validador ordenaba claves como texto. La ejecución limpia final usa salida JSON persistida y orden numérico por capítulo, versículo y tipo.

Evidencia:

- PR #109;
- commit `f9140b97e9bcea3ad511761ee15536e21de3c52e`;
- workflow `Validar importador transaccional de Nahúm`;
- ejecución limpia `30783144402` — `success`;
- reconfirmación final `30783199006` — `success`;
- artefacto `stepbible-nahum-importer-validation`, ID `8844339116`;
- digest `sha256:5ab2dcd687706b4d6ae05dcf4912f77086fdac6f627dc0b3a38a19518f0857ea`;
- `docs/FASE_D_IMPORTADOR_TAHOT_NAHUM.md`;
- borrador `supabase/migration-drafts/20260803040000_importador_payload_tahot_nahum.sql`.

No se creó una migración activa, no se aplicó el borrador y no se importó Nahúm en Supabase.

El Bloque 4 continúa activo. El siguiente incremento autorizado es convertir mecánicamente el borrador validado en una migración activa versionada y repetir la prueba completa desde la función OBA/RUT/HAG exacta. No aplicar la migración ni importar Nahúm hasta que esa segunda validación sea aprobada y registrada.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""


def main() -> int:
    text = MASTER.read_text(encoding="utf-8")
    if NEW in text:
        print("Documento maestro ya actualizado")
        return 0
    if text.count(OLD) != 1:
        raise SystemExit("No se encontró un único marcador del importador de Nahúm")
    MASTER.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    print("Documento maestro actualizado con el importador de Nahúm")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
