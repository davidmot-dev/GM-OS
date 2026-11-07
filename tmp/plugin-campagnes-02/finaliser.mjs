import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const distant=JSON.parse(fs.readFileSync('tmp/plugin-campagnes-02/source-distante-02.json','utf8'));
const racine='outils/gmos-campagnes-tests/plugin/gmos-campagnes-tests';
assert.equal(distant.plugin.current_release_id,'pluginrel_6ae784876888819193041fb11ecaaf72');
assert.equal(distant.plugin.version,'0.2.0');assert.equal(distant.plugin.scope,'USER');assert.equal(distant.plugin.discoverability,'PRIVATE');
const sha=b=>createHash('sha256').update(b).digest('hex');
const fichiers=[];
for(const f of distant.files){
    const local=fs.readFileSync(racine+'/'+f.path,'utf8'),lu=distant.contents[f.path];
    assert.equal(typeof lu,'string',f.path);
    if(f.path.endsWith('plugin.json'))assert.deepEqual(JSON.parse(lu),JSON.parse(local),f.path);
    else assert.equal(lu,local,f.path);
    fichiers.push({path:f.path,sha256Distant:sha(lu),verifie:true});
}
assert.equal(fichiers.length,13);
const compte='outils/gmos-campagnes-tests/plugin-compte.json',ancien=JSON.parse(fs.readFileSync(compte,'utf8'));
const rapport={date:'2026-11-01',plugin_id:distant.plugin.plugin_id,plugin_url:ancien.plugin_url,version:'0.2.0',current_release_id:distant.plugin.current_release_id,scope:distant.plugin.scope,discoverability:distant.plugin.discoverability,
    archive:'dist/gmos-campagnes-tests-0.2.0.zip',sha256Archive:sha(fs.readFileSync('outils/gmos-campagnes-tests/dist/gmos-campagnes-tests-0.2.0.zip')),
    publicationRelue:true,fichiers,testsUtilitaire:{passes:12,donnees:'fictives, temporaires, hors ligne',casAjoute:'archive unique, douze séances et ateliers dans la même campagne'},
    controles:['Identité et public conservés','Trois prompts de lancement conservés exactement','Manifestes portable et compatibilité synchronisés','Liens Markdown et YAML contrôlés','Utilitaire et icône inchangés','Paquet rouvert et comparé','Treize fichiers relus après publication'],
    portee:'Instructions publiées et contrôles structurels ; aucune nouvelle campagne jouable générée ou importée et aucun ancien lot converti.'};
fs.writeFileSync('outils/gmos-campagnes-tests/verification-version-0.2.0.json',JSON.stringify(rapport,null,2)+'\n');
fs.writeFileSync(compte,JSON.stringify({...ancien,current_release_id:rapport.current_release_id,version:rapport.version,updated:'2026-11-01',previous_release_id:ancien.current_release_id,verified_files:fichiers.map(f=>f.path),verification:'verification-version-0.2.0.json',note:'Mise à jour du plugin privé existant vers une campagne complète unique et ateliers intégrés ; treize fichiers distants relus, identité et prompts conservés.'},null,2)+'\n');
const p='documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md';
let texte=fs.readFileSync(p,'utf8');
const ancre='**Priorités transversales réévaluées le 01/11 (les quatre nouveaux pilotes).**';assert(texte.includes(ancre));
assert(!texte.includes('**Format des futures campagnes d’essais — décision du 01/11/2026.**'));
const ajout='**Format des futures campagnes d’essais — décision du 01/11/2026.** David demande d’appliquer à toutes les prochaines créations une campagne complète, généralement **10 à 15 séances**, dans **un seul .gmos**, avec intrigue suivie, arcs, conséquences et fins ; ateliers de recette intégrés dans un acte hors fiction de la même Trame. Le plugin [GM-OS Campagnes de test](https://chatgpt.com/plugins/plugins_6ae484c30bd4819186676a390b1b74bf) **0.2.0 est publié et relu** ; procédure locale synchronisée. États de référence pour une restauration locale/manuelle des seuls champs d’essai ; Nexus Remplacer concerne toute la campagne. Les anciens lots et leur validation restent inchangés ; plusieurs campagnes seulement sur demande explicite. Douze tests structurels et paquet vérifiés, pas de nouvelle campagne créée par cette mise à jour. [Reprise](2026-11-01-etat-et-reprise-codex-plugin-campagne-complete.md).\n\n';
texte=texte.replace(ancre,ajout+ancre);fs.writeFileSync(p,texte);
console.log('Version 0.2.0 publiée et relue : 13 fichiers conformes ; métadonnées et synthèse actualisées.');
