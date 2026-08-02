# FASE D · Bloque 4 — Paquete textual TAHOT de Abdías

Fecha: 2026-08-02

## Objetivo

Generar el primer paquete reproducible por libro del Antiguo Testamento a partir de TAHOT, usando Abdías como caso pequeño y completamente auditable.

Este incremento todavía no importa contenido a Supabase.

## Motivo de selección

Abdías tiene:

- un capítulo;
- 21 referencias;
- volumen reducido para revisar cada fila;
- correspondencia directa suficiente para validar el formato básico del paquete.

Los casos complejos de arameo, Qere/Ketiv, restauraciones y adiciones desde la LXX continúan cubiertos por el contrato y los inspectores del PR #60. No se asumirá que Abdías representa por sí solo todos esos casos.

## Archivos del paquete

El workflow genera temporalmente:

- `manifest.json`: procedencia, licencia, conteos y hashes;
- `records.jsonl`: una fila por registro TAHOT, con todos los campos activos;
- `verses.json`: reconstrucción por referencia para auditoría;
- `audit.md`: resumen legible de integridad.

No se versionan los archivos fuente completos de STEPBible.

## Campos conservados por fila

- referencia fuente completa;
- referencia inglesa;
- referencia hebrea alternativa cuando existe;
- índice fuente;
- estado textual;
- idioma derivado de `Grammar`;
- hebreo original y forma visual sin separadores técnicos;
- transliteración original y forma visual;
- glosa inglesa de STEPBible;
- dStrong;
- morfología;
- variantes de significado;
- variantes ortográficas;
- raíz e instancia;
- Strong alternativo;
- campo de palabra conjunta;
- etiquetas Strong ampliadas;
- puntuación separada;
- conteos de componentes;
- SHA-256 individual.

## Reglas de presentación

La glosa inglesa de la fuente se conserva como evidencia técnica. No se presenta como traducción bíblica, traducción literal aprobada ni traducción española.

La forma visual elimina solamente los separadores técnicos `/` y `\\`; no altera letras, vocales, acentos ni puntuación.

## Integridad

La generación debe rechazar:

- archivos con SHA-256 diferente al fijado;
- filas con un ancho distinto de 17 columnas;
- datos dentro de las cinco columnas reservadas;
- referencias inválidas;
- idioma morfológico desconocido;
- filas sin idioma que no sean omisiones Qere reconocidas;
- referencias fuente duplicadas dentro de un versículo;
- índices fuera de orden;
- un conteo distinto de 1 capítulo y 21 referencias.

Cada fila y cada versículo recibe una huella SHA-256. El paquete incluye además hashes acumulados de registros, versículos y contenido total.

## Seguridad y alcance

- descarga de solo lectura desde el commit fijado de STEPBible;
- sin cambios en Supabase;
- sin RLS nuevo;
- sin cambios de interfaz;
- sin deployment de producción;
- sin proveedor de IA.

## Criterio de avance

El paquete deberá aprobar:

1. los auto-tests del contrato y del generador;
2. las 21 referencias de Abdías;
3. hashes válidos y reproducibles;
4. revisión de conteos, estados, variantes y desalineaciones;
5. inspección de muestras del primer, un versículo intermedio y el último versículo.

Solo después se diseñará la migración piloto para Abdías. El Bloque 4 permanece activo.
