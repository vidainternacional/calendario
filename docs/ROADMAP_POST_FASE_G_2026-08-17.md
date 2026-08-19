# VIDA Internacional — Roadmap posterior a FASE G

Fecha: 2026-08-17
Estado: **DOCUMENTADO — NO ACTIVO**

Este documento conserva hallazgos y funcionalidades solicitadas durante la validación integral. No amplía FASE G. La prioridad activa sigue siendo FASE G hasta su cierre formal en `__VIDA_INTERNACIONAL.md`.

## FASE H — Centro de Hebreo Bíblico

Prioridad inmediata después de FASE G.

Objetivo: crear dentro de Estudios una herramienta didáctica para aprender a leer y comprender hebreo bíblico de forma progresiva, práctica, visual y no aburrida.

Alcance previsto:

- Hub propio dentro de Estudios con nombre final por definir entre opciones como `Hebreo Bíblico` o `Aprende Hebreo`.
- Alef-bet completo de 22 letras, distinguiendo además las cinco formas finales cuando corresponda.
- Presentación visual tipo tabla periódica/tarjetas didácticas: letra, nombre, orden, valor numérico tradicional cuando sea pertinente, transliteración, forma escrita, variantes gráficas relevantes y ejemplo de uso.
- Pictogramas e historia de las formas únicamente cuando exista fuente académica verificable, separando claramente historia paleográfica de interpretaciones simbólicas posteriores.
- Ayuda de pronunciación orientada al aprendizaje, sin presentarla como reconstrucción histórica infalible.
- Ejercicios progresivos de reconocimiento, lectura de sílabas/palabras y lectura de versículos.
- Biblia hebrea completa disponible para lectura del texto original del Antiguo Testamento usando únicamente fuentes aprobadas/licenciadas; conservar correctamente los segmentos arameos donde correspondan.
- Lectura paralela fácil con traducción española aprobada, sin confundir traducción con texto original.
- Interacción palabra por palabra cuando exista evidencia: lema, transliteración, morfología y glosa aprobada.
- Progreso didáctico por lecciones.
- Área de materiales administrables: enlaces, documentos, recursos de apoyo, tareas y nuevas lecciones.
- Diseño mobile-first, minimalista, amplio y coherente con VIDA.

La base bíblica ya existente deberá reutilizarse; no volver a importar datos que ya están cubiertos y auditados salvo necesidad comprobada.

## FASE I — Guía interactiva y ayuda contextual por rol

Objetivo: sustituir la dependencia de un piloto manual como mecanismo principal de orientación.

Alcance previsto:

- Recorridos opcionales con globos/contexto la primera vez que una persona entra a una superficie relevante.
- Posibilidad de volver a iniciar el recorrido desde Ayuda/Perfil.
- Guía adaptada a rol global, membresías, liderazgo contextual y permisos efectivos.
- No mostrar capacidades que la persona no posee.
- Explicaciones breves de qué hace cada herramienta, para qué sirve y cuál es el siguiente paso.
- Complemento tipo manual/cuaderno interactivo que reúna las funciones disponibles para esa persona.
- El Piloto Operativo histórico permanece pausado y no se borra.

## FASE J — Apariencia global, experiencia de Inicio, emojis y Copy

Objetivo: convertir la apariencia en un sistema global coherente y eliminar cambios bruscos entre módulos.

Alcance previsto:

- Tema de aplicación completo: Claro, Sepia y Oscuro en todas las superficies, no solo Biblia/Cuaderno.
- Ajuste central en Configuración/Perfil.
- Evaluar modo `Sistema` y un modo `Automático` basado en la hora local; evitar depender de ubicación si no es necesaria.
- Transiciones sin pantallazos blancos entre módulos, skeletons y cold-start.
- Inicio con ambientación integrada en el fondo superior según momento del día: mañana/día, atardecer y noche estrellada; no encerrarla en una tarjeta adicional.
- Banco amplio y reutilizable de emojis para las superficies que admitan personalización, incluido Cuaderno, sin depender de selectores distintos por módulo.
- Auditoría completa de Copy de toda la aplicación: títulos, ayudas, estados vacíos, botones, errores y microcopy, conservando un tono claro, humano y consistente.

## FASE K — Ministerios y Discipulado

Objetivo: fortalecer la presentación pública interna de cada ministerio y crear un recorrido formativo oficial de la iglesia.

### Ficha de presentación del ministerio

- Cada líder autorizado podrá completar/personalizar la ficha que se muestra cuando una persona explora ministerios.
- Información estructurada: propósito, visión, qué hace el equipo, a quién sirve, horarios/reuniones, requisitos, contactos/autorizados, imágenes y recursos permitidos.
- Conservar control administrativo/pastoral y límites de permisos.

### Discipulado

- Área propia de formación de la iglesia.
- Cursos/lecciones progresivas con video grabado y materiales complementarios.
- Evaluaciones/cuestionarios por módulo y evaluación final cuando corresponda.
- Progreso individual privado para el usuario y visible únicamente a responsables autorizados según la política que se defina.
- Insignia de Discipulado completado.
- La aprobación final de la insignia corresponderá a Pastor/Administrador según reglas explícitas.
- Poder utilizar el estado de Discipulado como requisito de servicio cuando la iglesia así lo configure, sin modificar automáticamente roles o ministerios sin reglas aprobadas.

Cualquier tabla, RLS, grants o almacenamiento nuevo de esta fase requerirá propuesta exacta, impacto y reversión antes de aplicarse.

## FASE L — Comunicación y Centro Pastoral

### Avisos

- Mejorar el redactor para poder guardar configuraciones/preajustes reutilizables.
- Selección clara de audiencia y ministerios desde el propio editor.
- Poder reutilizar opciones frecuentes sin volver a configurarlas cada vez y limitar la edición cotidiana al contenido cuando corresponda.
- Mantener aprobación, destinatarios y seguridad actuales.

### Centro Pastoral

- Reestructuración visual hacia un workspace más minimalista, amplio y limpio.
- Priorizar contenido de trabajo y reducir ruido visual.
- Reordenar acciones para mostrar primero lo esencial.
- Agrupar opciones secundarias en acordeones/desplegables claros.
- Mantener todas las funcionalidades aprobadas; el rediseño no debe simplificar ni eliminar capacidades.

## Hallazgos que SÍ pertenecen a FASE G

Estos no se difieren porque afectan comportamiento/consistencia de funciones ya existentes:

1. El skeleton de navegación Biblia → Cuaderno puede mostrar un frame claro antes del tema seleccionado.
2. La transición entre superficies de lectura/estudio evidencia que el tema está limitado a un subconjunto de la app. FASE G debe eliminar el flash comprobable; la tematización total se ejecutará en FASE J.
3. `get_next_visible_calendar_item()` elimina actualmente un evento al alcanzar `fecha_inicio`, aunque `fecha_fin` todavía no haya ocurrido. Debe corregirse en FASE G con cambio seguro y reversible.
4. Las búsquedas temáticas de Estudio Profundo pueden devolver relaciones correctas pero requieren una introducción determinista que explique por qué esos temas/pasajes fueron seleccionados.

No implementar H–L mientras FASE G siga activa.