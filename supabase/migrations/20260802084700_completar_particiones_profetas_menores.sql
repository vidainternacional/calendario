-- FASE D · Bloque 4
-- Reemplaza unidades amplias o solapadas por particiones canónicas estables.

update public.biblical_context_units
set enabled = false,
    review_status = 'rejected',
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'disabled_reason', 'overlapping_noncanonical_scope',
      'disabled_at', now()
    ),
    updated_at = now()
where slug in (
  'joel-1-2-crisis-retorno',
  'joel-2-3-espiritu-naciones',
  'miqueas-1-3-injusticia',
  'miqueas-4-7-esperanza-etica',
  'nahum-1-3-caida',
  'zacarias-1-6-visiones',
  'zacarias-7-8-ayuno-justicia',
  'zacarias-9-14-rey-dia'
);

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
    },
    {
      "code":"MIC","slug":"miqueas","name":"Miqueas","chapters":7,
      "summary":"Miqueas denuncia a dirigentes, terratenientes y profetas corruptos en Samaria y Jerusalén, anuncia juicio y promete un gobernante, un remanente y perdón.",
      "historical":"Profetiza en Judá durante el siglo VIII a. C. en el contexto de expansión asiria, caída de Samaria y presión sobre Jerusalén.",
      "jewish":"Miqueas pertenece al Libro de los Doce. Su resumen de justicia, misericordia y humildad, y su esperanza de paz desde Sion, son centrales en su recepción.",
      "literary":"Alterna ciclos de juicio y esperanza, litigios, lamentos, imágenes pastoriles y promesas de restauración.",
      "intent":"Defender a quienes pierden tierra y justicia ante élites, confrontar liderazgo religioso corrupto y sostener esperanza mesiánica y comunitaria.",
      "reflection":"Dios demanda una vida integrada: justicia, amor leal y humildad. Su perdón no trivializa el daño, sino que abre una restauración transformadora.",
      "cautions":"Miqueas 6:8 no debe reducirse a lema abstracto sin sus denuncias económicas y judiciales. Las promesas de reino requieren contexto.",
      "terms":["justicia","hesed","Belén","remanente"],
      "groups":["judíos","israelitas","asirios"],
      "places":["Moreset","Samaria","Jerusalén","Belén"]
    },
    {
      "code":"NAM","slug":"nahum","name":"Nahúm","chapters":3,
      "summary":"Nahúm celebra la caída de Nínive y anuncia el fin de un imperio conocido por violencia, terror y explotación.",
      "historical":"El libro se sitúa entre la caída de Tebas en 663 a. C. y la caída de Nínive en 612 a. C., durante el debilitamiento del imperio asirio.",
      "jewish":"Nahúm forma parte del Libro de los Doce y expresa consuelo para pueblos sometidos al terror imperial, aunque su lenguaje de guerra requiere lectura cuidadosa.",
      "literary":"Incluye himno, anuncio de liberación, poemas de sitio y burlas contra la ciudad imperial.",
      "intent":"Afirmar que el poder violento no es eterno y que Dios escucha el sufrimiento producido por imperios depredadores.",
      "reflection":"La justicia divina se opone a sistemas que convierten vidas en recursos y miedo en política.",
      "cautions":"La alegría por la caída de Nínive nace de trauma imperial; no autoriza odio étnico, violencia personal ni celebración indiscriminada del sufrimiento civil.",
      "terms":["Nínive","Asiria","venganza","buenas noticias"],
      "groups":["asirios","judíos","naciones"],
      "places":["Nínive","Tebas","Judá"]
    },
    {
      "code":"ZEC","slug":"zacarias","name":"Zacarías","chapters":14,
      "summary":"Zacarías anima la reconstrucción mediante visiones nocturnas, oráculos mesiánicos y escenas apocalípticas que proyectan purificación, reinado y adoración universal.",
      "historical":"Los primeros capítulos están fechados en el período persa durante la reconstrucción del templo; los capítulos posteriores presentan un horizonte literario y temporal más difícil de precisar.",
      "jewish":"Zacarías pertenece al Libro de los Doce. Sus visiones, figuras sacerdotales y esperanza para Jerusalén influyeron en expectativas judías sobre restauración y mesianismo.",
      "literary":"Los capítulos 1–8 reúnen visiones simbólicas y mensajes fechados; 9–14 contienen oráculos poéticos con rey humilde, pastor, duelo y día de YHWH.",
      "intent":"Llamar al retorno ético, afirmar que Dios vuelve a Sion y sostener esperanza de liderazgo purificado y futuro para las naciones.",
      "reflection":"La obra de Dios combina reconstrucción concreta y esperanza que supera los recursos humanos. La santidad alcanza la vida cotidiana.",
      "cautions":"Los símbolos y fechas no deben transformarse en predicciones políticas precisas. Las figuras mesiánicas poseen interpretaciones diversas que deben distinguirse.",
      "terms":["visiones","sumo sacerdote","renuevo","rey humilde"],
      "groups":["judíos","persas","naciones"],
      "places":["Jerusalén","Sion"]
    }
  ]$books$::jsonb,
  $sections$[
    {"code":"JOL","slug":"joel-1","start":1,"end":1,"title":"Langostas, duelo y convocatoria","summary":"Una devastación agrícola interrumpe alimento y culto, y convoca a ancianos, agricultores y sacerdotes a lamentar y reunirse.","intent":"Convertir la crisis en memoria compartida, oración y responsabilidad comunitaria.","cautions":"No debe afirmarse que toda plaga sea castigo directo ni usarse el duelo para promover prácticas dañinas.","terms":["langostas","duelo","asamblea","sacerdotes"],"reflection":"","groups":[],"places":[]},
    {"code":"JOL","slug":"joel-2-3","start":2,"end":3,"title":"Retorno, Espíritu y justicia entre naciones","summary":"El llamado a volver de corazón conduce a restauración, al Espíritu sobre toda carne y a una visión de justicia por la violencia ejercida contra pueblos vulnerables.","intent":"Unir arrepentimiento sincero, participación amplia y esperanza de que la violencia no tendrá la última palabra.","cautions":"La profecía no autoriza afirmaciones personales infalibles ni la identificación automática de crisis modernas con el día de YHWH.","terms":["retorno","Espíritu","toda carne","Sion","justicia"],"reflection":"","groups":[],"places":[]},
    {"code":"MIC","slug":"miqueas-1-3","start":1,"end":3,"title":"Caída, tierras robadas y líderes corruptos","summary":"Samaria y Jerusalén son acusadas; propietarios toman campos, gobernantes dañan al pueblo y profetas ajustan mensajes a pagos.","intent":"Nombrar la conexión entre idolatría, economía depredadora y corrupción de liderazgo.","cautions":"Las metáforas violentas denuncian abuso; no deben reproducirse para humillar a personas vulnerables.","terms":["Samaria","campos","líderes","profetas"],"reflection":"","groups":[],"places":[]},
    {"code":"MIC","slug":"miqueas-4-5","start":4,"end":5,"title":"Sion, paz y gobernante desde Belén","summary":"Las naciones suben a aprender, las armas se transforman, el remanente es reunido y se espera un gobernante vinculado con Belén.","intent":"Contrastar el liderazgo corrupto con un futuro de enseñanza, paz, cuidado y seguridad bajo Dios.","cautions":"La visión de paz no autoriza imponer religión por fuerza. La interpretación mesiánica debe reconocer su contexto en Judá.","terms":["Sion","paz","Belén","remanente"],"reflection":"","groups":[],"places":[]},
    {"code":"MIC","slug":"miqueas-6-7","start":6,"end":7,"title":"Litigio, vida justa y perdón","summary":"Dios recuerda su fidelidad, resume la respuesta ética, denuncia fraude y termina celebrando al Dios que perdona y mantiene amor leal.","intent":"Definir la verdadera respuesta de pacto como justicia, hesed y humildad, y cerrar con esperanza de perdón.","cautions":"El resumen ético no sustituye culto ni doctrina, pero impide separarlos de la vida. El perdón no evita reparación.","terms":["litigio","justicia","hesed","perdón"],"reflection":"","groups":[],"places":[]},
    {"code":"NAM","slug":"nahum-1","start":1,"end":1,"title":"Himno de justicia y buenas noticias para Judá","summary":"Dios es presentado como paciente y poderoso contra el mal, mientras se anuncia alivio del yugo asirio.","intent":"Consolar a quienes sufren opresión afirmando que el terror imperial no es definitivo.","cautions":"La venganza divina no es permiso para venganza privada ni para atribuir nuestras hostilidades a Dios.","terms":["justicia","refugio","yugo","buenas noticias"],"reflection":"","groups":[],"places":[]},
    {"code":"NAM","slug":"nahum-2-3","start":2,"end":3,"title":"Caída y exposición de Nínive","summary":"Poemas de batalla describen el colapso de la ciudad y exponen su comercio violento, engaño y explotación de pueblos.","intent":"Desenmascarar la aparente invencibilidad de un imperio y dar lenguaje de alivio a sus víctimas.","cautions":"El lenguaje de humillación refleja guerra antigua y trauma; no debe reproducirse como violencia verbal contra comunidades actuales.","terms":["Nínive","sitio","león","imperio"],"reflection":"","groups":[],"places":[]},
    {"code":"ZEC","slug":"zacarias-1-6","start":1,"end":6,"title":"Ocho visiones nocturnas","summary":"Jinetes, cuernos, una cuerda, el sumo sacerdote, el candelabro, el rollo y carros comunican regreso, purificación y protección.","intent":"Asegurar a la comunidad que Dios ve, limpia y fortalece la reconstrucción más allá de su debilidad.","cautions":"Los símbolos no deben asignarse arbitrariamente a personas actuales. La purificación sacerdotal no elimina rendición de cuentas.","terms":["visiones","Josué","Zorobabel","candelabro"],"reflection":"","groups":[],"places":[]},
    {"code":"ZEC","slug":"zacarias-7-8","start":7,"end":8,"title":"Ayuno, justicia y futuro de Sion","summary":"Una pregunta sobre ayunos conduce a recordar la injusticia anterior y a prometer una Jerusalén de ancianos, niños y pueblos que buscan a Dios.","intent":"Reorientar prácticas religiosas hacia verdad, justicia y misericordia, y presentar restauración como vida comunitaria segura.","cautions":"La promesa de ciudad segura no debe usarse para ignorar riesgos concretos ni para reclamar superioridad política moderna.","terms":["ayuno","justicia","ancianos","naciones"],"reflection":"","groups":[],"places":[]},
    {"code":"ZEC","slug":"zacarias-9-11","start":9,"end":11,"title":"Rey humilde y pastores en conflicto","summary":"Oráculos anuncian un rey humilde, liberación y una compleja alegoría pastoral sobre rechazo, salario y liderazgo quebrado.","intent":"Contrastar dominio militar con un reinado de paz y exponer el daño de pastores infieles.","cautions":"Las figuras pastorales son difíciles y deben interpretarse con prudencia; no justifican identificar apresuradamente líderes actuales con personajes simbólicos.","terms":["rey humilde","pastor","treinta piezas","paz"],"reflection":"","groups":[],"places":[]},
    {"code":"ZEC","slug":"zacarias-12-14","start":12,"end":14,"title":"Duelo, purificación y día de YHWH","summary":"Jerusalén atraviesa conflicto y duelo, se abre una fuente de purificación y la visión termina con Dios como rey y santidad extendida a lo cotidiano.","intent":"Proyectar una restauración que incluye arrepentimiento, limpieza, juicio y adoración universal.","cautions":"Las escenas de batalla y geografía transformada pertenecen a visión profética y no son permiso para violencia territorial moderna.","terms":["duelo","fuente","día de YHWH","santidad"],"reflection":"","groups":[],"places":[]}
  ]$sections$::jsonb
);

update public.biblical_context_units unit
set metadata = coalesce(unit.metadata, '{}'::jsonb) || jsonb_build_object(
      'generated_by_ai', true,
      'review_level', 'ai_assisted_editorial',
      'human_review_status', 'pending',
      'quality_tier', 'contextual_synthesis',
      'not_a_primary_source', true,
      'canonical_seed', true
    ),
    updated_at = now()
where unit.source_id = (
  select id from public.biblical_sources where slug = 'vida-contexto-editorial'
);