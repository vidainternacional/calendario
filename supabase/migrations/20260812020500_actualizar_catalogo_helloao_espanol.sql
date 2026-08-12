-- FASE D — Cobertura Bíblica Integral
-- HelloAO actualizó IDs/hashes de su catálogo durante la auditoría.
-- Este snapshot reemplaza únicamente la configuración del importador abierto.
-- Catálogo observado SHA-256: 97b45dbd36e06c76f667beef08e112aea5e9e857b1a81c40c08d397581fc2197

update internal.open_spanish_translation_catalog
set helloao_id='spa_pdt',
    expected_sha256='2d4ef9e30afcdb5916f853bda683685eee7c4ff114e3638a680ce201e1904fb2',
    expected_verses=31081,
    enabled=true
where catalog_key='pdpt';

update internal.open_spanish_translation_catalog
set helloao_id='spa_bes',
    expected_sha256='f931e0f2b01efec63b0073d4fbea0b1facef9f5278eaff4a35650abef1f62ee6',
    expected_verses=31101,
    enabled=true
where catalog_key='bes';

update internal.open_spanish_translation_catalog
set helloao_id='spa_blm',
    expected_sha256='13d53356247bbee736a96febeb3467a3f370d23a8bebce12f4d838bd7928f409',
    expected_verses=31103,
    enabled=true
where catalog_key='blm';

update public.biblical_sources
set provider_version='helloao:spa_pdt',
    metadata=metadata||jsonb_build_object(
      'helloao_id','spa_pdt',
      'helloao_catalog_raw_sha256','97b45dbd36e06c76f667beef08e112aea5e9e857b1a81c40c08d397581fc2197',
      'helloao_catalog_checked_at','2026-08-11'
    ),updated_at=now()
where slug='pdpt-ebible';

update public.biblical_sources
set provider_version='helloao:spa_bes',
    metadata=metadata||jsonb_build_object(
      'helloao_id','spa_bes',
      'helloao_catalog_raw_sha256','97b45dbd36e06c76f667beef08e112aea5e9e857b1a81c40c08d397581fc2197',
      'helloao_catalog_checked_at','2026-08-11'
    ),updated_at=now()
where slug='bes-ebible';

update public.biblical_sources
set provider_version='helloao:spa_blm',
    metadata=metadata||jsonb_build_object(
      'helloao_id','spa_blm',
      'helloao_catalog_raw_sha256','97b45dbd36e06c76f667beef08e112aea5e9e857b1a81c40c08d397581fc2197',
      'helloao_catalog_checked_at','2026-08-11'
    ),updated_at=now()
where slug='blm-ebible';
