#!/usr/bin/env python3
"""Registra la aplicación controlada de Rut en el documento maestro."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """No se modificó Supabase, RLS, la interfaz ni producción durante esta validación.

El Bloque 4 continúa activo. El siguiente incremento autorizado es convertir el borrador validado en una migración activa, aplicarla de forma controlada a Supabase e importar únicamente Rut. Después deberán auditarse independientemente conteos, hashes, permisos, lote, Qere/Ketiv, recuperación exclusiva desde servidor y visualización antes de ampliar a otro libro.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """No se modificó Supabase, RLS, la interfaz ni producción durante esta validación.

### Avance confirmado del Bloque 4 — Rut importado y auditado en Supabase

La migración activa del importador TAHOT generalizado y el payload canónico de Rut fueron aplicados de forma controlada al proyecto Supabase `calendariovida`.

Resultado auditado:

- capítulos: 4;
- textos aprobados y habilitados: 85;
- palabras visibles: 1,293;
- ocurrencias morfológicas: 2,026;
- identificadores léxicos utilizados: 373;
- variantes aprobadas y habilitadas: 29;
- lotes de importación: 1;
- hashes inválidos: 0;
- campos editoriales españoles añadidos sin revisión: 0;
- registros marcados como generados por IA: 0.

Rut 3:12 conserva el Ketiv `אִם` como única variante `addition`, sin lectura base, ancla ni ocurrencia visible artificial. La distribución total es de 18 variantes ortográficas, 10 sustituciones y 1 adición.

Seguridad y recuperación:

- `anon` y `authenticated` no pueden ejecutar el importador;
- únicamente `service_role` conserva `EXECUTE`;
- RLS continúa activo en las cuatro tablas textuales;
- la recuperación permanece en módulos `server-only` y exige una sesión autenticada;
- el catálogo `RUT` está aprobado y habilitado con los alias `Rut` y `Ruth`;
- el puente temporal de transferencia quedó inerte, exige JWT y responde únicamente HTTP 410.

Evidencia:

- PR #78;
- commit `2b66b5dad77e1b1bef9b48cafd79f61611cddc4e`;
- migración `generalizar_importador_payload_tahot_rut` aplicada correctamente;
- workflow `30776001163` — `success`;
- artefacto `stepbible-ruth-active-migration-validation`;
- digest `sha256:e340c24ead2fd67a712b8e4a6a201f23ef8f1a696d90e86ddfed9e6e946daf99`;
- `docs/FASE_D_APLICACION_RUT_SUPABASE.md`.

El Bloque 4 continúa activo. El siguiente punto pendiente es la validación funcional manual de Rut en Biblia → Estudio y Estudio Profundo, incluyendo texto hebreo RTL, transliteración, agrupación palabra por palabra, Strong, lemas, morfología, variantes y el caso de Rut 3:12. Después deberá verificarse la regresión de Abdías y Juan 3:16.

No ampliar a otro libro ni avanzar al Bloque 5 hasta registrar esa validación funcional.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""


def main() -> int:
    text = MASTER.read_text(encoding="utf-8")
    if NEW in text:
        print("Documento maestro ya actualizado")
        return 0
    if text.count(OLD) != 1:
        raise SystemExit("No se encontró un único marcador pendiente de aplicación de Rut")
    MASTER.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    print("Documento maestro actualizado con la aplicación de Rut")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
