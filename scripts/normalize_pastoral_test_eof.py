from pathlib import Path
import sys

root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('.')
for path in (root / 'tests/regression').glob('*.test.mjs'):
    text = path.read_text(encoding='utf-8')
    normalized = text.rstrip() + '\n'
    if normalized != text:
        path.write_text(normalized, encoding='utf-8')
