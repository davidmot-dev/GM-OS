import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const source=JSON.parse(fs.readFileSync('tmp/plugin-campagnes-02/source-distante.json','utf8'));
const racine='outils/gmos-campagnes-tests/plugin/gmos-campagnes-tests';
assert.equal(source.plugin.plugin_id,'plugins_6ae484c30bd4819186676a390b1b74bf');
assert.equal(source.plugin.scope,'USER');assert.equal(source.plugin.discoverability,'PRIVATE');
for(const[n,contenu]of Object.entries(source.contents)){
    if(['plugin.json','.codex-plugin/plugin.json'].includes(n))continue;
    assert.equal(fs.readFileSync(path.join(racine,n),'utf8').replaceAll('\r\n','\n'),contenu.replaceAll('\r\n','\n'),'Source locale différente du plugin : '+n);
}
const manifeste=JSON.parse(source.contents['plugin.json']);
const compatibilite=JSON.parse(source.contents['.codex-plugin/plugin.json']);
const description='Créer une campagne complète de recette GM-OS dans un seul .gmos, avec intrigue suivie, ateliers intégrés, médias et cahier de tests.';
const longue='Prépare une campagne originale complète pour GM-OS, généralement de 10 à 15 séances, livrée dans un seul fichier .gmos : intrigue suivie, arcs, PNJ, lieux, indices, rencontres et conséquences. Les ateliers de recette sont intégrés à cette même campagne et accompagnés d’états de référence pour leurs remises à zéro locales. Produit médias, cahier, CSV vierge, guide d’import et rapport. Réutilise les identifiants autorisés des joueurs et distingue vérifications automatiques, essais GM-OS et recette humaine. Aucun serveur ni accès automatique aux données de l’application.';
manifeste.version='0.2.0';manifeste.description=description;
manifeste.extensions['com.openai'].interface.longDescription=longue;
compatibilite.version=manifeste.version;compatibilite.description=description;
compatibilite.interface=structuredClone(manifeste.extensions['com.openai'].interface);
assert.deepEqual(manifeste.extensions['com.openai'].interface.defaultPrompt,JSON.parse(source.contents['plugin.json']).extensions['com.openai'].interface.defaultPrompt);
fs.mkdirSync(racine+'/.codex-plugin',{recursive:true});
fs.writeFileSync(racine+'/plugin.json',JSON.stringify(manifeste,null,2)+'\n');
fs.writeFileSync(racine+'/.codex-plugin/plugin.json',JSON.stringify(compatibilite,null,2)+'\n');
console.log('Identité, public et prompts conservés ; manifestes 0.2.0 préparés.');
