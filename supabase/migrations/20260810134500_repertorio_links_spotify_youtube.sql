alter table public.evento_repertorio
  add column if not exists spotify_url text,
  add column if not exists youtube_url text;
