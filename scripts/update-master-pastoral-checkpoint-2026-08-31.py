from pathlib import Path

path = Path('__VIDA_INTERNACIONAL.md')
s = path.read_text()
s = s.replace('Última actualización: 2026-08-26', 'Última actualización: 2026-08-31', 1)
section = '''## Centro Pastoral — Editor visual · checkpoint aprobado — 2026-08-31

1. Fondos conserva la galería general aprobada y amplía personalización mediante Rueda de color con tono, saturación, luminosidad y texturas seleccionables.
2. Las texturas personalizadas se muestran como muestras circulares dentro de Rueda de color.
3. Se incorpora Degradados junto a Rueda de color e Imágenes, con creación de degradados lineales, radiales y cónicos, dirección configurable, segundo color y opción para guardar el resultado en la galería general.
4. Las imágenes conservan conversión Imagen ↔ Fondo sin duplicar la misma instancia cuando corresponde.
5. Capas abre directamente sin subpestaña redundante y concentra Nueva capa, Opacidad y Fusión en una sola fila horizontal compacta.
6. Las miniaturas de Capas muestran el contenido real de cada capa y el swipe izquierdo conserva acciones contextuales.
7. Los fondos desbloqueados pueden moverse y escalarse mediante gestos igual que las imágenes.
8. Los textos y versículos insertados en el lienzo permanecen editables directamente mediante cursor, selección y borrado de contenido parcial.
9. Biblia conserva español y texto original; AT usa hebreo y NT griego. En hebreo se mantiene jerarquía propia del libro y exploración puntual de palabras.
10. La exploración léxica prioriza datos bíblicos existentes de VIDA; cuando una explicación no está disponible, la IA integrada puede actuar como respaldo claramente identificado como explicación IA.
11. Se preservan Deshacer/Rehacer, guardado, navegación, Biblia, imágenes, capas, Presentar y Congregación sin cambios de permisos ni Supabase/RLS.
12. Checkpoint técnico aprobado del bloque: `67153b157c01c4043395a907719d82d967268b6a`; PR #287 permanece OPEN · DRAFT · sin merge.

'''
anchor = '# Siguiente punto autorizado\n'
assert anchor in s
assert '## Centro Pastoral — Editor visual · checkpoint aprobado — 2026-08-31' not in s
s = s.replace(anchor, section + anchor, 1)
path.write_text(s)
