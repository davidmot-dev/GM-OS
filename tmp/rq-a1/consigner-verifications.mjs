import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const dossier='output/campagnes-tests/runequest';
const hash=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const lire=n=>JSON.parse(fs.readFileSync(path.join(dossier,n),'utf8'));
const medias=lire('verification-medias.json');medias.capturesExaminees=true;
medias.revue='01/11/2026 : neuf rendus examinés en planche ; documents, plans et cartouches lisibles, pas de portrait illustré revendiqué.';
fs.writeFileSync(path.join(dossier,'verification-medias.json'),JSON.stringify(medias,null,2)+'\n');
const noms=fs.readdirSync(path.join(dossier,'captures')).filter(n=>n.endsWith('.jpg')&&!n.startsWith('rendu-'));
assert.equal(noms.length,7);
fs.writeFileSync(path.join(dossier,'verification-captures-electron.json'),JSON.stringify({date:'2026-11-01',capturesExaminees:true,
    rapportElectronSHA256:hash(path.join(dossier,'verification-electron.json')),
    sourceE2ESHA256:hash('e2e/campagneDeRecetteRuneQuest.spec.ts'),helperE2ESHA256:hash('e2e/runequestCoupsDeRecette.ts'),
    captures:noms.map(n=>({fichier:'captures/'+n,sha256:hash(path.join(dossier,'captures',n))})),
    revue:'Sept captures examinées en planche ; coup depuis le jet examiné en taille native : cible Sera Main-Lente, bras gauche 3 PV maximum, 8−2=6 dégâts, zone −3/3 ; trois fiches Hub aux tailles prévues, C09 et PNJ/autonome visibles.'},null,2)+'\n');
const sources=['outils/campagnes-de-recette/runequest.mjs','outils/campagnes-de-recette/runequest-recette.mjs','outils/campagnes-de-recette/runequest.test.ts','outils/campagnes-de-recette/emballer-runequest.mjs','outils/campagnes-de-recette/runequest-verifier-plugin.mjs','e2e/campagneDeRecetteRuneQuest.spec.ts','e2e/runequestCoupsDeRecette.ts','src/modules/session/components/fields/RuneQuestAuJet.tsx','src/modules/remote/logic/caviardageDesJoueurs.ts'];
const provenance=lire('provenance.json');provenance.sourcesDeLaRevision=Object.fromEntries(sources.map(f=>[f,hash(f)]));
provenance.verifications={tests:lire('verification-archives.json').numPassedTests,electron:lire('verification-electron.json').reussi,build:'npm run build réussi le 01/11, tsc -b inclus',lint:'sources de la révision vérifiées',recetteHumaine:'78 cas NON TESTÉS ; les validations précédentes ne les préremplissent pas'};
fs.writeFileSync(path.join(dossier,'provenance.json'),JSON.stringify(provenance,null,2)+'\n');
console.log('Revues visuelles et empreintes consignées.');
