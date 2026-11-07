import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync,execFileSync} from 'node:child_process';
const lire=(...args)=>execFileSync('git',args,{encoding:'utf8',windowsHide:true}).trim();
assert.equal(lire('branch','--show-current'),'production');
const fichiers=(rep)=>fs.readdirSync(rep,{withFileTypes:true}).flatMap(e=>{
    if(e.isDirectory()&&e.name.startsWith('traces'))return [];
    const f=path.posix.join(rep,e.name);return e.isDirectory()?fichiers(f):[f];
});
const p='documentation/Planning/',u='documentation/User Guides/';
const groupes=[
 {titre:'fix(remote): retirer les secrets de seance des flux joueurs',corps:'David demande de corriger GM-05, puis valide les essais. Vider gmSecrets dans le filtre commun sans modifier les donnees du meneur. Conserver les regressions et les preuves sur quatre jeux et douze Hub.',fichiers:[
  'src/modules/remote/logic/caviardageDesJoueurs.ts','src/modules/remote/logic/caviardageDesJoueurs.test.ts','e2e/secretsDeSeance.spec.ts',u+'62-Tablette-des-joueurs-reglages-fins.md',p+'2026-11-01-correction-gm05.md',p+'2026-11-01-etat-et-reprise-codex-gm05.md',...fichiers('output/verification-gm05')]},
 {titre:'fix(runequest): afficher les PV de la cible choisie',corps:'A la demande de David, corriger RQ-A2 : afficher les PV maximum de la zone sur la fiche de la cible, sans reprendre ceux du lanceur. Mettre a jour localisation, journal, tests et manuel. Correction essayee et validee par David.',fichiers:[
  'src/modules/session/components/fields/RuneQuestAuJet.tsx','src/modules/session/components/fields/PanneauDeJet.tsx','src/modules/session/components/fields/PanneauDeJet.runequest.test.tsx','e2e/capturesDesJeux.spec.ts',u+'53-Les-jeux-et-leurs-mecaniques.md',u+'54-Jeu-RuneQuest.md',u+'captures/jeu-runequest-suites.jpg',p+'2026-11-01-etat-et-reprise-codex-runequest-pv-cible.md',...fichiers('output/verification-runequest-pv-cible')]},
 {titre:'feat(recette): aligner les campagnes RuneQuest sur le pilote 2.1.0',corps:'David demande RQ-A1 puis confirme : c est teste, commit et pousse. Livrer trois archives 2.1.0/320 champs, 78 cas et les preuves d import, de coups localises, de soins et de persistance. Conserver l historique et les resultats initiaux. Ajouter l analyse des quatre nouveaux pilotes et le plan actualise : GM-05, RQ-A2 et RQ-A1 valides.',fichiers:[
  ...['runequest.mjs','runequest-recette.mjs','runequest.test.ts','emballer-runequest.mjs','runequest-verifier-plugin.mjs'].map(n=>'outils/campagnes-de-recette/'+n),'e2e/campagneDeRecetteRuneQuest.spec.ts','e2e/runequestCoupsDeRecette.ts',...fichiers('output/campagnes-tests/runequest'),
  ...['2026-08-23-chantiers-gares.md','2026-10-20-ameliorations-tous-les-pilotes.md','2026-10-30-etat-et-reprise-codex-campagnes-runequest.md','2026-11-01-analyse-nouveaux-pilotes.md','2026-11-01-analyse-nouveaux-pilotes.json','2026-11-01-etat-et-reprise-codex-analyse-pilotes.md','2026-11-01-etat-et-reprise-codex-runequest-recette-210.md','2026-11-01-etat-et-reprise-codex-publication-pilotes.md'].map(n=>p+n)]},
];
const [operation,numero]=process.argv.slice(2),index=Number(numero)-1;
if(operation==='plan'){console.log(JSON.stringify(groupes.map(({titre,fichiers})=>({titre,fichiers:fichiers.length})),null,2));process.exit(0);}
const groupe=groupes[index];assert(groupe);
if(operation==='stage'){
    assert.equal(lire('diff','--cached','--name-only'),'','Index deja occupe : ne pas inclure le travail d un autre agent.');
    for(const f of groupe.fichiers)assert(fs.existsSync(f),f);
    const r=spawnSync('git',['add','--',...groupe.fichiers],{stdio:'inherit',windowsHide:true});assert.equal(r.status,0);
    const ajoutes=lire('diff','--cached','--name-only','-z').split('\0').filter(Boolean);
    for(const f of ajoutes)assert(groupe.fichiers.includes(f),f);
    console.log('Index controle :',ajoutes.length,'fichiers pour',groupe.titre);
}else if(operation==='commit'){
    const ajoutes=lire('diff','--cached','--name-only','-z').split('\0').filter(Boolean);assert(ajoutes.length);
    for(const f of ajoutes)assert(groupe.fichiers.includes(f),f);
    const message='tmp/commit-pilotes/message-'+numero+'.txt';
    fs.writeFileSync(message,groupe.titre+'\n\n'+groupe.corps+'\n\nCo-Authored-By: Codex <noreply@openai.com>\n');
    const r=spawnSync('git',['commit','--file',message],{stdio:'inherit',windowsHide:true});process.exit(r.status??1);
}else throw new Error('Operation inconnue');
