#!/usr/bin/env python3
"""Registra el payload reproducible de Nahúm en el documento maestro."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """No se construyó payload, no se modificó el importador y no se escribió en Supabase, RLS, interfaz o producción.

El Bloque 4 continúa activo. El siguiente incremento autorizado es construir fuera de producción un payload determinista de Nahúm y auditar conteos, hashes, variantes, Qere/Ketiv y campos editoriales. No importar Nahúm ni activar migraciones hasta validar ese payload y registrar el resultado.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """No se construyó payload durante la inspección léxica y no se escribió en Supabase, RLS, interfaz o producción.

### Avance confirmado del Bloque 4 — payload TAHOT reproducible de Nahúm

El paquete reproducible de Nahúm y su política canónica de afijos fueron transformados en un payload determinista fuera de producción.

Resultado:

- referencias y textos: 47;
- palabras visibles: 558;
- ocurrencias morfológicas: 828;
- identificadores léxicos: 387;
- filas fuente con variantes: 4;
- variantes estructuradas: 8;
- variantes ortográficas: 4;
- sustituciones Qere/Ketiv: 4;
- omisiones Qere: 0;
- roles: 558 palabras/raíces, 175 prefijos y 95 sufijos;
- duplicados, hashes inválidos y palabras artificiales: 0;
- campos editoriales españoles no autorizados: 0.

Reproducibilidad:

- paquete: `60e280a6d94abc8788b7cc9647e4dfa0f679e0a9708a1adf00be30abfc23b7f5`;
- archivo payload: 1,066,318 bytes;
- SHA-256 del archivo: `0c041041155152e1fb63cb568efa1530724bea7fa729b4ed8815dcbaaf666000`;
- huella canónica interna: `43a5ab1b8c9cf773e218c73eab3def49715ac7c0511a04ee9cae3990be4a8a99`.

El generador separa correctamente el Ketiv `K` cuando comparte el campo ortográfico con otros testigos, incluido Nahúm 1:15. Los payloads aprobados de Rut y Hageo conservaron exactamente sus hashes anteriores mediante regresiones obligatorias.

Evidencia:

- PR #105;
- commit `33155cb94e61cab23d26cb3d1ea396b0d46b6997`;
- workflow `Validar payload de importación de Nahúm`;
- ejecución final `30782244984` — `success`;
- `docs/FASE_D_PAYLOAD_TAHOT_NAHUM.md`.

No se modificó el importador, no se creó una migración y no se escribió en Supabase, RLS, interfaz o producción.

El Bloque 4 continúa activo. El siguiente incremento autorizado es diseñar y validar fuera de producción la ampliación transaccional e idempotente del importador para aceptar exactamente Nahúm. No aplicar migraciones ni importar Nahúm hasta aprobar rechazo de payload adulterado, rollback, conteos, hashes, permisos e idempotencia en PostgreSQL 16.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""


def main() -> int:
    text = MASTER.read_text(encoding="utf-8")
    if NEW in text:
        print("Documento maestro ya actualizado")
        return 0
    if text.count(OLD) != 1:
        raise SystemExit("No se encontró un único marcador del payload de Nahúm")
    MASTER.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    print("Documento maestro actualizado con el payload de Nahúm")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
