import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {empreinte} from './archives-de-recette.mjs';
const root='output/campagnes-tests/traveller/',pr=JSON.parse(fs.readFileSync(root+'provenance.json','utf8'));
assert.equal(empreinte(fs.readFileSync(root+pr.campagne.fichier)),pr.campagne.sha256);
const run=spawnSync(process.execPath,[path.resolve('node_modules/vitest/vitest.mjs'),'run','--config','outils/campagnes-de-recette/vitest-traveller.config.mts','--maxWorkers=4','--reporter=json','--outputFile='+root+'verification-vitest.json'],{encoding:'utf8'});
fs.writeFileSync(root+'verification-tests.log',(run.stdout??'')+(run.stderr??''));
const r=JSON.parse(fs.readFileSync(root+'verification-vitest.json','utf8'));
const report={archiveSha256:pr.campagne.sha256,rapportSha256:empreinte(fs.readFileSync(root+'verification-vitest.json')),codeVitest:run.status,total:r.numTotalTests,reussis:r.numPassedTests,echecs:r.numFailedTests,import:'Nexus et sauvegarde en mémoire uniquement ; pas Electron',sources:['traveller.test.ts','traveller.setup.ts','vitest-traveller.config.mts','traveller-executer-tests.mjs'].map(n=>({fichier:'outils/campagnes-de-recette/'+n,sha256:empreinte(fs.readFileSync('outils/campagnes-de-recette/'+n))}))};
fs.writeFileSync(root+'verification-tests-lies.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,erreurs:r.testResults.flatMap(t=>t.assertionResults).filter(a=>a.status==='failed').map(a=>({nom:a.fullName,messages:a.failureMessages.map(m=>m.slice(0,1600))}))},null,2));assert.equal(run.status,0);
