// Lie le rapport aux octets réellement testés ; garde l'assertion VAM-A01 en échec.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {empreinte} from './archives-de-recette.mjs';
const dir=path.resolve('output/campagnes-tests/vampire');
const pr=JSON.parse(fs.readFileSync(path.join(dir,'provenance.json'),'utf8'));
const archive=path.join(dir,pr.campagne.fichier),before=empreinte(fs.readFileSync(archive));
assert.equal(before,pr.campagne.sha256);
const report=path.join(dir,'verification-vitest.json');
const run=spawnSync(process.execPath,['node_modules/vitest/vitest.mjs','run','--config','outils/campagnes-de-recette/vitest-vampire.config.mts','--maxWorkers=4','--reporter=json',`--outputFile=${report}`],{encoding:'utf8'});
if(run.stdout)process.stdout.write(run.stdout);if(run.stderr)process.stderr.write(run.stderr);
assert.ok(fs.existsSync(report),'Rapport de test absent');
const r=JSON.parse(fs.readFileSync(report,'utf8'));
const failed=r.testResults.flatMap(s=>s.assertionResults??[]).filter(t=>t.status==='failed');
assert.equal(failed.length,1,'Tout nouvel échec bloque la livraison');
assert.ok(failed[0].fullName.includes('[VAM-A01]'),'Échec non autorisé par le registre des anomalies');
assert.equal(r.numFailedTests,1);assert.equal(r.numPendingTests,0);assert.equal(run.status,1,'La suite conserve bien son code d’échec');
assert.equal(empreinte(fs.readFileSync(archive)),before,'Archive modifiée pendant les essais');
const sources=['outils/campagnes-de-recette/vampire.test.ts','outils/campagnes-de-recette/vitest-vampire.config.mts'];
const binding={archive:pr.campagne,rapportSha256:empreinte(fs.readFileSync(report)),sources:sources.map(fichier=>({fichier,sha256:empreinte(fs.readFileSync(fichier))})),
 controles:r.numTotalTests,reussis:r.numPassedTests,echecs:r.numFailedTests,conformiteGlobale:false,anomalies:[{id:'VAM-A01',statut:'ÉCHEC CONSTATÉ',test:failed[0].fullName,attendu:6,observe:5}],importElectron:false,hubReseau:false};
fs.writeFileSync(path.join(dir,'verification-tests-liaison.json'),JSON.stringify(binding,null,2)+'\n');
console.log(`${r.numPassedTests} contrôles réussis ; 1 ÉCHEC conservé : VAM-A01, cinq cases au lieu de six. Le lot reste PRÉPARÉ, pas déclaré conforme en application.`);
