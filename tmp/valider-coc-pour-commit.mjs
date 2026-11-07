import fs from 'node:fs';
function modifier(p, fn) { const ancien = fs.readFileSync(p, 'utf8'); const suivant = fn(ancien); if (suivant === ancien) throw new Error(`Aucune modification : ${p}`); fs.writeFileSync(p, suivant); }
const citation = 'David confirme le 05/11/2026 : « c\'est bon c\'est testé, tu peux commit et pousse ». COC-A1 à COC-A6 sont validés ; commit et push autorisés sur production.';
modifier('documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md', s => {
  s = s.replaceAll('- [ ] **COC-A', '- [x] **COC-A');
  const a = s.indexOf('### 5. Compléter COC'), b = s.indexOf('### 6.', a);
  let plan = s.slice(a, b).replaceAll('à essayer par David', 'validé par David le 05/11').replaceAll('essai David restant', 'validé par David le 05/11');
  s = s.slice(0,a) + plan + s.slice(b);
  s = s.replace('🟢 10 · 🟠 6 · 🔴 0', '🟢 16 · 🟠 0 · 🔴 0').replace('COC-A1 à COC-A6 réalisés, **essai David restant**', 'COC-A1 à COC-A6 réalisés et **validés par David le 05/11**');
  const debut = s.indexOf('## Chroniques Oubliées Contemporain'), fin = s.indexOf('\n## ', debut + 4);
  let jeu = s.slice(debut, fin).replace('réalisation distincte de l’essai restant par David', 'validés par David le 05/11');
  jeu = jeu.replaceAll('| 🟠 P1 · COC-', '| 🟢 P1 · COC-').replaceAll('| 🟠 P2 · COC-', '| 🟢 P2 · COC-');
  jeu = jeu.replaceAll('à essayer par David.', 'validé par David le 05/11.');
  jeu = jeu.replace('**Reste :** essai de COC-A1 à COC-A6 par David.', '**Validation de David le 05/11/2026 :** « c\'est bon c\'est testé, tu peux commit et pousse ». Les six lots sont cochés et verts. **Reste :** aucun essai attendu pour COC-A1 à COC-A6.');
  return s.slice(0,debut) + jeu + s.slice(fin);
});
modifier('documentation/Planning/2026-08-23-chantiers-gares.md', s => {
  const a = s.indexOf('### 214 · COC'), b = s.indexOf("## La vue d'un coup d'œil", a);
  let t = s.slice(a,b);
  t = t.replace('Pas de commit/push demandé pour ce lot.', 'Validation et commit/push demandés le05/11 : « c\'est bon c\'est testé, tu peux commit et pousse ».');
  t = t.replace('**Réalisé, essai David restant :**', '**Réalisé et validé par David le05/11 :**');
  t = t.replace('Aucun commit/push pour COC.', 'Commit/push autorisés le05/11 avec A4/A5/A6.');
  t = t.replace('🟠 réalisé, validation de David attendue. Synthèse : dix acquis conservés, trois lots orange et trois propositions rouges.', '🟢 A1/A2/A3 validés par David le05/11. Synthèse actuelle avec A4/A5/A6 : seize acquis verts, zéro orange, zéro rouge.');
  t = t.replace('Aucun commit/push demandé. Les fichiers A1/A2/A3 restent conservés et leur validation humaine reste attendue.', 'Le05/11, David confirme « c\'est bon c\'est testé, tu peux commit et pousse » : les six lots COC sont validés, commit/push autorisés.');
  t = t.replace('**Réalisé en2.2.0, essai David restant :**', '**Réalisé en2.2.0 et validé par David le05/11 :**');
  t = t.replace('🟠 A4/A5/A6 réalisés, à essayer par David ; A1/A2/A3 toujours orange. Synthèse10 acquis verts/6 lots orange/0 rouge.', '🟢 COC-A1 à COC-A6 validés par David le05/11 ; seize acquis verts, zéro orange, zéro rouge. Aucun essai humain restant pour ces lots.');
  s = s.slice(0,a) + t + s.slice(b);
  return s.replace(/^\| 151 \|.*$/m, '| 151 | **COC — COC-A4/A5/A6** | 🟢 §215 ; pilote2.2.0, 9 871 tests et deux parcours Electron verts ; six lots validés par David —05/11 | Rien pour COC-A1 à A6 | Rien |')
    .replace(/^\| 150 \|.*$/m, '| 150 | **COC — COC-A1/A2/A3** | 🟢 §214 ; livrés en2.1.0, inclus en2.2.0 et validés par David —05/11 | Rien pour ces trois lots | Rien |');
});
for (const suffixe of ['a1-a3', 'a4-a6']) {
  const p = `documentation/Planning/2026-11-04-coc-${suffixe}.md`;
  modifier(p, s => {
    const lignes = s.split('\n'); lignes.splice(2,0,`**État actuel — 05/11 :** ${citation}`, '', 'Les mentions d’attente ci-dessous décrivent la livraison avant ce retour.', '');
    return lignes.join('\n').replace('## Recette de David restant à faire', '## Recette proposée avant validation de David');
  });
  const readme = `output/coc-${suffixe}/README.md`;
  modifier(readme, s => s.replace(/Livraison du 04\/11\/2026\.[\s\S]*?Pas de commit\/push demandé pour ce lot\./, `Livraison du 04/11/2026. ${citation}`)
    .replace(/Réalisation du 04\/11\/2026,[\s\S]*?Aucun commit\/push demandé ou effectué\./, `Réalisation du 04/11/2026, clôture technique le 05/11. ${citation}`)
    .replace('les changements COC-A1 à A6 non commités', 'les changements livrés de COC-A1 à A6'));
  for (const nom of ['verification-technique.json', 'fichiers-de-livraison.json']) {
    const r = `output/coc-${suffixe}/${nom}`, v = JSON.parse(fs.readFileSync(r, 'utf8'));
    v.validationDavid = { date: '2026-11-05', citation: "c'est bon c'est testé, tu peux commit et pousse", lots: 'COC-A1 à COC-A6', portee: 'validation globale de David ; aucun résultat individuel de recette ajouté' };
    if ('commitEtPush' in v) v.commitEtPush = 'autorisés par David le 05/11/2026';
    if ('commit' in v) v.commit = 'autorisé par David le 05/11/2026';
    if ('sujet' in v) v.sujet = v.sujet.replace(', livraison combinée non commitée', ', livraison combinée validée');
    fs.writeFileSync(r, JSON.stringify(v,null,2)+'\n');
  }
}
for (const p of ['documentation/Planning/2026-11-04-etat-et-reprise-codex-coc.md', 'documentation/Planning/2026-11-04-etat-et-reprise-codex-coc-a4-a6.md']) {
  modifier(p, s => {
    const lignes = s.split('\n'); lignes.splice(2,0,`**État actuel — 05/11 :** ${citation}`, '[Reprise actuelle](2026-11-05-etat-et-reprise-codex-coc.md). Les attentes et états Git ci-dessous sont ceux de la livraison initiale.', '');
    return lignes.join('\n');
  });
}
modifier('documentation/User Guides/54-Jeu-COC.md', s => s.replace('> Générateurs :', '> **Lots COC-A1 à COC-A6 testés et validés par David le 05/11/2026.**\n> Générateurs :'));
