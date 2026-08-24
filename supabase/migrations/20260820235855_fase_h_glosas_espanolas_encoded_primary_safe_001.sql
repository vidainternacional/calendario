-- FASE H / Bloque 3 — sentidos codificados con etiqueta primaria explícita, lote seguro 001.
-- Autoridad semántica: etiqueta explícita antes de » en source_gloss STEPBible/TAHOT.
-- La anotación técnica posterior a » NO se usa como significado.
-- Insert-only; reversión exacta por batch_id.
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_encoded_primary_safe_001_20260820';

with map(lexical_id,display_gloss_es) as (values
('H0127G','suelo'),('H0127I','país; planeta'),('H0157H','amigo'),('H0205G','maldad'),('H0241H','audición'),('H0410L','poder'),
('H0518A','si'),('H0518B','excepto'),('H0518H','ciertamente no'),('H0518I','ciertamente sí'),('H0518J','hasta'),
('H0759H','fortaleza'),('H0905H','solo'),('H0905J','aparte de'),('H0935P','traer'),('H0990G','abdomen'),('H0990I','joroba'),
('H1004B','hogar'),('H1121G','descendiente'),('H1121I','tipo'),('H1197A','quemar'),('H1197H','destruir'),('H1214I','ganar'),
('H1366G','límite'),('H1419K','viejo'),('H1530H','ola'),('H1540I','descubrir cosas'),('H1696H','dominar'),('H1826H','silencioso'),
('H1870H','camino'),('H1870L','viaje'),('H1964H','palacio'),('H1980H','acercarse'),('H1980I','caminar'),('H1980O','enviar'),
('H1984B','alabar'),('H2233G','semilla'),('H2233H','hijos; descendientes'),('H2320G','mes'),('H2320H','luna nueva'),
('H2342I','retorcerse de dolor'),('H2342J','danzar'),('H2342K','esperar con ansiedad'),('H2388J','prevalecer sobre'),
('H2436G','abrazo'),('H2436J','secreto'),('H2470A','débil'),('H2470H','enfermo'),('H2490C','comenzar'),('H2490H','profanar'),
('H3027H','poder'),('H3027J','por'),('H3027K','a'),('H3027M','monumento'),('H3117L','hoy'),('H3176G','esperar'),('H3220G','mar'),
('H3225H','sur'),('H3233G','derecha'),('H3233H','sur'),('H3318H','enviar'),('H3318P','rendirse'),('H3332H','fundir metal'),
('H3332I','colocar'),('H3335I','planear'),('H3477G','recto'),('H3513G','honrar'),('H3559H','establecer'),('H3559I','hacer'),
('H3678I','asiento'),('H3701G','dinero'),('H3925G','enseñar'),('H3947G','tomar'),('H3956H','idioma'),('H4148H','instrucción'),
('H4294J','vara'),('H4941G','juicio'),('H4941I','regla'),('H5162H','desistir'),('H5307I','asignar'),('H5375G','levantar'),
('H5375H','llevar'),('H5375M','mirar'),('H5375N','en voz alta'),('H5414L','arrojar'),('H5414N','pagar'),('H5437I','de nuevo'),
('H5674C','traer'),('H5769G','duradero; eterno'),('H5869H','visión'),('H5869I','apariencia'),('H5927G','subir'),('H5927J','atacar'),
('H5971L','criaturas'),('H5975H','designar'),('H6086H','árbol'),('H6086J','estaca'),('H6106I','cuerpo'),('H6310H','borde'),
('H6440G','delante de'),('H6440I','porque'),('H6485H','castigar'),('H6485L','poner'),('H6924G','oriente'),('H6931G','oriental'),
('H6931H','más antiguo'),('H6942G','consagrar'),('H6942J','preparar'),('H6963L','escuchar'),('H6965B','levantarse'),('H6965I','establecer'),
('H6996H','joven'),('H7070H','tallo'),('H7070J','hombro'),('H7070K','balanza'),('H7121G','llamar'),('H7121I','proclamar'),
('H7122H','hacia'),('H7126G','acercarse'),('H7130G','entre'),('H7200H','examinar'),('H7200M','acercarse'),('H7218A','cabeza'),
('H7218I','cima'),('H7223G','primero'),('H7223H','anterior'),('H7223I','principal'),('H7225H','mejor'),('H7364','lavar'),
('H7393H','piedra de molino'),('H7451C','daño'),('H7704B','suelo'),('H7725H','rescatar'),('H7725I','volver atrás'),('H7725M','responder'),
('H7725N','recordar'),('H7760H','poner'),('H7760M','nombrar'),('H7896H','poner'),('H7965J','amistad'),('H7971K','alcanzar'),
('H7971M','exiliar'),('H8040G','izquierda'),('H8040H','norte'),('H8042G','izquierda'),('H8042H','norte'),('H8047G','destruido'),
('H8047H','consternado'),('H8074H','consternado'),('H8085H','obedecer'),('H8085L','recibir; acoger'),('H8127J','punta'),('H8193J','orilla'),
('H8668H','victoria')
), eligible as (
 select e.id lexical_entry_id,e.lexical_id,e.strong_number,e.source_gloss,map.display_gloss_es
 from public.biblical_lexical_entries e
 join map on map.lexical_id=e.lexical_id
 left join public.biblical_hebrew_spanish_glosses g on g.lexical_entry_id=e.id
 where e.language='hebrew' and e.enabled and e.review_status='approved'
   and e.display_gloss_es is null and g.lexical_entry_id is null
   and e.source_gloss like ':%»%'
)
insert into public.biblical_hebrew_spanish_glosses
(lexical_entry_id,display_gloss_es,alternative_glosses_es,confidence,derivation_method,source_gloss_snapshot,status,provenance)
select lexical_entry_id,display_gloss_es,'{}'::text[],97,'encoded_primary_label_editorial_v1',source_gloss,'manual_approved',
 jsonb_build_object('phase','FASE_H_BLOQUE_3','batch_id','fase_h_es_encoded_primary_safe_001_20260820','source','STEPBible/TAHOT source_gloss en','source_license','CC BY 4.0','translation_layer','VIDA editorial Spanish','translation_basis','explicit primary sense label before »','technical_annotation_used_as_meaning',false,'context_used_as_meaning',false,'rv1909_used_as_meaning',false,'lexical_id',lexical_id,'strong_number',strong_number)
from eligible
on conflict (lexical_entry_id) do nothing;
