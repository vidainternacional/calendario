# FASE J — PROPUESTA FUTURA — COMUNIDAD, CENTRO PASTORAL Y DISCIPULADO

Fecha de registro: 2026-08-23

Estado: **PROPUESTA DOCUMENTADA — NO ACTIVA**.

Esta propuesta se registra como trabajo futuro posterior a FASE I. No modifica la prioridad activa ni autoriza implementación mientras FASE H continúe abierta.

## Objetivo general

Ampliar VIDA para acompañar mejor la vida de la iglesia antes, durante y después de los servicios, fortalecer la presentación de ministerios, facilitar discipulado, mejorar el Centro Pastoral y preparar contenido compartible hacia redes sociales.

## 1. Presencia en servicios y acompañamiento pastoral

Explorar un mecanismo opcional para detectar que una persona llegó físicamente a un servicio o actividad, con el objetivo pastoral de identificar ausencias relevantes y poder preguntar de manera humana si todo está bien o si necesita apoyo.

Principios iniciales:

- preferir **check-in voluntario por proximidad/geofence** al llegar al templo o evento;
- no realizar rastreo continuo de ubicación;
- solicitar consentimiento explícito antes de usar ubicación;
- usar la señal únicamente para acompañamiento y logística pastoral, no como mecanismo punitivo;
- contemplar alternativas sin GPS: QR del servicio, botón “Ya llegué”, check-in manual o confirmación desde el evento;
- cualquier aviso por ausencia debe ser respetuoso y contextual, por ejemplo: “Notamos que no pudiste acompañarnos hoy. Esperamos que estés bien. Si necesitas apoyo o quieres hablar con alguien, puedes escribirnos”.

Antes de implementar deben definirse privacidad, retención de datos, quién puede ver la información y cómo desactivar el seguimiento/check-in.

## 2. Centro Pastoral — presentaciones en horizontal

Las presentaciones creadas o subidas desde el Centro Pastoral deben poder visualizarse también en **orientación horizontal**, especialmente para proyección o exposición durante una enseñanza.

La experiencia futura debería contemplar:

- modo presentación horizontal a pantalla completa;
- diapositivas con versículo + imagen de fondo o imagen de apoyo;
- navegación táctil simple entre diapositivas;
- compatibilidad con móvil, tablet, navegador y proyección externa;
- conservar una vista vertical adecuada para edición y administración.

### Traducciones bíblicas externas

En la práctica pastoral se utilizan con frecuencia NVI y Reina-Valera 1960. VIDA no debe incorporar ni redistribuir el texto completo de traducciones con copyright sin licencia/autorización verificable.

Opciones a estudiar en la fase correspondiente:

- permitir que el pastor comparta/importе desde otra app una **imagen o contenido proporcionado por el propio usuario** mediante el sistema de compartir del dispositivo;
- aceptar una captura o imagen como recurso de una diapositiva;
- permitir pegar un fragmento que el usuario ya tenga autorizado para utilizar, sujeto a límites y revisión de licencia;
- buscar integraciones oficiales/licenciadas si en el futuro existe autorización para NVI o RVR1960;
- mantener las traducciones actualmente autorizadas de VIDA como fuente interna predeterminada.

No almacenar una copia completa de NVI o RVR1960 sin licencia.

## 3. Compartir contenido de VIDA hacia redes sociales

Diseñar una experiencia de compartir para versículos, frases de prédica, diapositivas, estudios o paquetes de contenido.

Formatos previstos:

- **Publicación**: formato cuadrado o vertical para feed;
- **Historia / Story**: formato vertical 9:16;
- opcionalmente un formato limpio para compartir por mensajería.

La tarjeta compartida podría componerse automáticamente con:

- versículo o frase seleccionada;
- referencia bíblica cuando corresponda;
- título de la prédica o serie;
- imagen/fondo aprobado;
- identidad visual de Vida Internacional;
- autor/pastor cuando sea apropiado;
- enlace profundo para regresar a la app o contenido público cuando exista esa capacidad.

El usuario debe poder previsualizar antes de compartir. El contenido con copyright debe respetar las licencias de su fuente.

## 4. Fichas de ministerios y solicitudes de ingreso

Mejorar las fichas que una persona ve antes de solicitar unirse a un ministerio. La ficha debe funcionar como una **carta de presentación del ministerio** y ser administrable por sus líderes desde el Dashboard correspondiente.

Contenido editable previsto:

- nombre e identidad visual;
- propósito / misión del ministerio;
- qué hace el equipo;
- a quién sirve;
- horarios o frecuencia habitual;
- responsabilidades principales;
- requisitos o preparación previa cuando existan;
- fotografías o material visual autorizado;
- mensaje de bienvenida del liderazgo;
- personas de contacto;
- botón claro para solicitar ingreso.

Los permisos deberán limitar la edición a liderazgo real y/o Administrador según el modelo vigente.

## 5. Discipulado digital y logro de finalización

Crear un área específica para coordinar **Discipulado** como proceso, no únicamente como material suelto.

Capacidades a explorar:

- rutas o programas de discipulado;
- grupos/personas asignadas;
- sesiones o etapas;
- materiales y tareas;
- avance visible para participante y responsable autorizado;
- recordatorios y próximos pasos;
- estado de completado;
- historial del proceso;
- reconocimiento visual al completar el discipulado, por ejemplo una **estrella/logro** dentro del perfil.

El logro debe representar un proceso realmente completado y no convertirse en una clasificación pública entre personas.

## Orden sugerido dentro de la futura FASE J

1. Fichas de ministerios y presentación del servicio.
2. Discipulado digital y logro de finalización.
3. Centro Pastoral horizontal y flujo de importación/compartir.
4. Generación de formatos para publicación e historia.
5. Check-in de asistencia/proximidad, únicamente después de diseñar privacidad, consentimiento y acceso pastoral.

## Dependencias y decisiones pendientes

- revisar permisos existentes de Centro Pastoral y Dashboard de ministerios;
- definir modelo de datos de discipulado antes de crear nuevas tablas;
- evaluar APIs nativas/web de compartir en iOS, Android y PWA;
- revisar licencias de traducciones bíblicas antes de integrar texto externo;
- definir política de privacidad y consentimiento antes de cualquier uso de ubicación;
- cualquier nueva tabla, RLS, grant, función sensible o almacenamiento de ubicación deberá presentarse con alcance, impacto y reversión antes de aplicarse.

## Gate

**No iniciar esta propuesta mientras la fase activa documentada sea FASE H.** Al cerrar FASE H debe ejecutarse FASE I en el orden oficial, salvo modificación expresa del documento maestro. Esta propuesta puede convertirse en una fase formal posterior únicamente cuando `__VIDA_INTERNACIONAL.md` lo indique.