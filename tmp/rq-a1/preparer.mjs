import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const racine=path.resolve('output/campagnes-tests/runequest');
const historique=path.join(racine,'historique','2026-10-30-2.0.0');
assert(!fs.existsSync(historique),'Sauvegarde historique déjà créée : ne pas écraser.');
fs.mkdirSync(historique,{recursive:true});
const noms=['RuneQuest-Campagnes-de-recette.zip','RuneQuest-2.0.0.gmos-driver','resultats.csv','inventaire.json','provenance.json','RAPPORT-DE-VERIFICATION.md','ANOMALIES-CONNUES.md','verification-archives.json','verification-contexte.json','verification-plugin.json','verification-electron.json','verification-medias.json','verification-captures-electron.json','verification-lancement.json'];
const empreintes={};
for(const nom of noms){const source=path.join(racine,nom);if(!fs.existsSync(source))continue;fs.copyFileSync(source,path.join(historique,nom));empreintes[nom]=createHash('sha256').update(fs.readFileSync(source)).digest('hex');}
fs.writeFileSync(path.join(historique,'empreintes-conservees.json'),JSON.stringify({dateConservation:'2026-11-01',raison:'RQ-A1 : lot 2.0.0 conservé avant mise à niveau 2.1.0 ; résultats historiques inchangés',fichiers:empreintes},null,2)+'\n');
console.log('Lot historique conservé :',Object.keys(empreintes).length,'fichiers.');
