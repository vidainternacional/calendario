# Fase D — Autoría visible y comparación ampliada

Estado: IMPLEMENTADO — VALIDACIÓN VISUAL PENDIENTE

## Alcance

- La autoría general del libro se muestra como parte visible del encabezado de lectura, sin desplegable.
- Los encabezados propios del capítulo o salmo se leen desde `hebrew_subtitle` cuando la traducción los incluye.
- El modo Comparar conserva la comparación estable entre dos Biblias.
- Se añade el modo `Todas las versiones` para consultar un solo versículo en todas las traducciones disponibles en la aplicación.
- Los controles visibles utilizan abreviaturas; las opciones nativas conservan el nombre completo.

## Fuente de encabezados

HelloAO define `hebrew_subtitle` como contenido informativo presente en la tradición textual, usado habitualmente para encabezados de Salmos. No se genera ni se infiere una atribución específica cuando la traducción no la proporciona.

## Validación técnica

- commit de implementación: `0473c77fe100c469c0b1c7fa95058b3c57653dd5`;
- preview: `dpl_AaAwbXyTV6Y5Z2nPfLSVwcKn4qAX` — `READY`;
- Next.js 16.2.10 compiló correctamente;
- TypeScript terminó sin errores;
- 32/32 páginas generadas;
- ruta `/biblia` incluida.

## Criterio de cierre

Este incremento requiere confirmación visual en producción de:

1. autoría visible sin desplegable;
2. encabezado específico de un salmo cuando exista;
3. estabilidad al alternar entre Leer y Comparar;
4. funcionamiento de `Dos Biblias` y `Todas las versiones`.
