# Biblioteca y hoja musical para uso en vivo · 2026-11-18

## Datos reales ya guardados

La carga mediante sesión real de administración incorporó 50 canciones nuevas en ccvida: **73 activas en total**. Cotejo 50/50 por UUID, título, artista, tono, MD5 de acordes/notas, enlaces certificados y estado. Las 23 anteriores conservaron todos los campos del snapshot previo. Comprobación posterior del 18-11 mantiene 73 activas. Estos datos son compartidos por producción; no confundir con publicar el código del editor.

Candidatas y pendientes: 87 identificadas, 70 referencias admitidas en el último build, 12 enlaces no admitidos, cinco identificadas sin video y 146 entradas/variantes pendientes de identidad/datos. Las letras siguen pendientes de aportación/licencia autorizada; no se copiaron letras completas. No declarar terminado el catálogo.

## Cambios solicitados en la ficha

El usuario confirmó carga y pidió ficha centrada, información general arriba, área amplia debajo para acordes/letra, transposición junto al cifrado, vista grande para tocar y control del orden.

- Biblioteca y Setlist usan contenedor interior centrado hasta 56rem, con márgenes móviles. Se evita el selector ministerial que anulaba padding/ancho y la regla global de main que imponía max-width:100vw. No cambia CSS global ni otras pantallas.
- Nombre, artista/versión y tono en Información general. Hoja musical abajo con pestañas y campos amplios; transposición dentro de Acordes y estructura. Los campos ocultos permanecen montados: no se pierden letra, notas o enlaces al guardar.
- Ver en grande abre un portal de pantalla completa sobre el fondo de la app. En ficha permite editar el campo visible y transportar acordes; al cerrar conserva los cambios en el formulario original. Guarda tono/acordes con la cola serial anterior y el resto mediante Guardar. Escape, foco atrapado, restauración de foco/scroll y cierre explícito.
- En Setlist, vista grande de lectura con acordes/letra, tono, indicaciones, anterior/siguiente y posición. No escribe al transponer personalmente. Solo gestor autorizado puede guardar versión oficial. Cambiar de canción reinicia su formulario oficial y vuelve arriba de la hoja grande; no permite abrir/reordenar durante un guardado pendiente.
- Flechas Subir/Bajar en Programación y lista del Setlist solo para administración/líder con permisos existentes. Envía listado esperado y nuevo completos; falla sin reemplazarlo si otra persona ya cambió el orden. Los miembros conservan lectura/transposición personal, sin edición del orden oficial.

## Guardado del orden — autorizado y aplicado

Usuario respondió **«Autorizar guardado del orden»** a la propuesta que detallaba operación única, permisos previos, conservación de letras/acordes/notas/RLS y reversión.

Aplicada `orden_repertorio_atomico_20261118`, fuente `supabase/migrations/20261118130000_orden_repertorio_atomico.sql`. Función `vida_reordenar_repertorio` SECURITY INVOKER, con ejecución solo para service_role; anon/authenticated sin EXECUTE. La server action comprueba sesión, perfil activo, administración/liderazgo y pertenencia del evento antes de invocarla. No cambia RLS ni roles.

Bloquea filas, comprueba el orden esperado, exige la misma lista sin duplicados y actualiza únicamente orden dentro de una transacción. No cambia títulos, notas, tonos ni biblioteca. Consultas ordenan establemente por orden/created_at/id. Antes/después de crear la función: tres filas de repertorio, misma huella `2738e59fb437d0cadecbd3a62652dac7`. No se reordenó ningún servicio para probar ni se suplantaron sesiones.

Reversión: `drop function public.vida_reordenar_repertorio(uuid,uuid,uuid[],uuid[]);` y volver al código anterior de flechas. No borrar repertorio ni canciones. Retirar la función no altera el último orden elegido voluntariamente por el gestor.

## Verificación

34 pruebas pertinentes: catálogo/certificados, ficha, transposición, permisos y operación del orden, eventos ajenos, listas alteradas y concurrencia. TypeScript y lint de PantallaCancion/FichaCancionCampos correctos; build completo local. Persisten fallos generales heredados fuera de alcance; no afirmar CI global verde.

Chromium con datos/acciones simulados y CSS real, 390px y 1280px: ficha centrada (896px, márgenes simétricos), campos/FormData preservados, transposición +2, edición grande que retorna al formulario, Escape/restauración scroll, navegación de setlist y envío de una permutación completa. No equivale a prueba autenticada de edición/reordenamiento de un servicio real. No se crearon datos ficticios ni se enviaron avisos.

Rama/PR #316 `agent/catalogo-canciones-vida-20261117`. Un Preview de este bloque al concluir; entrada única `https://calendario-git-agent-avisos-devociona-15ceac-vida-internacional.vercel.app/inicio`. Recibo final de SHA/READY/alias y datos en PR sin despliegue documental adicional.

Pendientes: validación visual del usuario y aprobación de publicación del código. La solicitud de llevar canciones a producción está satisfecha en datos (73); no interpretar como aprobación visual de la ficha recién ajustada. Maestro intacto; no merge/producción de código sin autorización nueva.

## Ajuste posterior solicitado: aire lateral y cifrado del servicio

Márgenes internos del panel Biblioteca incluyen cabecera/icono/descripción y editor; Repertorio tiene ancho centrado y márgenes propios frente al CSS ministerial. En biblioteca, Letra/Cifrado comienzan cerrados y muestran estado abierto; Indicaciones permanece accesible, todos los campos montados y enlaces debajo. Lector con selección visible y aria-pressed.

Programación calcula cifrado desde el tono oficial hasta el tono elegido para el servicio; ±½ o edición del campo actualizan la lectura, Guardar persiste tono e indicaciones. Bandera `solo_servicio` en action existente conserva biblioteca; autorización de sesión/rol/evento no cambia. La consulta editorial incluye cifrado/letra para lectura sin depender de acceso al panel del líder. No se escribieron servicios reales como prueba ni se amplió RLS.

37 pruebas pertinentes pasan, incluyendo persistencia restringida del tono/indicaciones sin escribir biblioteca y rechazo de músicos. Chromium aislado comprueba formularios completos, acordeones, transposición y pantalla grande con datos simulados. Compilación final y recibo Preview exacto en PR #316. Pendiente validación visual autenticada; no producción autorizada para este bloque. Reversión de UI/action mediante revert de este cambio, sin revertir datos ni la función de orden previamente aprobada.
