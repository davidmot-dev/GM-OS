// Contrôle du pilote Argyropée (skill finir-un-pilote) — 08/11/2026.
// Lit state.json, passe controlerLePilote (zéro constat exigé sur le 2.1.0), prépare le
// test de Vanille avec le vrai moteur (preparerLeJet) puis le tire avec des dés imposés.
// Usage : node outils/argyropee/verifier_pilote.mjs [chemin.gmos-driver]
//   sans argument : Export Dirvers/corriges/Argyropee-2.1.0.gmos-driver
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
const argy = await import('../../src/modules/dice/systemes/argyropee.ts');

const fichier = process.argv[2] ?? 'Export Dirvers/corriges/Argyropee-2.1.0.gmos-driver';
const { gameDriver: pilote, sheetTemplate: fiche } = JSON.parse(new AdmZip(fichier).readAsText('state.json'));
const constats = controlerLePilote(pilote, fiche);
console.log(JSON.stringify({ fichier, version: pilote.version, constats }, null, 2));
assert.deepEqual(constats, [], 'le pilote doit passer sans constat');

// Cas témoin du livre (p. 45) : Vanille, Serrurerie 3, métier Malandrin +2.
const valeurs = Object.fromEntries(fiche.sections.flatMap(s => s.fields).map(f => [f.id, f.defaultValue]));
Object.assign(valeurs, { serrurerie: 3, commerce: 3, metier1_nom: 'Malandrin', metier1_bonus: 2, panache: 15 });
const jet = preparerLeJet(pilote.jet, valeurs, { champs: { competence: 'serrurerie' }, difficulte: 1, desSupplementaires: 0 }, fiche.sections);
assert.equal(jet.seuil, 3, 'la compétence seule forme le seuil');
assert.equal(jet.reussitesRequises, 1, 'une réussite, jamais dix');
const metiers = argy.metiersDeLaFiche(pilote.jet.argyropee, valeurs);
assert.deepEqual(metiers, [{ index: 0, libelle: 'Malandrin', bonus: 2 }]);
const bonus = argy.bonusDuMetierChoisi(metiers, 0);
const attendus = { 10: ['echec', 5], 2: ['echec', 7], 4: ['reussite-partielle', 9], 7: ['reussite', 12], 9: ['reussite', 14] };
const tirages = Object.entries(attendus).map(([face, [bilan, total]]) => {
    const r = argy.lancerArgyropee(jet.seuil, bonus, { modificateur: 0, aidants: 0 }, () => Number(face));
    assert.equal(r.argyropee.bilan, bilan);
    assert.equal(r.total, total);
    return `${face} → ${r.totalDisplay}`;
});
// Le Panache de Vanille (p. 85) : Commerce 3, dé 1, 4 points → 8.
const commerce = preparerLeJet(pilote.jet, valeurs, { champs: { competence: 'commerce' }, difficulte: 1, desSupplementaires: 0 }, fiche.sections);
const avant = argy.lancerArgyropee(commerce.seuil, 0, { modificateur: 0, aidants: 0 }, () => 1);
const apres = argy.depenserLePanache(avant, 4);
assert.equal(apres.total, 8);
tirages.push(`Commerce, dé 1 → ${avant.totalDisplay}`, `+4 Panache → ${apres.totalDisplay}`);
console.log(tirages.join('\n'));
console.log('OK : zéro constat, test et Panache conformes au livre.');
