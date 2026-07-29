# FASE C — Sistema visual y editorial del Centro Pastoral

Estado: BASE ACEPTADA — AUDITORÍA FINA DIFERIDA AL CIERRE GLOBAL DE LA APP

## Alcance de esta fase

El Centro Pastoral debe sentirse como una sola experiencia de trabajo, con una jerarquía consistente y textos que ocupen únicamente el espacio necesario.

### Norma aplicada

- Fuente efectiva: Inter, limitada a las rutas `/pastoral`.
- Etiqueta contextual: 11 px, peso destacado y espaciado moderado.
- Título principal: escala fluida de 24 a 32 px, peso 750 y línea compacta.
- Descripción principal: 14 px, línea 1.55 y ancho máximo de lectura.
- Contenido operativo: alineado a la izquierda junto con iconos, campos y acciones.
- Estados vacíos y confirmaciones: centrados, con párrafos de ancho limitado.
- Ayuda extensa: plegable mediante `details`, no visible permanentemente.
- Tarjetas: descripciones limitadas a dos o tres líneas según el contexto.
- Formularios: etiquetas cortas, una instrucción por bloque y textos opcionales secundarios.

## Componentes reutilizables

- `components/pastoral/PastoralPageHeader.tsx`
- `app/(app)/pastoral/pastoral-visual-system.css`
- `app/(app)/pastoral/layout.tsx`

## Rutas normalizadas

- Centro Pastoral.
- Bosquejos.
- Colecciones de versículos.
- Biblioteca.
- Paquetes.
- Materiales de estudio.

También se compactaron estados vacíos, modales, formularios y tarjetas de Bosquejos, Colecciones, Biblioteca y Paquetes.

## Decisión de producto — 2026-07-29

La base visual aplicada se considera suficiente para continuar el desarrollo funcional de la aplicación.

La revisión detallada de textos, alineaciones, tamaños, espacios y tipografías no seguirá consumiendo tiempo dentro de la FASE C. Se realizará como una auditoría integral cuando estén terminadas las demás funciones de la app, ya sea directamente por el responsable del proyecto o mediante una herramienta especializada como Comet.

Hasta esa auditoría final:

- se conserva lo ya implementado en el Centro Pastoral;
- solo se corregirá un texto o estilo si provoca un error funcional, de accesibilidad o de comprensión grave;
- no se ampliará esta normalización a otras rutas durante la FASE C;
- la revisión editorial y gráfica fina no será un requisito para cerrar esta fase.

## Hallazgo transversal diferido

La aplicación carga Inter desde `next/font`, pero la configuración global de Tailwind todavía referencia variables Geist y `body` fuerza Arial. Corregirlo globalmente modificaría toda la aplicación y queda reservado para la fase de Optimización General o para la auditoría integral final.

La futura normalización global deberá:

1. definir una sola familia tipográfica base;
2. crear tokens compartidos para títulos, subtítulos, etiquetas, cuerpo y texto auxiliar;
3. auditar alineación según el tipo de componente;
4. reducir textos redundantes sin perder significado;
5. verificar impacto visual ruta por ruta antes del despliegue.

## Evidencia técnica

- Rama original: `fase-c/coherencia-visual-pastoral`.
- Integración en `main`: `9784b641af0a0e8fc46c0eac1f738bb6bfa421fa`.
- Producción: `dpl_EWmZpUG1PBw55cj5EaXexNzED9x1` — `READY`.
- Compilación de Next.js: correcta.
- TypeScript: correcto.
- Generación: 32 de 32 rutas.
- Aceptación provisional del usuario: 2026-07-29.

La Fase C continúa únicamente con sus comprobaciones funcionales y documentales pendientes.