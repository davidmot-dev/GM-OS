// Contrôle du pilote Delta Green (skill finir-un-pilote) — 12/11/2026.
// Lit state.json, passe controlerLePilote (zéro constat exigé sur le 2.0.1), prépare de vrais jets
// avec le moteur (preparerLeJet) et les lit sur l'échelle du livre (Manuel de l'Agent, p. 18, 29,
// 43-44 ; page PDF = imprimée + 1).
// Usage : node outils/delta-green/verifier_pilote.mjs [chemin.gmos-driver]
//   sans argument : Export Dirvers/corriges/Delta-Green-2.0.1.gmos-driver
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
const { degreDuDe } = await import('../../src/modules/dice/degresDeReussite.ts');
const { santeDeDepart } = await import('../../src/modules/combat/logic/SanteDuCombattant.ts');
const { champsProposes } = await import('../../src/modules/dice/demandeDeJet.ts');

const fichier = process.argv[2] ?? 'Export Dirvers/corriges/Delta-Green-2.0.1.gmos-driver';
const { gameDriver: pilote, sheetTemplate: fiche } = JSON.parse(new AdmZip(fichier).readAsText('state.json'));
const constats = controlerLePilote(pilote, fiche);
console.log(JSON.stringify({ fichier, version: pilote.version, constats }, null, 2));
assert.deepEqual(constats, [], 'le pilote doit passer sans constat');

const valeurs = Object.fromEntries(fiche.sections.flatMap(s => s.fields).map(f => [f.id, f.defaultValue]));
Object.assign(valeurs, { armes_a_feu: 50, FOR: 15, CON: 12, SAN: 55, pilotage: 40, pilotage_specialite: 'Hélicoptère' });
const preparer = (champ, choix = {}) => preparerLeJet(pilote.jet, valeurs, { champs: { competence: champ }, difficulte: 1, desSupplementaires: 0, ...choix }, fiche.sections);

// p. 44 : « Si votre Agent a 50 % dans une compétence, un résultat de 01, 11, 22, 33 ou 44 compte comme
// une réussite critique » ; « 55, 66, 77, 88, 99 ou 100 compte comme un échec critique ».
const armes = preparer('armes_a_feu');
assert.equal(armes.seuil, 50);
assert.equal(armes.reussitesRequises, 1, 'un d100, une réussite');
assert.deepEqual(armes.avertissements, []);
const attendus = {
    1: 'reussite-particuliere', 11: 'reussite-particuliere', 22: 'reussite-particuliere', 33: 'reussite-particuliere', 44: 'reussite-particuliere',
    2: 'reussite-normale', 50: 'reussite-normale', 51: 'echec-normal', 98: 'echec-normal',
    55: 'echec-total', 66: 'echec-total', 77: 'echec-total', 88: 'echec-total', 99: 'echec-total', 100: 'echec-total',
};
for (const [de, degre] of Object.entries(attendus)) assert.equal(degreDuDe(Number(de), armes.echelle), degre, `dé ${de} à 50 %`);

// p. 18 : une caractéristique se teste à la valeur × 5 ; p. 43 : ±20 / ±40 %, chances de 1 à 99 %.
assert.equal(preparer('FOR').seuil, 75, 'FOR 15 × 5');
assert.equal(preparer('FOR', { modificateurDuSeuil: -20 }).seuil, 55, 'FOR × 5 − 20');
assert.equal(preparer('FOR', { modificateurDuSeuil: 40 }).seuil, 99, '75 + 40 ramené à 99');
assert.equal(degreDuDe(99, preparer('FOR', { modificateurDuSeuil: 40 }).echelle), 'reussite-particuliere', '99 sous 99 % : un double réussi');
assert.equal(preparer('SAN').seuil, 55, 'la SAN se teste telle quelle');
// p. 29 : une compétence à 0 % ne se tente pas.
assert.ok(preparer('anthropologie').avertissements.some(a => a.includes('0 %')), 'Anthropologie 0 % refusée');
// p. 18 : PV = (FOR + CON) / 2, arrondi au supérieur — FOR 15, CON 12 → 14.
assert.equal(santeDeDepart(pilote.combat.santeDeDepart, c => Number(valeurs[c])), 14);
assert.equal(pilote.combat.statsToTrack.find(s => s.isMainHP)?.fieldId, 'PV');

// Le menu du jet (2.0.1) : la spécialité précise le nom ; sans elle, la compétence reste proposée.
const menu = new Map(champsProposes(pilote.jet.seuil[0], fiche.sections, valeurs).map(c => [c.id, c.label]));
assert.equal(menu.get('pilotage'), 'Pilotage — Hélicoptère');
assert.equal(menu.get('art'), 'Art', 'Art sans spécialité reste au menu');
assert.equal(menu.get('FOR'), 'Force (FOR)');
assert.equal(menu.get('SAN'), 'Santé Mentale (SAN)');
for (const cache of ['PV', 'VOL', 'SR', 'pilotage_specialite', 'autre1']) assert.ok(!menu.has(cache), `${cache} hors du menu`);
assert.equal(menu.size, 42 + 6 + 1, '42 compétences, 6 caractéristiques, la SAN');
console.log('OK : zéro constat ; jet à 50 % conforme à la p. 44 ; FOR × 5, ±40 %, bornes, SAN, 0 %, PV conformes.');
