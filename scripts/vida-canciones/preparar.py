"""Prepara candidatos revisables. Nunca escribe en bases de datos ni obtiene letras."""
import csv, json, re, sys, unicodedata, uuid
from pathlib import Path

MINISTERIO = '335daa03-4b5a-4ff5-8958-851de6b641ed'
KNOWN = ['Hillsong','Miel San Marcos','Marcos Witt','Marco Barrientos','Danilo Montero','Jaime Murrell','Juan Carlos Alvarado','Fernel Monroy','Jesús Adrián Romero','Marcos Brunet','Rojo','Emmanuel y Linda','Ingrid Rosario','Generación 12','Michael W Smith','Michael W. Smith','Aliento','Julio Melgar','Christine D Clario',"Christine D'Clario",'Un Corazón','New Wine','Barak','Gateway Worship','Evan Craft','Ricardo Rodríguez','Gadiel Espinosa','Yashira Guidini','Marcela Gándara','Esperanza de Vida','Gracia Soberana','Freddy Rodríguez','Marco Vidal','Averly Morillo','Montesanto','Coalo Zamorano','Josué del Cid','Toma Tu Lugar','René González','Luigi Castro','Bethel Music','Danny Berrios','La IBI','Sovereign Grace','BJ Putnam','Su Presencia','Palabra en Acción','En Espíritu y En Verdad','Elim','Salmistas','Israel Houghton','Marcos y Fer Brunet','Elevation Worship','Julissa','Juan Luis Guerra']
EXCLUDED = {3,19,32,53,54,56,58,82,85,89,99,103,111,117,144,147,148,159,177,180,187,221,232,48,113,212,45,78,205}
ALIASES = {127: 'No hay lugar más alto'}

def norm(s):
    return re.sub(r'[^a-z0-9]+', ' ', ''.join(c for c in unicodedata.normalize('NFKD',s.lower()) if not unicodedata.combining(c))).strip()

def artist_known(s):
    return any(norm(a) in norm(s) for a in KNOWN)

def video_id(url):
    match = re.fullmatch(r'https://(?:www\.)?youtube\.com/watch\?v=([\w-]{11})', url)
    return match.group(1) if match else None

def spotify_id(url):
    match = re.fullmatch(r'https://open\.spotify\.com/(?:(?:intl-[a-z]+|embed)/)?track/([A-Za-z0-9]{22})', url)
    return match.group(1) if match else None

def candidates(row, research, i):
    title = norm(ALIASES.get(i,re.sub(r'\s*\(.*?\)', '', row['titulo'])))
    result = []
    for source in research.get('sources',[]):
        headline = source['title']
        if not title or not re.search(r'(?:^| )'+re.escape(title)+r'(?: |$)',norm(headline)): continue
        if re.search(r'tutorial|pista|karaoke|reaccion|reacción|como tocar|cómo tocar|remix|instrumental|bebés|babies',headline,re.I) or 'Training' in (source.get('channel') or ''): continue
        artist = source.get('artist') or re.sub(r'\s*\(.*', '', source.get('channel') or '')
        if not artist and spotify_id(source['url']):
            translated = re.search(r'(?:lyrics by|song by|música y letra de|letra de|letras de|Lyrics von|paroles par|testo di|songtekst van)\s+(.+?)\s*\|\s*Spotify$',headline,re.I)
            if translated: artist = translated.group(1).strip()
            elif '/embed/track/' in source['url'] and ' - ' in headline: artist = headline.rsplit(' - ',1)[1].split('|')[0].strip()
        artist = {'MIEL SAN MARCOS':'Miel San Marcos','Marcos Witt Oficial':'Marcos Witt','Real Rojo Oficial':'Rojo','Montesanto Oficial':'Montesanto','Marcos y Fer Brunet':'Marcos Brunet','SovereignGraceMusic':'Sovereign Grace','Adoración La IBI - Topic':'La IBI'}.get(artist,artist)
        if not artist_known(artist): continue
        platform = 'youtube' if video_id(source['url']) else 'spotify' if spotify_id(source['url']) else None
        if not platform: continue
        indicated = row['artista_indicado']
        if indicated and not (norm(indicated) in norm(artist) or norm(artist) in norm(indicated)):
            # No sustituir el intérprete explícito del usuario con otro artista sin revisión.
            if i not in {0,2,24,65,72,97,127,165,169,192,230,233}: continue
        official = 'Official Artist Channel' in (source.get('channel') or '')
        score = 3 + (3 if official else 0) + (2 if indicated and norm(indicated) in norm(artist) else 0)
        result.append({**source,'artist':artist,'platform':platform,'score':score})
    return sorted(result,key=lambda x:-x['score'])

def chord_sheet(raw):
    return '\n'.join(part.strip() for part in raw.split(';') if part.strip())

def unsupported(sheet):
    chord = re.compile(r'^[\[(|]*([A-G](?:#|b)?)(m|maj|min|dim|aug|sus|add|M|ø|°)?([0-9+#()\-b]*)(?:/([A-G](?:#|b)?))?[\]),;|]*$')
    bad = []
    for token in sheet.split():
        if re.match(r'^[A-G](?:#|b)?(?:m|maj|sus|add|[0-9/#])',token) and not chord.fullmatch(token): bad.append(token)
    return sorted(set(bad))

def prepare(directory):
    rows = json.loads((directory/'inventario.json').read_text())
    researches = {}
    for path in sorted(directory.glob('investigacion-*.json')):
        for row in json.loads(path.read_text()):
            if 'i' in row:
                entry = researches.setdefault(row['i'], {'sources': []})
                entry['sources'].extend(row.get('sources', []))
    records = []
    for i,row in enumerate(rows):
        cs=candidates(row,researches.get(i,{}),i)
        y=next((s for s in cs if s['platform']=='youtube'),None)
        artist=(y or next(iter(cs),{})).get('artist','')
        s=next((s for s in cs if s['platform']=='spotify' and (norm(artist) in norm(s['artist']) or norm(s['artist']) in norm(artist))),None)
        if not y and s: artist=s['artist']
        title=row['titulo'] if i not in ALIASES else ALIASES[i]+' (A tus pies)'
        sheet=chord_sheet(row['acordes_usuario'])
        bad=unsupported(sheet)
        problems=[]
        if i in EXCLUDED: problems.append('Identidad o variante musical requiere confirmación.')
        if not cs: problems.append('No se confirmó grabación de referencia con intérprete cristiano identificado.')
        if bad: problems.append('Cifrado con tokens que el transportador actual no reconoce: '+', '.join(bad))
        if not sheet: problems.append('Falta cifrado aportado; no se inventan acordes.')
        if not row['tomo_base']: problems.append('Falta tono base del arreglo.')
        eligible=not problems
        missing=['letra']
        if not y: missing.append('youtube_url')
        if not s: missing.append('spotify_url')
        notes=[row['notas_usuario'], 'Arreglo VIDA a partir de apuntes suministrados; revisar cortes y repeticiones en ensayo. La grabación enlazada es una referencia; su tono y arreglo pueden diferir.']
        if missing: notes.append('Por completar: '+', '.join({'letra':'letra','youtube_url':'enlace YouTube','spotify_url':'enlace Spotify'}[k] for k in missing)+'.')
        if row['fuente_usuario']: notes.append('Referencia aportada: '+row['fuente_usuario'])
        clean_artist = {'MIEL SAN MARCOS':'Miel San Marcos', 'Marcos Witt Oficial':'Marcos Witt', 'Real Rojo Oficial':'Rojo', 'SovereignGraceMusic':'Sovereign Grace','Adoración La IBI - Topic':'La IBI'}.get(artist, artist)
        record={'id':str(uuid.uuid5(uuid.UUID(MINISTERIO),norm(title))), 'indice_origen':i,'titulo':title,'artista':clean_artist or None,'tonalidad_base':row['tomo_base'] or None,'acordes':sheet or None,'letra':None,'notas_permanentes':'\n'.join(n for n in notes if n),'spotify_url':'https://open.spotify.com/track/'+spotify_id(s['url']) if s else None,'youtube_url':y['url'] if y else None,'estado':'identificada' if eligible else 'pendiente','campos_pendientes':missing,'observaciones_revision':problems,'fuentes_verificacion':list(dict.fromkeys(x['url'] for x in cs)),'fuente_usuario':row['fuente_usuario'] or None}
        if i in {33,97}: record['estado']='existente';record['observaciones_revision']=['Se conserva la ficha existente sin sobrescribirla.']
        records.append(record)
    return records

if __name__=='__main__':
    directory=Path(sys.argv[1]); data=prepare(directory)
    (directory/'catalogo_preparado.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    fields=['indice_origen','titulo','artista','tonalidad_base','estado','spotify_url','youtube_url','campos_pendientes','observaciones_revision']
    with (directory/'revision.csv').open('w',newline='',encoding='utf-8-sig') as out:
        writer=csv.DictWriter(out,fieldnames=fields);writer.writeheader()
        for r in data: writer.writerow({k:json.dumps(r[k],ensure_ascii=False) if isinstance(r[k],list) else r[k] for k in fields})
    print(json.dumps({'total':len(data),'identificadas':sum(r['estado']=='identificada' for r in data),'existentes':sum(r['estado']=='existente' for r in data),'pendientes':sum(r['estado']=='pendiente' for r in data)},ensure_ascii=False))
