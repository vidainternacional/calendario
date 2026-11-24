
## Recibo posterior de recuperación real — 24-11-2026

Se comprobó directamente ccvida: siete objetos avatars,2028295 bytes; seis recuperadas suman1581601 bytes, descargadas de destino y cotejadas SHA256 íntegramente contra sus huellas certificadas. Cinco perfiles apuntan a recuperadas; cero perfiles con referencia al Supabase anterior. La foto nueva previa de446694 bytes permanece. Origen: cero objetos avatars. Por tanto la recuperación/retirada autorizada YA ocurrió; no solicitar repetirla ni seguir marcándola pendiente por falta de sesión en esta ejecución técnica. No se atribuye la acción a una sesión suplantada: se certifica estado final observado. Archivo pastoral excluido; no copiado. La validación visual del avatar en cuenta real sigue siendo del usuario.

# Revisión integrada — 24-11-2026

Pedido: fotos visibles y retorno navegable; preparar sedes/mensajería, Biblia y recursos en un único Preview, sin R2 ni producción. Amplía PR321; no integra automáticamente #319 ni #320. Se incorporan solo módulos de recursos de #320 y sus pruebas; historial de ambos Draft se conserva.

## Hecho y verificable en código

- /admin: accesos directos a Fotos, Sedes y mensajería, Recursos/Analytics. Retorno explícito a Inicio.
- /admin/fotos: herramienta real de recuperación, sin esperar las consultas largas de Analytics. Cuenta real de administrador activo obligatoria. La operación escribe ccvida y retira únicamente fotos originales autorizadas después de comprobar copias. Archivo La fe excluido. No afirmar ejecución de datos antes del recibo real. Nuevo acceso elimina dependencia de localizar un botón al final de Analytics.
- /admin/analisis: enlaces de retorno a Administración, Fotos y Sedes; Fotos y Recursos aparecen antes de las estadísticas. No toca BackButton compartido ni navegación de otros módulos.
- /admin/sedes: revisión interactiva explícitamente de ejemplo. Santa Ana central, Chalchuapa, preparación de sede futura, exploración pública separada de audiencias, ejemplo de alcance por responsabilidad, sedes/roles/ministerio/personas con deduplicación, grupos de prueba privados del remitente de ejemplo y carga/reutilización de selección. Revisar destinatarios y contenido, adjunto PDF visto dentro de la página. No envía push, no crea sedes/usuarios reales ni cambia pertenencias. Grupos solo durante permanencia; adjuntos solo en el dispositivo, no se suben.
- Lecturas editoriales Neon: force-cache + revalidación300s para consultas idénticas (URL, cuerpo SQL parametrizado y conexión forman la clave de fetch). Comprueba autorización por usuario ANTES de cada consulta. Fuentes aprobadas, filtros/paginación y separación AT/NT intactos. No cachea notas, perfiles, progreso ni escritura personal. Prueba existente actualizada para contrato de caché editorial, conserva comprobación de bloqueo sin sesión/inactivos.
- Recursos: indicadores con fechas y estado Sin datos cuando faltan credenciales. No medir cero por defecto ni afirmar vigilancia nueva en segundo plano. R2 se muestra pendiente, no activado; no hay tarjeta ni contratación.

## Límites pendientes de backend

Sedes, grupos y envío de esta revisión son demostración, no funciones productivas. Antes de activarlos, presentar SQL/políticas concretas y recibir aprobación específica. Alcance previsto: catálogo de sedes (nombre/país/zona horaria/central); pertenencias y responsabilidades por sede separadas del rol actual; relación de ministerios y eventos con sedes; audiencias y grupos privados; tablas de adjuntos con verificación por audiencia. Conservar todas las opciones actuales de envío. No asignar cuentas existentes automáticamente a Santa Ana; no convertir visitantes públicos en miembros de ministerio. Los eventos mixtos invitan músicos sin conceder acceso general a ministerios ajenos.

Visibilidad, lista de destinatarios y push deben usar la misma autorización; elegir una sede o cargar un grupo no eleva permisos. Respetar bajas de notificaciones. No tocar notas personales ni publicar borradores ajenos. Reversión de futura activación: deshabilitar experiencia, conservar tablas/filas nuevas; restaurar políticas desde respaldo, sin borrar contenido nuevo. Actualmente no se aplicó SQL ni RLS.

Supabase anterior:124504 textos cotejados por huella íntegra con NeonB; no tiene ocurrencias palabra por palabra. Conmutación automática todavía NO implementada. Preparar acceso y filtros equivalentes antes de activarla; no degradar Estudio Profundo a resultados incompletos ni copiar611398 ocurrencias a Free. Caché reduce repeticiones, no garantiza capacidad para300 usuarios ni elimina límites de cómputo/tráfico.

## Evidencia

22 pruebas pertinentes PASS: recuperación5, recursos7, lectura Neon6 y selección/navegación4. TypeScript, lint específico y build local correctos. Chromium aislado320/390/820px con componente real y personas de ejemplo: despliegues cerrados, alcance local, grupo guardado/cargado, mensaje y destinatarios revisables, sin desborde. No es validación autenticada ni prueba de entrega push. CI general con tres fallos heredados fuera de alcance no declarado verde. SHA/deployment/alias exactos se registran en recibo del PR321 para no crear otro despliegue documental.

## Checklist del usuario

1. Administración: abrir Fotos directamente y volver a Administración/Inicio sin historial previo.
2. Fotos: ejecutar como administrador, copiar texto del resultado; verificar avatar recuperado y foto nueva conservada antes de declarar cierre.
3. Sedes: alternar Santa Ana/Chalchuapa y preparar sede de ejemplo sin modificar usuarios.
4. Mensajería: elegir sedes/roles/personas, comprobar lista final y alcance, guardar/cargar grupo de prueba y ver PDF. No se envía nada.
5. Recursos/Biblia: distinguir Sin datos de consumo medido; Biblia real conserva AT/NT y Estudio. Medición real de ahorro y respaldo automático todavía pendientes.

Producción, cuentas, datos sensibles y RLS sin cambios nuevos. No activar R2. No publicar sin autorización expresa.
