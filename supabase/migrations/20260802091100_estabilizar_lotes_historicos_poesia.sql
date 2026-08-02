-- FASE D · Bloque 4 · Estabilización de visibilidad y unicidad

update public.biblical_context_units
set review_status='approved', enabled=true, updated_at=now()
where slug in ('josue-perfil','josue-1-5','josue-6-12','josue-13-21','josue-22-24','jueces-perfil','jueces-1-3','jueces-4-9','jueces-10-16','jueces-17-21','rut-perfil','rut-1-1','rut-2-2','rut-3-4','1-samuel-perfil','1-samuel-1-7','1-samuel-8-15','1-samuel-16-24','1-samuel-25-31','2-samuel-perfil','2-samuel-1-6','2-samuel-7-10','2-samuel-11-12','2-samuel-13-20','2-samuel-21-24','1-reyes-perfil','1-reyes-1-4','1-reyes-5-11','1-reyes-12-16','1-reyes-17-22','2-reyes-perfil','2-reyes-1-8','2-reyes-9-17','2-reyes-18-20','2-reyes-21-25','1-cronicas-perfil','1-cronicas-1-9','1-cronicas-10-16','1-cronicas-17-22','1-cronicas-23-29','2-cronicas-perfil','2-cronicas-1-9','2-cronicas-10-20','2-cronicas-21-28','2-cronicas-29-36','esdras-perfil','esdras-1-3','esdras-4-6','esdras-7-8','esdras-9-10','nehemias-perfil','nehemias-1-3','nehemias-4-7','nehemias-8-10','nehemias-11-13','ester-perfil','ester-1-2','ester-3-5','ester-6-7','ester-8-10');

delete from public.biblical_context_units
where book_code in ('JOB','PSA','PRO','ECC','SNG')
  and slug not in ('job-perfil','job-1-2','job-3-31','job-32-37','job-38-42','salmos-perfil','salmos-1-41','salmos-42-72','salmos-73-89','salmos-90-106','salmos-107-145','salmos-146-150','proverbios-perfil','proverbios-1-9','proverbios-10-22','proverbios-23-24','proverbios-25-29','proverbios-30-31','eclesiastes-perfil','eclesiastes-1-2','eclesiastes-3-6','eclesiastes-7-10','eclesiastes-11-12','cantares-perfil','cantares-1-2','cantares-3-5','cantares-6-8');

update public.biblical_context_units
set review_status='approved', enabled=true, updated_at=now()
where book_code in ('JOB','PSA','PRO','ECC','SNG');
