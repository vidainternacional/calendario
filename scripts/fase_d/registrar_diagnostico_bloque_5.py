from pathlib import Path

master = Path('__VIDA_INTERNACIONAL.md')
text = master.read_text(encoding='utf-8')

needle = "No avanzar al Bloque 6 hasta que cronologías y mapas estén documentados, implementados, validados funcionalmente y registrados aquí."
replacement = """### Avance confirmado del Bloque 5 — diagnóstico de cronologías y mapas

El inventario inicial del Bloque 5 quedó documentado y fusionado mediante el PR #134, commit de fusión `e07ef4e036900e35425aecd2ec7bb3c4b8b6b38f`.

Resultado:

- no existen todavía tablas dedicadas a cronologías, lugares o geometrías;
- pueden reutilizarse el registro de fuentes, los campos de periodos y lugares del contexto bíblico y el catálogo canónico de 66 libros;
- Pleiades ya está aprobada como fuente geográfica con atribución y licencia CC BY 3.0;
- no existe una librería de mapas instalada en la aplicación;
- el modelo mínimo debe separar lugares, periodos, eventos y relaciones evento-lugar, conservando fuente, precisión y nivel de certeza;
- Roma, Romanos y Hechos 28 quedaron seleccionados como piloto de menor riesgo;
- la inspección de Supabase fue exclusivamente de solo lectura y no modificó producción.

Evidencia permanente: `docs/FASE_D_BLOQUE_5_DIAGNOSTICO_CRONOLOGIAS_MAPAS.md`.

Validación temporal mientras Vercel permanece limitado:

- workflow permanente `.github/workflows/ci-temporal.yml`;
- `npm ci` reproducible;
- build completo de Next.js y TypeScript obligatorio;
- lint global visible como informe no bloqueante debido a deuda heredada reservada para la FASE E;
- claves VAPID efímeras generadas dentro del runner, sin almacenar ni sustituir secretos productivos;
- ejecución `30820270864` — `success`.

El siguiente incremento autorizado es diseñar y validar fuera de producción el esquema piloto de Roma, incluyendo contratos de fuente, precisión, certeza, hashes, RLS y recuperación exclusivamente desde servidor. No aplicar DDL ni importar datos en producción hasta que ese diseño haya sido auditado.

No avanzar al Bloque 6 hasta que cronologías y mapas estén documentados, implementados, validados funcionalmente y registrados aquí."""

if needle not in text:
    raise SystemExit('No se encontró la instrucción final esperada del Bloque 5')

master.write_text(text.replace(needle, replacement, 1), encoding='utf-8')
print('Diagnóstico del Bloque 5 registrado en el documento maestro')
