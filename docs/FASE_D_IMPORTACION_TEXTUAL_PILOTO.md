# FASE D · Bloque 4 — Importación textual piloto

Fecha: 2026-08-02

## Alcance

Se importaron y validaron dos pasajes piloto desde STEPBible, fijando la fuente al commit `b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39`:

- Salmos 23:1 desde TAHOT;
- Juan 3:16 desde TAGNT.

No se importó un léxico completo ni se conectaron estos datos a un proveedor de IA.

## Resultado

- entradas léxicas aprobadas: 31;
- ocurrencias aprobadas: 31;
- unidades morfológicas base: 30;
- textos completos: 2;
- variantes documentadas: 2;
- hashes inválidos: 0.

### Salmos 23:1

- cuatro palabras visibles;
- cinco morfemas;
- el término `רֹ֝עִ֗י` queda agrupado como raíz `רֹ֝עִ֗` y sufijo `י`;
- texto hebreo completo, transliteración y traducción literal;
- dirección de texto `rtl`.

### Juan 3:16

- 25 palabras en la lectura base NA27/NA28;
- una lectura adicional `αὐτοῦ`, presente en Tregelles, Textus Receptus y Bizantino;
- corrección de `πιστεύων` a la posición fuente 18;
- variante ortográfica `ἀλλ᾽ / ἀλλὰ`;
- texto griego completo, transliteración y traducción literal.

## Trazabilidad

Cada registro conserva:

- commit de la fuente;
- archivo y línea exactos;
- hash del archivo fuente;
- hash del extracto;
- referencia y estado textual;
- ediciones asociadas;
- hash SHA-256 calculado por PostgreSQL.

## Seguridad

- RLS activo en las cuatro tablas textuales;
- `anon` sin privilegios;
- `authenticated` únicamente con `SELECT`;
- solo se leen registros aprobados y habilitados;
- la importación no utiliza IDs generados codificados manualmente.

## Validación independiente

La base confirmó:

- 31 entradas léxicas;
- 31 ocurrencias;
- 30 unidades base;
- 2 textos completos;
- 2 variantes;
- agrupación hebrea correcta;
- secuencia griega correcta;
- 0 hashes inválidos.

## Siguiente incremento

Actualizar el servicio de recuperación de Estudio Profundo para devolver:

- texto original completo;
- transliteración del versículo;
- traducción literal;
- secuencia palabra por palabra;
- morfemas agrupados;
- variantes textuales y ediciones.

La visualización debe mantenerse dentro de **Biblia → Estudio** y limitarse inicialmente a los dos pasajes piloto.