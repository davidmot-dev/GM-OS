import fs from 'node:fs';
let s=fs.readFileSync('tmp/verifier-film-alien.mjs','utf8').replaceAll("'output/clips/alien'","'output/clips/bol'").replaceAll('alien-mecanismes-modules-et-tablette','barbarians-of-lemuria-mecanismes-et-tablette').replaceAll('# Alien —','# Barbarians of Lemuria —');fs.writeFileSync('tmp/verifier-film-bol.mjs',s);
