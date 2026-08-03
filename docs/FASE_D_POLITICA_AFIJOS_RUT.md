# FASE D · Bloque 4 — Política canónica de afijos de Rut

Fecha: 2026-08-02

## Objetivo

Definir, antes de construir el payload de importación, los lemas hebreos canónicos de los identificadores TAHOT cuya etiqueta fuente expresa únicamente una función gramatical como `Ps1c`, `Os3m` o `Sp3f`.

No se tradujeron significados ni se generaron definiciones. La política únicamente evita almacenar códigos gramaticales como si fueran lemas hebreos.

## Inspección reproducible

El paquete completo de Rut contiene:

- componentes morfológicos fuente: 2,029;
- identificadores léxicos distintos después de excluir separadores estructurales: 373;
- identificadores con lema hebreo explícito en la fuente: 352;
- identificadores que requieren política canónica: 21.

La inspección también detectó dos construcciones que el piloto de Abdías no ejercitaba:

1. raíces con marca de unión posterior, por ejemplo `{H1035G}+`;
2. filas con más de una palabra, separadas por un componente estructural vacío.

El parser compartido `scripts/stepbible/tahot_components.py` conserva la marca de unión, separa los grupos léxicos y excluye los separadores vacíos de las ocurrencias.

## Política aprobada para construir el payload

| Identificador | Función fuente | Lema canónico |
|---|---|---|
| `H9020` | `Ps1c` | `־י` |
| `H9021` | `Ps2m` | `־ךָ` |
| `H9022` | `Ps2f` | `־ךְ` |
| `H9023` | `Ps3m` | `־וֹ` |
| `H9024` | `Ps3f` | `־הָ` |
| `H9025` | `Pp1c` | `־נוּ` |
| `H9028` | `Pp3m` | `־הֶם` |
| `H9029` | `Pp3f` | `־ן` |
| `H9030` | `Os1c` | `־נִי` |
| `H9031` | `Os2m` | `־ךָ` |
| `H9032` | `Os2f` | `־ךְ` |
| `H9033` | `Os3m` | `־וֹ` |
| `H9034` | `Os3f` | `־הָ` |
| `H9035` | `Op1c` | `־נוּ` |
| `H9036` | `Op2m` | `־כֶם` |
| `H9038` | `Op3m` | `־הֶם` |
| `H9039` | `Op3f` | `־הֶן` |
| `H9041` | `Ss2m` | `־ךָ` |
| `H9043` | `Ss3m` | `־וֹ` |
| `H9044` | `Ss3f` | `־הּ` |
| `H9049` | `Sp3f` | `־נָה` |

Once decisiones reutilizan exactamente la política ya validada con Abdías. Las diez restantes se fijan desde las formas hebreas observadas en Rut y permanecen separadas del código gramatical original, que seguirá conservándose en metadatos y morfología.

## Validación obligatoria

`validate_tahot_affix_policy.py` exige:

- cobertura exacta de los 21 identificadores;
- ninguna clave adicional;
- ningún valor vacío;
- presencia de caracteres hebreos en todos los lemas;
- fallo inmediato si el conjunto observado cambia.

## Alcance

Este incremento:

- no genera todavía el payload final;
- no modifica Supabase;
- no escribe entradas léxicas;
- no cambia RLS ni permisos;
- no modifica la interfaz;
- no avanza al Bloque 5.

El siguiente paso es usar el parser compartido y esta política para construir un payload reproducible de Rut, representar la omisión Qere de Rut 3:12 como una variante de adición sin ocurrencia visible y validar todos los conteos fuera de producción.
