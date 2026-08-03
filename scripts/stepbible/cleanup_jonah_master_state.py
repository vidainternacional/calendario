#!/usr/bin/env python3
from pathlib import Path

master = Path('__VIDA_INTERNACIONAL.md')
text = master.read_text(encoding='utf-8')
obsolete = """El Bloque 4 continúa activo. El siguiente incremento autorizado es aplicar esta migración exacta de forma controlada en Supabase, importar únicamente Jonás desde el payload canónico y ejecutar una auditoría independiente de conteos, hashes, permisos, RLS, recuperación y seguridad. No solicitar validación visual hasta completar y registrar esa auditoría técnica.\n\n"""
if text.count(obsolete) != 1:
    raise SystemExit(f'Esperaba una instrucción obsoleta; encontradas: {text.count(obsolete)}')
master.write_text(text.replace(obsolete, '', 1), encoding='utf-8')
print('Estado maestro de Jonás limpiado')
