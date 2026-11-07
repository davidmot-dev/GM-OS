import fs from 'node:fs';
import assert from 'node:assert/strict';
const p = 'documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md';
let t = fs.readFileSync(p, 'utf8');
t = t.replace('Les six lignes rouges ajoutées par jeu sont des\n**propositions à faire**, distinctes du socle livré et de l\'essai attendu de David.', 'Les six propositions ajoutées par jeu sont distinctes du socle livré ;\nleur état est actualisé ci-dessous à chaque réalisation et validation.');
fs.writeFileSync(p, t);
const registre = 'documentation/Planning/2026-08-23-chantiers-gares.md';
let r = fs.readFileSync(registre, 'utf8');
r = r.split('\n').map(l => {
    const m = l.match(/^\| (\d+) \|/);
    if (!m || Number(m[1]) < 122 || Number(m[1]) > 134 || Number(m[1]) === 131) return l;
    const c = l.split('|');
    c[c.length - 2] = Number(m[1]) === 122
        ? ' Validation globale de David le 01/11 ; RQ-A1 (recette 2.1.0) reste à faire '
        : ' Fonctions livrées validées globalement par David le 01/11 ; historique conservé, extensions séparées ';
    return c.join('|');
}).join('\n');
for (const n of [186, 189, 194, 198]) {
    const motif = new RegExp(`(### ${n} ·[^\\n]+\\n)`);
    assert(motif.test(r));
    r = r.replace(motif, '$1\n> **Suivi du 01/11 :** validation globale de David des essais en attente ; GM-05 corrigé et validé au § 200. Les cas et rapports initiaux ci-dessous restent historiques, sans résultats détaillés inventés.\n');
}
fs.writeFileSync(registre, r);
console.log('Derniers renvois de suivi actualisés.');
