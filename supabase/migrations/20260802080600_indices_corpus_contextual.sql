create index if not exists biblical_books_source_id_idx
  on public.biblical_books (source_id);

create index if not exists biblical_context_units_source_id_idx
  on public.biblical_context_units (source_id);
