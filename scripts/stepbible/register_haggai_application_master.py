#!/usr/bin/env python3
"""Registra la aplicación controlada de Hageo en el documento maestro."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """No se aplicó el borrador a Supabase y no se modificó producción.

El Bloque 4 continúa activo. El siguiente incremento autorizado es convertir el borrador validado en una migración activa versionada y validarla nuevamente desde la función OBA/RUT exacta. Solo después podrá aplicarse de forma controlada a Supabase e importarse Hageo con auditoría independiente.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """No se aplicó el borrador a Supabase y no se modificó producción durante la validación externa.

### Avance confirmado del Bloque 4 — Hageo importado y auditado en Supabase

La migración activa del importador TAHOT y el payload canónico de Hageo fueron aplicados de forma controlada al proyecto Supabase `calendariovida`.

La primera aplicación fue rechazada por una cita SQL incorrecta en la comprobación final. PostgreSQL revirtió completamente la transacción: la función conservó la huella OBA/RUT y Hageo permaneció con cero datos. El PR #88 corrigió esa única cita y añadió una comprobación estática antes de repetir la validación y aplicación.

Resultado auditado:

- capítulos: 2;
- textos aprobados y habilitados: 38;
- palabras visibles: 600;
- ocurrencias morfológicas: 911;
- identificadores léxicos utilizados: 235;
- variantes aprobadas y habilitadas: 3;
- lotes de importación: 1;
- hashes inválidos: 0;
- campos editoriales españoles añadidos sin revisión: 0;
- registros marcados como generados por IA: 0.

Variantes confirmadas:

- Hageo 1:8, ortográfica: `וְאֶכָּבְדָ֖ה` / `וְאֶכָּבְדָ֖`, testigo `L`;
- Hageo 1:8, sustitución Qere/Ketiv: `וְאֶכָּבְדָ֖ה` / `וְאֶכָּבֵד`, testigo `K`;
- Hageo 1:10, ortográfica: `שָמַ֖יִם` / `שָׁמַ֖יִם`, testigo `ABH`.

Seguridad y recuperación:

- función activa: `619b0249f70e6ac373256da724a89033cb3ecb566ad26f2ac9709ee0b6f9977d`;
- `anon` y `authenticated` no pueden ejecutar el importador;
- únicamente `service_role` conserva `EXECUTE`;
- RLS continúa activo en las cuatro tablas textuales;
- el RPC público temporal fue eliminado;
- las Edge Functions temporales de Hageo quedaron inertes, exigen JWT y responden HTTP 410;
- una función adicional sin JWT y con capacidad de escritura fue descubierta durante la auditoría y desactivada inmediatamente;
- los conteos permanecieron exactos después del cierre de seguridad.

Evidencia:

- PR #87 y commit `c5514ccf4c77e9d3d85fc9e32460d0ff1fdee0a0` para la migración activa;
- PR #88 y commit `0d6d78cb47083be8b6e67c1e63f59f848585c7a6` para el hotfix;
- workflow final `30778552986` — `success`;
- artefacto `stepbible-haggai-active-migration-validation`;
- ID `8842866884`;
- digest `sha256:b6365795fd24f1828680bd68f649508fa177e68f7189dfbe75f37d18b90d2a02`;
- `docs/FASE_D_APLICACION_HAGEO_SUPABASE.md`.

El Bloque 4 continúa activo. El siguiente punto pendiente es la validación funcional manual de Hageo en Biblia → Estudio y Estudio Profundo, incluyendo texto hebreo RTL, transliteración, agrupación palabra por palabra, Strong, lemas, morfología y las variantes de Hageo 1:8 y 1:10. Después deberá verificarse la regresión de Abdías, Rut y Juan 3:16.

No ampliar a otro libro ni avanzar al Bloque 5 hasta registrar esa validación funcional.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""


def main() -> int:
    text = MASTER.read_text(encoding="utf-8")
    if NEW in text:
        print("Documento maestro ya actualizado")
        return 0
    if text.count(OLD) != 1:
        raise SystemExit("No se encontró un único marcador de aplicación de Hageo")
    MASTER.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    print("Documento maestro actualizado con la aplicación de Hageo")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
