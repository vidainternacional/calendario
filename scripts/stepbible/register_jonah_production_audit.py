#!/usr/bin/env python3
from pathlib import Path
p=Path('__VIDA_INTERNACIONAL.md')
t=p.read_text(encoding='utf-8')
marker='La migración todavía no se ha aplicado a Supabase y Jonás no se ha importado en producción.'
replacement='''### Avance confirmado del Bloque 4 — Jonás importado y auditado en producción

La migración activa fue aplicada de forma controlada y el payload canónico fue importado dos veces con resultado idempotente.

Resultado: 48 textos, 688 palabras visibles, 1,080 ocurrencias, 288 identificadores léxicos, 0 variantes, 1 lote, 0 hashes inválidos y 0 campos editoriales españoles no revisados.

La función activa conserva SHA-256 `0d65c4d8e8ac81368cea6e5b6fd3fb104156cc3e3e3f299426b20752eef7f062`. Abdías, Rut, Hageo y Nahúm conservaron sus conteos. Se reutilizaron 171 entradas sin modificación y se crearon 117 nuevas, sin duplicados.

RLS permanece activo; `anon` y `authenticated` no pueden ejecutar el importador; `service_role` es el único rol autorizado. Los RPC temporales fueron retirados, la función temporal quedó inerte con JWT y la prueba de recuperación pasó con reversión completa.

Evidencia: `docs/FASE_D_JONAS_PRODUCCION.md`.

El siguiente incremento autorizado es validar funcionalmente Jonás con una sesión autenticada en Biblia → Estudio y Estudio Profundo, comprobar la recuperación segura y registrar evidencia visual puntual. No avanzar a otro libro ni al Bloque 5 hasta completar esa validación.'''
if replacement in t: print('ya actualizado')
elif t.count(marker)!=1: raise SystemExit('marcador inválido')
else:
 p.write_text(t.replace(marker,replacement,1),encoding='utf-8')
 print('actualizado')
