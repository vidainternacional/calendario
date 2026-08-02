-- FASE D · Bloque 4
-- Conserva una partición canónica sin solapamientos: Joel 1 y Joel 2–3.

update public.biblical_context_units
set enabled = false,
    review_status = 'rejected',
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'disabled_reason', 'overlapping_noncanonical_scope',
      'replaced_by', jsonb_build_array('joel-1','joel-2-3'),
      'disabled_at', now()
    ),
    updated_at = now()
where slug in ('joel-1-2-crisis-retorno','joel-2-3-espiritu-naciones');

select internal.import_biblical_context_batch(
  'profetas-menores',
  'profetas-menores-v1-2026-08-02',
  $books$[
    {
      "code":"JOL","slug":"joel","name":"Joel","chapters":3,
      "summary":"Joel parte de una devastación agrícola para convocar duelo y retorno, reelabora el día de YHWH y anuncia restauración, justicia y derramamiento del Espíritu.",
      "historical":"La fecha exacta es debatida; el libro presupone templo y comunidad organizada, pero no nombra un rey. La plaga y sequía reflejan una economía dependiente de cosechas.",
      "jewish":"Joel integra ayuno, asamblea y oración comunitaria. Su promesa del Espíritu sobre toda carne fue releída en tradiciones judías y cristianas.",
      "literary":"Una crisis local se amplía hacia lenguaje cósmico y juicio de naciones, mientras el centro del libro insiste en volver de corazón.",
      "intent":"Convertir una emergencia colectiva en llamado a solidaridad, oración y cambio, y sostener que la presencia divina puede alcanzar a toda clase de personas.",
      "reflection":"La crisis puede abrir espacio para una comunidad más inclusiva, donde edad, género y posición no limitan el don del Espíritu.",
      "cautions":"No debe declararse que toda plaga o desastre sea castigo identificable. El lenguaje cósmico no ofrece un calendario científico ni permite fijar fechas del fin.",
      "terms":["día de YHWH","langostas","retorno","Espíritu","toda carne"],
      "groups":["habitantes de Judá","sacerdotes","naciones"],
      "places":["Jerusalén","Sion","valle de Josafat"]
    }
  ]$books$::jsonb,
  $sections$[
    {"code":"JOL","slug":"joel-1","start":1,"end":1,"title":"Langostas, duelo y convocatoria","summary":"Una devastación agrícola interrumpe alimento y culto, y convoca a ancianos, agricultores y sacerdotes a lamentar y reunirse.","intent":"Convertir la crisis en memoria compartida, oración y responsabilidad comunitaria.","cautions":"No debe afirmarse que toda plaga sea castigo directo ni usarse el duelo para promover prácticas dañinas.","terms":["langostas","duelo","asamblea","sacerdotes"],"reflection":"","groups":[],"places":[]},
    {"code":"JOL","slug":"joel-2-3","start":2,"end":3,"title":"Retorno, Espíritu y justicia entre naciones","summary":"El llamado a volver de corazón conduce a restauración, al Espíritu sobre toda carne y a una visión de justicia por la violencia ejercida contra pueblos vulnerables.","intent":"Unir arrepentimiento sincero, participación amplia y esperanza de que la violencia no tendrá la última palabra.","cautions":"La profecía no autoriza afirmaciones personales infalibles ni la identificación automática de crisis modernas con el día de YHWH.","terms":["retorno","Espíritu","toda carne","Sion","justicia"],"reflection":"","groups":[],"places":[]}
  ]$sections$::jsonb
);