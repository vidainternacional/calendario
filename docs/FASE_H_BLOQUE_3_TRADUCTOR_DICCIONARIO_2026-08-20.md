# FASE H — Bloque 3 — Traductor y diccionario práctico

Fecha: 2026-08-20
Estado: EN CURSO

## Decisión funcional aprobada

El Centro de Hebreo no duplicará Estudio Profundo. La superficie de traducción será puntual:

- un campo para palabra o frase;
- detección automática Español ⇄ Hebreo;
- una palabra prioriza el diccionario bíblico aprobado de VIDA;
- si no existe equivalencia exacta o la entrada es una frase, usa VIDA AI del lado servidor;
- salida breve, sin Strong, morfología, transliteración técnica ni ocurrencias;
- copiar resultado y escuchar hebreo;
- ninguna clave de proveedor se expone al cliente.

## Implementación

- `components/hebreo/HebrewTranslator.tsx`
- `lib/hebreo/translator.ts`
- `app/api/estudios/hebreo/traducir/route.ts`
- `tests/regression/fase-h-traductor-practico.test.mjs`

El endpoint exige sesión autenticada. Para palabras exactas consulta primero `biblical_lexical_entries` y `biblical_hebrew_spanish_glosses` con estados finales `verified_derived` / `manual_approved`. Para frases o palabras sin coincidencia editorial usa `vidaAI()` con salida restringida únicamente a la traducción.

## Lote de nombres RV1909 misma grafía

Aprobado explícitamente por el usuario y aplicado mediante migración:

`supabase/migrations/20260821001500_fase_h_nombres_rv1909_misma_grafia.sql`

Batch:

`fase_h_es_nombres_rv1909_misma_grafia_001_20260820`

Reglas:

- TAHOT debe identificar la misma entidad a ambos lados de la anotación;
- la entrada léxica debe ocurrir realmente en el mismo versículo;
- RV1909 debe contener exactamente la misma grafía normalizada;
- RV1909 solo confirma grafía, no significado;
- insert-only;
- `ON CONFLICT DO NOTHING`;
- sin cambios a lema, Strong, source_gloss, ocurrencias, RLS o permisos.

Auditoría posterior real:

- filas insertadas: 1,028;
- nombres distintos: 680;
- Strong distintos: 692;
- flags indebidos de contexto como significado: 0;
- flags indebidos de RV1909 como significado: 0;
- total hebreo: 10,737;
- español listo: 6,564;
- español pendiente: 4,173;
- entradas sin source_gloss: 0.

Reversión exacta:

```sql
DELETE FROM public.biblical_hebrew_spanish_glosses
WHERE provenance->>'batch_id' =
  'fase_h_es_nombres_rv1909_misma_grafia_001_20260820';
```

## Gate siguiente

No cerrar Bloque 3 todavía. Quedan entradas editoriales pendientes, incluyendo 1,011 filas antiguas en estado `rejected` que requieren tratamiento separado con respaldo y restauración exacta antes de reemplazarse. La validación visual/funcional del traductor se hará cuando Preview del head correspondiente esté READY.
