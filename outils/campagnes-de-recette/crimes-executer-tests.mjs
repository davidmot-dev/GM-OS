import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {empreinte} from './archives-de-recette.mjs';
const r='output/campagnes-tests/crimes/',p=JSON.parse(fs.readFileSync(r+'provenance.json','utf8'));
assert.equal(empreinte(fs.readFileSync(r+p.campagne.fichier)),p.campagne.sha256);
const run=spawnSync(process.execPath,[path.resolve('node_modules/vitest/vitest.mjs'),'run','--config','outils/campagnes-de-recette/vitest-crimes.config.mts','--maxWorkers=4','--reporter=json','--outputFile='+r+'verification-vitest.json'],{encoding:'utf8'});
fs.writeFileSync(r+'verification-tests.log',(run.stdout??'')+(run.stderr??''));
const t=JSON.parse(fs.readFileSync(r+'verification-vitest.json','utf8')),fails=t.testResults.flatMap(x=>x.assertionResults).filter(x=>x.status==='failed');
// CRI-A01 corrigé le 24/11/2026 (`caviardageDesJoueurs.ts`, Claude Code, à la demande de David) : la loyauté et les appels ne partent plus vers les joueurs. Plus aucun échec attendu ; le lot livré le 20/11 garde sa preuve d'avant correction.
assert.equal(fails.length,0,fails.map(f=>f.fullName).join('
'));assert.equal(run.status,0);
fs.writeFileSync(r+'verification-tests-lies.json',JSON.stringify({archiveSha256:p.campagne.sha256,rapportSha256:empreinte(fs.readFileSync(r+'verification-vitest.json')),codeVitest:run.status,total:t.numTotalTests,reussis:t.numPassedTests,echecs:t.numFailedTests,anomalie:'aucune — CRI-A01 corrigé le 24/11/2026'},null,2)+'\n');
console.log(JSON.stringify({total:t.numTotalTests,reussis:t.numPassedTests,echecs:t.numFailedTests,anomalie:'aucune'}));
