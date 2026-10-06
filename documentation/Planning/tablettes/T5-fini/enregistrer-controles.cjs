const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
// Collecter après les essais, avant de retirer les journaux temporaires.
// Ce script vérifie/consigne les résultats ; il ne relance aucun test.
const RACINE = path.resolve(__dirname, '../../../..');
function journal(nom) {
  const b = fs.readFileSync(path.join(RACINE, nom));
  return b[0] === 255 && b[1] === 254 ? b.toString('utf16le') : b.toString('utf8');
}
function passage(nom, nombre, statut = 'passed') {
  if (!new RegExp(`\\b${nombre} ${statut}\\b`).test(journal(nom))) throw new Error(`${nom} : ${nombre} ${statut} non trouvé`);
}
passage('.tmp-t5-e2e-final.log', 44);
passage('.tmp-t5-accent-final.log', 1);
passage('.tmp-t5-regressions-joueurs.log', 39);
passage('.tmp-t5-regressions-meneur.log', 44);
passage('.tmp-t5-apparence.log', 1);
passage('.tmp-t5-manuel.log', 20);
if (!/707 passed/.test(journal('.tmp-t5-unites-final.log'))) throw new Error('Unitaires T5 non vérifiés');
if (!journal('.tmp-t5-build-final.log').includes('files generated')) throw new Error('Construction T5 non vérifiée');
if (!journal('.tmp-t4-push.log').includes('1a8c8019..edcdb68a')) throw new Error('Push T4 non vérifié');
const galerie = JSON.parse(fs.readFileSync(path.join(__dirname, 'galerie-controles.json'), 'utf8'));
const revueManuel = JSON.parse(fs.readFileSync(path.join(__dirname, 'manuel-controles.json'), 'utf8'));
const lint = JSON.parse(fs.readFileSync(path.join(__dirname, 'lint-compare.json'), 'utf8'));
if (galerie.erreurs.length || galerie.captures !== 132 || revueManuel.erreurs.length || revueManuel.jpeg !== 19 || lint.nouveaux) throw new Error('Galerie, manuel ou lint incomplets');
const sources = [
  'src/components/TabletHub.tsx', 'src/modules/remote/RemoteControl.tsx',
  'src/modules/remote/components/RemoteDiceResultOverlay.tsx',
  'src/components/socle/CadreDeTablette.tsx', 'src/components/socle/tablettes.css',
  'e2e/finiTablettesT5.spec.ts',
  ...['60-Tablette-du-meneur', '61-Tablette-des-joueurs', '62-Tablette-des-joueurs-reglages-fins'].map(n => 'documentation/User Guides/' + n + '.md'),
  ...['regarder-galerie', 'regarder-manuel', 'verifier-lint', 'enregistrer-controles'].map(n => 'documentation/Planning/tablettes/T5-fini/' + n + '.cjs'),
];
const captures = fs.readdirSync(__dirname).filter(f => f.endsWith('.png')).map(f => 'documentation/Planning/tablettes/T5-fini/' + f);
const manuel = fs.readdirSync(path.join(RACINE, 'documentation/User Guides/captures')).filter(f => /^tablette-.*\.jpg$/.test(f)).map(f => 'documentation/User Guides/captures/' + f);
const empreintes = [...sources, ...captures, ...[...galerie.planches, ...revueManuel.planches].map(p => 'documentation/Planning/tablettes/T5-fini/' + p), ...manuel].map(source => ({ source, sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(RACINE, source))).digest('hex') }));
fs.writeFileSync(path.join(__dirname, 'controles-integration.json'), JSON.stringify({
  date: '2026-10-07', phase: 'T5 fini des deux tablettes',
  autorisation: 'David : commit, push et fais T5, GM-os est fermé. Aucun essai physique supplémentaire déclaré.',
  t4: { commit: 'edcdb68a', pousse: true, unitairesPrePush: 6774, ignores: 4, guidesNotebookLM: 22 },
  construction: { types: 0, code: 0 }, unites: { fichiers: 43, reussis: 707, code: 0 },
  e2e: {
    passageFinal: { reussis: 44, assertionObsoleteAccent: 1 },
    rejeuAccentCorrige: { reussis: 1, echecs: 0 },
    t5DistinctsValides: 45,
    regressions: { joueurs: 39, meneur: 44, apparenceT1: 1, total: 84 },
    distinctsValides: 129, echecsAttendus: 0, manuel: 20,
    historique: 'Jauge fonctionnelle et contraste du focus sur accent plein corrigés après les essais et la relecture. Décor du signal, nom accessible Envoyer, choix de pastille et attente de fin de Synchronisation corrigés dans le banc. Le halo garde la teinte du thème selon le contrat du PC. Passage final : 44 réussis et une assertion devenue obsolète comparant le focus contrasté au focus accent ; assertion corrigée pour contrôler chaque variable du PC, puis rejeu réussi de ce scénario, sans changement du produit. Ainsi 45 scénarios T5 distincts validés ; 84 régressions jouées avant le dernier ajustement de couleur du focus, sans changement de disposition ou de geste ; manuel rejoué sur le build final.',
  },
  lint: { reference: 'edcdb68a', fichiers: 5, nouveaux: 0 },
  galerie: { captures: galerie.captures, erreurs: [], regardees: true, planches: galerie.planches },
  manuel: { jpeg: manuel.length, regardes: true },
  limites: 'Edge sur cinq formats, profils et campagne fictifs. Les appareils réels, Safari, la lisibilité à la table et la reconnexion après veille restent en T6.',
  commitT5: false, pushT5: false, empreintes,
}, null, 2));
console.log(`${empreintes.length} empreintes enregistrées ; T4 poussé, T5 vérifié et non commité.`);
