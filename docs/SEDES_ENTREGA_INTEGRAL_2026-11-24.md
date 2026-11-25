# Entrega integral de sedes — activación autorizada

## Recibo final del Preview —25-11-2026

Implementación funcional publicada en rama/PR321 con commit a3f40699306ca2603e351e1f485f68cac9970cb0. Deployment dpl_HujCiNsQQMBDVVivWfd4X4HstGKs READY, mismo SHA. Alias fijo confirmado: https://calendario-git-agent-avisos-devociona-15ceac-vida-internacional.vercel.app/inicio . No crear otro Preview para entregar este recibo documental.

Comprobación por conector Vercel: /signup HTTP200 con ambas sedes reales del catálogo, /sedes/administrar sin sesión lleva a login y no expone Administración; consulta inicial de logs error/fatal del deployment sin resultados. No hubo prueba autenticada/recepción push ni sesión suplantada. Producción confirmada sin cambio en dpl_78e612TyrSRrc4PNrs4keQkVB9EG, main bd7aa236143eb829c0fcbe263099431c19033cfd.

Configuración de negocio pendiente: Administración debe clasificar ministerios reales y asociar pastores; cero asignaciones automáticas. El usuario revisará con personas reales públicos/privados, grupos, reenvíos, invitados y GPS si se usa. Cambio aplicado y compilado; falta validación visual tuya. No declarar toda la app multisede certificada ni producción publicada. exigir_sedes_legacy=false hasta aprobación separada de publicación final.

Recibo remoto completo y accesible en https://github.com/vidainternacional/calendario/pull/321 . Estas actualizaciones finales de bitácora/documento se conservan en un commit local documental posterior, todavía sin push para evitar un segundo Preview por bloque; incluirlas en el siguiente cambio autorizado. No volver a aplicar la migración ni generar despliegues para sincronizar solo documentación. Maestro y fases intactos.

## Activación autorizada — 25-11-2026

El usuario responde «Ok» a la solicitud concreta de aplicar este paquete en ccvida y conectarlo al mismo Preview. Autoriza SQL presentado y Preview; no merge, producción ni corte definitivo legacy. Aplicada por conector la migración **20261125185122_sedes_integracion_audiencias_servicios_20261125** con el mismo SQL SHA256 d769580f52d5809b7408a76aa402b1d831a00ec2dd0364e55adae5a14e833015. Copia idéntica versionada en supabase/migrations; no se inventó timestamp local.

Comprobación remota después de aplicar: cinco columnas nuevas; RLS activa en grupos, invitados y config privada; anon no puede gestionar sedes ni consultar coordenadas; authenticated no ejecuta el predicado de otro UUID. Config activa=true, exigir_sedes_legacy=false para compatibilidad de producción. Cero grupos/invitados/responsables/clasificaciones creados automáticamente. Conteos antes/después idénticos:25 perfiles y usuarios,7 archivos,1 aviso,1 devocional,1 paquete,13 eventos,37 membresías. No se enviaron avisos ni se usaron sesiones suplantadas.

Asesores: ningún hallazgo WARN/ERROR nuevo respecto a la lectura inmediatamente anterior. Un INFO nuevo deliberado: config del esquema privado tiene RLS sin políticas y sin grants para clientes; solo helpers autorizados leen su configuración. Esto deniega acceso directo por diseño. Referencia: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy . Las advertencias históricas no se cambiaron fuera de alcance.

Estado siguiente: publicar un único Preview de esta rama en el alias habitual y verificar SHA/READY/alias, catálogo de registro y rutas públicas/protegidas. Administración todavía debe clasificar los ministerios reales y asociar las cuentas pastorales; no se adivinan responsables o membresías. Pruebas autenticadas y recepción push reales siguen pendientes del usuario. Main y maestro intactos.

24-11-2026. Petición vigente: terminar el bloque y después realizar validación con personas reales. Estado: implementación local preparada; segundo paquete de base de datos y Preview integral todavía NO aplicados. Producción/main y documento maestro intactos.

## Alcance concreto de la segunda migración

Proyecto único de destino: ccvida, lnkrojvyiwnlcoponxud. La primera migración 20261124221418 ya existe y no se repite.

SQL exacto a autorizar: [sedes-integracion-completa.sql](sql/sedes-integracion-completa.sql). Fuentes para revisión: sedes-integracion.sql, sedes-operaciones.sql, sedes-asistencia.sql y sedes-asistencia-funciones.sql. El test de PostgreSQL comprueba que el artefacto completo coincide con esas fuentes y ejecuta ese mismo artefacto. No ejecutar además las piezas separadas.

1. Agrega vida_audiencia nullable a publicaciones, vida_devocionales y pastoral_paquetes. Contenido y destinatarios se guardan juntos; el autor no cambia y una audiencia nueva nunca se vuelve implícitamente histórica.
2. Crea vida_grupos_destino (grupos propios de destinatarios) y vida_evento_invitados (invitaciones por evento/equipo); RLS activa y acceso mínimo. Configuración/helpers quedan en esquema privado no expuesto; no se acepta actuar como otro UUID.
3. Añade políticas restrictivas de lectura a contenido y eventos/programación/asistencia asociados y modifica las RPC históricas que podían saltar esas fronteras. Conserva datos e historial, sin sustituir roles o políticas anteriores. Las notas privadas del pastor no se incluyen en los recursos compartidos.
4. Agrega operaciones autorizadas para clasificar ministerios, crear equipos distintos por sede con calendario privado, asociar cuentas pastorales existentes a sedes, invitar músicos y asignarles una función solo para ese servicio. No se clonan miembros ni se asignan cuentas automáticamente.
5. Permite catálogo mínimo público para registro; la congregación declarada y las sedes visibles son preferencias propias, nunca autoridad para leer equipos privados. Las cuentas existentes también pueden elegir desde Perfil.
6. Agrega ubicación del templo por sede y sede de celebración opcional por evento. Ajusta asistencia, historial e intercambios para respetar la responsabilidad real, conservando cálculo GPS/ventanas e historial de asistentes visitantes. No se escriben coordenadas reales de templos ni ubicaciones personales al aplicar la migración.
7. Configura una transición compatible: exigir_sedes_legacy=false inicialmente conserva los clientes de producción actuales. Los destinatarios nuevos siempre se validan; el cierre de rutas antiguas de publicación queda para la autorización separada de producción. No se declara completamente activado antes de ese corte.

## Impacto y recuperación

- Las lecturas privadas y gestiones pastorales pasan a comprobar sede/equipo concreto. Una invitación permite únicamente ver el servicio y sus canciones, sin abrir chats o el resto de la programación ajena.
- Administración debe clasificar los ministerios reales y elegir qué cuentas pastorales corresponden a cada sede. No se adivina esa asignación: hasta clasificar, se conserva compatibilidad del material histórico. Cada nuevo equipo necesita integrantes/liderazgo autorizados mediante las herramientas actuales.
- No modifica contraseñas, autenticación, roles de perfiles, imágenes recuperadas, notas personales, corpus Neon, planes, gastos ni R2. No envía mensajes ni crea usuarios de prueba al aplicar SQL.
- La primera aplicación no activa datos privados reales de Chalchuapa ni publica producción. El Preview usa las mismas cuentas reales y la protección nueva, sin suplantación de sesión.
- Reversión operativa: [sedes-integracion-reversion.sql](sql/sedes-integracion-reversion.sql) desactiva escrituras nuevas mediante la configuración. Conserva columnas, grupos, invitaciones e historial y mantiene las guardas de lectura/GPS. No restaurar políticas amplias sobre contenido privado nuevo; no borrar datos para revertir.
- La aprobación de este SQL no autoriza merge, producción ni habilitar el corte definitivo. Todo ello requiere autorización nueva según el maestro.

## Implementación preparada

- Inicio filtra avisos públicos por las sedes elegidas; mensajes privados dirigidos siguen disponibles aunque se cambie ese filtro. Contadores y marcas de lectura usan el mismo alcance.
- Selector común de destinatarios en Avisos, mensajes pastorales y distribución de paquetes: sedes, roles, ministerios, personas y grupos propios; destinos plegados y el contenido primero. Los permisos se revalidan al guardar o reenviar. Push privado sin asunto/cuerpo sensible en pantalla bloqueada, bajas de notificaciones respetadas.
- Perfil y registro distinguen congregación de domicilio y de pertenencia ministerial. El inicio recuerda completar esa preferencia sin impedir el acceso a personas que no sirven.
- Directorio de ministerios con filtro/etiqueta de sede, administración de equipos/responsables y ubicación del templo; instrumentos/asignaciones de invitados por servicio y lector musical aprobado de solo lectura oficial para invitados.
- No modifica diseños aprobados de Biblia, planes, editor pastoral o música. Los nuevos desplegables comienzan cerrados.

## Evidencia y límites

- PostgreSQL local aislado con usuarios ficticios: 20 pruebas pasan, incluidas RLS/RPC, permisos revocados, publicación atómica, destinatarios, privados, bajas push, lectura de paquetes sin notas privadas, invitados, GPS distinto, historia limitada y reversión sin borrados. No certifica una sesión real remota ni recepción push en teléfonos.
- Navegador Chromium aislado con componentes React reales y acciones simuladas: administrador, pastor local y líder, cada uno a 320/390/820 px; 9 recorridos correctos. Grupos, recuperación tras error de guardado, controles GPS, campos y ausencia de desborde. No es prueba autenticada de Preview.
- Compilación final Next16 correcta (build de producción local), TypeScript sin errores y 76 regresiones de las áreas afectadas pasan. Los tres fallos históricos del CI general no se han corregido ni se declara todo el CI en verde.
- PR321 OPEN DRAFT; rama agent/recuperar-fotos-20261124. HEAD remoto anterior 9b49a1d4b91f2f40b98bb3b59fc6938b7dbb7ab2. Main comprobado bd7aa236143eb829c0fcbe263099431c19033cfd. El alias fijo sigue apuntando al paquete base, no a este trabajo local; no se ha creado un Preview integral que dependa de SQL inexistente.

## Siguiente paso autorizado / bloqueado

Terminar verificaciones independientes, presentar este paquete y pedir autorización específica exigida por __VIDA_INTERNACIONAL.md, regla estricta13. Controles previos: Guardrails validó los67 archivos del commit local; lint de todos los archivos TypeScript/TSX nuevos sin errores. Las advertencias heredadas de archivos existentes se conservan. No confundir la compilación local con un deployment.

Después de aprobación: aplicar solo a ccvida, consultar la versión real de migración y versionarla, comprobar esquema/grants/asesores sin suplantar usuarios, publicar un único Preview integral en el alias habitual. No ejecutar escrituras con cuentas reales para simular una revisión.

Para revisar después: elegir congregación y sedes visibles; clasificar equipos/pastores reales; comprobar destinatarios públicos/privados con dos cuentas; invitar músico a un servicio; probar mensajes/reenvío y GPS del templo si se usa. Producción requiere autorización nueva. Bloque4/FASEI no se cierran.

Huella SHA256 del SQL exacto preparado: `d769580f52d5809b7408a76aa402b1d831a00ec2dd0364e55adae5a14e833015`.
