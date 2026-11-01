import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

const dossier='output/campagnes-tests/runequest';
const outil=process.env.GMOS_VERIFICATEUR_CAMPAGNES??'C:/Users/david/.codex/plugins/cache/created-by-me-remote/gmos-campagnes-tests/0.1.0/skills/campagnes-de-test/scripts/gmos_bundle.py';
assert(fs.existsSync(outil),'Définir GMOS_VERIFICATEUR_CAMPAGNES vers gmos_bundle.py du plugin.');
const archives=JSON.parse(fs.readFileSync(path.join(dossier,'inventaire.json'),'utf8')).archives;
const rapports=archives.map(({fichier})=>{
    const resultat=spawnSync(process.env.GMOS_PYTHON??'py',['-I','-B','-X','utf8',outil,'verify',path.resolve(dossier,fichier)],{encoding:'utf8',windowsHide:true});
    assert.equal(resultat.status,0,resultat.stderr||String(resultat.error));
    const rapport=JSON.parse(resultat.stdout);assert(rapport.valid,JSON.stringify(rapport.errors));
    return {fichier,...rapport};
});
fs.writeFileSync(path.join(dossier,'verification-plugin.json'),JSON.stringify({outil:'GM-OS Campagnes de test / gmos_bundle.py verify',rapports},null,2)+'\n');
console.log('Trois archives valides selon le contrôle structurel partiel du plugin.');
