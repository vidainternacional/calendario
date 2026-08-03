#!/usr/bin/env python3
"""Registra la aplicación controlada de Hageo en el documento maestro."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """No se aplicó el borrador a Supabase y no se modificó producción.

El Bloque 4 continúa activo. El siguiente incremento autorizado es convertir el borrador validado en una migración activa versionada y validarla nuevamente desde la función OBA/RUT exacta. Solo después podrá aplicarse de forma controlada a Supabase e importarse Hageo con auditoría independiente.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """No se aplicó el borrador a Supabase y no se modificó producción durante la validación externa.

### Avance confirmado del Bloque 4 — Hageo importado y auditado en Supabase

La migración activa y el payload canónico de Hageo fueron aplicados de forma controlada al proyecto Supabase `calendariovida`.

La primera aplicación fue rechazada de forma atómica por una cita SQL inválida en la comprobación final. PostgreSQL revirtió completamente la operación. El PR #88 corrigió únicamente esa cita y añadió una prueba estática antes de repetir la aplicación.

Resultado auditado:

- capítulos: 2;
- textos aprobados y habilitados: 38;
- palabras visibles: 600;
- ocurrencias morfológicas: 911;
- identificadores léxicos utilizados: 235;
- variantes aprobadas y habilitadas: 3;
- lotes de importación: 1;
- versículos con anomalías de índice: 0;
- hashes inválidos: 0;
- campos editoriales españoles añadidos sin revisión: 0;
- registros marcados como generados por IA: 0.

Variantes confirmadas:

- Hageo 1:8: variante ortográfica `וְאֶכָּבְדָ֖ה` / `וְאֶכָּבְדָ֖`;
- Hageo 1:8: sustitución Qere/Ketiv `וְאֶכָּבְדָ֖ה` / `וְאֶכָּבֵד`;
- Hageo 1:10: variante ortográfica `שָמַ֖יִם` / `שָׁמַ֖יִם`;
- cero adiciones, omisiones, transposiciones o palabras artificiales.

Seguridad e idempotencia:

- `anon` y `authenticated` no pueden ejecutar el importador;
- únicamente `service_role` conserva `EXECUTE`;
- RLS continúa activo en las cuatro tablas textuales;
- la función final tiene SHA-256 `619b0249f70e6ac373256da724a89033cb3ecb566ad26f2ac9709ee0b6f9977d`;
- una nueva ejecución con el mismo payload conservó exactamente 38 textos, 911 ocurrencias, 3 variantes y 1 lote;
- los puentes temporales quedaron inertes, exigen JWT y responden únicamente HTTP 410;
- la recuperación permanece exclusivamente en servidor y exige sesión autenticada.

Evidencia:

- PR #87, migración activa;
- PR #88, corrección mínima;
- commit `0d6d78cb47083be8b6e67c1e63f59f848585c7a6`;
- migración `generalizar_importador_payload_tahot_hageo` aplicada correctamente;
- workflow final `30778552986` — `success`;
- `docs/FASE_D_APLICACION_HAGEO_SUPABASE.md`.

El Bloque 4 continúa activo. El siguiente punto pendiente es la validación funcional manual de Hageo en Biblia → Estudio y Estudio Profundo, incluyendo texto hebreo RTL, transliteración, palabras, Strong, lemas, morfología y las variantes de Hageo 1:8 y 1:10. Después deberán verificarse las regresiones de Rut, Abdías y Juan 3:16.

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
