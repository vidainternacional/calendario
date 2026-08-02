-- FASE D · Bloque 4
-- Libros importados en numeración TAGNT; la traducción activa resuelve sus correspondencias.

select internal.import_stepbible_tagnt_book(
  '2Co','2CO',256,4477,70,
  '7fe679d34b271ee732d7999fd19a674d1152928a256f043da91c7e4b2d3cf73b',
  'https://raw.githubusercontent.com/STEPBible/STEPBible-Data/b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39/Translators%20Amalgamated%20OT%2BNT/TAGNT%20Act-Rev%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt',
  '524e32375361e6d3fa2f7ef00b87605fdc4317a762f395651a05fdc31ad031b7'
);

select internal.import_stepbible_tagnt_book(
  '3Jn','3JN',15,218,3,
  'a0e9c91652a6a8bdad97da6c0244cc70c4f9bee1a89e881adabfa85f9fe2cf35',
  'https://raw.githubusercontent.com/STEPBible/STEPBible-Data/b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39/Translators%20Amalgamated%20OT%2BNT/TAGNT%20Act-Rev%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt',
  '524e32375361e6d3fa2f7ef00b87605fdc4317a762f395651a05fdc31ad031b7'
);

select internal.import_stepbible_tagnt_book(
  'Rev','REV',405,9850,335,
  '5e60cb8fc26d8708453def7c6d833767b7aafd9a13e0bf964908461d31c0dfb9',
  'https://raw.githubusercontent.com/STEPBible/STEPBible-Data/b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39/Translators%20Amalgamated%20OT%2BNT/TAGNT%20Act-Rev%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt',
  '524e32375361e6d3fa2f7ef00b87605fdc4317a762f395651a05fdc31ad031b7'
);
