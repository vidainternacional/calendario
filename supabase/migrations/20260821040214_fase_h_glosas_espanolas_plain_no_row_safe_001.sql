-- FASE H / Bloque 3 — glosas españolas plain sin fila editorial, lote seguro 001.
-- 27 entradas aprobadas/habilitadas que no tienen display_gloss_es ni fila previa
-- en biblical_hebrew_spanish_glosses.
--
-- Traducción editorial conservadora de la glosa fuente inglesa TAHOT.
-- No se modifica biblical_lexical_entries ni se usa contexto bíblico como significado.
-- Insert-only + ON CONFLICT DO NOTHING.
--
-- Reversión exacta:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id'='fase_h_es_plain_no_row_safe_001_20260820';

with map(lexical_entry_id, expected_source_gloss, display_gloss_es) as (values
 ('ec023736-771e-4a85-b672-7ef0f1428077'::uuid,'dram','dárico'),
 ('cda5c052-17a1-4f8d-8df4-b7956a8603a2'::uuid,'to pitch','acampar'),
 ('8c097eea-0aba-4f24-b177-d9648c6ba4da'::uuid,'Ashbea','Asbea'),
 ('e44ed1dd-4704-4fd6-b402-d4a26268c585'::uuid,'watch','vigilia'),
 ('80397053-1ac5-4505-ac00-9c34fc3df8e4'::uuid,'refuse','desechos'),
 ('afc73b29-dedd-4cb9-8513-49236cf0106f'::uuid,'[Obj.]','marcador de objeto directo'),
 ('6b6e0ec6-9afe-4b05-a6bb-b0909dabb2bf'::uuid,'swallow','golondrina'),
 ('f88ef901-e77e-4a08-8197-7767173d1e9d'::uuid,'olive','olivo'),
 ('07907bd6-62e1-4a8d-8a6e-bc7b3397d3ed'::uuid,'set','unión'),
 ('3e44c562-0334-4682-aa04-ea0d96c082f6'::uuid,'to mince','andar con pasos cortos'),
 ('0ae42005-5900-4e5d-afef-d2d579ce88de'::uuid,'weave','tejido'),
 ('c86333c8-09b4-458e-b82f-0b8ecbac1de6'::uuid,'to commit','entregar'),
 ('e3c54820-8c4c-4a82-9701-c4000ca121a8'::uuid,'rank','formación'),
 ('39fe0563-6beb-430f-a2c2-27180a2f7d1b'::uuid,'plane','cepillo'),
 ('dde974d6-f658-471d-bc00-c422abf7cea6'::uuid,'socket','cavidad'),
 ('e5c47261-a674-4a12-8b7d-6cd82c29e72b'::uuid,'stock','cepo'),
 ('5897c889-ecab-4f6d-ab6e-ff4f4cf396b3'::uuid,'produce','producto'),
 ('a0d9f55b-7ef0-41d7-b835-3940217b2979'::uuid,'till','hasta'),
 ('b0dd3ae2-4399-4bda-9e98-87b54e071370'::uuid,'to luxuriate','deleitarse'),
 ('d8182963-001a-4e82-b25e-3ff0e138c785'::uuid,'pipe','instrumento de viento'),
 ('655e3d75-87cc-48fc-82e7-2fc2f33d1cc7'::uuid,'from with','de junto a'),
 ('bfc98865-04e8-4dea-bcae-bb203933cb9c'::uuid,'close','junto a'),
 ('fb0fc73e-9760-4437-8947-b54825910029'::uuid,'Parbar','Parbar'),
 ('4b7c79c0-303b-417b-ae24-854340587673'::uuid,'watch','vigilancia'),
 ('3d34d56e-8e29-41ee-aa19-855f3ea9f866'::uuid,'rank','fila'),
 ('5d7517cc-5ffe-43cf-b8a7-b693a24ac6dc'::uuid,'onycha','uña aromática'),
 ('59d961c1-46ef-42a9-bd7a-d77fd109294d'::uuid,'to do three','hacer por tercera vez')
), eligible as (
 select l.id as lexical_entry_id,l.strong_number,l.source_gloss,map.display_gloss_es
 from map
 join public.biblical_lexical_entries l
   on l.id=map.lexical_entry_id
  and l.source_gloss=map.expected_source_gloss
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
 'exact_source_gloss_editorial_map_v2',source_gloss,'verified_derived',
 jsonb_build_object(
   'phase','FASE_H_BLOQUE_3',
   'batch_id','fase_h_es_plain_no_row_safe_001_20260820',
   'source','STEPBible/TAHOT source_gloss en',
   'translation_policy','conservative editorial Spanish mapping',
   'strong_number',strong_number,
   'context_used_as_meaning',false,
   'rv1909_used_as_meaning',false
 )
from eligible
on conflict (lexical_entry_id) do nothing;