// Contrôle du bestiaire du pilote Cthulhu Hack 1.2.0 — 19/11/2026, chantier § 263, T15.
// Lit state.json, passe controlerLePilote et controlerLeBestiaire (zéro constat exigé), vérifie que
// chaque créature entre au combat avec ses Points de Vie (`ficheDePlateau` → champ `hp`), et calcule
// la riposte du Garde du livre (p. 55 : Revolver 4) contre un investigateur à 1 PA : 3, et 7 sur un
// 20 naturel (décision D5 de David : les dégâts doublés, puis l'Armure).
// Usage : node outils/cthulhu-hack/verifier_bestiaire.mjs [chemin.gmos-driver]
//   sans argument : Export Dirvers/corriges/Cthulhu-Hack-1.2.0.gmos-driver
import '../campagnes-de-recette/charger-typescript.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';
import { registerHooks } from 'node:module';
registerHooks({ load(url, contexte, suivant) {
    return url.endsWith('.json') ? { format: 'module', source: `export default ${fs.readFileSync(new URL(url), 'utf8')};`, shortCircuit: true } : suivant(url, contexte);
} });
const { controlerLePilote } = await import('../../src/modules/forge/rules/controlesDuPilote.ts');
const { ficheDePlateau, controlerLeBestiaire, ecrireLAttaque } = await import('../../src/modules/bestiaire/bestiaire.ts');
const { riposteDeCthulhuHack } = await import('../../src/modules/combat/logic/attaqueDeLAdversaire.ts');

const fichier = process.argv[2] ?? 'Export Dirvers/corriges/Cthulhu-Hack-1.2.0.gmos-driver';
const { gameDriver: pilote, sheetTemplate: gabarit } = JSON.parse(new AdmZip(fichier).readAsText('state.json'));
const constats = controlerLePilote(pilote, gabarit);
const champs = new Set(gabarit.sections.flatMap(s => s.fields).map(f => f.id));
const duBestiaire = controlerLeBestiaire(pilote.bestiaire, champs);
console.log(JSON.stringify({ fichier, version: pilote.version, constats, duBestiaire }, null, 2));
assert.equal(pilote.version, '1.2.0');
assert.deepEqual(constats, [], 'le pilote doit passer sans constat');
assert.deepEqual(duBestiaire, [], 'le bestiaire doit passer sans constat, champs de la fiche compris');
assert.equal(pilote.bestiaire.creatures.length, 22, 'les 22 profils du livre (p. 54-62)');

for (const creature of pilote.bestiaire.creatures) {
    const fiche = ficheDePlateau(pilote.bestiaire, creature);
    assert.ok(Number.isInteger(fiche.hp) && fiche.hp > 0, `${creature.nom} : Points de Vie absents de la fiche de plateau`);
    assert.ok(creature.attaques.lignes.length > 0 && creature.attaques.lignes.every(l => Number.isInteger(l.degats)), `${creature.nom} : une attaque sans dégâts fixes`);
}

const garde = pilote.bestiaire.creatures.find(c => c.id === 'garde');
assert.deepEqual(ficheDePlateau(pilote.bestiaire, garde), { hp: 14 });
assert.deepEqual(garde.valeurs, { 'des-de-vie': '3', 'points-de-vie': 14, 'points-d-armure': 1, 'malus-au-toucher': -2 });
assert.equal(garde.attaques.lignes.map(ecrireLAttaque).join(', '), 'Revolver (4), Matraque (2) ×2');
// T17 : l'Armure du Garde (1 PA, colonne au rôle `protection`) se retire des coups d'un investigateur.
const { armureDeLAdversaire } = await import('../../src/modules/combat/logic/attaqueDeLAdversaire.ts');
assert.equal(armureDeLAdversaire(pilote, { origineDuLivre: { creatureId: 'garde' } }), 1, 'Armure du Garde lue au bestiaire');
assert.equal(armureDeLAdversaire(pilote, { origineDuLivre: { creatureId: 'shoggoth' } }), 8);
const revolver = garde.attaques.lignes[0].degats;
assert.equal(riposteDeCthulhuHack(revolver, 1, false), 3, 'Revolver 4 contre 1 PA');
assert.equal(riposteDeCthulhuHack(revolver, 1, true), 7, '20 naturel : 8 − 1');

console.log(`OK : zéro constat, 22 créatures avec leurs PV ; Garde : ${garde.attaques.lignes.map(ecrireLAttaque).join(', ')} ; riposte 3, et 7 sur un 20 naturel.`);
