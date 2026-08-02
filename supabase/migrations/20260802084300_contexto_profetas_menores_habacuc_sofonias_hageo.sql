-- FASE D · Bloque 4 · Profetas menores 3
select internal.import_biblical_context_batch(
  'profetas-menores',
  'profetas-menores-v1-2026-08-02',
  $books$[
    {
      "code":"HAB","slug":"habacuc","name":"Habacuc","chapters":3,
      "summary":"Habacuc dialoga con Dios sobre violencia interna y el uso de Babilonia como instrumento, recibe una visión sobre fe y justicia, y termina con una oración de confianza.",
      "historical":"El libro refleja el ascenso babilónico a fines del siglo VII a. C. y la crisis de Judá ante violencia, corrupción y amenaza imperial.",
      "jewish":"Habacuc pertenece al Libro de los Doce. Su protesta fiel y la declaración sobre vivir por fidelidad han tenido amplia recepción judía y cristiana.",
      "literary":"Está construido como diálogo de quejas y respuestas, seguido de ayes y una oración poética con lenguaje teofánico.",
      "intent":"Permitir preguntas honestas sobre el gobierno de Dios, anunciar el fin del opresor y formar una perseverancia que espera sin negar la crisis.",
      "reflection":"La fe no es ausencia de preguntas, sino fidelidad que aprende a esperar y alegrarse aun cuando las seguridades materiales fallan.",
      "cautions":"«El justo vivirá por su fe» no debe separarse de la espera por justicia. La descripción babilónica no legitima violencia sagrada moderna.",
      "terms":["queja","fe","visión","ayes"],
      "groups":["judíos","babilonios"],
      "places":["Judá","Babilonia"]
    },
    {
      "code":"ZEP","slug":"sofonias","name":"Sofonías","chapters":3,
      "summary":"Sofonías anuncia el día de YHWH contra Judá y las naciones, llama a buscar humildad y termina con purificación, reunión y gozo de Dios sobre su pueblo.",
      "historical":"Se sitúa en tiempos de Josías, antes o alrededor de sus reformas, cuando Judá aún mostraba idolatría y prácticas asociadas con influencias imperiales.",
      "jewish":"Sofonías integra el Libro de los Doce y une juicio universal, búsqueda humilde y esperanza de un remanente restaurado.",
      "literary":"Avanza desde un barrido cósmico de juicio hacia oráculos geográficos y finalmente una canción de restauración para Sion.",
      "intent":"Sacudir complacencia, llamar a humildad y mostrar que el propósito final de Dios incluye purificar lenguaje, reunir dispersos y habitar con gozo.",
      "reflection":"La humildad busca refugio no en privilegio, sino en Dios. La restauración termina con presencia y alegría, no solo con supervivencia.",
      "cautions":"El día de YHWH no debe usarse para fijar desastres actuales como cumplimiento seguro. El lenguaje universal es poético y teológico.",
      "terms":["día de YHWH","remanente","humildad","gozo"],
      "groups":["judíos","naciones"],
      "places":["Jerusalén","Sion"]
    },
    {
      "code":"HAG","slug":"hageo","name":"Hageo","chapters":2,
      "summary":"Hageo llama a la comunidad retornada a reconstruir el templo, relaciona prioridades, presencia divina, pureza y esperanza davídica.",
      "historical":"Sus mensajes están fechados en 520 a. C. durante el dominio persa, cuando el segundo templo aún no se había completado y la comunidad enfrentaba limitaciones económicas.",
      "jewish":"Hageo forma parte del Libro de los Doce y se vincula con Zorobabel, Josué sumo sacerdote y la reconstrucción narrada en Esdras.",
      "literary":"Cuatro mensajes fechados combinan preguntas, exhortaciones, fórmulas sacerdotales y promesas.",
      "intent":"Reordenar las prioridades de una comunidad desanimada y afirmar que la presencia de Dios acompaña el trabajo común.",
      "reflection":"La reconstrucción espiritual requiere participación, memoria y esperanza; no se reduce a comodidad privada.",
      "cautions":"El llamado a construir el templo no debe usarse para presionar financieramente ni medir la fe por edificios. Las promesas económicas pertenecen a un pacto y crisis concretos.",
      "terms":["templo","Zorobabel","Josué","gloria"],
      "groups":["judíos","persas"],
      "places":["Jerusalén"]
    }
  ]$books$::jsonb,
  $sections$[
    {"code":"HAB","slug":"habacuc-1-2","start":1,"end":2,"title":"Quejas, visión y ayes contra el opresor","summary":"El profeta pregunta por violencia en Judá y por el uso de Babilonia; la respuesta exige esperar y anuncia ayes contra codicia, sangre e idolatría.","intent":"Validar la protesta, llamar a fidelidad paciente y asegurar que el conquistador también será juzgado.","cautions":"«Escribe la visión» no es una técnica para metas personales. La espera se relaciona con justicia histórica y fidelidad.","terms":["queja","visión","fe","ayes"],"reflection":"","groups":[],"places":[]},
    {"code":"HAB","slug":"habacuc-3","start":3,"end":3,"title":"Oración de temor y alegría resistente","summary":"Habacuc recuerda la aparición poderosa de Dios y decide alegrarse aun si campos, rebaños y cosechas fallan.","intent":"Transformar la protesta en confianza que no depende de abundancia inmediata.","cautions":"La alegría no exige negar pérdida ni impedir acciones de supervivencia y justicia.","terms":["oración","teofanía","higuera","alegría"],"reflection":"","groups":[],"places":[]},
    {"code":"ZEP","slug":"sofonias-1-2","start":1,"end":2,"title":"Día de YHWH y llamado a la humildad","summary":"Judá y pueblos vecinos enfrentan juicio por idolatría, violencia y complacencia; los humildes son llamados a buscar a Dios.","intent":"Romper indiferencia y convocar a una respuesta humilde antes del desastre.","cautions":"La descripción cósmica no permite identificar cualquier guerra o crisis como cumplimiento total y exclusivo.","terms":["día de YHWH","complacencia","humildad","naciones"],"reflection":"","groups":[],"places":[]},
    {"code":"ZEP","slug":"sofonias-3","start":3,"end":3,"title":"Ciudad rebelde, remanente y gozo de Dios","summary":"Después de denunciar dirigentes, el poema promete labios purificados, un pueblo humilde, reunión de dispersos y el gozo de Dios en Sion.","intent":"Mostrar que el juicio busca purificación y termina en presencia, dignidad restaurada y celebración.","cautions":"La restauración no borra las denuncias contra autoridades ni debe usarse para evitar responsabilidad institucional.","terms":["remanente","labios puros","gozo","Sion"],"reflection":"","groups":[],"places":[]},
    {"code":"HAG","slug":"hageo-1","start":1,"end":1,"title":"Consideren sus caminos y reconstruyan","summary":"Hageo cuestiona que las casas privadas estén atendidas mientras el templo permanece en ruinas; dirigentes y pueblo responden.","intent":"Movilizar una obra comunitaria y afirmar que Dios está con quienes obedecen en medio de escasez.","cautions":"No debe utilizarse para manipular donaciones ni despreciar necesidades legítimas de vivienda y familia.","terms":["consideren","templo","Zorobabel","Josué"],"reflection":"","groups":[],"places":[]},
    {"code":"HAG","slug":"hageo-2","start":2,"end":2,"title":"Gloria futura, pureza y sello davídico","summary":"Mensajes animan a quienes recuerdan el primer templo, consultan sobre pureza y presentan a Zorobabel como anillo de sello.","intent":"Sostener el trabajo pequeño con la promesa de presencia y ubicar la esperanza política bajo la acción de Dios.","cautions":"La gloria futura no debe medirse solo por riqueza material. El lenguaje sobre sacudir naciones es profético y no un calendario político.","terms":["gloria","pureza","sacudir","anillo de sello"],"reflection":"","groups":[],"places":[]}
  ]$sections$::jsonb
);