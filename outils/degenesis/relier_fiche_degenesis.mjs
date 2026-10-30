// Écrit la correspondance entre la fiche GM-OS de Degenesis (pilote 2.0.0, finir_degenesis.py) et le
// gabarit degenesis-fr livré par Codex le 2026-10-30 — Claude Code, le même jour, à la demande de David
// (« finir le pilote », « tout, dans l'ordre »). Les 129 clés de la fiche ont chacune leur champ ; le
// maximum d'Égo et la santé restante n'existent que dans GM-OS. Vérifie les deux côtés avant d'écrire.
// Pistes : l'Égo compte les points restants, les trois autres ce qui a été subi.
// Usage : node outils/degenesis/relier_fiche_degenesis.mjs <pilote 2.0.0 .gmos-driver>
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const AdmZip = require('adm-zip');
const [pilote] = process.argv.slice(2);
assert.ok(pilote, 'Usage : node outils/degenesis/relier_fiche_degenesis.mjs <pilote 2.0.0 .gmos-driver>');

const html = fs.readFileSync('docs/fiches/Degenesis/degenesis-fiche-personnage-interactive.html', 'utf8');
const gabarit = JSON.parse(html.match(/<script\b[^>]*\bid=["']character-sheet-template["'][^>]*>([\s\S]*?)<\/script>/i)[1]).template;
const clesDeLaFiche = new Set(gabarit.pages.flatMap(p => p.fields).map(f => f.key));
const etat = JSON.parse(new AdmZip(pilote).getEntry('state.json').getData().toString('utf8'));
const champsGmos = new Set(etat.sheetTemplate.sections.flatMap(s => s.fields).map(f => f.id));

const paires = [
    ['nom', 'identity.name'], ['genre', 'identity.gender'], ['age', 'identity.age'], ['taille', 'identity.height'],
    ['poids', 'identity.weight'], ['culture', 'identity.culture'], ['concept', 'identity.concept'], ['culte', 'identity.cult'],
    ['rang', 'identity.rank'],
    ['physique', 'attributes.physical'], ['agilite', 'attributes.agility'], ['charisme', 'attributes.charisma'],
    ['intellect', 'attributes.intellect'], ['psyche', 'attributes.psyche'], ['instinct', 'attributes.instinct'],
    ['athletisme', 'skills.athletics'], ['corps_a_corps', 'skills.melee'], ['force', 'skills.strength'], ['lutte', 'skills.brawl'],
    ['resistance', 'skills.toughness'], ['vigueur', 'skills.stamina'],
    ['armes_a_projectiles', 'skills.projectile_weapons'], ['artisanat', 'skills.crafting'], ['dexterite', 'skills.dexterity'],
    ['furtivite', 'skills.stealth'], ['mobilite', 'skills.mobility'], ['navigation', 'skills.navigation'],
    ['art', 'skills.art'], ['commandement', 'skills.leadership'], ['consideration', 'skills.consideration'],
    ['expression', 'skills.expression'], ['negociation', 'skills.negotiation'], ['seduction', 'skills.seduction'],
    ['concentration', 'skills.concentration'], ['connaissance_des_artefacts', 'skills.artifact_lore'], ['legendes', 'skills.legends'],
    ['medecine', 'skills.medicine'], ['science', 'skills.science'], ['technologie', 'skills.technology'],
    ['domination', 'skills.domination'], ['foi', 'skills.faith'], ['reactivite', 'skills.reaction'], ['ruse', 'skills.cunning'],
    ['tromperie', 'skills.deception'], ['volonte', 'skills.willpower'],
    ['dressage', 'skills.animal_handling'], ['empathie', 'skills.empathy'], ['orientation', 'skills.orientation'],
    ['perception', 'skills.perception'], ['pulsions', 'skills.impulses'], ['survie', 'skills.survival'],
    ['alliés', 'origins.allies'], ['autorite', 'origins.authority'], ['reseau', 'origins.network'], ['renommee', 'origins.renown'],
    ['ressources', 'origins.resources'], ['secrets', 'origins.secrets'],
    ...[1, 2, 3, 4, 5, 6].flatMap(i => [[`potentiel${i}_nom`, `potentials.${i - 1}.name`], [`potentiel${i}`, `potentials.${i - 1}.level`]]),
    ['ego_jauge', 'tracks.ego'], ['sporulations_jauge', 'tracks.sporulation'],
    ['blessures_superficielles', 'tracks.flesh_wounds'], ['traumatismes', 'tracks.trauma'],
    ...[1, 2, 3].flatMap(i => [['', 'name'], ['_maniabilite', 'handling'], ['_portee', 'range'], ['_degats', 'damage'],
        ['_chargeur', 'magazine'], ['_encombrement', 'weight'], ['_tech', 'technology'], ['_emplacements', 'slots'],
        ['_proprietes', 'properties']].map(([suffixe, cle]) => [`arme${i}${suffixe}`, `weapons.${i - 1}.${cle}`])),
    ...[1, 2].flatMap(i => [['', 'name'], ['_valeur', 'rating'], ['_encombrement', 'weight'], ['_tech', 'technology'],
        ['_emplacements', 'slots'], ['_proprietes', 'properties']].map(([suffixe, cle]) => [`armure${i}${suffixe}`, `armor.${i - 1}.${cle}`])),
    ...[1, 2, 3, 4, 5, 6].flatMap(i => [[`equipement${i}`, `equipment.${i - 1}.name`], [`equipement${i}_encombrement`, `equipment.${i - 1}.weight`]]),
    ...[1, 2, 3].map(i => [`encombrement_total${i}`, `equipment_totals.${i - 1}.weight`]),
    ['dinars_lc', 'wealth.dinars_lc'], ['experience', 'experience.total'],
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
    commentaire: 'Correspondance entre la fiche GM-OS de Degenesis (pilote 2.0.0, outils/degenesis/finir_degenesis.py) et le gabarit '
        + 'degenesis-fr livré le 2026-10-30. Écrite par outils/degenesis/relier_fiche_degenesis.mjs : les 129 clés ont chacune leur '
        + "champ. Pistes : l'Égo compte les points restants ; Sporulations, Blessures superficielles et Traumatismes ce qui a été subi. "
        + "Le maximum d'Égo et la santé restante n'existent que dans GM-OS.",
    champs: paires.map(([gmos, fiche]) => ({ gmos, fiche })),
    absents: [],
};
fs.mkdirSync('docs/systems/degenesis/fiche', { recursive: true });
fs.writeFileSync('docs/systems/degenesis/fiche/correspondance.json', JSON.stringify(correspondance, null, 2) + '\n');
console.log(JSON.stringify({ champs: paires.length, clesDeLaFiche: clesDeLaFiche.size, seulementDansGmos: [...champsGmos].filter(c => !paires.some(([g]) => g === c)) }));
