import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const racine='outils/gmos-campagnes-tests/plugin/gmos-campagnes-tests';
const ancien=JSON.parse(fs.readFileSync('tmp/plugin-campagnes-02/source-distante.json','utf8'));
const lire=f=>fs.readFileSync(racine+'/'+f,'utf8');
const manifeste=JSON.parse(lire('plugin.json')),compat=JSON.parse(lire('.codex-plugin/plugin.json'));
const original=JSON.parse(ancien.contents['plugin.json']);
assert.equal(manifeste.name,original.name);assert.equal(manifeste.version,'0.2.0');
assert.deepEqual(manifeste.author,original.author);assert.deepEqual(manifeste.keywords,original.keywords);
const {longDescription:_ancienneDescription,...interfaceAvant}=original.extensions['com.openai'].interface;
const {longDescription:_nouvelleDescription,...interfaceApres}=manifeste.extensions['com.openai'].interface;
assert.deepEqual(interfaceApres,interfaceAvant,'Identité, prompts, assets et capacités doivent être conservés');
assert.deepEqual(compat.interface,manifeste.extensions['com.openai'].interface);assert.equal(compat.version,manifeste.version);
for(const f of ['assets/icon.svg','skills/campagnes-de-test/scripts/gmos_bundle.py']){
    // Conserver exactement les sources distantes inchangées, y compris leurs fins de ligne.
    assert.equal(lire(f).replaceAll('\r\n','\n'),ancien.contents[f].replaceAll('\r\n','\n'));
    fs.writeFileSync(racine+'/'+f,ancien.contents[f]);
}
const fichiersModifies=['plugin.json','.codex-plugin/plugin.json','README.md','skills/campagnes-de-test/SKILL.md','skills/campagnes-de-test/agents/openai.yaml',...['methode','contrat-livraison','verification','exemples','format-nexus-v1','campagne-complete'].map(n=>'skills/campagnes-de-test/references/'+n+'.md')];
assert(lire('skills/campagnes-de-test/SKILL.md').includes('une campagne complète dans un seul fichier'));
assert(lire('skills/campagnes-de-test/references/campagne-complete.md').includes('10 à 15 séances'));
assert(!lire('skills/campagnes-de-test/SKILL.md').includes('Le lot habituel comporte trois archives'));
const rapport={plugin_id:ancien.plugin.plugin_id,releaseDepart:ancien.plugin.current_release_id,version:'0.2.0',identiteEtPromptsConserves:true,utilitaireEtIconeInchanges:true,nouveauxServices:0,regle:'une campagne complète, un seul .gmos, ateliers intégrés et restauration locale documentée',fichiers:fichiersModifies.map(f=>({path:f,sha256:createHash('sha256').update(fs.readFileSync(racine+'/'+f)).digest('hex')}))};
fs.writeFileSync('tmp/plugin-campagnes-02/verification-evolution.json',JSON.stringify(rapport,null,2)+'\n');
console.log('Identité, trois prompts, public, utilitaire et icône préservés ; contrat 0.2.0 cohérent.');
