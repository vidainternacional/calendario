-- Extiende exclusivamente las categorías de los videos nuevos de VIDA; no cambia RLS ni otras tablas.
-- Reversión no destructiva: la app puede volver a la versión anterior conservando las columnas y registros.
alter table public.vida_devocionales
  add column if not exists serie_titulo text,
  add column if not exists serie_episodio integer;

alter table public.vida_devocionales
  drop constraint if exists vida_devocionales_tipo_check;
alter table public.vida_devocionales
  add constraint vida_devocionales_tipo_check
  check (tipo in ('mensaje','devocional','serie','estudio_biblico','ensenanza','reflexion','testimonio','conferencia','capacitacion'));

alter table public.vida_devocionales
  add constraint vida_devocionales_serie_completa_check
  check (
    (tipo = 'serie' and serie_titulo is not null and length(btrim(serie_titulo)) between 1 and 100
      and serie_episodio between 1 and 999)
    or (tipo <> 'serie' and serie_titulo is null and serie_episodio is null)
  );

create unique index if not exists vida_devocionales_serie_episodio_unico
  on public.vida_devocionales(autor_id,lower(btrim(serie_titulo)),serie_episodio)
  where tipo = 'serie';
