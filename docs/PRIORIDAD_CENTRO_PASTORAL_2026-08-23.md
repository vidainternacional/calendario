# Decisión de prioridad — Centro Pastoral — 2026-08-23

## Decisión del usuario

La implementación de **FASE I — Guía interactiva y ayuda contextual por rol** se difiere para el final del desarrollo pendiente. No se considera completada ni cancelada; queda pausada para retomarse posteriormente.

## Prioridad de trabajo solicitada

La siguiente prioridad de trabajo es **Centro Pastoral — reorganización visual y evolución del área de trabajo**.

## Alcance autorizado

1. Preservar íntegramente las funciones, rutas, datos, permisos, relaciones y flujos ya aprobados del Centro Pastoral.
2. No modificar RLS, grants, esquema de Supabase ni lógica sensible de acceso sin una propuesta previa explícita y aprobación del usuario.
3. Convertir la superficie en un workspace integrado al fondo de la app, evitando tarjetas anidadas y cajas sobre cajas.
4. Mantener **Proyecto** como contexto principal en la parte superior.
5. Convertir las páginas del proyecto en lienzos visuales reutilizados directamente por Editar, Presentar y Congregación, sin reconstruir diapositivas paralelas.
6. El lienzo debe ser mobile-first y conservar el mismo modelo en celular, iPad y computadora, ampliando superficie y precisión según el dispositivo sin crear editores separados.
7. Soportar formatos 16:9 horizontal, 9:16 vertical, 4:3 para proyectores y 1:1, conservando la composición al cambiar de vista.
8. Permitir múltiples elementos independientes por página: cajas de texto, versículos e imágenes, con posición, tamaño y orden de capa propios.
9. Las imágenes deben poder usarse como elemento o fondo, moverse, redimensionarse, duplicarse, adelantarse/atrasarse, borrarse y ajustar encuadre/opacidad/esquinas; una página puede contener varias imágenes simultáneas.
10. Las herramientas se organizan en una sola barra superior con panel desplegable inmediatamente debajo: **Fondo, Texto, Párrafo, Recursos, Biblia y Diseño**.
11. Fondo permite color, imagen y temas predefinidos. Texto permite cajas independientes, tipografías, tamaño, color y énfasis. Párrafo concentra alineación, viñetas, numeración e interlineado.
12. Recursos reutiliza la Biblioteca Pastoral existente, admite subir imágenes desde el proyecto y puede enlazar bancos externos con licencias compatibles, sin copiar material sin derechos claros.
13. Deshacer/Rehacer permanecen siempre visibles y usan un historial global del proyecto, no solo del texto: páginas, posiciones, tamaños, estilos, fondos, capas y metadatos visuales deben ser reversibles.
14. Presentar y Congregación deben reutilizar exactamente el mismo lienzo y ofrecer pantalla completa; swipe/touch continúa disponible en móvil/iPad y navegación equivalente en computadora.
15. Compartir conserva la distribución actual y puede añadir exportación PDF/impresión y compartir/copiar el enlace autenticado existente.
16. Un futuro enlace público para redes/WhatsApp y el control remoto iPad → pantalla/OBS/proyector deberán diseñarse con publicación segura, emparejamiento y permisos claros antes de exponer contenido fuera de la sesión. Cualquier cambio sensible requerido se presentará primero al usuario con impacto y reversión.
17. IA para generar o proponer recursos visuales queda contemplada como herramienta opcional posterior; no bloquea la calidad del lienzo, edición, presentación ni recursos base.
18. Usar el sistema visual actual de VIDA: tipografía, márgenes, áreas táctiles, botones, estados, transiciones, separadores y jerarquía mobile-first ya aprobados.
19. No copiar el patrón de tarjetas didácticas de Hebreo; reutilizar únicamente su nivel de pulido y consistencia visual.
20. Compatibilidad Android permanece contemplada, pero la validación manual actual prioriza iPhone; iPad y computadora forman parte del diseño responsive desde esta evolución.

## Implementación sin cambio sensible — 2026-08-24

La primera evolución a lienzo visual se persiste dentro del JSON ya existente de `pastoral_paquetes.presentacion_diapositivas`. No introduce tablas, migraciones, políticas RLS ni grants nuevos. Los proyectos anteriores se normalizan al abrirse para conservar título y contenido como elementos del lienzo.

La carga de imágenes reutiliza `pastoral_biblioteca` y el bucket `pastoral-library` ya existentes a través de la acción pastoral autorizada. No se crea un segundo repositorio de archivos.

## FASE I

FASE I queda **DIFERIDA — realizar al final** por decisión explícita del usuario el 2026-08-23. Su alcance documentado se conserva sin cambios para retomarlo más adelante.

## Siguiente punto autorizado propuesto para el documento maestro

**Trabajar exclusivamente en Centro Pastoral — evolución del workspace visual. Consolidar el lienzo por capas, herramientas desplegables, múltiples imágenes, texto y párrafo independientes, formatos responsive, historial global y paridad Editar/Presentar/Congregación; llevar cada lote estable a Preview para validación antes de integración. Mantener enlace público, control remoto/OBS y cualquier IA que requiera nueva infraestructura detrás de una propuesta de seguridad/impacto previa. FASE I permanece diferida para el final.**
