# FASE J — PLAN FUTURO — EVOLUCIÓN DE NOTAS CON VISTA DE LISTA TIPO iOS

Estado: **PLANIFICADA — posterior a FASE I y no activa mientras FASE H siga abierta**.

Fecha de decisión: 2026-08-20.

## Objetivo

Evolucionar el módulo Notas para que disponga de una **vista de listas inspirada en la experiencia nativa de Notas de iOS**, preservando todas las capacidades ya cerradas de FASE F y sin degradar edición, privacidad, sincronización, offline, historial, metadatos, exportación ni correlación bíblica.

## Referencia visual aportada por el usuario

El usuario entregó dos capturas de la app Notas de iOS como referencia visual. No se deben generar imágenes a partir de ellas. La referencia debe interpretarse como patrón UX, no como copia literal de marca o interfaz.

Elementos observados que deben guiar la futura vista:

- pantalla principal basada en **lista nativa**, no en mosaico de tarjetas;
- sección de **notas fijadas / Pinned** separada del resto;
- agrupación cronológica del listado mediante bloques como **Hoy**, **Ayer** y **7 días anteriores** o equivalentes localizados;
- cada fila prioriza **título de la nota**;
- debajo puede mostrar fecha/tiempo reciente y un **extracto corto del contenido**;
- metadatos secundarios discretos, por ejemplo adjuntos cuando existan;
- separadores finos entre filas;
- jerarquía visual compacta que permita recorrer muchas notas sin desperdiciar altura;
- búsqueda accesible desde la misma superficie de lista;
- acción de crear una nota nueva fácilmente accesible en móvil;
- navegación superior limpia y coherente con el lenguaje visual general de VIDA;
- soporte de notas fijadas sin perder el orden cronológico de las demás;
- la vista debe sentirse nativa en iPhone, con áreas táctiles cómodas y sin card-in-card innecesario.

## Reglas de preservación

Esta fase futura NO debe reabrir ni romper lo ya aprobado en FASE F:

- cuaderno personal único por usuario;
- privacidad por defecto;
- notas asociadas a referencias/contexto cuando corresponda;
- sincronización y respaldo en Supabase;
- historial Deshacer/Rehacer sobre contenido y metadatos;
- funcionamiento offline aprobado;
- exportación;
- predicación correlativa y demás comportamientos ya cerrados.

## Arquitectura esperada

La futura vista de lista debe ser una **vista adicional o evolución de navegación**, no un reemplazo destructivo del editor. El usuario debe poder recorrer sus notas rápidamente, abrir una nota existente, fijarla/desfijarla cuando corresponda y crear una nueva manteniendo el mismo modelo de datos privado.

## Control de fase

No implementar este trabajo durante FASE H. Al cerrar formalmente FASE H y completar FASE I, incorporar esta planificación al documento maestro `__VIDA_INTERNACIONAL.md` como FASE J antes de iniciar su ejecución.
