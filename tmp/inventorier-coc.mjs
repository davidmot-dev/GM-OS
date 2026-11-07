import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const propres = [
    'src/modules/combat/coc.test.ts', 'src/modules/combat/coc.ts', 'src/modules/combat/components/PanneauDeCoc.tsx',
    'src/modules/dice/systemes/cocAvance.test.ts', 'src/modules/dice/systemes/dommagesDeCoc.ts',
    'src/modules/dice/systemes/profilsDeCoc.ts', 'src/modules/dice/systemes/suiviDeCoc.ts',
    'src/modules/session/components/fields/CartesCoc.tsx', 'src/modules/session/components/fields/useSourcesCoc.ts',
    'e2e/cocAvance.spec.ts', 'electron/cocAvance.test.ts', 'outils/coc/ameliorer_coc.mjs',
    'documentation/Planning/2026-11-04-coc-a1-a3.md', 'documentation/Planning/2026-11-04-etat-et-reprise-codex-coc.md',
    ...['bande', 'consequences', 'dommages', 'profils'].map(n => `documentation/User Guides/captures/jeu-coc-${n}.jpg`),
    ...['d20', 'option-3d6'].map(v => `Export Dirvers/corriges/coc/COC-2.1.0-${v}.gmos-driver`),
];
const etrangers = new Set(['Export Dirvers/corriges/RQ_driver_gmos_finir.gmos-driver', 'documentation/User Guides/10-Session-OS-le-cockpit.md', 'documentation/User Guides/12-Forge-de-campagne.md']);
const modifies = execFileSync('git', ['diff', '--name-only', '-z'], { encoding: 'utf8' }).split('\0').filter(p => p && !etrangers.has(p));
const sortie = 'output/coc-a1-a3';
function livrables(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
        if (e.name.startsWith('traces-') || e.name.startsWith('.')) return [];
        const p = path.posix.join(dir, e.name);
        return e.isDirectory() ? livrables(p) : [p];
    });
}
const inventaire = `${sortie}/fichiers-de-livraison.json`;
const fichiers = [...new Set([...modifies, ...propres, ...livrables(sortie), inventaire])].sort();
fs.writeFileSync(inventaire, JSON.stringify({ date: '2026-11-04', sujet: 'COC-A1/A2/A3', commit: 'non demandé',
    nombre: fichiers.length, fichiers, archivesRemisesMaisNonDestineesAuCommit: propres.filter(p => p.startsWith('Export Dirvers/')),
    exclus: ['changements étrangers préexistants', 'tmp/', 'traces Electron de diagnostic'] }, null, 2) + '\n');
console.log(`${fichiers.length} fichiers de livraison non commités.`);
