"""Exporta solamente ocurrencias editoriales ya certificadas, sin escribir en las bases."""
import gzip
import hashlib
import json
import sys
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen

private, manifest_path, output = map(Path, sys.argv[1:4])
manifest = json.loads(manifest_path.read_text())['books']
expected = {b['book']: b for b in manifest}
digests = {book: hashlib.md5() for book in expected}
counts = {book: 0 for book in expected}

with output.open('wb') as raw_file, gzip.GzipFile(fileobj=raw_file, mode='wb', mtime=0) as archive:
    total = 0
    for destination, filename in [('A', 'neon-uri'), ('B', 'neon-b-uri')]:
        uri = (private / filename).read_text().strip()
        books = [b['book'] for b in manifest if b['destination'] == destination]
        cursor = '00000000-0000-0000-0000-000000000000'
        while True:
            placeholders = ','.join('$' + str(i + 2) for i in range(len(books)))
            sql = 'SELECT id,to_jsonb(t)::text FROM public.biblical_word_occurrences t WHERE id>$1::uuid AND book_code IN (' + placeholders + ') ORDER BY id LIMIT 1000'
            request = Request('https://' + urlparse(uri).hostname + '/sql',
                              data=json.dumps({'queries': [{'query': sql, 'params': [cursor] + books}]}).encode(),
                              headers={'Content-Type': 'application/json', 'Neon-Connection-String': uri,
                                       'Neon-Array-Mode': 'true', 'Neon-Raw-Text-Output': 'true',
                                       'Neon-Batch-Read-Only': 'true'})
            with urlopen(request, timeout=60) as response:
                rows = json.loads(response.read())['results'][0]['rows']
            if not rows:
                break
            for row_id, row_json in rows:
                obj = json.loads(row_json)
                book = obj['book_code']
                if obj['approved_by'] is not None or expected[book]['destination'] != destination:
                    raise RuntimeError('Fila fuera del corpus editorial autorizado')
                digests[book].update(hashlib.md5(row_json.encode()).hexdigest().encode())
                counts[book] += 1
                archive.write(row_json.encode() + b'\n')
            cursor = rows[-1][0]
            total += len(rows)
            if total % 25000 == 0:
                print(json.dumps({'exported': total}), flush=True)
    for book, certificate in expected.items():
        if counts[book] != certificate['n'] or digests[book].hexdigest() != certificate['hash']:
            raise RuntimeError('Respaldo discrepante: ' + book)
sha256 = hashlib.file_digest(output.open('rb'), 'sha256').hexdigest()
report = {'file': output.name, 'rows': total, 'books': len(expected), 'bytes': output.stat().st_size,
          'sha256': sha256, 'all_book_hashes_verified': True}
output.with_suffix(output.suffix + '.manifest.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report), flush=True)
