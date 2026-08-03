#!/usr/bin/env python3
"""Registra el payload TAHOT reproducible de Hageo en el documento maestro."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """El Bloque 4 continúa activo. El siguiente incremento autorizado es construir fuera de producción un payload determinista de Hageo y auditar conteos, hashes, variantes, Qere/Ketiv y campos editoriales. No importar Hageo ni activar migraciones hasta validar ese payload y registrar el resultado.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """### Avance confirmado del Bloque 4 — payload TAHOT reproducible de Hageo

El paquete reproducible de Hageo y su política canónica de afijos fueron transformados en un payload determinista fuera de producción.

Resultado:

- referencias y textos: 38;
- palabras visibles: 600;
- ocurrencias morfológicas: 911;
- identificadores léxicos: 235;
- filas fuente con variantes: 2;
- variantes estructuradas: 3;
- omisiones Qere: 0;
- roles: 600 palabras/raíces, 268 prefijos y 43 sufijos;
- duplicados de ocurrencias o variantes: 0;
- hashes inválidos: 0;
- palabras visibles artificiales: 0;
- campos editoriales españoles no autorizados: 0.

Reproducibilidad:

- paquete: `bc8e1caebce9a2e55d34b3be4770f3591e430b3aa217208324dee1bdbdd54e38`;
- archivo payload: 1,052,343 bytes;
- SHA-256 del archivo: `c24d50fbbe01ecb47ec5a818c8a0f8cbdebae1451f2c9cd2b446234f02516ec6`;
- huella canónica interna: `db6510d6e971e672c2fac244b406ffd1f704ac49d4fc3b3bbca3b1c5cde71fa9`.

Variantes fijadas:

- Hageo 1:8: variante ortográfica `וְאֶכָּבְדָ֖ה` / `וְאֶכָּבְדָ֖`;
- Hageo 1:8: sustitución Qere/Ketiv `וְאֶכָּבְדָ֖ה` / `וְאֶכָּבֵד`;
- Hageo 1:10: variante ortográfica `שָמַ֖יִם` / `שָׁמַ֖יִם`.

Evidencia:

- PR #84;
- workflow `Validar payload de importación de Hageo`;
- ejecución inicial `30777802369` — `success`;
- artefacto `stepbible-haggai-import-payload`;
- ID `8842631101`;
- digest `sha256:32dc56f668eeb7b01f62b54447fee73ac0d0be0443e76b6438da4847d4cbe7b5`;
- `docs/FASE_D_PAYLOAD_TAHOT_HAGEO.md`.

No se modificó el importador, no se creó una migración y no se escribió en Supabase, RLS, interfaz o producción.

El Bloque 4 continúa activo. El siguiente incremento autorizado es diseñar y validar fuera de producción la ampliación transaccional e idempotente del importador para aceptar exactamente Hageo. No aplicar migraciones ni importar Hageo hasta aprobar rechazo de payload adulterado, rollback, conteos, hashes, permisos e idempotencia en PostgreSQL 16.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""


def main() -> int:
    text = MASTER.read_text(encoding="utf-8")
    if NEW in text:
        print("Documento maestro ya actualizado")
        return 0
    if text.count(OLD) != 1:
        raise SystemExit("No se encontró un único marcador del payload de Hageo")
    MASTER.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    print("Documento maestro actualizado con el payload de Hageo")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
