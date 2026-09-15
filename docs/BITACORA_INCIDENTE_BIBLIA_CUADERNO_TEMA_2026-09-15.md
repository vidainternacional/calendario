# Bitácora de incidente — Biblia / Cuaderno / tema de lectura

Fecha: 2026-09-15
Estado final: **APROBADO POR EL USUARIO Y AUTORIZADO PARA PRODUCCIÓN**
Módulos afectados: Biblia, navegación inferior y Cuaderno.

## Qué ocurrió

Durante cambios posteriores realizados fuera del checkpoint previamente aprobado se introdujo una regresión en una funcionalidad cerrada: el tema visual de Biblia comenzó a afectar al Cuaderno y la navegación inferior dejó de sincronizarse correctamente con el cambio Claro / Sepia / Oscuro.

Los síntomas confirmados fueron:

- Cuaderno heredaba el tema de Biblia, aunque debía permanecer independiente.
- Al entrar a Cuaderno, la navegación inferior podía conservar el tema oscuro heredado.
- En Biblia, el contenido cambiaba de tema pero la navegación inferior podía quedarse con el tema anterior hasta salir de la página y volver a entrar.
- Se intentaron correcciones localizadas, pero el usuario indicó correctamente que no debía seguirse acumulando parches sobre una función que ya había estado validada históricamente.

## Recuperación realizada

1. **Retorno al checkpoint de producción aprobado**
   - Se restauró `main` al árbol aprobado anterior mediante `ba4d518e6f806fadbffcbbf36f7c22e3eb7a77c6`, basado en el checkpoint `fce0d37cb5c6215807112742b67999cb7eab3cfb`.
   - Los commits posteriores que habían introducido regresiones quedaron fuera de producción y preservados para referencia, no borrados.

2. **Aislamiento de Cuaderno**
   - `0d77c5b34ab8f7b93bd822ced25341a5fdc407f0` separó el tema de Cuaderno del tema de Biblia.
   - Se verificó que Cuaderno permaneciera visualmente independiente aunque Biblia estuviera en Claro, Sepia u Oscuro.

3. **Intento de sincronización visual**
   - `5cacf111b3b5440eb67b1d50b60420ceab56291b` intentó hacer atómico el cambio visual de Biblia.
   - No fue considerado cierre porque la navegación inferior todavía podía quedarse atrás.

4. **Recuperación de la implementación histórica validada**
   - En lugar de seguir agregando capas, se buscó el comportamiento histórico que ya había funcionado.
   - Se recuperó como referencia el checkpoint `22e7c3af45df1050b3778821c96d59a7b581b4cc`, documentado como sincronización estable de temas, y el antecedente `c581745842ff01b334c925ff5c7449596a3b4b90`, específico para adaptar la navegación inferior al tema bíblico.
   - `ffdb7eef0d46f988c85c8aaaea38320af1defb66` restauró el controlador de tema bíblico validado.

5. **Causa residual identificada**
   - Biblia ya cambiaba correctamente, pero la navegación inferior no recibía inmediatamente la señal de cambio.
   - La implementación histórica utilizaba el evento `vida-biblia-theme` para comunicar el tema al layout/navegación compartida.

6. **Corrección final**
   - `8b970942a1d2aadee34457768461f75e250ef6aa` restauró únicamente esa señal histórica entre Biblia y navegación inferior.
   - No se modificó Cuaderno, Supabase, RLS, permisos, datos ni lógica funcional ajena.

## Comportamiento final aprobado

- **Biblia** controla Claro / Sepia / Oscuro para toda su superficie, incluida la navegación inferior.
- El cambio visual de Biblia y navegación inferior se refleja sin tener que salir y volver a entrar.
- **Cuaderno es independiente**: no hereda el tema visual de Biblia.
- Salir de Cuaderno y regresar a Biblia conserva el tema bíblico seleccionado.
- El usuario validó manualmente este comportamiento y lo aprobó el 2026-09-15.

## Regla de prevención para futuros cambios

Este incidente deja las siguientes reglas obligatorias para Biblia, Cuaderno y cualquier módulo cerrado:

1. **No reimplementar ni sustituir un comportamiento aprobado sin comparar primero con el último commit/deploy históricamente validado.**
2. Si una regresión aparece en una función que antes estaba aprobada, **priorizar restaurar la implementación conocida como estable antes de crear un parche nuevo**.
3. **No acumular parches** sobre tema, layout o navegación compartida. Si existe interferencia, identificar la fuente real y consolidar únicamente lo necesario.
4. El tema de Biblia debe permanecer **limitado a la ruta/superficie de Biblia**; Cuaderno no debe leer ni heredar ese estado visual.
5. La navegación inferior es un componente compartido del layout. Cualquier adaptación visual de Biblia debe usar una conexión explícita y reversible, actualmente `vida-biblia-theme`, y limpiar/restablecer el estado al salir de Biblia.
6. Toda modificación futura relacionada con tema debe probar como mínimo esta secuencia antes de marcarse corregida:
   - Biblia Claro → Sepia → Oscuro sin salir de la página.
   - Confirmar que la navegación inferior cambia al mismo tiempo.
   - Entrar a Cuaderno y confirmar que permanece independiente.
   - Regresar a Biblia y confirmar que conserva su tema.
7. **Compilar no equivale a validar.** Un cambio de este tipo solo puede cerrarse después de validación visual real del usuario.
8. No tocar estilos globales, Cuaderno, navegación compartida o módulos cerrados como efecto colateral de una corrección visual en Biblia.

## Resultado

Incidente **CERRADO Y APROBADO**. La solución final autorizada para producción corresponde al comportamiento validado en `8b970942a1d2aadee34457768461f75e250ef6aa`, acompañado por esta bitácora para evitar repetir la regresión en trabajos futuros.
