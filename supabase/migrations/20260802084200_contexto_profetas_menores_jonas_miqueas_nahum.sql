-- FASE D · Bloque 4 · Profetas menores 2
select internal.import_biblical_context_batch(
  'profetas-menores',
  'profetas-menores-v1-2026-08-02',
  $books$[
    {
      "code":"JON","slug":"jonas","name":"Jonás","chapters":4,
      "summary":"Jonás narra la resistencia de un profeta enviado a Nínive, la misericordia mostrada a una ciudad enemiga y la confrontación final con el enojo del mensajero.",
      "historical":"La historia usa Nínive, capital asiria posterior, como símbolo de poder violento. La forma narrativa y su fecha de composición son debatidas.",
      "jewish":"Jonás se lee en Yom Kippur y enfatiza retorno, misericordia y el alcance del cuidado divino más allá de Israel.",
      "literary":"Es una narración profética satírica con descensos, repeticiones, ironía, oración poética y un final abierto.",
      "intent":"Cuestionar nacionalismo religioso y mostrar que Dios busca el arrepentimiento incluso de enemigos, mientras también transforma al profeta.",
      "reflection":"La gracia puede incomodar cuando alcanza a quienes consideramos indignos. La obediencia externa no garantiza un corazón alineado con la compasión.",
      "cautions":"El pez no es el centro teológico del libro. La historia no minimiza la violencia asiria ni exige confianza ingenua en agresores.",
      "terms":["Nínive","misericordia","gran pez","arrepentimiento"],
      "groups":["israelitas","asirios","marineros"],
      "places":["Jope","Nínive","mar"]
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
    }
  ]$books$::jsonb,
  $sections$[
    {"code":"JON","slug":"jonas-1-2","start":1,"end":2,"title":"Huida, tormenta y oración desde el mar","summary":"Jonás huye, marineros extranjeros responden con temor y el profeta ora después de ser preservado en el gran pez.","intent":"Mostrar el descenso producido por la resistencia y la misericordia que alcanza tanto a marineros como al profeta.","cautions":"La oración de Jonás mezcla gratitud y lenguaje de salmo; no demuestra todavía una transformación completa de su actitud.","terms":["huida","marineros","tormenta","gran pez"],"reflection":"","groups":[],"places":[]},
    {"code":"JON","slug":"jonas-3-4","start":3,"end":4,"title":"Nínive se vuelve y Jonás se enoja","summary":"La ciudad responde al anuncio, Dios suspende el desastre y una planta permite confrontar la falta de compasión de Jonás.","intent":"Dejar al lector ante la pregunta de si aceptará que la misericordia alcance al enemigo arrepentido.","cautions":"El arrepentimiento de Nínive en la narración no elimina la necesidad de evaluar frutos y seguridad en casos reales de agresión.","terms":["Nínive","arrepentimiento","planta","compasión"],"reflection":"","groups":[],"places":[]},
    {"code":"MIC","slug":"miqueas-1-3","start":1,"end":3,"title":"Caída, tierras robadas y líderes corruptos","summary":"Samaria y Jerusalén son acusadas; propietarios toman campos, gobernantes despedazan al pueblo y profetas ajustan mensajes a pagos.","intent":"Nombrar la conexión entre idolatría, economía depredadora y corrupción de liderazgo.","cautions":"Las metáforas violentas denuncian abuso; no deben reproducirse para humillar a personas vulnerables.","terms":["Samaria","campos","líderes","profetas"],"reflection":"","groups":[],"places":[]},
    {"code":"MIC","slug":"miqueas-4-5","start":4,"end":5,"title":"Sion, paz y gobernante desde Belén","summary":"Las naciones suben a aprender, las armas se transforman, el remanente es reunido y se espera un gobernante vinculado con Belén.","intent":"Contrastar el liderazgo corrupto con un futuro de enseñanza, paz, cuidado y seguridad bajo Dios.","cautions":"La visión de paz no autoriza imponer religión por fuerza. La interpretación mesiánica debe reconocer su contexto en Judá.","terms":["Sion","paz","Belén","remanente"],"reflection":"","groups":[],"places":[]},
    {"code":"MIC","slug":"miqueas-6-7","start":6,"end":7,"title":"Litigio, vida justa y perdón","summary":"Dios recuerda su fidelidad, resume la respuesta ética, denuncia fraude y termina celebrando al Dios que perdona y mantiene amor leal.","intent":"Definir la verdadera respuesta de pacto como justicia, hesed y humildad, y cerrar con esperanza de perdón.","cautions":"El resumen ético no sustituye culto ni doctrina, pero impide separarlos de la vida. El perdón no evita reparación.","terms":["litigio","justicia","hesed","perdón"],"reflection":"","groups":[],"places":[]},
    {"code":"NAM","slug":"nahum-1","start":1,"end":1,"title":"Himno de justicia y buenas noticias para Judá","summary":"Dios es presentado como paciente y poderoso contra el mal, mientras se anuncia alivio del yugo asirio.","intent":"Consolar a quienes sufren opresión afirmando que el terror imperial no es definitivo.","cautions":"La venganza divina no es permiso para venganza privada ni para atribuir nuestras hostilidades a Dios.","terms":["justicia","refugio","yugo","buenas noticias"],"reflection":"","groups":[],"places":[]},
    {"code":"NAM","slug":"nahum-2-3","start":2,"end":3,"title":"Caída y exposición de Nínive","summary":"Poemas de batalla describen el colapso de la ciudad y exponen su comercio violento, engaño y explotación de pueblos.","intent":"Desenmascarar la aparente invencibilidad de un imperio y dar lenguaje de alivio a sus víctimas.","cautions":"El lenguaje de humillación refleja guerra antigua y trauma; no debe reproducirse como violencia verbal contra comunidades actuales.","terms":["Nínive","sitio","león","imperio"],"reflection":"","groups":[],"places":[]}
  ]$sections$::jsonb
);