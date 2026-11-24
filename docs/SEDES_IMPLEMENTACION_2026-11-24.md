# Sedes reales — base autorizada y aplicada

24-11-2026. Solicitud: «termina todo para que sea funcional». El paquete base presentado fue autorizado expresamente con «Ok hazlo» y aplicado a ccvida. No equivale a autorización de producción ni de cambiar permisos históricos.

## Estado comprobado

- Main consultado directamente: bd7aa236143eb829c0fcbe263099431c19033cfd. PR321 OPEN/DRAFT, HEAD previo43e9eff9568111f676f9e890859d560eececc180. Maestro leído, intacto; Bloque4/FASEI no se cierran.
- ccvida lnkrojvyiwnlcoponxud: catálogo real y tablas de selección creadas por migración20261124221418 sedes_base_perfil_20261124. Selectores conectados al servidor en la rama; recibo final del Preview en PR321. No se convierten automáticamente las preferencias locales de prueba en datos reales.
- `publicaciones.leer_publicaciones` y `eventos.leer_eventos` permiten lectura general de cuentas activas. El rol pastor conserva atribuciones históricas generales. Un filtro de interfaz no basta para garantizar privacidad entre sedes.
- Devocionales tienen audiencias existentes por iglesia/roles/ministerios, y paquetes tienen distribución propia. Deben integrarse preservando estas opciones y cotejando el acceso por URL/API además de Inicio y push.
- Lectura de metadata ccvida 24-11-2026 19:56UTC:230 políticas públicas, huella cc79aafabe8b9a43c5dd60fc37b97aa7; cero tablas del paquete. Recalcular antes de aplicar y comparar únicamente políticas existentes tras el cambio.
- No se han creado ministerios de Chalchuapa ni reasignado los actuales. No deducir una sede por nombre, domicilio o por elegir qué publicaciones ver.

## Paquete exacto aplicado tras aprobación

SQL: [base](sql/sedes-base.sql). Reversión: [deshabilitar escrituras](sql/sedes-base-reversion.sql).

Cinco tablas nuevas:

| Tabla | Uso y permisos |
|---|---|
| vida_sedes | Catálogo; cuentas activas leen sedes activas. Administración/pastor general activo crea o actualiza. Sin borrado desde cliente. |
| vida_sede_preferencias | Marca si la persona ya eligió congregación, incluida la opción ninguna. Solo su dueño activo lee/inserta/actualiza. |
| vida_sede_selecciones | Relaciones por usuario/sede; pertenencia declarada y visibilidad independientes. Solo dueño activo, sin poderes ministeriales. |
| vida_ministerio_sedes | Relación de ministerio existente con sede; lectura de cuentas activas, escritura de administración/pastor general activo. Inicialmente vacía. |
| vida_sede_responsables | Responsabilidades locales explícitas; lectura del interesado o gestor global y escritura del gestor global. Inicialmente vacía. Todavía no sustituye permisos históricos. |

Semillas: únicamente VIDA Santa Ana central y VIDA Chalchuapa, El Salvador, zona America/El_Salvador. No se crea Guatemala automáticamente; el catálogo admite futuras sedes.

RLS en las cinco tablas; anon sin grants; no hay DELETE cliente. Tres funciones nuevas, SECURITY INVOKER, search_path vacío y objetos calificados. `vida_guardar_mis_sedes` toma dueño de auth.uid, valida cuenta activa/sedes, serializa por dueño y guarda en una transacción. No acepta profile_id del cliente. Cambiar congregación no pisa sedes visibles ni viceversa. Vacío significa no pertenezco, solo para congregación; visibles requiere al menos una sede. Administración no puede modificar desde esta RPC la preferencia privada de otra persona.

Servidor en app/actions/sedes.ts: obtener selección propia, guardarla y crear sede con sesión/perfil activo + RLS y dueño esperado para impedir escrituras de una pantalla vieja tras cambio de cuenta. Sin service role. Los selectores aprobados usan estas acciones; no se muestra éxito si falla el servidor. Ambos accesos del Perfil comparten estado por UUID; círculo conserva independencia de pertenencia y avisa que publicaciones aún no están segmentadas. Catálogo real administrativo, formulario de creación cerrado inicialmente.

Impacto del primer paquete: agrega estructuras e índices pequeños y dos filas de catálogo. No UPDATE/DELETE a profiles, ministerios, miembros, publicaciones, eventos, notas ni progreso. No altera políticas/roles/grants de tablas existentes; no asigna personas, ministerios o pastores automáticamente. No agrega envíos, crons, pagos o R2.

Reversión del primer paquete: volver al código previo y revocar ejecución/escrituras nuevas, conservando tablas y datos para no perder selecciones. SQL de reversión preparado y probado. No borra ni reconstruye tablas existentes. Para reactivar después, restaurar exclusivamente los grants nuevos revisados del paquete base.

## Secuencia para completar la solicitud

1. **Aplicado y verificado en ccvida.** Cero tablas nuevas en preflight, cinco con RLS después. Las230políticas anteriores mantienen huella cc79aafabe8b9a43c5dd60fc37b97aa7. Semillas correctas,3funciones invoker sin acceso anon y ningún usuario/equipo asignado. Origen antiguo intacto.
2. Perfil/ficha e Inicio conectados a la misma selección persistente, manteniendo UI aprobada. La elección durante registro/onboarding aún debe integrarse. Si falla guardado, mostrar error y conservar valor confirmado. No convertir datos locales de revisión sin elección explícita. Catálogo administrable con futuras sedes.
3. Conciliar ministerios actuales y responsables con selección administrativa explícita; no inferir equipos o pastores de Chalchuapa. Mantener acceso existente mientras no esté conciliado. Personas pueden pertenecer a ninguna/una/varias congregaciones y solicitar ministerios de cualquiera; liderazgo existente aprueba.
4. Preparar y presentar el segundo cambio sensible: fronteras de lectura/escritura ministerial y eventos, destinatarios de publicaciones/devocionales/paquetes y funciones que hoy usan service role o rol global. El SQL y reversión deberán corresponder al diff final; no se considera autorizado de manera implícita por aprobar las cinco tablas base. No habilitar contenido privado nuevo por sede hasta comprobar estas fronteras.
5. Integrar selector común de audiencia: sedes + opciones actuales de roles, líderes, ministerios y personas, grupos guardados por remitente. Resolver/deduplicar en servidor dentro del alcance permitido. Guardado/publicación y audiencia atómicos; no publicar primero un mensaje general y después añadir restricción. Revalidar permisos al reenviar/grupo dinámico. Preferencias push respetadas; visibilidad y push se comprueban por separado.
6. Eventos entre sedes: invitados autorizados para ese evento/repertorio, sin acceso a conversaciones o programación de todo otro ministerio. No conceder membresía por cambiar filtro de Inicio. Verificar invitados en cada API y en funciones de servidor.
7. Un único Preview final en el alias aprobado, pruebas técnicas y de privacidad por rol con datos ficticios aislados. No enviar anuncios de prueba a usuarios reales. Publicar solo tras nueva aprobación expresa.

La solicitud completa NO está terminada al aprobar/aplicar esta base. Las fases siguientes siguen dentro del trabajo solicitado, con el segundo punto de autorización necesario antes de cambiar permisos históricos.

## Verificación de este paquete

- SQL ejecutado en PostgreSQL local embebido PGlite, sin credenciales ni datos reales: 10 escenarios/11 pruebas contando el padre. Catálogo, separación pertenencia/vistas, RLS entre cuentas, ambas/ninguna, rechazo sin escrituras parciales, cuenta inactiva, imposibilidad de autoasignación, gestión global, bloqueo anon y reversión sin borrado.
- Dos pruebas de dominio: selección válida/deduplicación y distinción pastor local/global/cuenta inactiva.
- TypeScript, ESLint específicos, compilación Next16.2.10 y diff correctos. Guardrails verificó los9 archivos dentro del alcance. Total13 pruebas pasan al ejecutar con permisos de subprocesos disponibles.
- Base comprobada directamente en ccvida mediante metadata y agregados; guardado autenticado con persona real pendiente. Sin modificación de producción.10regresiones actuales+11SQL; navegador aislado320/390/820 con backend simulado. No declarar sedes completas ni prueba visual autenticada de toda la app.
- CLI no pudo generar archivo por configuración de solo lectura. Se aplicó con el conector autorizado y se versionó la migración usando el número exacto de su historial remoto20261124221418, sin inventar timestamp ni cambiar dependencias. Fuente canónica:supabase/migrations/20261124221418_sedes_base_perfil_20261124.sql; docs/sql conserva copia revisable. Asesores sin hallazgos relativos a las tablas/funciones nuevas; advertencias heredadas fuera de este paquete.
