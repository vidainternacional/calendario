# FASE D — Piloto de biblioteca interna con STEPBible

Fecha: 2026-08-01

Estado: **IMPLEMENTADO EN PREVIEW — VALIDACIÓN VISUAL PENDIENTE**

## Objetivo

Validar el ciclo completo de la biblioteca bíblica interna con un conjunto mínimo, verificable y reversible, sin importar libros completos ni conectar contenido a la IA.

## Fuente

- fuente superior: `stepbible-lexical-pilot`;
- proveedor: STEP Bible;
- licencia: CC BY 4.0;
- fuente y licencia ya aprobadas dentro de `biblical_sources`;
- atribución y localizador visibles en la interfaz.

## Contenido incorporado

Un recurso:

- `stepbible-piloto-lexico-contextual`;
- tipo: diccionario;
- idioma: multilingüe;
- versión: `lexical-pilot-v1`;
- hash SHA-256 completo;
- licencia verificada;
- estado aprobado y habilitado.

Dos fragmentos editoriales:

1. Salmos 23:1 — resumen limitado a las formas hebreas y glosas breves ya aprobadas.
2. Juan 3:16 — resumen limitado a cuatro formas griegas y la morfología ya aprobada.

Ambos registros:

- están clasificados como `editorial_summary`;
- conservan referencia bíblica exacta;
- tienen localizador directo a STEPBible Data;
- tienen hash SHA-256 completo;
- declaran que no fueron generados por IA;
- advierten que Strong y la morfología no sustituyen el análisis contextual completo.

## Interfaz

Componente: `components/estudios/BibliotecaBiblicaVerificada.tsx`.

Ubicación: `/estudios/profundo`.

Comportamiento:

- muestra una tarjeta compacta cuando no existe cobertura;
- ofrece enlaces a los dos ejemplos del piloto;
- muestra la evidencia solo para Salmos 23:1 y Juan 3:16;
- mantiene cada fragmento contraído por defecto;
- permite desplegar contenido, temas, fuente, licencia y localizador;
- muestra la versión abreviada del paquete;
- no modifica el resultado generado por el estudio actual.

## Seguridad y validación

Resultado en base de datos:

- recursos del piloto: 1;
- fragmentos del piloto: 2;
- relaciones válidas entre fuente, recurso y fragmento: 2;
- RLS habilitado en ambas tablas;
- `anon_select = false`;
- `authenticated_select = true`;
- políticas de escritura para clientes: 0.

Migración:

- `20260802054500_biblioteca_biblica_piloto_stepbible.sql`.

## Límites

- no se importó un léxico completo;
- no se importaron definiciones extensas;
- no se añadieron Mateo 6:7 ni otros pasajes sin datos revisados;
- no se conectó la biblioteca al prompt o proveedor de IA;
- no se modificaron Biblia, Comparar, Notas, audio, autoría, contexto histórico ni datos pastorales.

## Estado de fase

El proyecto permanece en **FASE D — Bloque 4**. El piloto debe validarse visualmente en preview antes de fusionar el PR #29 o ampliar cobertura.
