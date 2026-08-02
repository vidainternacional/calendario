-- FASE D · Bloque 4 · piloto textual, parte 1/3: fuente y léxico.
update public.biblical_sources
set provider_version='STEPBible-Data@b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39',
    content_hash='53a8c65d4133a5114bcd6e127efd0e4554ec2785a2aca86238517b97459131ad',
    metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
      'source_commit','b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39',
      'source_files',jsonb_build_array(
        jsonb_build_object('dataset','TAHOT','sha256','84e118a97e5725e3847cdfdd593873513021c790c63cc91a0d41fca2b5db2ed5','extract_sha256','4a112c7e27da3b2a0cf76f468975f62ebef04173f2656580ecc64dd38dee7ea4','lines',jsonb_build_array(21230,21233)),
        jsonb_build_object('dataset','TAGNT','sha256','ab8eaaeb68e17a1dcfa34e1e9350358f22f03bc2a97244d848750ad81044bc8e','extract_sha256','3b36d9f586fe932d4fa21065ab6fe556f2788d2b2fe0ac252b48099e21853cfa','lines',jsonb_build_array(87972,87997))
      ),
      'pilot_status','textual_data_verified',
      'base_text_policy',jsonb_build_object('hebrew','TAHOT source reading','greek','NA27/NA28'),
      'generated_by_ai',false
    ), updated_at=now()
where slug='stepbible-lexical-pilot';

with source as (
  select id from public.biblical_sources
  where slug='stepbible-lexical-pilot' and enabled and review_status='approved'
), data as (
  select * from jsonb_to_recordset($data$[{"l":"greek","i":"G0025","s":"G0025","m":"ἀγαπάω","t":"agapaō","p":"verb","g":"to love","e":"amar","ln":87974,"si":"G0025"},{"l":"greek","i":"G0166","s":"G0166","m":"αἰώνιος","t":"aiōnios","p":"adjective","g":"eternal","e":"eterno","ln":87997,"si":"G0166"},{"l":"greek","i":"G0235","s":"G0235","m":"ἀλλά","t":"alla","p":"conjunction","g":"but","e":"pero, sino","ln":87994,"si":"G0235"},{"l":"greek","i":"G0622","s":"G0622","m":"ἀπολλύω","t":"apollymi","p":"verb","g":"to destroy","e":"destruir, perder","ln":87993,"si":"G0622"},{"l":"greek","i":"G0846A","s":"G0846","m":"αὐτός","t":"autos","p":"pronoun","g":"he/she/it/self","e":"él, ella, ello; mismo","ln":87982,"si":"G0846_a"},{"l":"greek","i":"G0846B","s":"G0846","m":"αὐτός","t":"autos","p":"pronoun","g":"he/she/it/self","e":"él, ella, ello; mismo","ln":87991,"si":"G0846_B"},{"l":"greek","i":"G1063","s":"G1063","m":"γάρ","t":"gar","p":"conjunction","g":"for","e":"porque, pues","ln":87973,"si":"G1063"},{"l":"greek","i":"G1325","s":"G1325","m":"δίδωμι","t":"didōmi","p":"verb","g":"to give","e":"dar","ln":87985,"si":"G1325"},{"l":"greek","i":"G1519","s":"G1519","m":"εἰς","t":"eis","p":"preposition","g":"toward","e":"hacia, en","ln":87990,"si":"G1519"},{"l":"greek","i":"G2192","s":"G2192","m":"ἔχω","t":"echō","p":"verb","g":"to have/be","e":"tener","ln":87995,"si":"G2192"},{"l":"greek","i":"G2222","s":"G2222","m":"ζωή","t":"zōē","p":"noun","g":"life","e":"vida","ln":87996,"si":"G2222"},{"l":"greek","i":"G2316","s":"G2316","m":"θεός","t":"theos","p":"noun","g":"God","e":"Dios","ln":87976,"si":"G2316"},{"l":"greek","i":"G2443","s":"G2443","m":"ἵνα","t":"hina","p":"conjunction","g":"in order that/to","e":"para que","ln":87986,"si":"G2443"},{"l":"greek","i":"G2889","s":"G2889","m":"κόσμος","t":"kosmos","p":"noun","g":"world","e":"mundo","ln":87978,"si":"G2889"},{"l":"greek","i":"G3361","s":"G3361","m":"μή","t":"mē","p":"particle","g":"not","e":"no","ln":87992,"si":"G3361"},{"l":"greek","i":"G3439","s":"G3439","m":"μονογενής","t":"monogenēs","p":"adjective","g":"unique","e":"único","ln":87984,"si":"G3439"},{"l":"greek","i":"G3588A","s":"G3588","m":"ὁ","t":"ho","p":"article","g":"the/this/who","e":"el, la, lo","ln":87975,"si":"G3588_A"},{"l":"greek","i":"G3588B","s":"G3588","m":"ὁ","t":"ho","p":"article","g":"the/this/who","e":"el, la, lo","ln":87977,"si":"G3588_B"},{"l":"greek","i":"G3588C","s":"G3588","m":"ὁ","t":"ho","p":"article","g":"the/this/who","e":"el, la, lo","ln":87980,"si":"G3588_C"},{"l":"greek","i":"G3588D","s":"G3588","m":"ὁ","t":"ho","p":"article","g":"the/this/who","e":"el, la, lo","ln":87983,"si":"G3588_D"},{"l":"greek","i":"G3588E","s":"G3588","m":"ὁ","t":"ho","p":"article","g":"the/this/who","e":"el, la, lo","ln":87988,"si":"G3588_E"},{"l":"greek","i":"G3779","s":"G3779","m":"οὕτω, οὕτως","t":"houtōs","p":"adverb","g":"thus(-ly)","e":"así, de esta manera","ln":87972,"si":"G3779"},{"l":"greek","i":"G3956","s":"G3956","m":"πᾶς","t":"pas","p":"adjective","g":"all","e":"todo","ln":87987,"si":"G3956"},{"l":"greek","i":"G4100","s":"G4100","m":"πιστεύω","t":"pisteuō","p":"verb","g":"to trust (in)","e":"creer, confiar","ln":87989,"si":"G4100"},{"l":"greek","i":"G5207","s":"G5207","m":"υἱός","t":"huios","p":"noun","g":"son","e":"hijo","ln":87981,"si":"G5207"},{"l":"greek","i":"G5620","s":"G5620","m":"ὥστε","t":"hōste","p":"conjunction","g":"so","e":"de modo que","ln":87979,"si":"G5620"},{"l":"hebrew","i":"H2637","s":"H2637","m":"חָסֵר","t":"chaser","p":"verb","g":"I lack","e":"carecer, faltar","ln":21233,"si":"H2637"},{"l":"hebrew","i":"H3068G","s":"H3068","m":"יהוה","t":"Yahweh","p":"proper_name","g":"Yahweh","e":"Yahvé / SEÑOR","ln":21230,"si":"H3068G"},{"l":"hebrew","i":"H3808","s":"H3808","m":"לֹא","t":"lo’","p":"negative_particle","g":"not","e":"no","ln":21232,"si":"H3808"},{"l":"hebrew","i":"H7462B","s":"H7462","m":"רָעָה","t":"ra‘ah","p":"verb","g":"to pasture","e":"pastorear, cuidar","ln":21231,"si":"H7462B"},{"l":"hebrew","i":"H9020","s":"H9020","m":"־י","t":"-i","p":"pronominal_suffix","g":"my","e":"mi","ln":21231,"si":"H9020"}]$data$::jsonb) as x(
    l text,i text,s text,m text,t text,p text,g text,e text,ln integer,si text
  )
)
insert into public.biblical_lexical_entries(
  source_id,language,lexical_id,strong_number,lemma,transliteration,part_of_speech,
  source_gloss,display_gloss_es,display_gloss_kind,source_locator,provider_version,
  content_hash,review_status,enabled,approved_at,metadata
)
select source.id,d.l,d.i,d.s,d.m,d.t,d.p,d.g,d.e,'editorial_translation',
  (case when d.l='hebrew' then 'https://github.com/STEPBible/STEPBible-Data/blob/b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39/Translators%20Amalgamated%20OT%2BNT/TAHOT%20Job-Sng%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt' else 'https://github.com/STEPBible/STEPBible-Data/blob/b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39/Translators%20Amalgamated%20OT%2BNT/TAGNT%20Mat-Jhn%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt' end)||'#L'||d.ln,
  'STEPBible-Data@b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39',
  encode(extensions.digest(concat_ws('|',d.l,d.i,d.s,d.m,d.t,d.p,d.g,d.e,d.ln::text,d.si,'b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39'),'sha256'),'hex'),
  'approved',true,now(),
  jsonb_build_object('source_commit','b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39','source_line',d.ln,'source_lexical_id',d.si,'review_level','source_validated','generated_by_ai',false)
from data d cross join source
on conflict(source_id,language,lexical_id) do update set
  strong_number=excluded.strong_number,lemma=excluded.lemma,transliteration=excluded.transliteration,
  part_of_speech=excluded.part_of_speech,source_gloss=excluded.source_gloss,
  display_gloss_es=excluded.display_gloss_es,display_gloss_kind=excluded.display_gloss_kind,
  source_locator=excluded.source_locator,provider_version=excluded.provider_version,
  content_hash=excluded.content_hash,review_status='approved',enabled=true,
  approved_at=coalesce(public.biblical_lexical_entries.approved_at,excluded.approved_at),
  metadata=excluded.metadata,updated_at=now();

do $validate$
declare s uuid; c integer; bad integer;
begin
 select id into s from public.biblical_sources where slug='stepbible-lexical-pilot';
 select count(*) into c from public.biblical_lexical_entries where source_id=s and enabled and review_status='approved';
 select count(*) into bad from public.biblical_lexical_entries where source_id=s and enabled and (content_hash is null or content_hash !~ '^[0-9a-f]{64}$');
 if c<>31 then raise exception 'Se esperaban 31 entradas léxicas; se obtuvieron %',c; end if;
 if bad<>0 then raise exception 'Hashes léxicos inválidos: %',bad; end if;
end $validate$;