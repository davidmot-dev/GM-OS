// Contrôle du pilote Vampire V5 (skill finir-un-pilote) — 17/11/2026.
// Lit state.json, passe controlerLePilote (zéro constat exigé sur le 2.2.0), prépare de vrais jets
// avec le moteur (preparerLeJet) sur les exemples du livre de base français, et vérifie la
// correspondance avec la fiche HTML (pages IMPRIMÉES ; page du PDF = imprimée + 4).
// Usage : node outils/vampire/verifier_pilote.mjs [chemin.gmos-driver]
//   sans argument : Export Dirvers/corriges/Vampire-2.2.0.gmos-driver
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
const { degatsDeVampireSelonLeJeu } = await import('../../src/modules/combat/logic/pistesDeVampire.ts');
const { typesDeDegats } = await import('../../src/modules/combat/logic/TypesDeDegats.ts');
const { exemplairesDeLaCreature } = await import('../../src/modules/combat/logic/invocationDeRencontre.ts');

const fichier = process.argv[2] ?? 'Export Dirvers/corriges/Vampire-2.2.0.gmos-driver';
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
// 2.1.0 — les dégâts case par case (p. 126-127), sur le vrai pilote et par la porte des dégâts.
const stats = pilote.combat.statsToTrack;
assert.equal(pilote.combat.defaultHealthType, 'hp', 'la Santé compte les cases sans « X »');
assert.deepEqual(typesDeDegats(pilote), ['Superficiels', 'Aggravés', 'Superficiels non divisés', 'Volonté — superficiels', 'Volonté — aggravés']);
const blesse = { ...valeurs, vigueur: 2, resolution: 2, sang_froid: 3, sante: 5, volonte: 5, sante_degats: '', volonte_degats: '' };
// L'officier de police (p. 126-127) : cinq cases, six aggravés — hors de combat, la Santé tombe à zéro.
const officier = degatsDeVampireSelonLeJeu(pilote, blesse, { value: 6, type: 'Aggravés' }, stats);
assert.equal(officier.fiche.sante_degats, 'XXXXX');
assert.deepEqual([officier.impact.value, !!officier.impact.isRecovery], [5, false]);
assert.match(officier.texte, /torpeur pour un vampire, coma ou mort pour un mortel/);
// Cinq superficiels en font trois ; la Santé (cases sans « X ») ne bouge pas.
const coups = degatsDeVampireSelonLeJeu(pilote, blesse, { value: 5, type: 'Superficiels' }, stats);
assert.deepEqual([coups.fiche.sante_degats, coups.impact.value], ['///', 0]);
// Jauge pleine : chaque niveau change un « / » en « X », et la Santé perd une case.
const plein = degatsDeVampireSelonLeJeu(pilote, { ...blesse, sante_degats: '/////' }, { value: 2, type: 'Superficiels' }, stats);
assert.deepEqual([plein.fiche.sante_degats, plein.impact.value], ['X////', 1]);
// La Volonté : l'impact vers la santé vaut zéro, la Volonté restante s'écrit avec ses marques.
const honte = degatsDeVampireSelonLeJeu(pilote, blesse, { value: 2, type: 'Volonté — aggravés' }, stats);
assert.deepEqual([honte.impact.value, honte.fiche.volonte_degats, honte.fiche.volonte], [0, 'XX', 3]);
// L'Affaiblissement au jet (p. 126) : Santé pleine de « / », Dextérité + Mêlée perd deux dés, Astuce + Vigilance non.
const affaibli = { ...valeurs, dexterite: 3, melee: 2, astuce: 2, vigilance: 2, soif: 0, sante: 5, sante_degats: '/////' };
assert.equal(preparer({ attribut: 'dexterite', competence: 'melee' }, {}, affaibli).vampire.total, 3, 'Affaibli : 5 − 2');
assert.equal(preparer({ attribut: 'astuce', competence: 'vigilance' }, {}, affaibli).vampire.total, 4, 'un groupement mental épargné');
assert.equal(preparer({ attribut: 'dexterite', competence: 'melee' }, { vampire: { affaibli: false } }, affaibli).vampire.total, 5, 'le conteur l’épargne');
// Les cases de la fiche HTML : « X » d'abord, puis « / », dans les deux sens.
const cases = versLaFiche({ sheetData: { ...nadia, sante_degats: 'X//', volonte_degats: '/' } }, table);
assert.deepEqual([1, 2, 3, 4].map(i => cases[`damage.health.${i}`]), ['aggravated', 'superficial', 'superficial', 'intact']);
assert.equal(cases['damage.willpower.1'], 'superficial');
assert.equal(versGmOs({ ...cases, 'damage.health.7': 'aggravated' }, table).sheetData.sante_degats, 'XX//');

// 2.2.0 — le bestiaire et le catalogue relus contre le livre (p. 304, 370-381).
const bestiaire = pilote.bestiaire, catalogue = pilote.catalogue;
assert.equal(bestiaire.creatures.length, 23);
assert.ok(bestiaire.colonnes.every(c => c.champ), 'chaque colonne du bestiaire remplit un champ');
assert.ok(bestiaire.creatures.every(c => Number.isInteger(c.source?.page) && c.categorie), 'page et catégorie de chaque créature');
const creature = id => bestiaire.creatures.find(c => c.id === id);
const plateau = id => exemplairesDeLaCreature({ bestiaire, creature: creature(id), nombre: 1, typeDeSante: pilote.combat.defaultHealthType })[0].sheetData;
// Le lieutenant de police (p. 371) : Physique 4, Armes à feu 5 — un groupement complet, lancé seul.
const lieutenant = { ...valeurs, ...plateau('lieutenant-de-police') };
assert.deepEqual([lieutenant.sante, lieutenant.volonte, lieutenant.groupement_1_nom, lieutenant.groupement_1, lieutenant.groupement_4_nom, lieutenant.groupement_4], [6, 5, 'Physique', 4, 'Armes à feu', 5]);
const menuDuLieutenant = new Map(champsProposes(pilote.jet.reserve.composantes[0], fiche.sections, lieutenant).map(c => [c.id, c.label]));
assert.equal(menuDuLieutenant.get('groupement_1'), 'Physique');
assert.equal(menuDuLieutenant.get('groupement_4'), 'Armes à feu');
assert.ok(!menuDuLieutenant.has('groupement_8'), 'un groupement sans nom reste hors du menu');
assert.equal(preparer({ attribut: 'groupement_4' }, {}, lieutenant).vampire.total, 5, 'Armes à feu 5 : cinq dés');
assert.equal(preparer({ attribut: 'groupement_1' }, {}, lieutenant).vampire.total, 4, 'Physique 4');
// Affaibli (Santé pleine de « / ») : le groupement Physique perd deux dés, le Mental non (p. 126).
const lieutenantAffaibli = { ...lieutenant, sante_degats: '//////' };
assert.equal(preparer({ attribut: 'groupement_1' }, {}, lieutenantAffaibli).vampire.total, 2);
assert.equal(preparer({ attribut: 'groupement_3' }, {}, lieutenantAffaibli).vampire.total, 4);
// Sur la fiche d'un joueur, rien de l'antagoniste n'entre au menu.
assert.ok(![...premier.keys()].some(id => id.startsWith('groupement_')), 'groupements cachés sur la fiche d’un joueur');
// La Harpie (p. 374) : Manipulation 4 + Persuasion 4 ; Santé 5 = Vigueur 2 + 3, Volonté 6 = Résolution 3 + Sang-froid 3.
const harpie = { ...valeurs, ...plateau('harpie-de-l-elysium') };
assert.equal(preparer({ attribut: 'manipulation', competence: 'persuasion' }, {}, harpie).vampire.total, 8);
assert.equal(santeDeDepart(pilote.combat.santeDeDepart, c => Number(harpie[c])), harpie.sante);
for (const c of bestiaire.creatures.filter(x => x.valeurs.vigueur !== undefined)) {
    assert.equal(c.valeurs.vigueur + 3, c.valeurs.sante, `${c.nom} : Santé = Vigueur + 3`);
    assert.equal(c.valeurs.resolution + c.valeurs.sang_froid, c.valeurs.volonte, `${c.nom} : Volonté = Résolution + Sang-froid`);
}
// Les chiffres forgés n'ont pas bougé : Santé et Volonté de chaque créature, groupements des simplifiés.
const forge = JSON.parse(new AdmZip('Export Dirvers/Vampire_driver_gmos_1794902541894.gmos-driver').readAsText('state.json')).gameDriver.bestiaire;
for (const f of forge.creatures) {
    const c = creature(f.id);
    assert.deepEqual([c.valeurs.sante, c.valeurs.volonte], [f.valeurs.sante, f.valeurs.volonte], f.nom);
    if (f.valeurs.physique !== undefined) assert.deepEqual([c.valeurs.groupement_1, c.valeurs.groupement_2, c.valeurs.groupement_3], [f.valeurs.physique, f.valeurs.social, f.valeurs.mental], f.nom);
}
// Le catalogue : la table des armes est p. 304 ; le chapitre « Matériel » (p. 378-381) y est.
assert.equal(catalogue.objets.length, 30);
assert.ok(catalogue.objets.filter(o => o.famille === 'arme' && o.categorie === 'Dégâts des armes').every(o => o.source.page === 304));
assert.equal(catalogue.objets.find(o => o.id === 'munitions-raufoss').valeurs['valeur-de-degats'], '+5');

console.log(`OK : zéro constat ; groupements de Guillaume, Benoît et Claire (p. 118, 205) ; attribut seul, Force + Force, jet de Volonté sans Soif ; menu ${menu.size} entrées ; Santé et initiative (p. 119, 300) ; correspondance ${table.champs.length} champs, ${table.absents.length} absents, aller-retour tenu ; dégâts : l'officier de police, superficiels divisés, conversion, Volonté, Affaiblissement au jet, cases de la fiche (p. 126-127) ; bestiaire jouable (23 créatures, lieutenant 6/6, Armes à feu 5, Harpie 8 dés) et catalogue de 30 objets (p. 304, 370-381).`);
