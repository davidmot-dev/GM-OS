import fs from 'node:fs';
import crypto from 'node:crypto';
const root = 'output/coc-a4-a6';
const synthese = 'documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md';
let s = fs.readFileSync(synthese, 'utf8');
s = s.replaceAll('Réalisé en 2.2.0 le 04/11, vérifications en cours, essai David restant', 'Livré en 2.2.0, clôture technique le 05/11 : 9 871 tests et deux parcours Electron réussis, essai David restant');
s = s.replaceAll('2.2.0 le 04/11, vérifications en cours, essai David restant', '2.2.0, clôture technique le 05/11 : 9 871 tests et deux parcours Electron réussis, essai David restant');
s = s.replace('corpus19/19 relu, contrôles finaux en cours', 'corpus 19/19 relu, 9 871 tests et deux parcours Electron réussis, neuf captures 2.2 relues (clôture le 05/11)');
fs.writeFileSync(synthese, s);
for (const nom of ['heroisme', 'psychisme', 'voies', 'voies-hub']) {
  fs.copyFileSync(`${root}/jeu-coc-${nom}.jpg`, `documentation/User Guides/captures/jeu-coc-${nom}.jpg`);
}
for (const nom of fs.readdirSync(`${root}/captures-communes`)) {
  fs.copyFileSync(`${root}/captures-communes/${nom}`, `documentation/User Guides/captures/${nom}`);
}
const hashes = {};
for (const variante of ['d20', 'option-3d6']) {
  const nom = `COC-2.2.0-${variante}.gmos-driver`;
  const copie = fs.readFileSync(`${root}/pilote/${nom}`);
  const remise = fs.readFileSync(`Export Dirvers/corriges/coc/${nom}`);
  if (!copie.equals(remise)) throw new Error(`Copies différentes : ${nom}`);
  hashes[variante] = crypto.createHash('sha256').update(copie).digest('hex');
}
const rapport = {
  dateDebut: '2026-11-04', dateClotureTechnique: '2026-11-05', pilote: '2.2.0',
  types: 'npx tsc -b : réussi (construction finale)',
  construction: 'npm run build : réussi après correction du titre au journal',
  lint: { erreurs: 0, avertissements: 1, preexistant: 'src/components/hub/useSaisieDifferee.ts : directive eslint-disable inutilisée', dernierPanneauModifie: 'eslint ciblé sans diagnostic' },
  vitest: { commande: 'npx vitest run --maxWorkers=4', fichiersReussis: 833, fichiersIgnores: 1, testsReussis: 9871, testsIgnores: 4, echecs: 0, nouveauxTestsDepuisA1A3: 24, testsCorpus: 138 },
  electron: { scenario: 'e2e/cocAventures.spec.ts', parcoursReussis: 1, dureeSecondes: 34.5, rapport: 'verification-electron.json', formulaireHubEtVraiJournal: true },
  captures: { scenario: 'e2e/capturesDesJeux.spec.ts', filtre: 'seul pilote COC 2.2.0 d20', parcoursReussis: 1, dureeSecondes: 29.1, images22ReluesEtLivreesAuManuel: 9 },
  archives: { sha256: hashes, copiesCorrigesIdentiques: true, identifiantsConserves: true, anciensChampsConserves: true, nouveauxSelecteursDeVoie: 6, constatsDuControleur: 0 },
  validationDavid: 'restante pour COC-A1 à COC-A6', commitEtPush: 'non demandés pour COC',
  limites: ['cinq capacités officielles, six contextes seulement', 'durée finale du choc confirmée par le MJ', '+3 Enragé en 3d6 conservé et ajustable, sans conversion canonique', 'symptômes, thérapie et économie des actions arbitrés à la table']
};
fs.writeFileSync(`${root}/verification-technique.json`, JSON.stringify(rapport, null, 2) + '\n');
