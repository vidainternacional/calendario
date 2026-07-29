# FASE C — Sistema visual y editorial del Centro Pastoral

Estado: IMPLEMENTADO — PENDIENTE DE VALIDACIÓN VISUAL EN PRODUCCIÓN

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

## Hallazgo transversal diferido

La aplicación carga Inter desde `next/font`, pero la configuración global de Tailwind todavía referencia variables Geist y `body` fuerza Arial. Corregirlo globalmente modificaría toda la aplicación y queda reservado para la fase de Optimización General.

La futura normalización global deberá:

1. definir una sola familia tipográfica base;
2. crear tokens compartidos para títulos, subtítulos, etiquetas, cuerpo y texto auxiliar;
3. auditar alineación según el tipo de componente;
4. reducir textos redundantes sin perder significado;
5. verificar impacto visual ruta por ruta antes del despliegue.

## Evidencia técnica

- Rama: `fase-c/coherencia-visual-pastoral`.
- Preview final: `dpl_4kJqiuTri1PWGA4ye3Y25vveXiVc` — `READY`.
- Compilación de Next.js: correcta.
- TypeScript: correcto.
- Generación: 32 de 32 rutas.

La Fase C permanece activa hasta la validación visual del recorrido pastoral en móvil y escritorio.
