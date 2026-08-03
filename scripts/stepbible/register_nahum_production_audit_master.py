#!/usr/bin/env python3
"""Registra la aplicación y auditoría de Nahúm en el documento maestro."""
from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")

OLD = """La migración todavía no se ha aplicado a Supabase y Nahúm no se ha importado en producción.

El Bloque 4 continúa activo. El siguiente incremento autorizado es aplicar esta migración exacta de forma controlada en Supabase, importar únicamente Nahúm desde el payload canónico y ejecutar una auditoría independiente de conteos, hashes, variantes, permisos, RLS, recuperación y seguridad. No solicitar validación visual hasta completar y registrar esa auditoría técnica.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

NEW = """La migración todavía no se había aplicado a Supabase durante su validación externa.

### Avance confirmado del Bloque 4 — Nahúm importado y auditado en Supabase

La migración activa y el payload canónico de Nahúm fueron aplicados de forma controlada al proyecto Supabase `calendariovida`.

Resultado auditado:

- función activa OBA/RUT/HAG/NAM: `69045240e658995cd0e1ba3557e54a2700b623078b36125e73ed1ada64f5139c`;
- textos aprobados y habilitados: 47;
- palabras visibles: 558;
- ocurrencias morfológicas: 828;
- identificadores léxicos utilizados: 387;
- variantes: 8, con cuatro ortográficas y cuatro sustituciones Qere/Ketiv;
- lotes de importación: 1;
- hashes inválidos: 0;
- campos editoriales españoles no revisados añadidos: 0;
- segunda ejecución idempotente: aprobada.

Integridad y seguridad:

- Abdías, Rut y Hageo conservaron sus conteos exactos;
- 155 entradas léxicas fueron reutilizadas sin modificación y 232 se crearon para Nahúm;
- no existen duplicados por fuente e identificador léxico;
- `anon` y `authenticated` no pueden ejecutar el importador;
- únicamente `service_role` conserva `EXECUTE`;
- RLS y las políticas de lectura permanecen sin ampliación;
- el RPC, token y tabla temporales fueron eliminados;
- la Edge Function temporal quedó inerte, exige JWT y responde HTTP 410.

La prueba de recuperación eliminó temporalmente dentro de una subtransacción 8 variantes, 828 ocurrencias, 47 textos, 1 lote y 232 entradas exclusivas, preservó 155 entradas compartidas y revirtió completamente al estado productivo exacto.

La ruta funcional fue verificada bajo el rol real `authenticated`:

- `Nahúm`, `Nahum`, `Nah` y `NAM` resuelven el código canónico `NAM`;
- Biblia → Estudio y Estudio Profundo usan la misma evidencia textual aprobada;
- Nahúm dispone de contexto aprobado para los capítulos 1–3;
- Nahúm 1:1, 1:3, 1:15, 2:5 y 3:3 recuperan edición hebrea RTL, transliteración, Strong, lemas y morfología;
- las ocho variantes se recuperan en sus anclas exactas;
- fuente, atribución y licencia CC BY 4.0 son visibles para el panel.

Evidencia permanente:

- PR #113 y commit `dce300122738ccdb1f6d38ca66b8917dc69671f0` para la migración activa;
- migración Supabase `20260803042730_generalizar_importador_payload_tahot_nahum`;
- respuestas idempotentes `pg_net` 331 y 332;
- `docs/FASE_D_APLICACION_NAHUM_SUPABASE.md`.

La importación, auditoría técnica, recuperación segura y validación funcional de datos están completas.

El Bloque 4 continúa activo. El único siguiente punto autorizado es la validación visual manual de Nahúm en Biblia → Estudio y Estudio Profundo, incluyendo Nahúm 1:1, 1:3, 1:15, 2:5 y 3:3, las ocho variantes y la regresión de Hageo 1:8, Rut 3:12, Abdías 1:1 y Juan 3:16. No ampliar a otro libro hasta registrar esa aprobación.

No avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""


def main() -> int:
    text = MASTER.read_text(encoding="utf-8")
    if NEW in text:
        print("Documento maestro ya actualizado")
        return 0
    if text.count(OLD) != 1:
        raise SystemExit("No se encontró un único marcador de aplicación de Nahúm")
    MASTER.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    print("Documento maestro actualizado con la aplicación de Nahúm")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
