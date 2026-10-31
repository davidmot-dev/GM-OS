// Écrit la correspondance entre la fiche GM-OS de Chroniques Oubliées Contemporain (pilote 2.0.0,
// finir_coc.py) et le gabarit coc2-fr livré par Codex le 2026-10-31 — Claude Code, le même jour, à la
// demande de David (« finir le pilote », « tout, dans l'ordre »). Les 151 clés de la fiche ont chacune
// leur champ ; les rubriques de « Donner corps à votre personnage » (p. 15-18), le modèle de l'échelle
// d'évolution et l'expérience n'existent que dans GM-OS. Vérifie les deux côtés avant d'écrire.
// Échelles : la santé compte les échelons noircis (p. 71), l'évolution l'échelon atteint (p. 80).
// Usage : node outils/coc/relier_fiche_coc.mjs <pilote 2.0.0 .gmos-driver>
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const AdmZip = require('adm-zip');
const [pilote] = process.argv.slice(2);
assert.ok(pilote, 'Usage : node outils/coc/relier_fiche_coc.mjs <pilote 2.0.0 .gmos-driver>');

const html = fs.readFileSync('docs/fiches/COC/coc2-fiche-personnage-interactive.html', 'utf8');
const gabarit = JSON.parse(html.match(/<script\b[^>]*\bid=["']character-sheet-template["'][^>]*>([\s\S]*?)<\/script>/i)[1]).template;
const clesDeLaFiche = new Set(gabarit.pages.flatMap(p => p.fields).map(f => f.key));
const etat = JSON.parse(new AdmZip(pilote).getEntry('state.json').getData().toString('utf8'));
const champsGmos = new Set(etat.sheetTemplate.sections.flatMap(s => s.fields).map(f => f.id));

const CARACTERISTIQUES = [['agilite', 'agility'], ['constitution', 'constitution'], ['force', 'strength'], ['perception', 'perception'],
    ['charisme', 'charisma'], ['intelligence', 'intellect'], ['volonte', 'willpower']];
const paires = [
    ['nom', 'identity.name'], ['joueur', 'identity.player'], ['age', 'identity.age'], ['origines', 'identity.origin'],
    ['metier', 'identity.profile'],
    ...CARACTERISTIQUES.flatMap(([c, k]) => [[c, `attributes.${k}`], [`note_${c}`, `attribute_notes.${k}`]]),
    ['attaque_au_contact', 'combat.melee'], ['attaque_a_distance', 'combat.ranged'], ['defense', 'combat.defense'],
    ['initiative', 'combat.initiative'], ['capacite_de_guerison', 'combat.cg'], ['bonus_dommages_au_contact', 'combat.damage_bonus'],
    ['description', 'profile.description'], ['sequelles', 'profile.sequelae'],
    ...[1, 2, 3].flatMap(i => [[`trait${i}`, `traits.${i - 1}.description`], [`trait${i}_valeur`, `traits.${i - 1}.value`]]),
    ['biens', 'equipment.0'], ['equipement2', 'equipment.1'],
    ...[1, 2, 3].flatMap(i => [['', 'name'], ['_attaque', 'attack_bonus'], ['_bc', 'critical_bonus'], ['_dm', 'damage'], ['_notes', 'notes_range']]
        .map(([suffixe, cle]) => [`arme${i}${suffixe}`, `weapons.${i - 1}.${cle}`])),
    ['protections', 'armor.name'], ['protection_rd', 'armor.reduction'], ['protection_malus', 'armor.penalty'],
    ['echelle_de_sante', 'tracks.health'], ['echelle_evolution', 'tracks.scale'],
    ...[1, 2, 3, 4, 5, 6].flatMap(i => [[`voie${i}`, `paths.${i - 1}.name`], ...[1, 2, 3, 4, 5].flatMap(r => [
        [`voie${i}_rang${r}`, `paths.${i - 1}.ranks.${r - 1}.acquired`],
        [`voie${i}_rang${r}_nom`, `paths.${i - 1}.ranks.${r - 1}.name`],
        [`voie${i}_rang${r}_description`, `paths.${i - 1}.ranks.${r - 1}.description`],
    ])]),
];

for (const [gmos, fiche] of paires) {
    assert.ok(champsGmos.has(gmos), `« ${gmos} » n'est pas un champ du pilote`);
    assert.ok(clesDeLaFiche.has(fiche), `« ${fiche} » n'est pas une clé de la fiche`);
}
const visees = new Set(paires.map(([, fiche]) => fiche));
const orphelines = [...clesDeLaFiche].filter(k => !visees.has(k));
assert.deepEqual(orphelines, [], `clés de la fiche sans champ : ${orphelines.join(', ')}`);
assert.equal(new Set(paires.map(([g]) => g)).size, paires.length, 'un champ GM-OS visé deux fois');

const correspondance = {
    version: 1,
    gabaritDeLaFiche: gabarit.id,
    commentaire: 'Correspondance entre la fiche GM-OS de Chroniques Oubliées Contemporain (pilote 2.0.0, outils/coc/finir_coc.py) et le '
        + 'gabarit coc2-fr livré le 2026-10-31. Écrite par outils/coc/relier_fiche_coc.mjs : les 151 clés ont chacune leur champ. '
        + "Échelles : la santé compte les échelons noircis, l'évolution l'échelon atteint. Les rubriques de « Donner corps à votre "
        + "personnage », le modèle de l'échelle d'évolution et l'expérience n'existent que dans GM-OS.",
    champs: paires.map(([gmos, fiche]) => ({ gmos, fiche })),
    absents: [],
};
fs.mkdirSync('docs/systems/coc/fiche', { recursive: true });
fs.writeFileSync('docs/systems/coc/fiche/correspondance.json', JSON.stringify(correspondance, null, 2) + '\n');
console.log(JSON.stringify({ champs: paires.length, clesDeLaFiche: clesDeLaFiche.size, seulementDansGmos: [...champsGmos].filter(c => !paires.some(([g]) => g === c)) }));
