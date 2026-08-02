# FASE D · Bloque 4 — Visualización textual del Nuevo Testamento

Fecha: 2026-08-02

## Objetivo

Publicar la evidencia textual aprobada del Nuevo Testamento dentro de las herramientas existentes, sin crear una sección paralela y sin conectar estos datos a proveedores de IA.

## Rutas integradas

- **Biblia → Estudio**: utiliza el versículo y la traducción seleccionados en la Biblia general.
- **Estudio Profundo**: utiliza R09 (`spa_r09`) como perfil predeterminado cuando la consulta no procede directamente de la Biblia.

## Información visible

Para cada versículo cubierto se muestran:

- texto griego original;
- transliteración;
- secuencia literal de glosas editoriales;
- palabras expandibles;
- lema y transliteración del lema;
- número Strong;
- morfología y código morfológico;
- lecturas adicionales y variantes documentadas;
- edición base;
- aviso cuando una referencia requiere una edición de respaldo porque NA28 no contiene ese texto;
- fuente, atribución, licencia y versión del paquete.

## Versificación

La recuperación utiliza el identificador de la traducción activa. El perfil R09 resuelve explícitamente:

- 2 Corintios 13:14 desde TAGNT 13:13;
- 3 Juan 1:14 desde TAGNT 1:14 y 1:15;
- Apocalipsis 13:1 desde TAGNT 12:18 y 13:1.

Cuando no existe una correspondencia especial, la recuperación permanece directa.

## Estados de interfaz

- carga;
- evidencia disponible;
- versículo no seleccionado;
- capa textual todavía no disponible para el Antiguo Testamento;
- presentación adaptada a temas claro, oscuro y sepia.

El contexto histórico y las demás herramientas de Estudio permanecen disponibles aunque no exista todavía una capa textual para una referencia.

## Seguridad y procedencia

- recuperación exclusivamente mediante acciones y módulos de servidor;
- sesión autenticada requerida;
- RLS activo;
- únicamente filas habilitadas y aprobadas;
- `anon` sin acceso;
- clientes sin permisos de escritura;
- sin consulta a proveedores de IA;
- fuente TAGNT de STEPBible fijada a commit y hashes verificados.

## Implementación

Archivos principales:

- `app/actions/evidencia-textual.ts`;
- `components/biblia/BibleTextualStudyPanel.tsx`;
- `components/estudios/TextualEvidencePanel.tsx`;
- `lib/estudios/resolved-biblical-textual-study.ts`;
- integración en `components/biblia/BibliaClient.tsx`;
- integración en `components/estudios/EstudioProfundoClient.tsx`.

PR: `#58`.

Commit de integración: `8286d80495defd21e01c0c27854253bd93d143a2`.

## Validación previa a producción

- parche de integración aplicado correctamente;
- TypeScript `tsc --noEmit`: aprobado;
- preview de Vercel: `dpl_4yJHqNwqRfx1nMtPfqevHL1TT5E4` — `READY`;
- archivos temporales de parche y validación retirados antes de fusionar.

El Bloque 4 permanece activo. La siguiente ampliación autorizada es el corpus textual hebreo y arameo del Antiguo Testamento; no se avanza al Bloque 5.