import fs from 'node:fs';
let s=fs.readFileSync('tmp/verifier-film-alien.mjs','utf8').replaceAll("'output/clips/alien'","'output/clips/blade-runner'").replaceAll('alien-mecanismes-modules-et-tablette','blade-runner-mecanismes-et-tablette').replaceAll('# Alien —','# Blade Runner —');fs.writeFileSync('tmp/verifier-film-br.mjs',s);
