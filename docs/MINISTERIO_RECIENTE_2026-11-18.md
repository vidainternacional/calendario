# Inicio — último ministerio visitado · 2026-11-18

Base: main `a117e24b8bf718e91c5faf8dad23dcac7a7d6302`, PR #317 ya publicado. Rama aislada `agent/ministerio-reciente-20261118`; no mezcla ramas Draft ni altera el maestro.

## Cambio solicitado

Inicio siempre escogía `membresias[0]`. Ahora el ministerio visitado más recientemente encabeza la ficha y su selector. Se conserva el orden relativo de los demás, membresías, apariencia, liderazgo y badges existentes.

La visita se registra al montar el layout autorizado de un ministerio donde la persona es miembro. Un prefetch, una solicitud de ingreso o una visita transversal del administrador a un equipo ajeno no cambia la ficha de sus membresías. Si el ministerio guardado deja de estar en la lista actual, se usa el primero de esa lista sin agregarlo de nuevo.

Preferencia local por usuario y dispositivo; no sincroniza entre teléfonos. Se conserva al recargar, comunica el cambio en la pestaña y escucha almacenamiento, foco y restauración del historial. Sin almacenamiento disponible, funciona durante la visita. No agrega consultas, timers, tablas, RLS, perfiles ni escrituras al servidor.

## Ficha de presentación existente — revisión sin modificar

- Ruta: abrir el ministerio → lápiz superior **Personalizar ministerio** → modal **Personalizar dashboard**.
- Disponible al líder asignado contextual (`es_lider`); ser administrador/pastor global por sí solo no muestra el lápiz. No se cambian esos permisos.
- Campos ya implementados: nombre, descripción (500 caracteres), emoji, portada, imagen/avatar, colores y tipografías; vista previa y Guardar cambios. Imágenes se comprimen antes de guardar.
- Acción existente `personalizarMinisterio` verifica liderazgo de ese ministerio y actualiza su ficha; revalida ministerio, exploración e Inicio. La descripción se muestra en la portada del ministerio y en Explorar ministerios.
- Para redactar la presentación basta describir qué hace el ministerio, a quién sirve y cómo integrarse. No se crearon campos nuevos ni otra ficha.

## Verificación y continuidad

Cinco pruebas pertinentes: último acceso y orden restante intacto, exclusión de equipos ajenos o retirados, separación entre usuarios/SSR, actualización al volver y limpieza de listeners, almacenamiento bloqueado. TypeScript y compilación local correctos. Archivos nuevos con lint limpio; fallos generales heredados no corregidos ni declarados verdes.

Prueba móvil aislada con los componentes reales y datos simulados: LiveStream → Alabanza → Atrás muestra Alabanza, recargar conserva la selección, selector vuelve cerrado y no hay desbordamiento a 390 px. No equivale a sesión autenticada real.

No se modificaron datos, membresías, permisos ni fichas reales. No hay autorización nueva de merge/producción. Preparar un único Preview y mantener la entrada acordada `https://calendario-git-agent-avisos-devociona-15ceac-vida-internacional.vercel.app/inicio`; asignarla al deployment verificado de esta rama. Recibo exacto de SHA/READY en el PR para no generar otra publicación documental.

Reversión: volver al código previo, sin modificar datos de servidor. La preferencia local puede ignorarse; no concede acceso. Pendiente validación visual autenticada del usuario (LiveStream → Alabanza → Atrás → Inicio) antes de aprobar producción.
