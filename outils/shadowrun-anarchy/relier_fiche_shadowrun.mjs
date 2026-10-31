// Écrit la correspondance entre la fiche GM-OS de Shadowrun : Anarchy 2.0 (pilote 2.0.0, finir_shadowrun.py)
// et le gabarit shadowrun-anarchy2-fr livré par Codex le 2026-10-31 — Claude Code, le même jour, à la demande de
// David (« finir le pilote »). Les 120 clés de valeur ont chacune leur champ ; le portrait reste sur la fiche.
// Le métatype, le train de vie, les capacités et la position du moniteur n'existent que dans GM-OS.
// Vérifie les deux côtés avant d'écrire.
// Usage : node outils/shadowrun-anarchy/relier_fiche_shadowrun.mjs <pilote 2.0.0 .gmos-driver>
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const AdmZip = require('adm-zip');
const [pilote] = process.argv.slice(2);
assert.ok(pilote, 'Usage : node outils/shadowrun-anarchy/relier_fiche_shadowrun.mjs <pilote 2.0.0 .gmos-driver>');

const html = fs.readFileSync('docs/fiches/Shadowrun Anarchy/shadowrun-anarchy2-fiche-personnage-interactive.html', 'utf8');
const gabarit = JSON.parse(html.match(/<script\b[^>]*\bid=["']character-sheet-template["'][^>]*>([\s\S]*?)<\/script>/i)[1]).template;
const clesDeLaFiche = new Set(gabarit.pages.flatMap(p => p.fields).map(f => f.key));
const etat = JSON.parse(new AdmZip(pilote).getEntry('state.json').getData().toString('utf8'));
const champsGmos = new Set(etat.sheetTemplate.sections.flatMap(s => s.fields).map(f => f.id));

const SEUILS = [['sans_armure', 'unarmoured'], ['principale', 'primary'], ['secondaire', 'secondary'], ['mental', 'mental']];
const GRAVITES = [['legere', 'light'], ['grave', 'serious'], ['incapacitante', 'incapacitating']];
const de = (n, f) => Array.from({ length: n }, (_, i) => f(i + 1));

const paires = [
    ['pseudo', 'identity.name'],
    ...de(5, n => [`mot_cle_${n}`, `keywords.${n - 1}`]),
    ...de(4, n => [`comportement_${n}`, `behaviours.${n - 1}`]),
    ...de(4, n => [`replique_${n}`, `cues.${n - 1}`]),
    ['force', 'attributes.strength'], ['agilite', 'attributes.agility'], ['volonte', 'attributes.willpower'],
    ['logique', 'attributes.logic'], ['charisme', 'attributes.charisma'],
    ...de(11, n => [['_nom', 'name'], ['', 'rating'], ['_attribut', 'attribute'], ['_reserve', 'pool'], ['_rr', 'risk_reduction']]
        .map(([suffixe, cle]) => [`competence_${n}${suffixe}`, `skills.${n - 1}.${cle}`])).flat(),
    ['connaissances_liste', 'knowledge.description'],
    ...de(11, n => [`atout_${n}`, `assets.${n - 1}.description`]),
    ...de(4, n => [[`arme_${n}`, `weapons_spells.${n - 1}.name`], [`arme_${n}_type`, `weapons_spells.${n - 1}.type`]]).flat(),
    ...de(5, n => [`equipement_${n}`, `equipment.${n - 1}`]),
    ['armure_principale', 'armour.primary.name'], ['armure_secondaire', 'armour.secondary.name'],
    ...SEUILS.flatMap(([s, k]) => GRAVITES.map(([g, kg]) => [`seuil_${s}_${g}`, `thresholds.${k}.${kg}`])),
    ['piratage_des_de_risque', 'hacking.minimum_risk_dice'], ['piratage_hausse_du_seuil', 'hacking.threshold_increase'],
    ['anarchy', 'tracks.anarchy'], ['essence', 'tracks.essence'],
    ['blessures_legeres', 'wounds.light'], ['blessures_graves', 'wounds.serious'], ['blessures_incapacitantes', 'wounds.incapacitating'],
];
const absents = [{ fiche: 'portrait', pourquoi: 'Une image : elle reste sur la fiche, GM-OS a son propre portrait du personnage.' }];

for (const [gmos, fiche] of paires) {
    assert.ok(champsGmos.has(gmos), `« ${gmos} » n'est pas un champ du pilote`);
    assert.ok(clesDeLaFiche.has(fiche), `« ${fiche} » n'est pas une clé de la fiche`);
}
const visees = new Set([...paires.map(([, fiche]) => fiche), ...absents.map(a => a.fiche)]);
const orphelines = [...clesDeLaFiche].filter(k => !visees.has(k));
assert.deepEqual(orphelines, [], `clés de la fiche sans champ : ${orphelines.join(', ')}`);
assert.equal(new Set(paires.map(([g]) => g)).size, paires.length, 'un champ GM-OS visé deux fois');

const correspondance = {
    version: 1,
    gabaritDeLaFiche: gabarit.id,
    commentaire: 'Correspondance entre la fiche GM-OS de Shadowrun : Anarchy 2.0 (pilote 2.0.0, outils/shadowrun-anarchy/finir_shadowrun.py) '
        + 'et le gabarit shadowrun-anarchy2-fr livré le 2026-10-31. Écrite par outils/shadowrun-anarchy/relier_fiche_shadowrun.mjs : '
        + `les ${paires.length} clés de valeur ont chacune leur champ. Les blessures comptent les cases cochées ; la RR de chaque `
        + 'compétence, ses pastilles cochées. Le métatype, le train de vie, les capacités et la position du moniteur n’existent que dans GM-OS.',
    champs: paires.map(([gmos, fiche]) => ({ gmos, fiche })),
    absents,
};
fs.mkdirSync('docs/systems/shadowrun-anarchy/fiche', { recursive: true });
fs.writeFileSync('docs/systems/shadowrun-anarchy/fiche/correspondance.json', JSON.stringify(correspondance, null, 2) + '\n');
console.log(JSON.stringify({ champs: paires.length, clesDeLaFiche: clesDeLaFiche.size, seulementDansGmos: [...champsGmos].filter(c => !paires.some(([g]) => g === c)) }));
