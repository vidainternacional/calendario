from pathlib import Path

MASTER = Path("__VIDA_INTERNACIONAL.md")
text = MASTER.read_text(encoding="utf-8")

old_date = "Última actualización: 2026-08-02"
new_date = "Última actualización: 2026-08-03"
if old_date not in text:
    raise SystemExit("No se encontró la fecha esperada del documento maestro")
text = text.replace(old_date, new_date, 1)

old_block = """El siguiente incremento autorizado es validar funcionalmente Jonás con una sesión autenticada en Biblia → Estudio y Estudio Profundo, comprobar la recuperación segura y registrar evidencia visual puntual. No avanzar a otro libro ni al Bloque 5 hasta completar esa validación.\n\nNo avanzar al Bloque 5 hasta que el modelo, las fuentes, la recuperación segura y la visualización funcional de las herramientas ampliadas estén documentados y validados en producción."""

new_block = """### Avance confirmado del Bloque 4 — validación funcional de Jonás aprobada\n\nLa validación manual de Jonás fue aprobada por el usuario el 2026-08-03.\n\nCobertura confirmada:\n\n- Jonás 1:1, 2:1, 3:1 y 4:11 revisados en **Biblia → Estudio**;\n- las mismas referencias recuperadas correctamente en **Estudio Profundo**;\n- hebreo RTL, transliteración, números Strong, lemas, morfología, fuente STEPBible Data y licencia CC BY 4.0 visibles;\n- ausencia correcta del panel de variantes, porque el corpus importado de Jonás contiene 0 variantes y 0 casos Qere/Ketiv;\n- sin pantallas en blanco, cargas infinitas, errores visibles de hidratación, desbordamientos laterales ni regresiones de interfaz.\n\nEvidencia permanente:\n\n- PR #130 y commit de fusión `f38b8ef3da46f028f581007a72af00ed7db05ee6`;\n- `docs/FASE_D_VALIDACION_VISUAL_JONAS_2026-08-03.md`;\n- `docs/FASE_D_JONAS_PRODUCCION.md`.\n\nLa selección, paquete reproducible, política de afijos, payload, importador, migración activa, importación productiva, auditoría técnica, recuperación autenticada y visualización funcional de Jonás están completas.\n\nEl siguiente incremento autorizado es realizar una auditoría consolidada de cierre del Bloque 4 y documentar si todos sus objetivos quedaron satisfechos. No avanzar al Bloque 5 hasta registrar explícitamente el cierre del Bloque 4 en este documento maestro."""

if old_block not in text:
    raise SystemExit("No se encontró la instrucción pendiente exacta de Jonás")
text = text.replace(old_block, new_block, 1)

MASTER.write_text(text, encoding="utf-8")
print("Documento maestro actualizado correctamente")
