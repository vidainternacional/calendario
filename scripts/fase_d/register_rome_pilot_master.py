from pathlib import Path

path = Path('__VIDA_INTERNACIONAL.md')
text = path.read_text(encoding='utf-8')
marker = 'hash global `67efcaa4e4cae2ec6f908f60a97850a1b7fd6ee223496fbc17438a87ea3a0550`'
if marker in text:
    print('El paquete piloto de Roma ya está registrado')
    raise SystemExit(0)

block = '''

### Avance confirmado del Bloque 5 — paquete piloto reproducible de Roma

El paquete piloto de Roma quedó validado fuera de producción el 2026-08-03 mediante el PR #149 y el commit de fusión `5940bb2c2066192c087b3b7f2cd39b247d675625`.

Resultado:

- fuente Pleiades aprobada, licencia CC BY 3.0 y atribución fijadas;
- URI estable `https://pleiades.stoa.org/places/423025`;
- un lugar: Roma;
- un periodo relativo sin año absoluto;
- dos eventos vinculados a Romanos 1–16 y Hechos 28:14–31;
- dos relaciones evento-lugar;
- coordenadas declaradas como aproximadas;
- certeza explícita por entidad;
- hashes SHA-256 por entidad;
- hash global `67efcaa4e4cae2ec6f908f60a97850a1b7fd6ee223496fbc17438a87ea3a0550`;
- validación específica y CI temporal en `success`;
- todas las entidades nuevas permanecen `pending` y deshabilitadas.

Archivos:

- `data/fase_d/rome_pilot/rome_pilot_v1.json`;
- `scripts/fase_d/validate_rome_pilot_package.py`;
- `docs/FASE_D_BLOQUE_5_PAQUETE_PILOTO_ROMA.md`.

No se importaron datos, no se conectó la interfaz y no se avanzó al Bloque 6.

**Siguiente punto autorizado:** diseñar y validar fuera de producción un importador idempotente para este paquete y un plan de recuperación de datos. El importador debe resolver relaciones por slugs, verificar fuente, licencia, hashes y conteos, mantener las entidades deshabilitadas durante la carga y abortar toda la transacción ante cualquier diferencia. No ejecutar todavía la importación en Supabase. Las instrucciones anteriores del Bloque 5 quedan subordinadas a este estado más reciente.
'''

path.write_text(text.rstrip() + block.rstrip() + '\n', encoding='utf-8')
