# Mensajes semanales de VIDA

Pedido: un espacio independiente del discipulado para que el pastor publique videos semanales alojados en YouTube. La aplicación guarda enlaces y texto, no videos binarios.

Se comprobó que Prédicas en video y Devocionales ministeriales eran marcadores «Próximamente». La sección nueva sustituye el marcador de Prédicas en video por un acceso operativo Mensajes semanales en Estudios. No modifica la gestión de discipulado ni la formación de hebreo.

Se localizó a Romy en la cuenta migrada: su rol ya es pastor y su cuenta está activa. No se modificaron roles ni permisos. Los pastores y administradores activos pueden gestionar sus propios mensajes. Los miembros activos ven únicamente publicaciones autorizadas para la iglesia.

## Modelo y acceso

Un mensaje usa un proyecto pastoral sencillo existente: titulo, descripcion_publica e instrucciones con la URL canónica de YouTube, sin bosquejo, colección ni archivos adjuntos. La audiencia es iglesia. El campo publicado distingue borradores y publicaciones. Es un enlace legible, no un marcador interno ni JSON mostrado al usuario.

No se añadieron tablas, columnas, roles, RLS ni funciones SQL. Los mensajes publicados también son materiales pastorales y pueden aparecer en los espacios existentes de paquetes recibidos/Inicio; sus notas privadas no se consultan ni se exponen.

Las escrituras usan sesión del usuario, verificación de rol/estado y RLS existentes. Edición y publicación filtran id, profile_id y updated_at para evitar cambios sobre mensajes de otro autor o sobrescribir una edición concurrente. No se ejecutan notificaciones push al publicar desde esta sección.

Las lecturas obtienen primero los IDs visibles mediante get_received_pastoral_packages bajo la sesión del miembro. Solo esos IDs pueden consultarse en el cliente de servidor, con publicado=true, audiencia=iglesia y selección explícita de campos públicos. Los borradores propios se leen con la sesión y filtro de autor. El detalle usa get_internal_pastoral_package y vuelve a comprobar acceso/audiencia/tipo de material. No hay acceso por simple conocimiento del UUID de un borrador.

YouTube: enlaces HTTPS de youtube.com/www/m o youtu.be, con watch, shorts, live o embed y un ID válido. Se normalizan los enlaces, sin resolver páginas externas. El reproductor usa youtube-nocookie.com; ofrece abrir YouTube si el autor del video impide la inserción. La visibilidad pública/no listada y la autorización de inserción se configuran en YouTube.

## Verificación del Preview

El Preview usa ccvida, por lo que trabaja con datos reales: empezar guardando un borrador propio. No publicar pruebas para toda la iglesia sin coordinarlo. No se cargaron mensajes ficticios ni se enviaron notificaciones durante el desarrollo.

Romy debe entrar con su cuenta de VIDA, abrir Estudios → Mensajes semanales → Nuevo mensaje, pegar el URL, escribir título/descripción y guardar. Publicar debe ser una elección explícita. Otro miembro debe poder reproducir el publicado pero no ver borradores, editar ni publicar. Romy debe poder editar/despublicar el suyo y un enlace inválido debe rechazarse. Confirmar que no cambia ningún curso ni avance del discipulado.

La publicación de esta sección nueva en producción queda pendiente de la revisión del Preview. El acceso habitual ya restablecido no se modifica por preparar esta rama.

Validación local: 9 pruebas nuevas de URLs, autorización, propiedad, concurrencia y paginación; 28 pruebas existentes de Hebreo/Cuaderno, todas aprobadas. TypeScript, build estándar Turbopack y ESLint de archivos nuevos pasan. La página Estudios conserva tres errores previos de no-explicit-any y una advertencia de accesibilidad en código no modificado; no se alteró ese código para silenciar el lint.


## Extensión: Devocionales y mensajes desde Centro Pastoral

Rama `agent/devocionales-centro-pastoral-20261116`, basada exactamente en el head del PR #306. No integra el PR #306 ni modifica producción.

- Gestión y edición exclusivamente en `/pastoral/mensajes`, accesible desde Centro Pastoral a pastores y administradores activos.
- Estudios → Devocionales y mensajes conserva la biblioteca de publicaciones; se retira el marcador redundante «Devocionales ministeriales · Próximamente».
- Se reutilizan editor, acciones, validación YouTube, borrador, publicación, propietario, revisión y tablas existentes, sin esquemas/RLS/roles nuevos.
- Pendientes separados: categorías, series ordenadas y permisos individuales delegados desde Administración. Requieren diseño de datos/permisos, impacto, reversión y autorización específica; no se habilitan por defecto.
- Checklist de Preview: acceso desde Centro Pastoral, edición de borrador propio, lectura en Estudios para un miembro, publicación/despublicación, Planes de lectura intactos.

## Extensión de biblioteca — solicitud del 16-11-2026

- El usuario aprobó visualmente la disposición de Centro Pastoral y solicitó listas/cuadrícula, categorías y destinatarios segmentados (ministerios, múltiples ministerios, pastores o iglesia completa).
- Implementado en esta rama: vistas alternables de lista/cuadrícula, búsqueda local, autor y orden; categorías actuales «Todos» y «Mensajes». «Devocionales» y «Series» se señalan como pendientes hasta habilitar clasificación persistente real. Los datos autorizados, detalle y editor mantienen intacta la seguridad anterior.
- **NO implementado**: audiencia segmentada ni tipos/series persistidos. Requiere aprobación explícita por impacto en privacidad y cambios en SQL/RLS/RPC y revisión de todas las superficies de paquetes. Ningún dato ni permiso se modificó.
- Verificar en Preview que la biblioteca vacía muestre navegación, categorías y cambio de vista, y al existir publicaciones la búsqueda/lista/cuadrícula funcionen sin exponer borradores. Mantener PR Draft y sin producción.

## Continuidad de edición y previsualización

- Entrada `Centro Pastoral → Ver biblioteca` usa `?origen=pastoral`: el enlace volver en Biblioteca lleva a `/pastoral/mensajes` y no a Estudios. La paginación y enlaces al detalle mantienen ese origen. La entrada normal desde Estudios permanece igual.
- Dentro de cada formulario hay una Vista previa desplegable, inicialmente cerrada, que refleja título, descripción y video de YouTube según se escriben. No hace escrituras a Supabase, no publica y conserva el formulario durante la previsualización.
- El enlace a Biblioteca es una navegación completa, por lo que se debe guardar como borrador antes de salir para no perder cambios no guardados. Para comprobar contenido sin salir usar vista previa.

## Corrección puntual — navegación principal de Centro Pastoral

- El botón «Atrás» de `/pastoral` ahora enlaza a `/perfil` de forma explícita, sin usar el historial del navegador. Se conserva el mismo diseño visual y no se modifica el componente `BackButton` compartido ni la navegación contextual de Biblioteca y Devocionales.
- Alcance únicamente navegación, sin cambios de datos, roles, permisos, Supabase o producción. Verificar en Preview el regreso `/perfil → /pastoral → Atrás → /perfil` y el retorno interno `Biblioteca → Devocionales`.


## Publicación flexible de Devocionales — 16-11-2026 (bloque dirigido en PR #308)

**Solicitud:** En el mismo formulario de creación y edición, dejar opcional publicar, conservar borradores privados y seleccionar una combinación de destinatarios: toda la congregación, pastores, administradores, líderes, servidores, líderes de ministerio (asignados) y cualquier número de los ministerios activos existentes.

**Solución y alcance:**
- Control «Publicar» independiente del desplegable «Elegir destinatarios», ambos dentro del editor existente y sin alterar la vista previa.
- Selección aditiva (OR): el destinatario ve el mensaje si pertenece a cualquiera de los roles o ministerios seleccionados; «Toda la congregación» incluye a todos los miembros con cuenta activa.
- Las casillas usan los valores de rol y la tabla de miembros/ministerios REALES de ccvida, sin listas de ejemplo. Validación de ministerios activos en servidor.
- Sin selección de audiencia no se permite publicar, pero sí guardar un borrador que solo puede leer su autor. Cambiar selección tras publicar actualiza quién tiene acceso a la biblioteca y al enlace directo.
- La categoría «Devocional» se puede guardar y filtrar; «Mensaje» continúa, y «Series» permanece pendiente.
- Datos nuevos aislados en public.vida_devocionales: no se modifican ni se migran datos del módulo pastoral de paquetes, roles preexistentes, RLS previa, navegación o menú inferior.
- RLS en tabla nueva comprueba cuenta activa, rol, membresía y asignación de líder. Ningún destinatario no seleccionado puede abrir el video por su ID interno.
- El enlace de YouTube es externo: un video público/no listado puede abrirse fuera de VIDA si alguien conoce su enlace. No se envían notificaciones push automáticamente desde este formulario.
- Materiales antiguos del PR #306 siguen visibles y editables con su mecanismo previo; no se borraron ni reconvirtieron.

**Cambios sensibles autorizados en alcance:** crear solamente tabla, índices, permisos y RLS nuevos para contenido dirigido. Reversión de app: regresar al commit 5d9054f9fc66c70b20ca900b596e54adcf37a864; sin borrar la tabla o información nueva. No tocar políticas existentes, producción web, cron ni Service Role.

**Verificación requerida:** compilar y obtener un único Preview en el alias fijo; probar borrador privado, publicar para Alabanza solamente, varios ministerios combinados, pastores, líderes de ministerio y vista de Estudios según dos usuarios con distinta membresía. Sin usuarios de prueba, esto requiere validación visual/autenticada del usuario. No integrar PR ni cerrar bloque hasta su validación.
