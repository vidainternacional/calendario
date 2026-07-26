# Constitución del Proyecto Vida Internacional

Estado: VIGENTE

## Propósito

Este documento define las reglas permanentes que gobiernan el desarrollo del producto. Toda fase, experimento, corrección o refactorización debe respetarlas.

## Principios obligatorios

1. Las personas tienen prioridad sobre los procesos y la tecnología.
2. La experiencia de usuario tiene prioridad sobre agregar funciones.
3. Mobile First es obligatorio.
4. Ningún módulo debe sentirse como una aplicación diferente.
5. Todo cambio importante debe ser reversible.
6. Ninguna mejora visual puede romper funcionalidades existentes.
7. Las funciones estables no se modifican directamente.
8. Los experimentos se ejecutan primero en laboratorio.
9. Ninguna fase se cierra sin evidencia técnica, visual y documental.
10. Las decisiones aprobadas por el propietario del producto prevalecen hasta que se revoquen explícitamente.

## Flujo obligatorio de cambios importantes

Baseline → Laboratorio → Validación → Producción

## Criterio de cierre de fase

Una fase solo puede declararse completada cuando exista:

- implementación terminada;
- validación funcional;
- validación responsive;
- revisión de regresiones;
- documentación actualizada;
- commits descriptivos;
- actualización del documento maestro;
- aprobación cuando corresponda.

## Prioridad documental al iniciar una sesión

1. `VIDA_INTERNACIONAL.md`
2. Documento de la fase activa
3. `docs/MEMORIA_TECNICA_Y_VISUAL.md`
4. `docs/PROTOCOLO_CAMBIOS_SEGUROS.md`
5. `docs/gobernanza/DECISIONES_APROBADAS.md`
6. `docs/gobernanza/NO_ROMPER_ESTO.md`

## Regla de interpretación

Si existe conflicto entre una propuesta nueva y una decisión aprobada o un componente protegido, se conserva lo estable y se plantea el cambio únicamente como experimento reversible.