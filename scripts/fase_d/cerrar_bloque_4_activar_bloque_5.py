from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")
text = MASTER.read_text(encoding="utf-8")

replacements = [
    (
        "| FASE D | IA Bíblica Avanzada, nuevas fuentes, contexto histórico, comparaciones, cronologías, mapas y herramientas de estudio | **ACTIVA — BLOQUE 4** |",
        "| FASE D | IA Bíblica Avanzada, nuevas fuentes, contexto histórico, comparaciones, cronologías, mapas y herramientas de estudio | **ACTIVA — BLOQUE 5** |",
    ),
    (
        "- Bloque 4 — Comparaciones y herramientas ampliadas: **ACTIVO**.\n- Bloque 5 — Cronologías y mapas: PENDIENTE.",
        "- Bloque 4 — Comparaciones y herramientas ampliadas: **COMPLETADO — 2026-08-03**.\n- Bloque 5 — Cronologías y mapas: **ACTIVO**.",
    ),
    (
        "### Bloque activo\n\n**Bloque 4 — Comparaciones y herramientas ampliadas.**",
        "### Bloque 4 — objetivo cerrado\n\n**Bloque 4 — Comparaciones y herramientas ampliadas.**",
    ),
]

for old, new in replacements:
    if old not in text:
        raise SystemExit(f"No se encontró el bloque esperado: {old[:80]}")
    text = text.replace(old, new, 1)

old_tail = "El siguiente incremento autorizado es realizar una auditoría consolidada de cierre del Bloque 4 y documentar si todos sus objetivos quedaron satisfechos. No avanzar al Bloque 5 hasta registrar explícitamente el cierre del Bloque 4 en este documento maestro."
new_tail = """### Cierre confirmado del Bloque 4 — Comparaciones y herramientas ampliadas

La auditoría consolidada del Bloque 4 quedó aprobada y fusionada mediante el PR #132, commit de fusión `5826b544f703a3487f33e485a2fbc6f6c2de3215`.

El cierre confirma:

- cobertura contextual completa para 66 libros y 1,189 capítulos;
- corpus textual completo del Nuevo Testamento, con 27 libros, 7,958 referencias TAGNT, 138,096 palabras base, 4,000 lecturas adicionales y 6,409 variantes documentadas;
- cuatro fuentes TAHOT verificadas para los 39 libros del Antiguo Testamento y 23,261 referencias fuente;
- cinco libros completos del Antiguo Testamento importados y validados: Abdías, Rut, Hageo, Nahúm y Jonás;
- 239 textos, 3,430 palabras visibles, 5,279 ocurrencias y 43 variantes en ese piloto completo del Antiguo Testamento;
- fuentes, atribuciones, licencias, hashes, importadores, idempotencia, RLS, permisos y recuperación segura documentados;
- visualización funcional aprobada en **Biblia → Estudio** y **Estudio Profundo**;
- ausencia de conexión de los datos textuales y léxicos a proveedores de IA;
- ausencia de contenido editorial español presentado como revisado cuando no lo está.

Evidencia permanente: `docs/FASE_D_AUDITORIA_CIERRE_BLOQUE_4.md`.

El Bloque 4 queda oficialmente **COMPLETADO — 2026-08-03**.

### Bloque activo

**Bloque 5 — Cronologías y mapas.**

El primer incremento autorizado debe:

- inventariar las cronologías, mapas, coordenadas, componentes y fuentes geográficas ya existentes en el repositorio;
- definir el modelo mínimo para eventos, periodos, lugares, relaciones bíblicas, fuentes y nivel de certeza;
- evaluar fuentes compatibles con las reglas de atribución, licencia y privacidad del Bloque 2;
- reutilizar la navegación de **Biblia → Estudio** y **Estudio Profundo**, sin crear una sección duplicada;
- no importar todavía corpus geográficos o cronológicos completos;
- no conectar estos datos a la IA;
- no usar APIs externas de pago ni realizar escrituras en producción durante el diagnóstico inicial.

No avanzar al Bloque 6 hasta que cronologías y mapas estén documentados, implementados, validados funcionalmente y registrados aquí."""

if old_tail not in text:
    raise SystemExit("No se encontró la instrucción final esperada del Bloque 4")
text = text.replace(old_tail, new_tail, 1)

MASTER.write_text(text, encoding="utf-8")
print("Bloque 4 cerrado y Bloque 5 activado en el documento maestro")
