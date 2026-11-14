# VIDA — Rescate sin costo: checkpoint de migración bíblica
Fecha: 2026-11-14
Rama independiente: agent/migracion-biblia-neon-20261114
Objetivo actual: restaurar acceso a la app sin contratar plan, manteniendo Supabase Auth/usuarios y contenido bíblico compartido en dos Neon Free.

## Estado confirmado (consulta directa)
- Supabase calendariovida (atjtjpchslxbseayzflz): biblical_word_occurrences 611398 filas y biblioteca bíblica todavía intacta; base ~1277668499 bytes. Restricción reportada exceed_db_size_quota; despliegue Vercel READY no significa inicio de sesión funcional.
- Neon A rough-glitter-04635242: 59459 ocurrencias del Antiguo Testamento.
- Neon B curly-scene-97670657: 19658 ocurrencias del Nuevo Testamento y 9133 del Antiguo Testamento.
- Total contabilizado entre destinos: 88250 filas; NO equivale a 88250 claves únicas verificadas contra origen.
- Ambos Neon cuentan además con 16 fuentes, 66 libros y 16946 entradas léxicas ya copiadas (validadas por conteo previamente).
- Detectada inconsistencia de distribución: Neon B contiene registros del Antiguo Testamento. Se ha pausado la copia masiva hasta estabilizar criterio y verificar duplicados. No borrar datos de ninguno.
- La integración de lectura con Neon, la validación completa, el cambio a Vercel y la liberación de espacio en Supabase siguen pendientes.

## Forma de trabajo acordada — fases cortas
1. **Checkpoint y estrategia**: auditar ubicación de lo ya copiado, fijar distribución por capacidad y asegurar lotes reanudables. Este documento es el checkpoint inicial; continuar solo cuando se pueda verificar sin mezclar destinos.
2. **Copia controlada**: un lote finito por intervención, registrar cursor y cantidad de registros originales/recibidos y hashes si posible. No confiar solo en el mayor UUID global cuando hay destinos con escrituras parciales; evitar traslado de información personal.
3. **Completar corpus**: textos, variantes, glosarios, concordancias, contexto, cronología y geografía, aplicando esquema compatible, índices y relaciones; comprobar límites gratuitos de ambos proyectos.
4. **Lectura segura**: backend server-only a Neon; mantener Supabase para Auth, perfiles, ministerios, notas personales y progreso bíblico; Preview único + CI/regresión.
5. **Recuperar cuota**: solo después de copia íntegra, pruebas y respaldo verificable, presentar listado de objetos a eliminar, impacto y reversión y pedir aprobación explícita. No eliminar ni modificar RLS sin autorización.

## Guardrails
No gastos, no merge a main, no producción, no borrados, no alteración de permisos ni datos sensibles sin autorización. Conservar los PR pendientes. El objetivo de acceso no está resuelto hasta comprobar login en vivo.
