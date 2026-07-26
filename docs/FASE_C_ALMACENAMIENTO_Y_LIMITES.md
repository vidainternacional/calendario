# FASE C — Almacenamiento y límites operativos

Fecha de revisión: 2026-07-26

## Alcance

Este documento registra los límites aplicables a la Biblioteca Pastoral y a los recursos utilizados por los paquetes pastorales. Su objetivo es evitar suposiciones, prevenir cargas excesivas y dejar una referencia verificable para futuras sesiones.

## Límite adoptado por Vida Internacional

- Tamaño máximo aceptado por archivo en la Biblioteca Pastoral: **25 MB**.
- Este límite pertenece a la aplicación y debe validarse antes de iniciar una carga.
- El límite de Vida es deliberadamente menor que el máximo general del proveedor para mejorar la experiencia móvil, reducir fallos por conectividad y controlar el consumo de almacenamiento.
- Tipos previstos: imágenes, PDF, documentos, presentaciones, audio y video compatibles con el flujo pastoral.
- Los archivos se almacenan de forma privada y se abren mediante accesos temporales firmados.

## Límites actuales del proveedor

Según la documentación oficial de Supabase consultada el 2026-07-26:

- Plan Free: **1 GB** de almacenamiento de archivos incluido.
- Plan Pro: **100 GB** de almacenamiento incluido; el exceso se factura según el precio vigente del proveedor.
- Tamaño máximo global configurable por archivo en Free: **50 MB**.
- En planes Pro o superiores el límite global puede configurarse por encima de esa cantidad, sujeto a la configuración del proyecto.
- Un bucket puede imponer un límite menor que el límite global.
- El consumo se calcula por el tamaño total de los objetos almacenados y puede expresarse como GB-hora para cuota y facturación.

Fuentes oficiales de referencia:

- Supabase Storage — Limits: https://supabase.com/docs/guides/storage/uploads/file-limits
- Supabase Storage — Pricing: https://supabase.com/docs/guides/storage/pricing
- Supabase Pricing: https://supabase.com/pricing

Estas cifras son externas y pueden cambiar. Antes de modificar límites, presupuesto o plan, debe revisarse nuevamente la documentación oficial y la página Usage del proyecto.

## Reglas operativas

1. No aumentar el límite de 25 MB desde la interfaz sin revisar primero:
   - cuota disponible;
   - conectividad móvil;
   - tiempo de carga;
   - tipos MIME permitidos;
   - seguridad del bucket;
   - experiencia de apertura y descarga.
2. No usar enlaces públicos permanentes para archivos pastorales privados.
3. Mantener políticas por propietario y acceso firmado temporal.
4. Eliminar archivos huérfanos cuando se confirme que ningún registro pastoral los utiliza.
5. Evitar duplicar el mismo archivo en varios paquetes; debe reutilizarse desde Biblioteca cuando sea posible.
6. Registrar cualquier cambio de proveedor, plan, bucket o límite en la memoria técnica y en el changelog.

## Monitoreo recomendado

Revisión mensual o antes de una carga masiva:

- almacenamiento total utilizado;
- archivos de mayor tamaño;
- archivos sin registro asociado;
- consumo de egreso;
- errores de carga;
- tiempo medio de apertura en móvil;
- cuota restante del plan.

## Criterio de ampliación

Considerar una ampliación únicamente cuando:

- el uso sostenido alcance aproximadamente el 80 % de la cuota;
- ya se hayan eliminado duplicados y archivos huérfanos;
- exista una necesidad pastoral real;
- el costo y el impacto operativo hayan sido aprobados.

## Estado para cierre de FASE C

- Límite funcional de la aplicación documentado: **COMPLETADO**.
- Límites externos y regla de reverificación documentados: **COMPLETADO**.
- Estrategia de monitoreo y ampliación documentada: **COMPLETADO**.
