// Contrôle du pilote Traveller (skill finir-un-pilote) — 26/11/2026.
// Lit state.json, passe controlerLePilote (zéro constat exigé), prépare de vrais jets avec le moteur
// (preparerLeJet) sur les exemples du livre de règles français v2.2 (pages imprimées ; PDF = imprimée + 1),
// et fait passer un coup et un soin par la porte des dégâts.
// Usage : node outils/traveller/verifier_pilote.mjs [chemin.gmos-driver]
//   sans argument : Export Dirvers/corriges/Traveller-2.1.0.gmos-driver
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
const { santeDeDepart, valeurDuChamp } = await import('../../src/modules/combat/logic/SanteDuCombattant.ts');
const { champsProposes } = await import('../../src/modules/dice/demandeDeJet.ts');
const { resoudreTraveller, modificateursDeTraveller, CHOIX_DE_TRAVELLER } = await import('../../src/modules/dice/systemes/traveller.ts');
const { physiqueDeTravellerSelonLeJeu, alignerLaFicheDeTraveller } = await import('../../src/modules/combat/logic/physiqueDeTraveller.ts');

const fichier = process.argv[2] ?? 'Export Dirvers/corriges/Traveller-2.1.0.gmos-driver';
const { gameDriver: pilote, sheetTemplate: fiche } = JSON.parse(new AdmZip(fichier).readAsText('state.json'));
const constats = controlerLePilote(pilote, fiche);
console.log(JSON.stringify({ fichier, version: pilote.version, constats }, null, 2));
assert.deepEqual(constats, [], 'le pilote doit passer sans constat');

const base = Object.fromEntries(fiche.sections.flatMap(s => s.fields).map(f => [f.id, f.defaultValue]));
const preparer = (valeurs, champs) => preparerLeJet(pilote.jet, { ...base, ...valeurs }, { champs, difficulte: 1, desSupplementaires: 0 }, fiche.sections);

// p. 59 : Kathya (DEX 10, Furtivité 0) 2D+1 ; Erik (DEX 6, Furtivité 2) 2D+2 ; Morn (DEX 12, sans Furtivité) 2D−1.
const furtif = { caracteristique: 'dexterite', competence: 'furtivite' };
const kathya = preparer({ dexterite: 10, furtivite: '0' }, furtif);
const erik = preparer({ dexterite: 6, furtivite: '2' }, furtif);
const morn = preparer({ dexterite: 12, furtivite: '' }, furtif);
assert.deepEqual([kathya.seuil, erik.seuil, morn.seuil], [1, 2, -1], 'Kathya, Erik, Morn');
for (const j of [kathya, erik, morn]) {
    assert.deepEqual(j.avertissements, []);
    assert.equal(j.reussitesRequises, 1, 'une somme contre le nombre cible : une réussite');
    assert.equal(j.nombreDeDes, 2);
}
// p. 61 : 4 et 3, MD+3, tâche Moyenne → 10, Effet 2.
const jet = resoudreTraveller([4, 3], 0, modificateursDeTraveller(3, CHOIX_DE_TRAVELLER), 8);
assert.deepEqual([jet.total, jet.traveller.effet, jet.traveller.bilan], [10, 2, 'succes-moyen']);
// p. 69 : Polyvalent 2, sans Pilote → MD−1 ; p. 58 : une spécialité d'Ingénieur ouvre les autres au niveau 0.
assert.equal(preparer({ polyvalent: '2', pilote_1: '' }, { competence: 'pilote_1' }).seuil, -1);
assert.equal(preparer({ ingenieur_1: '1', ingenieur_1_specialite: 'Propulseur-S', ingenieur_2: '' }, { competence: 'ingenieur_2' }).seuil, 0);
assert.equal(preparer({ profession_1: '2', profession_2: '' }, { competence: 'profession_2' }).seuil, -3, 'Profession, p. 69');

// Le menu : les caractéristiques par leur nom, la spécialité saisie en précision, sans les cases de spécialité.
const valeurs = { ...base, aeronef_1_specialite: 'Avion' };
const menuCarac = champsProposes(pilote.jet.seuil[0], fiche.sections, valeurs).map(c => c.id);
assert.deepEqual(menuCarac.slice(0, 7), ['force', 'dexterite', 'endurance', 'intellect', 'education', 'statut_social', 'psi']);
assert.ok(!menuCarac.some(id => id.endsWith('_md')), 'les MD ne se choisissent pas');
const menuComp = new Map(champsProposes(pilote.jet.seuil[1], fiche.sections, valeurs).map(c => [c.id, c.label]));
assert.equal(menuComp.get('aeronef_1'), 'Aéronef — Avion');
assert.equal(menuComp.get('aeronef_2'), 'Aéronef (spécialité 2)');
assert.ok(!menuComp.has('aeronef_1_specialite') && !menuComp.has('competence_libre_1'), 'ni spécialité ni ligne libre sans nom');
assert.equal(menuComp.size, 67, '67 lignes nommées ; les 5 libres apparaissent une fois nommées');

// La santé : END + FOR + DEX ; un coup de 10 sur 7/6/8 → END 0, FOR 3 (p. 74).
const voyageur = { ...base, endurance: 7, force: 6, dexterite: 8, endurance_max: 7, force_max: 6, dexterite_max: 8, sante_physique: 21 };
assert.equal(santeDeDepart(pilote.combat.santeDeDepart, c => valeurDuChamp(voyageur, c)), 21);
const coup = physiqueDeTravellerSelonLeJeu(pilote.combat.physiqueTraveller, voyageur, { value: 10 }, pilote.combat.statsToTrack);
assert.deepEqual([coup.fiche.endurance, coup.fiche.force, coup.fiche.dexterite, coup.fiche.force_md, coup.impact.value], [0, 3, 8, -1, 10]);
const aligne = alignerLaFicheDeTraveller(pilote, { ...voyageur, dexterite: 9, dexterite_max: 9 });
assert.equal(aligne.dexterite_md, 1);
assert.equal(aligne.sante_physique, 22);
// 2.1.0 (TRV-A5, 27/11) : la PSI dépensée garde son maximum, son MD suit la PSI actuelle (p. 224-225) ;
// les Rads sont une dose sans maximum, l'END permanente se retire de l'END et de son maximum (p. 78).
const psi = alignerLaFicheDeTraveller(pilote, { ...voyageur, psi: 4, psi_max: 9, psi_md: 1 });
assert.deepEqual([psi.psi_md, psi.psi_max], [-1, undefined]);
assert.equal(alignerLaFicheDeTraveller(pilote, { ...voyageur, psi: 10 }).psi_max, 10);
assert.equal(pilote.combat.statsToTrack.find(s => s.fieldId === 'psi').max, 'psi_max');
assert.deepEqual(pilote.combat.radiationsTraveller, { champ: 'rads', endurance: 'endurance', maximum: 'endurance_max' });
assert.ok(!pilote.combat.statsToTrack.find(s => s.fieldId === 'rads').max, 'une dose, pas une jauge');
// Une créature du bestiaire entre avec ses PdV (p. 81) : la colonne remplit la santé principale.
assert.equal(pilote.bestiaire.colonnes.find(c => c.id === 'pdv').champ, 'sante_physique');
console.log('OK : zéro constat ; PSI et Rads (2.1.0) ; Kathya, Erik, Morn (p. 59), Effet 2 (p. 61), Polyvalent et spécialités (p. 58, 69), menu, dégâts (p. 74), bestiaire.');
