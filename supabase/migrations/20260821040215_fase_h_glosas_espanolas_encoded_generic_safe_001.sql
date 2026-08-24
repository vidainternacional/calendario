-- FASE H / Bloque 3 — glosas españolas de entradas TAHOT anotadas, lote seguro 001.
-- 52 entradas con anotación técnica/proper-context en source_gloss.
--
-- Regla editorial: se traduce únicamente el componente léxico principal de la
-- glosa fuente; la anotación situada después de » sirve para identificar el uso
-- técnico del dataset y NO se convierte en significado léxico.
--
-- Se excluyen deliberadamente casos interpretativamente sensibles como Second
-- Quarter, Dragon Spring, "great stature", Rock of Escape y City of Salt para
-- una revisión separada.
--
-- Insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id'='fase_h_es_encoded_generic_safe_001_20260820';

with map(lexical_entry_id,expected_source_gloss,display_gloss_es) as (values
 ('a17628ba-423a-4baa-8632-0779d799b5ff'::uuid,'Hall»Hall_of_Judgment@1Ki.7.7','salón'),
 ('c2b0ccc0-4b45-43f3-a8c8-16339ac7b710'::uuid,'Hall»Hall_of_Judgment@1Ki.7.7','salón'),
 ('140ad79a-d087-4830-92e3-2350f2331b7b'::uuid,' Oak»Diviners''_Oak@Jdg.9.37','encina'),
 ('4c2ab407-a035-42fe-bad2-1f1bf1645fc9'::uuid,'Dung( Gate)»Dung_Gate@Neh.2.13-','estiércol'),
 ('2557d440-71a6-4b8a-825b-6345660a8b4b'::uuid,'House»House_of_the_Forest@Isa.22.8','casa'),
 ('096f510b-7e4f-4dc5-b357-6eeb3ab231f6'::uuid,'House»House_of_the_Forest_of_Lebanon@1Ki.7.2','casa'),
 ('a133cf9f-4b66-4033-8a5c-2d99e3b89d85'::uuid,'Great( Sea) (KJV: the great sea; NIV: Mediterranean Sea)»Great_Sea@Num.34.6-Ezk','grande'),
 ('96b39595-0f65-4126-b793-88174cd582d0'::uuid,'Valley( Gate)»Valley_Gate@2Ch.26.9-Neh','valle'),
 ('c4a6d56f-9478-4da0-aac0-55612c4e761e'::uuid,'Valley»Hamon-gog_Valley@Ezk.39.11-','valle'),
 ('1f2ac5fb-8e43-4aba-aa6f-12d5082e609a'::uuid,'Valley»Travelers_Valley@Ezk.39.11','valle'),
 ('5db850d6-e42d-4133-a29d-b407f848f75f'::uuid,'Fish( Gate)»Fish_Gate@2Ch.33.14-Zep','pez'),
 ('49556968-660d-4bf5-ab92-4bcf6c7812ee'::uuid,' of Slaughter»Hinnom_Valley@Jos.15.8-Jer','matanza'),
 ('e6f09b67-4984-4d0b-8e94-1e8e92034de2'::uuid,'New( Gate)»New_Gate@Jer.26.10-','nuevo'),
 ('701a74c5-c754-4124-a63e-7f01db20f5d7'::uuid,' Wall»Broad_Wall@Neh.3.8-','muro'),
 ('010313a6-55ee-4ce3-80d0-623965177c08'::uuid,'(Gate of the )Foundation»Foundation_Gate@2Ch.23.5','fundamento'),
 ('447d60e1-e6bb-490e-afa9-c5d112c8991f'::uuid,'Wildgoats''»Wildgoats_Rocks@1Sa.24.2','cabras monteses'),
 ('a248dcdd-8001-4ad4-aacd-4671c607ab81'::uuid,'Forest»Forest_Ephraim@2Sa.18.6','bosque'),
 ('0d169cfd-9e87-448c-9aaa-e60f40bcb763'::uuid,'Canaanite woman»Canaanite_woman@Gen.46.10-Exo','cananea'),
 ('a7f71b51-fd1f-403c-ad4d-11eefa96522b'::uuid,' of the Throne»Hall_of_the_Throne@1Ki.7.7','trono'),
 ('15fa1e45-5203-4f4e-b79f-8a464032028e'::uuid,' of the Hundred»Tower_of_the_Hundred@Neh.3.1-','cien'),
 ('b35d4eb6-70d7-4628-b21f-b2045688740b'::uuid,'Tower»Tower_of_Hananel@Neh.3.1-Zec','torre'),
 ('8c78a0ce-fe44-489e-b6c3-e75cef2cc7a3'::uuid,'Tower»Tower_of_the_Hundred@Neh.3.1-','torre'),
 ('ef7c14d7-2ea7-49f8-8e91-e1277b239821'::uuid,'East( Gate)»East_Gate@Neh.3.29','este'),
 ('c0259312-03a2-459e-82c0-a861136444b0'::uuid,'Water( Gate)»Water_Gate@Neh.3.26-','agua'),
 ('4b051e62-2b57-435f-9d9d-b093c3050489'::uuid,'Salt( Sea)»Salt_Sea@Gen.14.3-2Ki','sal'),
 ('aab56352-125e-4a7a-8e1a-0bf6d5c66f7d'::uuid,' of Salt»Salt_Valley@2Sa.8.13-Psa','sal'),
 ('43ddbdc4-7b13-453c-8042-67c72550d29c'::uuid,'King''s»King''s_Highway@Num.20.17','rey'),
 ('f8c2b2cd-c954-4da2-8314-ba43cd7d2b48'::uuid,'King''s»King''s_Valley@Gen.14.17','rey'),
 ('605239fb-f7ec-4d73-b203-bd99d6e92a5e'::uuid,'Queen»Queen_of_Sheba@1Ki.10.1-Luk','reina'),
 ('a547a078-1732-45bf-8883-c7a9f8050817'::uuid,' of Judgment»Hall_of_Judgment@1Ki.7.7','juicio'),
 ('cede08e0-a48f-4030-828b-fd4bc5604a14'::uuid,'Brook»Brook_of_the_Willows@Isa.15.7','arroyo'),
 ('c97f89d0-37d7-4d5a-a9fe-b7e4fe9f97be'::uuid,'Valley»Eshcol_Valley@Num.13.23-Deu','valle'),
 ('9cd8c97d-1778-422c-8cd1-8992100106e7'::uuid,'Valley»Sorek_Valley@Jdg.16.4','valle'),
 ('a2658110-c66c-42e8-b160-0d73bb02427c'::uuid,'Brook»Brook_of_the_Arabah@Amo.6.14','arroyo'),
 ('9dd8227e-4ce4-49e1-95f9-d064a0f05d2c'::uuid,'Brook»Brook_of_Egypt@Num.34.5-Ezk','arroyo'),
 ('cd08d93d-d7aa-4917-803c-da60d4da76f6'::uuid,'Brook»Brook_of_Egypt@Num.34.5-Ezk','arroyo'),
 ('42a6417d-e780-4d2b-82e7-e453b071cca3'::uuid,'Horse( Gate)»Horse_Gate@Neh.3.28-Jer','caballo'),
 ('f586d133-02af-42a9-b299-e7a1cc0fa203'::uuid,'Fountain( Gate)»Fountain_Gate@Neh.2.14-','fuente'),
 ('37da5185-94c9-41c2-a92c-482fed7c0b70'::uuid,'Upper»Beth-horon_Upper@Jos.16.5-2Ch','superior'),
 ('5f650b49-e8ac-4385-8862-890083204393'::uuid,'People''s( Gate) (KJV: people)»People''s_Gate@Jer.17.19','pueblo'),
 ('a3fb62e9-4563-4bcd-af27-f12414c41637'::uuid,' of Pillars»Hall_of_Pillars@1Ki.7.6','columnas'),
 ('f6580225-535d-41d9-bfd1-d098d651cdc3'::uuid,'Diviners''»Diviners''_Oak@Jdg.9.37','adivinar'),
 ('2d73fd19-a751-4cb8-8e8b-bf73980ee777'::uuid,' of the Willows»Brook_of_the_Willows@Isa.15.7','sauces'),
 ('c851a66f-a62b-4004-a1fe-02879f4a12a4'::uuid,'Sheep( Gate)»Sheep_Gate@Neh.3.1-Jhn','ovejas'),
 ('1922eaf8-d9ec-4ddf-9724-18ac1bd8709e'::uuid,' Rocks»Wildgoats_Rocks@1Sa.24.2','rocas'),
 ('42b773f1-5171-46cc-adeb-706960964c68'::uuid,'Most Holy Place»Most_Holy_Place@1Ki.6.16-Heb','Lugar Santísimo'),
 ('7d693e40-e72e-4ecc-b11b-460fa05c4a10'::uuid,' of Holiness»Way_of_Holiness@Isa.35.8','santidad'),
 ('2d1d4633-1798-4afd-b5c2-f40e861e895e'::uuid,'Holy Place»Holy_Place@Exo.26.33-Heb','Lugar Santo'),
 ('9512bba2-bfcf-4757-aa4f-dcc43db6a02f'::uuid,'Broad»Broad_Wall@Neh.3.8-','ancho'),
 ('92966011-ecf1-4efd-bfbb-16a6ecf924f0'::uuid,' Field»Washer''s_Field@2Ki.18.17','campo'),
 ('726c1d86-97e7-4e41-893b-8ed34b333510'::uuid,'Lower»Beth-horon_Lower@@Jos.16.3','inferior'),
 ('c6416977-bd0a-4f6d-8cdf-1fcd2329f441'::uuid,' of the Ovens»Tower_of_the_Ovens@Neh.3.11-','hornos')
), eligible as (
 select l.id lexical_entry_id,l.strong_number,l.source_gloss,map.display_gloss_es
 from map
 join public.biblical_lexical_entries l
   on l.id=map.lexical_entry_id and l.source_gloss=map.expected_source_gloss
 left join public.biblical_hebrew_spanish_glosses g on g.lexical_entry_id=l.id
 where l.language='hebrew'
   and l.enabled=true
   and l.review_status='approved'
   and nullif(btrim(l.display_gloss_es),'') is null
   and g.lexical_entry_id is null
)
insert into public.biblical_hebrew_spanish_glosses
(lexical_entry_id,display_gloss_es,alternative_glosses_es,confidence,derivation_method,source_gloss_snapshot,status,provenance)
select lexical_entry_id,display_gloss_es,'{}'::text[],96,
 'encoded_source_primary_editorial_map_v2',source_gloss,'verified_derived',
 jsonb_build_object(
   'phase','FASE_H_BLOQUE_3',
   'batch_id','fase_h_es_encoded_generic_safe_001_20260820',
   'source','STEPBible/TAHOT source_gloss en',
   'translation_policy','translate lexical primary component only',
   'technical_annotation_used_as_meaning',false,
   'context_used_as_meaning',false,
   'rv1909_used_as_meaning',false,
   'strong_number',strong_number
 )
from eligible
on conflict (lexical_entry_id) do nothing;