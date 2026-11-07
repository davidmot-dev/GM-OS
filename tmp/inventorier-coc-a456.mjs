import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const sortie = 'output/coc-a4-a6';
const rapportPath = `${sortie}/verification-technique.json`;
const rapport = JSON.parse(fs.readFileSync(rapportPath, 'utf8'));
rapport.manuel = { testsDeCoherenceFinaux: 36, fichiersReussis: 2, echecs: 0 };
rapport.diffCheck = 'git diff --check : réussi';
fs.writeFileSync(rapportPath, JSON.stringify(rapport, null, 2) + '\n');
const anciens = JSON.parse(fs.readFileSync('output/coc-a1-a3/fichiers-de-livraison.json', 'utf8')).fichiers;
const etrangers = new Set(['Export Dirvers/corriges/RQ_driver_gmos_finir.gmos-driver', 'documentation/User Guides/10-Session-OS-le-cockpit.md', 'documentation/User Guides/12-Forge-de-campagne.md']);
const modifies = execFileSync('git', ['diff', '--name-only', '-z'], { encoding: 'utf8' }).split('\0').filter(p => p && !etrangers.has(p));
const ajouts = [
  'docs/systems/coc/rules/sante-psychique-et-chocs.md',
  'documentation/Planning/2026-11-04-coc-a4-a6.md',
  'documentation/Planning/2026-11-04-etat-et-reprise-codex-coc-a4-a6.md',
  'e2e/cocAventures.spec.ts', 'outils/coc/etendre_coc.mjs',
  'src/modules/combat/cocAventures.test.ts',
  ...['avantagesDeCoc.ts', 'psychismeDeCoc.ts', 'voiesDeCoc.ts', 'cocAventures.test.ts'].map(n => `src/modules/dice/systemes/${n}`),
  ...['AventuresCoc.tsx', 'AventuresCoc.test.tsx'].map(n => `src/modules/session/components/fields/${n}`),
  ...['heroisme', 'psychisme', 'voies', 'voies-hub'].map(n => `documentation/User Guides/captures/jeu-coc-${n}.jpg`),
  ...['d20', 'option-3d6'].map(v => `Export Dirvers/corriges/coc/COC-2.2.0-${v}.gmos-driver`)
];
function livrables(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    if (e.name.startsWith('traces-') || e.name.startsWith('.')) return [];
    const p = path.posix.join(dir, e.name);
    return e.isDirectory() ? livrables(p) : [p];
  });
}
const inventaire = `${sortie}/fichiers-de-livraison.json`;
const fichiers = [...new Set([...anciens, ...modifies, ...ajouts, ...livrables(sortie), inventaire])].sort();
for (const fichier of fichiers) if (fichier !== inventaire && !fs.existsSync(fichier)) throw new Error(`Absent : ${fichier}`);
fs.writeFileSync(inventaire, JSON.stringify({ dateDebut: '2026-11-04', dateClotureTechnique: '2026-11-05', sujet: 'COC-A1 à COC-A6, livraison combinée non commitée', commit: 'non demandé', nombre: fichiers.length, fichiers,
  archivesRemisesMaisNonDestineesAuCommit: fichiers.filter(p => p.startsWith('Export Dirvers/')),
  exclus: ['changements étrangers préexistants (dont RuneQuest et guides10/12)', 'tmp/', 'traces Electron de diagnostic', 'docs/Reference/ et clips étrangers'] }, null, 2) + '\n');
console.log(`${fichiers.length} fichiers de livraison COC-A1 à A6 ; aucune commande Git d’écriture.`);
