// Contrôle du bestiaire relié du pilote Blade Runner 2.1.0 — 19/11/2026, chantier § 263, T8.
// Lit state.json, passe controlerLePilote (zéro constat exigé), calcule la fiche de plateau de
// l'Agent du LAPD comme Combat-OS la pose (`ficheDePlateau`), puis prépare son jet d'Agilité +
// Armes à feu avec le vrai moteur (`preparerLeJet`) : C (D8) + C (D8), deux dés de huit.
// Usage : node outils/blade-runner/verifier_bestiaire.mjs [chemin.gmos-driver]
//   sans argument : Export Dirvers/corriges/Blade-Runner-2.1.0.gmos-driver
import '../campagnes-de-recette/charger-typescript.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';
import { registerHooks } from 'node:module';
registerHooks({ load(url, contexte, suivant) {
    return url.endsWith('.json') ? { format: 'module', source: `export default ${fs.readFileSync(new URL(url), 'utf8')};`, shortCircuit: true } : suivant(url, contexte);
} });
const { controlerLePilote } = await import('../../src/modules/forge/rules/controlesDuPilote.ts');
const { ficheDePlateau, controlerLeBestiaire } = await import('../../src/modules/bestiaire/bestiaire.ts');
const { preparerLeJet } = await import('../../src/modules/dice/DescripteurDeJet.ts');

const fichier = process.argv[2] ?? 'Export Dirvers/corriges/Blade-Runner-2.1.0.gmos-driver';
const { gameDriver: pilote, sheetTemplate: gabarit } = JSON.parse(new AdmZip(fichier).readAsText('state.json'));
const constats = controlerLePilote(pilote, gabarit);
const champs = new Set(gabarit.sections.flatMap(s => s.fields).map(f => f.id));
const duBestiaire = controlerLeBestiaire(pilote.bestiaire, champs);
console.log(JSON.stringify({ fichier, version: pilote.version, constats, duBestiaire }, null, 2));
assert.equal(pilote.version, '2.1.0');
assert.deepEqual(constats, [], 'le pilote doit passer sans constat');
assert.deepEqual(duBestiaire, [], 'le bestiaire doit passer sans constat, champs de la fiche compris');

// Chaque créature entre avec ses attributs ET sa Santé sur la fiche, plus jamais `{}`.
for (const creature of pilote.bestiaire.creatures) {
    const fiche = ficheDePlateau(pilote.bestiaire, creature);
    for (const attribut of ['vigueur', 'agilite', 'intelligence', 'empathie', 'sante', 'santeMax']) {
        assert.ok(fiche[attribut] !== undefined, `${creature.nom} : « ${attribut} » absent de la fiche de plateau`);
    }
}

// Cas témoin : l'Agent du LAPD en uniforme (VIG B, AGI C, Armes à feu C, Santé 5).
const agent = pilote.bestiaire.creatures.find(c => c.id === 'agent-du-lapd-en-uniforme');
const fiche = ficheDePlateau(pilote.bestiaire, agent);
assert.deepEqual(fiche, {
    vigueur: 'B (D10)', agilite: 'C (D8)', intelligence: 'C (D8)', empathie: 'C (D8)', sante: 5,
    armesAFeu: 'C (D8)', conduite: 'C (D8)', corpsACorps: 'C (D8)', santeMax: 5,
});
const valeurs = { ...Object.fromEntries(gabarit.sections.flatMap(s => s.fields).map(f => [f.id, f.defaultValue])), ...fiche };
const jet = preparerLeJet(pilote.jet, valeurs, { champs: { attribut: 'agilite', competence: 'armesAFeu' }, difficulte: 0, desSupplementaires: 0 }, gabarit.sections);
console.log('Jet de l’Agent — Agilité + Armes à feu :', JSON.stringify({ des: jet.desEchelonnes ?? jet.des, avertissements: jet.avertissements }));
assert.deepEqual(jet.avertissements, [], 'le jet se prépare sans avertissement');
const faces = (jet.desEchelonnes ?? []).map(d => d.faces);
assert.deepEqual(faces, [8, 8], 'C (D8) + C (D8) : deux dés de huit');

const armes = pilote.bestiaire.creatures.filter(c => c.valeurs.armes).map(c => `${c.nom} → ${c.valeurs.armes}`);
console.log(`OK : zéro constat, ${pilote.bestiaire.creatures.length} créatures avec leurs attributs sur la fiche, jet de l’Agent en 2D8.`);
console.log(`Armes rattachées au catalogue : ${armes.join(' ; ')}`);
