"""Escritor único de lotes editoriales; jamás conecta al origen Supabase.

Usa la API HTTPS transaccional de Neon y un bloqueo local exclusivo. Recibe una carpeta privada fuera del repositorio con
neon-uri e inbox/*.json: book, n, hash y rows (JSON canónico como texto).
Conserva el texto numérico original y comprueba cada lote dentro de su transacción.
"""
import hashlib
import json
import sys
import time
from pathlib import Path

import fcntl
from urllib.parse import urlparse
from urllib.request import Request, urlopen

root = Path(sys.argv[1])
uri = (root / 'neon-uri').read_text().strip()
lock_file = (root / 'writer.lock').open('w')
fcntl.flock(lock_file, fcntl.LOCK_EX | fcntl.LOCK_NB)

def execute(query, params=()):
    request = Request('https://' + urlparse(uri).hostname + '/sql',
                      data=json.dumps({'query': query, 'params': list(params)}).encode(),
                      headers={'Neon-Connection-String': uri, 'Content-Type': 'application/json',
                               'Neon-Raw-Text-Output': 'true', 'Neon-Array-Mode': 'true'})
    with urlopen(request, timeout=60) as response:
        result = json.loads(response.read())
    if 'rows' not in result:
        raise RuntimeError('Neon no devolvió filas de verificación.')
    return result['rows']

if __name__ == "__main__":
    expected = int(execute('SELECT count(*) FROM public.biblical_word_occurrences')[0][0])
    print(json.dumps({'ready': True, 'initial_count': expected}), flush=True)
    while not (root / 'STOP').exists():
        files = sorted((root / 'inbox').glob('*.json'))
        if not files:
            time.sleep(0.25)
            continue
        path = files[0]
        batch = json.loads(path.read_text())
        rows = batch['rows']
        objects = [json.loads(row) for row in rows]
        ids = [obj['id'] for obj in objects]
        if len(rows) != batch['n'] or len(set(ids)) != len(ids) or ids != sorted(ids):
            raise RuntimeError('Lote incompleto, duplicado o fuera de orden.')
        if any(obj['book_code'] != batch['book'] or obj['approved_by'] is not None for obj in objects):
            raise RuntimeError('Libro incorrecto o contiene identidad editorial personal.')
        fingerprint = hashlib.md5(''.join(hashlib.md5(row.encode()).hexdigest() for row in rows).encode()).hexdigest()
        if fingerprint != batch['hash']:
            raise RuntimeError('La huella de transporte difiere del origen.')
        payload = '[' + ','.join(rows) + ']'
        result = execute('''
                WITH gate AS MATERIALIZED (
                  SELECT pg_advisory_xact_lock(20261114,1),
                         1 / CASE WHEN (SELECT count(*) FROM public.biblical_word_occurrences)=$2::bigint
                                  THEN 1 ELSE 0 END AS ok
                ), incoming AS MATERIALIZED (
                  SELECT x.* FROM gate, jsonb_populate_recordset(NULL::public.biblical_word_occurrences, $1::jsonb) x
                  WHERE gate.ok=1
                ), existing AS MATERIALIZED (
                  SELECT t.* FROM public.biblical_word_occurrences t JOIN incoming i USING(id)
                ), inserted AS (
                  INSERT INTO public.biblical_word_occurrences SELECT * FROM incoming
                  ON CONFLICT(id) DO NOTHING RETURNING *
                ), verified AS (
                  SELECT count(*) AS n,md5(string_agg(md5(to_jsonb(t)::text),'' ORDER BY id)) AS hash
                  FROM (SELECT * FROM existing UNION ALL SELECT * FROM inserted) t
                )
                SELECT n,hash,(SELECT count(*) FROM inserted) /
                  CASE WHEN n=$3::bigint AND hash=$4 THEN 1 ELSE 0 END
                FROM verified
            ''', (payload, str(expected), str(batch['n']), batch['hash']))[0]
        result = (int(result[0]), result[1], int(result[2]))
        expected += result[2]
        report = {'book': batch['book'], 'n': result[0], 'hash': result[1],
                  'inserted': result[2], 'cursor': ids[-1], 'total': expected}
        report_path = root / 'results' / path.name
        report_path.write_text(json.dumps(report))
        with (root / 'ledger.jsonl').open('a') as ledger:
            ledger.write(json.dumps(report) + '\n')
        path.unlink()
        print(json.dumps(report), flush=True)
