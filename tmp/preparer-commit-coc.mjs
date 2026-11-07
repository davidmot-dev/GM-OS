import fs from 'node:fs';
const p = 'output/coc-a4-a6/fichiers-de-livraison.json';
const v = JSON.parse(fs.readFileSync(p,'utf8'));
v.fichiers = [...new Set([...v.fichiers, 'documentation/Planning/2026-11-05-etat-et-reprise-codex-coc.md'])].sort();
v.nombre = v.fichiers.length;
v.fichiersDestinesAuCommit = v.fichiers.filter(f => !f.startsWith('Export Dirvers/'));
v.nombreDestineAuCommit = v.fichiersDestinesAuCommit.length;
fs.writeFileSync(p, JSON.stringify(v,null,2)+'\n');
const note = 'documentation/Planning/2026-11-04-coc-a4-a6.md';
fs.writeFileSync(note, fs.readFileSync(note,'utf8').replace('**98 fichiers de livraison**','**99 fichiers de livraison**, dont 95 destinés au commit'));
const reprise = 'documentation/Planning/2026-11-04-etat-et-reprise-codex-coc-a4-a6.md';
fs.writeFileSync(reprise, fs.readFileSync(reprise,'utf8').replace('(98 fichiers)', '(99 fichiers, dont 95 destinés au commit)'));
fs.writeFileSync('tmp/coc-commit-paths.txt', v.fichiersDestinesAuCommit.join('\0')+'\0');
fs.writeFileSync('tmp/coc-commit-message.txt', `feat(coc): finaliser COC-A1 a COC-A6

David demande les six lots COC puis confirme le 05/11/2026 :
« c'est bon c'est testé, tu peux commit et pousse ».

Suit les degats depuis l'arme, la RD unique et les consequences de sante.
Ajoute roles PNJ, Pulp et bandes, heroisme hors test et Legende, chocs et
sequelles persistants, puis cinq capacites officielles choisies par contexte.
Conserve identifiants et anciennes cles dans les variantes d20 et 3d6 du
pilote 2.2.0. Partage les capacites avec le Hub et garde leurs sources au journal.

Actualise corpus, manuel, captures et suivi ; COC-A1 a A6 valides, seize
acquis verts. Archives de reimport remises dans Export Dirvers/corriges/coc,
copies reproductibles sous output. Changements etrangers et traces exclus.

Verification : 9 871 tests reussis, 4 ignores ; types, lint sans erreur et
construction passes ; deux parcours Electron finaux et 36 tests du manuel.
Neuf captures 2.2 relues ; aucun profil personnel utilise.

Co-Authored-By: Codex <noreply@openai.com>
`);
console.log(`${v.nombre} fichiers de livraison ; ${v.nombreDestineAuCommit} au commit.`);
