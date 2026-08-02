#!/usr/bin/env python3
"""Genera paquetes por libro del NT desde STEPBible TAGNT. Solo lectura."""
from __future__ import annotations
import argparse,gzip,hashlib,json,re,sys,unicodedata,urllib.request
from collections import defaultdict
from pathlib import Path
from urllib.parse import quote

COMMIT="b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39"
BASE=f"https://raw.githubusercontent.com/STEPBible/STEPBible-Data/{COMMIT}/Translators%20Amalgamated%20OT%2BNT/"
SOURCES=[
 {"key":"tagnt-mat-jhn","file":"TAGNT Mat-Jhn - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt","books":"Mat Mrk Luk Jhn".split(),"sha":"ab8eaaeb68e17a1dcfa34e1e9350358f22f03bc2a97244d848750ad81044bc8e"},
 {"key":"tagnt-act-rev","file":"TAGNT Act-Rev - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt","books":"Act Rom 1Co 2Co Gal Eph Php Col 1Th 2Th 1Ti 2Ti Tit Phm Heb Jas 1Pe 2Pe 1Jn 2Jn 3Jn Jud Rev".split(),"sha":None},
]
BOOKS={
 "Mat":("MAT","Mateo",28,1071),"Mrk":("MRK","Marcos",16,678),"Luk":("LUK","Lucas",24,1151),"Jhn":("JHN","Juan",21,879),
 "Act":("ACT","Hechos",28,1007),"Rom":("ROM","Romanos",16,433),"1Co":("1CO","1 Corintios",16,437),"2Co":("2CO","2 Corintios",13,257),
 "Gal":("GAL","Gálatas",6,149),"Eph":("EPH","Efesios",6,155),"Php":("PHP","Filipenses",4,104),"Col":("COL","Colosenses",4,95),
 "1Th":("1TH","1 Tesalonicenses",5,89),"2Th":("2TH","2 Tesalonicenses",3,47),"1Ti":("1TI","1 Timoteo",6,113),"2Ti":("2TI","2 Timoteo",4,83),
 "Tit":("TIT","Tito",3,46),"Phm":("PHM","Filemón",1,25),"Heb":("HEB","Hebreos",13,303),"Jas":("JAS","Santiago",5,108),
 "1Pe":("1PE","1 Pedro",5,105),"2Pe":("2PE","2 Pedro",3,61),"1Jn":("1JN","1 Juan",5,105),"2Jn":("2JN","2 Juan",1,13),
 "3Jn":("3JN","3 Juan",1,14),"Jud":("JUD","Judas",1,25),"Rev":("REV","Apocalipsis",22,404),
}
REF=re.compile(r"^(?P<book>[123]?[A-Za-z]{2,3})\.(?P<chapter>\d+)\.(?P<verse>\d+)(?P<context>[^#]*)#(?P<index>\d+)(?P<suffix>[^\t]*)$")
FORM=re.compile(r"^(.*?)\s+\(([^()]*)\)\s*$")
PUNCT=re.compile(r"^([^\w\u0370-\u03ff]*)(.*?)([^\w\u0370-\u03ff]*)$",re.UNICODE)
EDITION_PRIORITY=("NA28","NA27","Tyn","SBL","WH","Treg","TR","Byz")
SOURCE_VERSE_COUNTS={"2Co":256,"3Jn":15}

def hbytes(v): return hashlib.sha256(v).hexdigest()
def htext(v): return hbytes(v.encode("utf-8"))
def nfc(v): return unicodedata.normalize("NFC",v.strip())

def download(src):
 url=BASE+quote(src["file"])
 req=urllib.request.Request(url,headers={"User-Agent":"Vida-Internacional-STEPBible-NT/1.0"})
 with urllib.request.urlopen(req,timeout=240) as r:
  if r.status!=200: raise RuntimeError(f"HTTP {r.status}: {url}")
  raw=r.read()
 digest=hbytes(raw)
 if src["sha"] and digest!=src["sha"]: raise RuntimeError(f"Hash inesperado en {src['key']}: {digest}")
 return url,raw,digest

def parse_line(line,n):
 if not line or line.startswith("#") or "\t" not in line:return None
 f=line.rstrip("\r\n").split("\t")
 if len(f)<12:return None
 m=REF.match(f[0])
 if not m or m["book"] not in BOOKS:return None
 fm=FORM.match(f[1])
 if not fm:raise RuntimeError(f"Forma griega inválida L{n}: {f[1]}")
 surface=nfc(fm[1]); translit=fm[2].strip(); pm=PUNCT.match(surface)
 before,clean,after=pm.groups() if pm else ("",surface,"")
 sm=f[3].split("=",1)
 if len(sm)!=2 or not re.fullmatch(r"G\d{4}[A-Za-z0-9_]*",sm[0].strip()):raise RuntimeError(f"Strong/morfología inválida L{n}")
 lm=f[4].split("=",1); witnesses=[x.strip() for x in f[5].split("+") if x.strip()]
 return {"book":m["book"],"chapter":int(m["chapter"]),"verse":int(m["verse"]),"source_index":int(m["index"]),"source_suffix":m["suffix"],
  "source_reference":f[0],"source_line":n,"line_sha256":htext(line.rstrip("\r\n")),"surface_form":surface,"clean_surface_form":clean,
  "punctuation_before":before,"punctuation_after":after,"occurrence_transliteration":translit,"source_gloss_en":f[2].strip(),
  "source_gloss_es":f[8].strip(),"strong_number":sm[0].strip(),"morphology_code":sm[1].strip(),"lemma":nfc(lm[0]),
  "lemma_gloss_en":lm[1].strip() if len(lm)==2 else "","source_lemma_gloss":f[9].strip(),"textual_witnesses":witnesses,
  "is_base_reading":"NA28" in witnesses,"variant_note":f[7].strip(),"source_word_link":f[10].strip(),"lexical_id":f[11].strip(),
  "display_word_index":None}

def validate_verse(rows,ref):
 rows=sorted(rows,key=lambda x:(x["source_line"],x["source_index"]))
 idx=[x["source_index"] for x in rows]
 if idx!=sorted(idx):raise RuntimeError(f"Índices fuera de orden en {ref}")
 available={w for x in rows for w in x["textual_witnesses"]}
 edition=next((e for e in EDITION_PRIORITY if e in available),None)
 if not edition:raise RuntimeError(f"Sin edición textual reconocida en {ref}: {sorted(available)}")
 pos=0
 for x in rows:
  x["is_base_reading"]=edition in x["textual_witnesses"];x["display_word_index"]=None
  if x["is_base_reading"]:pos+=1;x["display_word_index"]=pos
 if not pos:raise RuntimeError(f"Sin lectura base {edition} en {ref}")
 return rows,edition

def validate_book(book,verses):
 _,name,chapters,app_total=BOOKS[book];total=SOURCE_VERSE_COUNTS.get(book,app_total)
 found=sorted({c for c,_ in verses})
 if found!=list(range(1,chapters+1)):raise RuntimeError(f"Capítulos incompletos en {name}: {found}")
 if len(verses)!=total:raise RuntimeError(f"Versículos inválidos en {name}: {len(verses)} != {total}")
 for c in found:
  vv=sorted(v for cc,v in verses if cc==c)
  if vv!=list(range(1,max(vv)+1)):raise RuntimeError(f"Versículos discontinuos en {name} {c}")

def verse_payload(book,c,v,rows):
 rows,edition=validate_verse(rows,f"{book}.{c}.{v}"); base=[x for x in rows if x["is_base_reading"]]; variants=[x for x in rows if not x["is_base_reading"]]
 return {"reference":f"{book}.{c}.{v}","chapter":c,"verse":v,"base_edition":edition,"uses_fallback_edition":edition!="NA28","original_text":" ".join(x["surface_form"] for x in base),
  "transliteration":" ".join(x["occurrence_transliteration"] for x in base),"source_gloss_sequence_es":" ".join(x["source_gloss_es"] or x["source_gloss_en"] for x in base),
  "base_word_count":len(base),"variant_row_count":len(variants),"words":rows,
  "variant_notes":[{"source_index":x["source_index"],"display_word_index":x["display_word_index"],"surface_form":x["surface_form"],"note":x["variant_note"]} for x in base if x["variant_note"]]}

def write_gz(path,payload):
 path.parent.mkdir(parents=True,exist_ok=True); data=(json.dumps(payload,ensure_ascii=False,separators=(",",":"))+"\n").encode()
 with gzip.open(path,"wb",compresslevel=9) as f:f.write(data)
 raw=path.read_bytes();return len(raw),hbytes(raw)

def summary(path,manifest):
 t=manifest["totals"]; lines=["# Validación del corpus textual del Nuevo Testamento","",f"- Commit STEPBible: `{COMMIT}`",f"- Libros: {t['books']}",f"- Versículos fuente: {t['verses']}",f"- Libros que requieren mapa de versificación: {t['versification_books']}",f"- Palabras base: {t['base_words']}",f"- Lecturas adicionales: {t['variant_rows']}",f"- Versículos con edición de respaldo: {t['fallback_verses']}",f"- Filas totales: {t['all_rows']}","","| Libro | Capítulos | Versículos fuente/app | Palabras base | Respaldo | Lecturas adicionales | SHA-256 |","|---|---:|---:|---:|---:|---:|---|"]
 for b in manifest["books"]:lines.append(f"| {b['name_es']} | {b['chapter_count']} | {b['source_verse_count']}/{b['app_verse_count']} | {b['base_words']} | {b['fallback_verses']} | {b['variant_rows']} | `{b['artifact_sha256']}` |")
 lines+= ["","NA28 se usa cuando está disponible. Las referencias omitidas por NA28 conservan una lectura de respaldo etiquetada.","2 Corintios y 3 Juan requieren mapa de versificación antes de importarse a la numeración de la app.","Proceso de solo lectura: no modifica Supabase ni producción."]
 path.write_text("\n".join(lines)+"\n",encoding="utf-8")

def extract(out,requested=None):
 grouped=defaultdict(lambda:defaultdict(list)); srcman=[]
 for src in SOURCES:
  relevant=set(src["books"])
  if requested and not relevant&requested:continue
  print(f"Descargando {src['key']}…",flush=True);url,raw,digest=download(src);rows=0
  for n,line in enumerate(raw.decode("utf-8-sig").splitlines(),1):
   rec=parse_line(line,n)
   if not rec or (requested and rec["book"] not in requested):continue
   if rec["book"] not in relevant:raise RuntimeError(f"{rec['book']} en fuente inesperada {src['key']}")
   grouped[rec["book"]][(rec["chapter"],rec["verse"])].append(rec);rows+=1
  srcman.append({"key":src["key"],"filename":src["file"],"url":url,"sha256":digest,"bytes":len(raw),"parsed_rows":rows})
 expected=set(BOOKS) if requested is None else requested
 missing=expected-set(grouped)
 if missing:raise RuntimeError(f"Libros sin datos: {sorted(missing)}")
 books=[];tot={"books":0,"verses":0,"base_words":0,"variant_rows":0,"fallback_verses":0,"all_rows":0,"base_editions":{},"versification_books":0}
 for book in BOOKS:
  if book not in expected:continue
  verses=grouped[book];validate_book(book,verses);code,name,chapters,app_vcount=BOOKS[book];source_vcount=SOURCE_VERSE_COUNTS.get(book,app_vcount)
  items=[verse_payload(book,c,v,verses[(c,v)]) for c,v in sorted(verses)]
  editions={e:sum(1 for x in items if x["base_edition"]==e) for e in EDITION_PRIORITY};editions={k:v for k,v in editions.items() if v}
  counts={"verses":len(items),"base_words":sum(x["base_word_count"] for x in items),"variant_rows":sum(x["variant_row_count"] for x in items),"fallback_verses":sum(1 for x in items if x["uses_fallback_edition"]),"all_rows":sum(len(x["words"]) for x in items),"base_editions":editions}
  payload={"schema_version":"stepbible-tagnt-book-v1","source_commit":COMMIT,"license":"CC BY 4.0","attribution":"STEP Bible","book":{"step_code":book,"internal_code":code,"name_es":name,"chapter_count":chapters,"source_verse_count":source_vcount,"app_verse_count":app_vcount,"versification_mapping_required":source_vcount!=app_vcount},"counts":counts,"verses":items}
  fn=f"{code.lower()}.json.gz";size,digest=write_gz(out/"books"/fn,payload)
  books.append({**payload["book"],**counts,"artifact":f"books/{fn}","artifact_bytes":size,"artifact_sha256":digest})
  tot["books"]+=1;tot["versification_books"]+=int(source_vcount!=app_vcount)
  for k in ("verses","base_words","variant_rows","fallback_verses","all_rows"):tot[k]+=counts[k]
  for e,n in editions.items():tot["base_editions"][e]=tot["base_editions"].get(e,0)+n
  print(f"{name}: {counts['verses']} versículos, {counts['base_words']} palabras base, {counts['fallback_verses']} con respaldo, {counts['variant_rows']} variantes.",flush=True)
 manifest={"schema_version":"stepbible-tagnt-manifest-v1","source_repository":"STEPBible/STEPBible-Data","source_commit":COMMIT,"license":"CC BY 4.0","attribution":"STEP Bible","sources":srcman,"totals":tot,"books":books}
 out.mkdir(parents=True,exist_ok=True);(out/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8");summary(out/"validation.md",manifest)
 return manifest

def self_test():
 lines=[
  "Jhn.3.16#01=NKO\tοὕτως (houtōs)\tThus\tG3779=ADV\tοὕτω, οὕτως=thus(-ly)\tNA28+NA27+Tyn+SBL+WH+Treg+TR+Byz\t\t\tAsí\tthus\t#01\tG3779",
  "Jhn.3.16#11=ko\tαὐτοῦ (autou)\tof him\tG0846=P-GSM\tαὐτός=he/she/it/self\tTreg+TR+Byz\t\t\tde él\tof him\t#11«10:G5207\tG0846_a\tG3778",
  "Jhn.3.16#23=NKO\tἀλλ᾽ (all᾽)\tbut\tG0235=CONJ\tἀλλά=but\tNA28+NA27+Tyn+SBL+WH+Treg+TR+Byz\t\tSBL+WH+Treg+TR+Byz: ἀλλὰ ; \tsino\tbut\t#23\tG0235"]
 rows=[parse_line(x,i+1) for i,x in enumerate(lines)];assert rows[0]["is_base_reading"] and not rows[1]["is_base_reading"] and "ἀλλὰ" in rows[2]["variant_note"]
 out,edition=validate_verse(rows,"Jhn.3.16");assert edition=="NA28" and [x["display_word_index"] for x in out]==[1,None,2]
 fallback=[parse_line("Mat.17.21#01=K\tτοῦτο (touto)\tthis\tG3778=D-NSN\tοὗτος=this\tTR+Byz\t\t\testo\tthis\t#01\tG3778",4)]
 _,edition=validate_verse(fallback,"Mat.17.21");assert edition=="TR" and fallback[0]["is_base_reading"]
 print("Self-test OK")

def main():
 p=argparse.ArgumentParser();p.add_argument("--output-dir",type=Path,default=Path("artifacts/stepbible-nt"));p.add_argument("--books");p.add_argument("--self-test",action="store_true");a=p.parse_args()
 if a.self_test:self_test();return 0
 req={x.strip() for x in a.books.split(",") if x.strip()} if a.books else None
 if req:
  unknown=req-set(BOOKS)
  if unknown:raise RuntimeError(f"Libros desconocidos: {sorted(unknown)}")
 m=extract(a.output_dir,req);print(json.dumps(m["totals"],ensure_ascii=False));return 0
if __name__=="__main__":
 try:raise SystemExit(main())
 except Exception as e:print(f"ERROR: {e}",file=sys.stderr);raise SystemExit(1) from e
