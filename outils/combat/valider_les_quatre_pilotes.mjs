// Validation finale des quatre pilotes du chantier Combat-OS (registre § 263, T19, 19/11/2026).
// David : « je voudrais qu'on valide tous les drivers au final ».
//
// Pour chacun : `controlerLePilote` sans constat, puis un vrai jet préparé (`preparerLeJet`) sur un
// cas tiré du livre, et le jet proposé à un adversaire par « Attaquer » (`attaqueParDefaut`).
//   - Blade Runner 2.1.0 : l'Agent du LAPD (bestiaire du livre), Agilité C + Armes à feu C → 2D8.
//   - Alien 1.11.0 : Attribut + Compétence en dés de base, Niveau de stress en dés de stress
//     (corpus `alien/rules`, p. 60-62) : Agilité 4 + Combat à distance 3, Stress 1 → 7 + 1 D6.
//   - Cthulhu Hack 1.2.0 : une Sauvegarde, un d20 « moins ou égal » (corpus, « Sauvegardes ») :
//     Force 12 → seuil 12.
//   - Dune 2.0.0 : deux d20 sous Compétence + Principe (corpus, « Tests de compétence ») ; un PNJ
//     mineur a une compétence à 6 et une seule valeur de principe (livre p. 327) → seuil 12.
// Les bestiaires de Blade Runner et de Cthulhu Hack ont leur propre contrôle, à lancer aussi :
// `outils/blade-runner/verifier_bestiaire.mjs` et `outils/cthulhu-hack/verifier_bestiaire.mjs`.
//
// Usage : node outils/combat/valider_les_quatre_pilotes.mjs
//   GMOS_PILOTE_DUNE=<chemin> pour un autre export de Dune que celui du 11/11.
import '../campagnes-de-recette/charger-typescript.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';
import { registerHooks } from 'node:module';
registerHooks({ load(url, contexte, suivant) {
    return url.endsWith('.json') ? { format: 'module', source: `export default ${fs.readFileSync(new URL(url), 'utf8')};`, shortCircuit: true } : suivant(url, contexte);
} });
const { controlerLePilote } = await import('../../src/modules/forge/rules/controlesDuPilote.ts');
const { preparerLeJet } = await import('../../src/modules/dice/DescripteurDeJet.ts');
const { attaqueParDefaut } = await import('../../src/modules/combat/logic/attaqueDeLAdversaire.ts');

const lire = fichier => JSON.parse(new AdmZip(fichier).readAsText('state.json'));
const CAS = [
    {
        jeu: 'Blade Runner', fichier: 'Export Dirvers/corriges/Blade-Runner-2.1.0.gmos-driver', version: '2.1.0',
        valeurs: { vigueur: 'B (D10)', agilite: 'C (D8)', armesAFeu: 'C (D8)', sante: 5, santeMax: 5 },
        champs: { attribut: 'agilite', competence: 'armesAFeu' },
        attendu: j => assert.deepEqual(j.desEchelonnes.map(d => d.faces), [8, 8], 'C (D8) + C (D8)'),
        dire: j => `${j.desEchelonnes.map(d => `D${d.faces}`).join(' + ')}`,
    },
    {
        jeu: 'Alien', fichier: 'Export Dirvers/corriges/Alien-1.11.0.gmos-driver', version: '1.11.0',
        // Valeurs imprimées en texte au catalogue (« Puissance 9 », « Spécial », équipage « 2-24 ») :
        // 17 depuis la 1.9.0, 17 de plus en 1.11.0 — consignés au registre Alien (14 et 15/11).
        avertissementsConnus: 34,
        valeurs: { force: 3, agilite: 4, combat_a_distance: 3, niveau_de_stress: 1, sante: 4 },
        champs: { attribut: 'agilite', 'compétence': 'combat_a_distance', stress: 'niveau_de_stress' },
        attendu: j => { assert.equal(j.nombreDeDes, 7, 'Agilité 4 + Combat à distance 3'); assert.equal(j.desSecondaires, 1, 'Stress 1'); assert.equal(j.faces, 6); },
        dire: j => `${j.nombreDeDes} dés de base + ${j.desSecondaires} dé de stress, D${j.faces}`,
    },
    {
        jeu: 'Cthulhu Hack', fichier: 'Export Dirvers/corriges/Cthulhu-Hack-1.2.0.gmos-driver', version: '1.2.0',
        valeurs: { force: 12, dexterite: 11, constitution: 10, hp: 9 },
        champs: { sauvegarde: 'force' },
        attendu: j => { assert.equal(j.seuil, 12); assert.equal(j.faces, 20); assert.equal(j.sens, 'sous-ou-egal'); },
        dire: j => `1d20 ${j.sens} ${j.seuil}`,
    },
    {
        jeu: 'Dune', fichier: process.env.GMOS_PILOTE_DUNE ?? 'Export Dirvers/Dune_driver_gmos_1794393367137.gmos-driver', version: '2.0.0',
        valeurs: { combat: 6, discipline: 5, mob: 5, domination: 6 },
        champs: { competence: 'combat', principe: 'domination' },
        attendu: j => { assert.equal(j.seuil, 12, 'Combat 6 + Domination 6'); assert.equal(j.nombreDeDes, 2); assert.equal(j.faces, 20); },
        dire: j => `${j.nombreDeDes}d20 sous ${j.seuil}, difficulté ${j.reussitesRequises}`,
    },
];

const bilan = [];
for (const c of CAS) {
    const { gameDriver: pilote, sheetTemplate: gabarit } = lire(c.fichier);
    assert.equal(pilote.version, c.version, `${c.jeu} : version`);
    const constats = controlerLePilote(pilote, gabarit);
    // Zéro erreur ; seuls des avertissements déjà connus, et seulement sur des valeurs du catalogue.
    assert.deepEqual(constats.filter(x => x.gravite !== 'avertissement'), [], `${c.jeu} : aucune erreur`);
    assert.ok(constats.every(x => /^catalogue\.objets\[\d+\]\.valeurs\./.test(x.ou)), `${c.jeu} : un avertissement hors du catalogue`);
    assert.equal(constats.length, c.avertissementsConnus ?? 0, `${c.jeu} : avertissements connus`);
    const jet = preparerLeJet(pilote.jet, c.valeurs, { champs: c.champs, difficulte: pilote.jet.difficulte?.defaut ?? 0, desSupplementaires: 0 }, gabarit.sections);
    assert.deepEqual(jet.avertissements, [], `${c.jeu} : le jet se prépare sans avertissement`);
    c.attendu(jet);
    const proposee = attaqueParDefaut(pilote, [], c.valeurs);
    bilan.push({ jeu: c.jeu, version: pilote.version, erreurs: 0, avertissements: constats.length, jet: c.dire(jet), attaqueProposee: JSON.stringify(proposee) });
}
console.table(bilan);
console.log('OK : quatre pilotes sans erreur (avertissements connus seulement), quatre jets du livre préparés sans avertissement.');
