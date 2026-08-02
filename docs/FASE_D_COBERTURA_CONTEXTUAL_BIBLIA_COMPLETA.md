# FASE D · Bloque 4 — Cobertura contextual completa de la Biblia

Fecha: 2026-08-02

## Resultado

Estudio Profundo dispone de contexto interno para los 66 libros y los 1,189 capítulos del canon protestante usado por la aplicación.

La cobertura no depende de una llamada a IA durante la consulta. El servidor reconoce una referencia y recupera:

- perfil general del libro;
- sección literaria que contiene el capítulo;
- resumen contextual;
- contexto histórico;
- contexto judío o del judaísmo pertinente;
- función literaria;
- intención comunicativa;
- reflexión teológica y espiritual;
- cautelas interpretativas;
- términos, pueblos y lugares;
- fuente editorial, versión, localizador y hash.

## Conteos finales

- libros aprobados: 66;
- libros con contexto: 66;
- perfiles activos: 66;
- secciones activas: 239;
- unidades contextuales activas: 305;
- capítulos indexados: 1,189;
- capítulos cubiertos: 1,189;
- capítulos sin cobertura: 0;
- hashes inválidos: 0;
- unidades sin declaración de asistencia editorial: 0;
- rangos exactos duplicados: 0;
- pares de secciones solapadas: 0.

## Integridad preventiva

La base incluye:

- índice único parcial que impide duplicados exactos activos;
- trigger `prevent_biblical_context_section_overlap` que rechaza nuevas secciones activas solapadas del mismo libro;
- prueba controlada que confirmó el rechazo de un solapamiento temporal;
- RLS y permisos de solo lectura para clientes autenticados activos;
- importador restringido al esquema `internal`.

## Transparencia

El corpus `vida-contexto-editorial` se identifica como:

- síntesis editorial asistida por IA;
- pendiente de revisión humana especializada;
- no fuente primaria;
- no sustituto de comentarios críticos, léxicos, manuscritos ni asesoría pastoral.

STEPBible, Pleiades y las demás fuentes externas conservan atribución, licencia y procedencia separadas.

## Criterios de seguridad interpretativa

El corpus incluye cautelas explícitas para evitar, entre otros usos:

- antisemitismo y teología de reemplazo;
- predicciones escatológicas sin evidencia;
- identificación de símbolos bíblicos con políticos, tecnologías o países actuales;
- manipulación financiera;
- justificación de esclavitud, abuso doméstico o control espiritual;
- culpabilización de personas con ansiedad, enfermedad, duelo o trauma;
- reemplazo de atención médica o psicológica por exhortaciones religiosas;
- acusaciones contra líderes sin evidencia y procesos justos.

## Alcance conseguido

Cualquier referencia válida de Génesis a Apocalipsis puede obtener un estudio contextual general y seccional desde la biblioteca interna.

Ejemplos para prueba:

- Génesis 1:1
- Éxodo 20:1
- Salmos 23:1
- Isaías 53:5
- Daniel 7:13
- Mateo 6:7
- Juan 3:16
- Romanos 8:28
- Gálatas 3:28
- Filipenses 4:13
- 1 Timoteo 2:12
- Hebreos 8:13
- Santiago 5:14
- 1 Pedro 3:7
- Apocalipsis 13:18
- Apocalipsis 21:1

## Límites pendientes

«Cobertura contextual completa» no significa que cada versículo posea todavía:

- texto original completo almacenado internamente;
- transliteración palabra por palabra;
- traducción literal editorial propia;
- morfología de cada ocurrencia;
- aparato de variantes manuscritas exhaustivo;
- revisión académica humana individual.

Esos componentes permanecen como siguiente trabajo del Bloque 4. Deben incorporarse desde fuentes compatibles y mostrarse solo cuando exista evidencia específica aprobada.