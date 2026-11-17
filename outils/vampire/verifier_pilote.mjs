// Contrôle du pilote Vampire V5 (skill finir-un-pilote) — 17/11/2026.
// Lit state.json, passe controlerLePilote (zéro constat exigé sur le 2.0.0), prépare de vrais jets
// avec le moteur (preparerLeJet) sur les exemples du livre de base français, et vérifie la
// correspondance avec la fiche HTML (pages IMPRIMÉES ; page du PDF = imprimée + 4).
// Usage : node outils/vampire/verifier_pilote.mjs [chemin.gmos-driver]
//   sans argument : Export Dirvers/corriges/Vampire-2.0.0.gmos-driver
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
const { champsProposes } = await import('../../src/modules/dice/demandeDeJet.ts');
const { santeDeDepart } = await import('../../src/modules/combat/logic/SanteDuCombattant.ts');
const { resoudreVampire } = await import('../../src/modules/dice/systemes/vampire.ts');
const { verifierLaCorrespondance, lireLaCorrespondance, versLaFiche, versGmOs } = await import('../../src/modules/fiches/correspondanceDeFiche.ts');

const fichier = process.argv[2] ?? 'Export Dirvers/corriges/Vampire-2.0.0.gmos-driver';
const { gameDriver: pilote, sheetTemplate: fiche } = JSON.parse(new AdmZip(fichier).readAsText('state.json'));
const constats = controlerLePilote(pilote, fiche);
console.log(JSON.stringify({ fichier, version: pilote.version, constats }, null, 2));
assert.deepEqual(constats, [], 'le pilote doit passer sans constat');

const valeurs = Object.fromEntries(fiche.sections.flatMap(s => s.fields).map(f => [f.id, f.defaultValue]));
const preparer = (champs, choix = {}, v = valeurs) => preparerLeJet(pilote.jet, v, { champs, difficulte: 3, desSupplementaires: 0, ...choix }, fiche.sections);

// p. 118 : Guillaume, Résolution 3 + Investigation 3 → six dés ; Benoît, Intelligence 3 + Occultisme 2 → cinq.
Object.assign(valeurs, { resolution: 3, investigation: 3, intelligence: 3, occultisme: 2, soif: 0 });
assert.equal(preparer({ attribut: 'resolution', competence: 'investigation' }).vampire.total, 6, 'Guillaume, six dés');
assert.equal(preparer({ attribut: 'intelligence', competence: 'occultisme' }).vampire.total, 5, 'Benoît, cinq dés');
// p. 205 : Claire, Intelligence 3 + Investigation 3, Soif 2 → six dés dont deux de Soif.
const claire = preparer({ attribut: 'intelligence', competence: 'investigation' }, {}, { ...valeurs, soif: 2 });
assert.deepEqual([claire.vampire.total, claire.vampire.ordinaires, claire.vampire.desDeSoif], [6, 4, 2], 'Claire : 6 dés, 2 de Soif');
assert.equal(claire.nombreDeDes, 4);
assert.equal(claire.desSecondaires, 2);
assert.equal(claire.reussitesRequises, 3);
assert.deepEqual(claire.avertissements, []);
// p. 118 : sans la compétence, l'attribut seul, sans pénalité ; Force + Force pour soulever une poutre.
assert.equal(preparer({ attribut: 'intelligence' }).vampire.total, 3, 'attribut seul');
assert.equal(preparer({ attribut: 'force', competence: 'force' }, {}, { ...valeurs, force: 4 }).vampire.total, 8, 'Force + Force');
// p. 119, 205 : un jet de Volonté (la réserve actuelle) ne prend aucun dé de Soif.
const volonte = preparer({ attribut: 'volonte' }, {}, { ...valeurs, volonte: 4, soif: 3 });
assert.deepEqual([volonte.vampire.total, volonte.vampire.desDeSoif, volonte.vampire.sansSoif], [4, 0, true], 'jet de Volonté sans Soif');
// p. 118 : une discipline par son nom ; la spécialité précise la compétence au menu.
const avecNoms = { ...valeurs, discipline_1_nom: 'Célérité', discipline_1: 2, melee: 2, melee_specialites: 'Couteaux' };
const menu = new Map(champsProposes(pilote.jet.reserve.composantes[1], fiche.sections, avecNoms).map(c => [c.id, c.label]));
assert.equal(menu.get('discipline_1'), 'Célérité');
assert.equal(menu.get('melee'), 'Mêlée — Couteaux');
assert.equal(menu.get('armes_a_feu'), 'Armes à feu', 'une compétence sans spécialité reste au menu');
assert.equal(menu.get('dexterite'), 'Dextérité', 'un second attribut');
for (const cache of ['discipline_1_pouvoirs', 'discipline_1_nom', 'melee_specialites', 'discipline_2']) assert.ok(!menu.has(cache), `${cache} hors du menu`);
assert.equal(menu.size, 27 + 9 + 1, '27 compétences, 9 attributs, la discipline nommée');
const premier = new Map(champsProposes(pilote.jet.reserve.composantes[0], fiche.sections, avecNoms).map(c => [c.id, c.label]));
assert.deepEqual([...premier.keys()], ['force', 'dexterite', 'vigueur', 'charisme', 'manipulation', 'sang_froid', 'intelligence', 'astuce', 'resolution', 'volonte', 'humanite']);
// p. 120, 206 : les exemples de David, jugés par la mécanique que le pilote nomme.
assert.equal(resoudreVampire([10, 7, 3, 2], [10, 4], 5).vampire.bilan, 'triomphe-brutal');
// p. 119 : Santé = Vigueur + 3 ; p. 300 : initiative Sang-froid + Vigilance.
assert.equal(santeDeDepart(pilote.combat.santeDeDepart, c => Number({ ...valeurs, vigueur: 3 }[c])), 6);
assert.equal(pilote.combat.statsToTrack.find(s => s.isMainHP)?.fieldId, 'sante');
assert.equal(pilote.combat.statsToTrack.find(s => s.fieldId === 'volonte')?.max, 'resolution + sang_froid');
assert.equal(pilote.combat.initiativeFormula, 'sang_froid + vigilance');

// La correspondance : chaque clé de la fiche HTML est reliée ou déclarée absente, et l'aller-retour tient.
const html = fs.readFileSync('docs/fiches/Vampire/vampire-v5-fiche-personnage-interactive.html', 'utf8');
const gabarit = JSON.parse(html.match(/<script\b[^>]*\bid=["']character-sheet-template["'][^>]*>([\s\S]*?)<\/script>/i)[1]).template;
const cles = new Set(gabarit.pages.flatMap(p => p.fields).map(f => f.key));
const table = lireLaCorrespondance(fs.readFileSync('docs/systems/vampire/fiche/correspondance.json', 'utf8'));
const defauts = verifierLaCorrespondance(table, cles, fiche.sections.flatMap(s => s.fields).map(f => f.id));
assert.deepEqual(defauts, [], 'correspondance sans défaut');
const couvertes = new Set([...table.champs.flatMap(c => [c.fiche].flat()), ...table.absents.map(a => a.fiche)]);
assert.deepEqual([...cles].filter(k => !couvertes.has(k)), [], 'chaque clé HTML est reliée ou absente');
const nadia = { ...avecNoms, discipline_1_pouvoirs: 'Grâce féline\nRapidité', soif: 2, humanite: 7, avantage_1: 'Contacts', avantage_1_niveau: 2 };
const lot = versLaFiche({ sheetData: nadia }, table);
assert.equal(lot['skills.melee'], 2);
assert.equal(lot['specialties.melee'], 'Couteaux');
assert.equal(lot['disciplines.0.powers.1'], 'Rapidité');
assert.equal(lot['tracks.hunger'], 2);
const retour = versGmOs(lot, table).sheetData;
for (const cle of ['melee', 'melee_specialites', 'discipline_1', 'discipline_1_nom', 'discipline_1_pouvoirs', 'soif', 'humanite', 'avantage_1_niveau']) {
    assert.equal(String(retour[cle]), String(nadia[cle]), `aller-retour de ${cle}`);
}
console.log(`OK : zéro constat ; groupements de Guillaume, Benoît et Claire (p. 118, 205) ; attribut seul, Force + Force, jet de Volonté sans Soif ; menu ${menu.size} entrées ; Santé et initiative (p. 119, 300) ; correspondance ${table.champs.length} champs, ${table.absents.length} absents, aller-retour tenu.`);
