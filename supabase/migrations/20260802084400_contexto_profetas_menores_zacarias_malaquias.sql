-- FASE D · Bloque 4 · Profetas menores 4
select internal.import_biblical_context_batch(
  'profetas-menores',
  'profetas-menores-v1-2026-08-02',
  $books$[
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
    },
    {
      "code":"MAL","slug":"malaquias","name":"Malaquías","chapters":4,
      "summary":"Malaquías disputa con sacerdotes y pueblo sobre culto despreocupado, injusticia, fidelidad del pacto y la venida de un mensajero que preparará el día de YHWH.",
      "historical":"Refleja la comunidad del segundo templo bajo dominio persa, después de la reconstrucción, cuando persistían desánimo, desigualdad y prácticas cultuales deficientes.",
      "jewish":"Malaquías cierra el Libro de los Doce. Su llamado a recordar la Torá de Moisés y su promesa de Elías conectan profecía, pacto y esperanza futura.",
      "literary":"Se organiza como disputas: Dios afirma algo, el pueblo pregunta y el profeta responde con acusación, evidencia y promesa.",
      "intent":"Confrontar cinismo religioso y exigir honor, justicia, fidelidad matrimonial y responsabilidad comunitaria mientras se espera la intervención de Dios.",
      "reflection":"La rutina religiosa puede ocultar indiferencia. Dios atiende tanto el altar como salarios, relaciones y trato al vulnerable.",
      "cautions":"Los textos sobre diezmos no deben usarse como mecanismo de coerción o promesa de enriquecimiento. Las disputas matrimoniales requieren sensibilidad pastoral y legal.",
      "terms":["mensajero","pacto","diezmo","Elías"],
      "groups":["judíos","sacerdotes"],
      "places":["Judá","Jerusalén"]
    }
  ]$books$::jsonb,
  $sections$[
    {"code":"ZEC","slug":"zacarias-1-6","start":1,"end":6,"title":"Ocho visiones nocturnas","summary":"Jinetes, cuernos, una cuerda, el sumo sacerdote, el candelabro, el rollo y carros comunican regreso, purificación y protección.","intent":"Asegurar a la comunidad que Dios ve, limpia y fortalece la reconstrucción más allá de su debilidad.","cautions":"Los símbolos no deben asignarse arbitrariamente a personas actuales. La purificación sacerdotal no elimina rendición de cuentas.","terms":["visiones","Josué","Zorobabel","candelabro"],"reflection":"","groups":[],"places":[]},
    {"code":"ZEC","slug":"zacarias-7-8","start":7,"end":8,"title":"Ayuno, justicia y futuro de Sion","summary":"Una pregunta sobre ayunos conduce a recordar la injusticia anterior y a prometer una Jerusalén de ancianos, niños y pueblos que buscan a Dios.","intent":"Reorientar prácticas religiosas hacia verdad, justicia y misericordia, y presentar restauración como vida comunitaria segura.","cautions":"La promesa de ciudad segura no debe usarse para ignorar riesgos concretos ni para reclamar superioridad política moderna.","terms":["ayuno","justicia","ancianos","naciones"],"reflection":"","groups":[],"places":[]},
    {"code":"ZEC","slug":"zacarias-9-11","start":9,"end":11,"title":"Rey humilde y pastores en conflicto","summary":"Oráculos anuncian un rey humilde, liberación y una compleja alegoría pastoral sobre rechazo, salario y liderazgo quebrado.","intent":"Contrastar dominio militar con un reinado de paz y exponer el daño de pastores infieles.","cautions":"Las figuras pastorales son difíciles y deben interpretarse con prudencia; no justifican identificar apresuradamente líderes actuales con personajes simbólicos.","terms":["rey humilde","pastor","treinta piezas","paz"],"reflection":"","groups":[],"places":[]},
    {"code":"ZEC","slug":"zacarias-12-14","start":12,"end":14,"title":"Duelo, purificación y día de YHWH","summary":"Jerusalén atraviesa conflicto y duelo, se abre una fuente de purificación y la visión termina con Dios como rey y santidad extendida a lo cotidiano.","intent":"Proyectar una restauración que incluye arrepentimiento, limpieza, juicio y adoración universal.","cautions":"Las escenas de batalla y geografía transformada pertenecen a visión profética y no son permiso para violencia territorial moderna.","terms":["duelo","fuente","día de YHWH","santidad"],"reflection":"","groups":[],"places":[]},
    {"code":"MAL","slug":"malaquias-1-2","start":1,"end":2,"title":"Amor disputado, sacerdocio y fidelidad","summary":"El pueblo cuestiona el amor de Dios; sacerdotes ofrecen culto despreocupado y se denuncian traición al pacto y relaciones quebradas.","intent":"Restaurar honor en el culto y fidelidad en la vida relacional, especialmente entre quienes enseñan y representan el pacto.","cautions":"Los textos matrimoniales no deben forzar a permanecer en abuso ni simplificar situaciones legales complejas. La responsabilidad sacerdotal es central.","terms":["amor","altar","sacerdotes","pacto"],"reflection":"","groups":[],"places":[]},
    {"code":"MAL","slug":"malaquias-3-4","start":3,"end":4,"title":"Mensajero, justicia y memoria de la Torá","summary":"Un mensajero prepara la visita de Dios, se denuncian salarios retenidos y abandono del vulnerable, y el libro concluye con Moisés y Elías.","intent":"Llamar a una fidelidad verificable mientras se espera purificación y justicia.","cautions":"La ventana del cielo no garantiza enriquecimiento individual por donar. El juicio comienza con prácticas económicas y comunitarias concretas.","terms":["mensajero","refinador","diezmo","Elías"],"reflection":"","groups":[],"places":[]}
  ]$sections$::jsonb
);