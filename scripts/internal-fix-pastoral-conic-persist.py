from pathlib import Path
p=Path('components/pastoral/pastoral-canvas-model.ts')
s=p.read_text()
old="if (/^(?:linear-gradient|radial-gradient|repeating-linear-gradient)\\(.+\\)$/i.test(fondo)) return fondo"
new="if (/^(?:linear-gradient|radial-gradient|conic-gradient|repeating-linear-gradient)\\(.+\\)$/i.test(fondo)) return fondo"
if old not in s: raise SystemExit('gradient sanitizer anchor missing')
p.write_text(s.replace(old,new,1))
print('patched conic gradient persistence')
