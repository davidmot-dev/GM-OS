import fs from 'node:fs';
function inserer(fichier, repere, texte) {
  const avant=fs.readFileSync(fichier,'utf8');
  if(avant.includes(texte.trim())) return;
  if(!avant.includes(repere)) throw new Error('Repère absent : '+fichier);
  fs.writeFileSync(fichier,avant.replace(repere,texte+'\n'+repere));
}
const guide='documentation/User Guides/';
inserer(guide+'63-Fiche-de-personnage-HTML.md','## 1. Ce que c\'est vraiment',`## Reprendre une ancienne fiche

Depuis le 03/11/2026, le meneur peut ouvrir **Formulaire → Diagnostic et reprise de fiche**
sur un PJ. Le panneau affiche le pilote installé, sa version, le gabarit attendu et la dernière
référence enregistrée. Une référence inconnue signifie que GM-OS ne connaît pas la version de
création ; ce n'est pas une preuve que la fiche est périmée. Les nouveaux PJ retiennent leur
référence à la création. Le Voyageur conserve son panneau de reprise spécifique.

1. Sauvegarder ou abandonner les saisies en cours du formulaire.
2. Lire les clés hors gabarit, les valeurs incompatibles et les champs absents. Les anciennes
   clés sont conservées ; aucun rapprochement n'est déduit du nom d'un champ.
3. Choisir explicitement les valeurs anciennes à copier vers les champs actuels et relire
   **l'aperçu avant/après**. Une cible déjà remplie peut être remplacée par ce choix.
4. **Télécharger la sauvegarde avant reprise**, puis **Appliquer cette reprise**. Le JSON
   conserve les rubriques avant et après la reprise et désigne ce PJ précis.
5. Pour revenir en arrière, choisir ce JSON sous **Sauvegarde de reprise à restaurer**, vérifier
   l'aperçu puis **Restaurer les anciennes valeurs**. Si les rubriques reprises ont changé entre
   temps, la restauration refuse de les écraser. La sauvegarde d'un autre PJ est refusée.

La reprise conserve les notes, l'inventaire, la santé et les anciennes clés. Les champs absents
reçoivent les valeurs initiales du gabarit, montrées avant l'application. Si le gabarit change,
le lien vers l'ancienne fiche HTML est détaché ; cette fiche reste dans la bibliothèque. Relier
ensuite la fiche adaptée au jeu. Le JSON ne remplace pas une sauvegarde complète : il ne
restaure ni un pilote remplacé, ni toute une campagne, ni une bibliothèque HTML.

Pour changer le pilote installé, importer son **.gmos-driver** dans Nexus avec **Remplacer**.
Importer une campagne ne remplace pas un pilote déjà présent du même identifiant ; le bilan
signale désormais une différence de version, de règles ou de gabarit, même si le numéro de
version est identique entre deux variantes. Voir [Nexus](./90-Nexus-OS-emporter-une-campagne.md).

*NP-C2 : réalisation et tests structurels vérifiés le 03/11/2026 ; essais applicatifs et essai
de David encore à faire. Aucune campagne personnelle ouverte.*

`);
inserer(guide+'53-Les-jeux-et-leurs-mecaniques.md','**Dune, 25/10/2026 :**',`**Anciennes fiches et variantes, 03/11/2026 :** le meneur dispose du
[diagnostic et de la reprise de fiche PJ](./63-Fiche-de-personnage-HTML.md#reprendre-une-ancienne-fiche) :
référence installée, correspondances choisies, aperçu, sauvegarde JSON et restauration protégée.
L'import d'une campagne signale les dépendances locales différentes qu'il conserve. Les essais
applicatifs des droits et des variantes COC 3d6/Shadowrun alternatif sont préparés, non encore exécutés.

`);
inserer(guide+'90-Nexus-OS-emporter-une-campagne.md','## 📤 Exporter une campagne',`## Pilote conservé et anciennes fiches

L'import d'une campagne ajoute ses pilotes manquants, mais **conserve un pilote déjà installé
de même identifiant**. Depuis le 03/11/2026, son bilan avertit si la version, les règles de jet
ou de combat, ou le gabarit embarqué diffèrent de ceux du poste. Deux variantes peuvent avoir
le même numéro de version : ce numéro seul ne suffit pas à conclure qu'elles sont identiques.

Pour changer le pilote, importer son **.gmos-driver** séparément avec **Remplacer**. Vérifier
ensuite les PJ via **Formulaire → Diagnostic et reprise de fiche**. Cette reprise volontaire
montre les valeurs avant/après et demande de télécharger son JSON de retour arrière ; elle
ne migre aucune campagne à son ouverture. Voir [la méthode](./63-Fiche-de-personnage-HTML.md#reprendre-une-ancienne-fiche).

`);
const jeux=['RuneQuest','Degenesis','COC','Shadowrun-Anarchy'];
for(const jeu of jeux) inserer(guide+`54-Jeu-${jeu}.md`,'\n---\n',`\n**Anciennes fiches — NP-C2, 03/11/2026.** Le meneur peut maintenant préparer une
[reprise avec aperçu et sauvegarde](./63-Fiche-de-personnage-HTML.md#reprendre-une-ancienne-fiche)
depuis le formulaire du PJ. Les anciennes clés restent présentes ; les correspondances se
choisissent explicitement, sans déduire une conversion de leurs noms. Les notes et la santé
ne sont pas remises à zéro. L'import d'une campagne conserve un pilote de même ID et signale
les différences ; pour changer ce pilote, importer son .gmos-driver avec **Remplacer**.
Tests structurels vérifiés ; recette applicative et essai de David encore à faire.
`);
const plan='documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md';
let texte=fs.readFileSync(plan,'utf8');
texte=texte.replace('- [ ] **NP-C2 · P1 — Anciennes fiches :** proposer un diagnostic et un aperçu de conversion, avec conservation des valeurs et retour arrière.',
  '- [ ] **NP-C2 · P1 — Anciennes fiches : réalisation livrée le 03/11, recette à terminer.** Diagnostic de version/gabarit, liaisons explicites, aperçu, export JSON et restauration protégée ; anciennes clés, notes et PV conservés. Tests structurels verts ; essais Electron et essai de David encore à faire.');
texte=texte.replace('- [ ] **NP-C3 · P1 — Droits et variantes :** vérifier le refus d’éditer le PJ d’autrui, puis les imports COC 3d6 et Shadowrun alternatif.',
  '- [ ] **NP-C3 · P1 — Droits et variantes : essais préparés le 03/11.** Six parcours Electron : refus sur les quatre jeux, conservation après rechargement, imports COC 3d6 et Shadowrun alternatif puis retour au standard. Exécution en attente de l’autorisation des services locaux ; aucun bug GM-06 déclaré sans preuve.');
texte=texte.replace(/^\| 🔴 P1 · NP-C2[^\n]*$/m,
  '| 🟠 P1 · NP-C2 — Anciennes fiches et versions | **Réalisation livrée le 03/11, recette applicative à faire.** Référence enregistrée sur les nouveaux PJ, diagnostic sur les anciens sans version inventée ; aperçu et correspondances explicites. Nexus signale une dépendance différente conservée, y compris une variante de même version | Sauvegarde JSON obligatoire avant application ; anciennes clés, notes et santé conservées ; restauration relue et refusée si la fiche a changé. **252 tests ciblés passent (22 fichiers)** ; six parcours Electron préparés, autorisation de démarrage attendue. [Suivi](2026-11-03-np-c2-c3-reprises-droits-variantes.md) |');
texte=texte.replace(/^\| 🔴 P1 · NP-C3[^\n]*$/m,
  '| 🟠 P1 · NP-C3 — Droits et variantes | **Essais préparés le 03/11.** La politique existante refuse déjà le PJ d’autrui dans les tests unitaires ; aucun défaut GM-06 démontré. Parcours préparés : quatre jeux sur la vraie porte WebSocket, propres éditions autorisées, notes MJ protégées, refus persisté après rechargement ; variantes COC 3d6 et Shadowrun alternatif puis standard | Exécuter `e2e/reprisesEtVariantesDesPilotes.spec.ts` dans l’instance jetable autorisée ; jets et valeurs conservées, captures et rapports dédiés. Autorisation des services locaux attendue ; cas humains et tablette physique **NON TESTÉS**. [Suivi](2026-11-03-np-c2-c3-reprises-droits-variantes.md) |');
texte=texte.replace('**Suite choisie par David :** NP-C1, RQ-A2 et RQ-A1 validés ; choisir ensuite un lot restant,',
  '**Suite choisie par David :** NP-C1, RQ-A2 et RQ-A1 validés ; **NP-C2 et NP-C3 choisis le 02/11**. Le diagnostic de reprise est réalisé, les essais applicatifs sont préparés et attendent leur autorisation locale ; choisir ensuite un autre lot restant,');
for(const jeu of ['RuneQuest','Degenesis','Chroniques Oubliées Contemporain','Shadowrun Anarchy']) {
  const debut=`| [${jeu}]`;
  texte=texte.split('\n').map(l=>l.startsWith(debut)&&!l.includes('NP-C2 livré')?l.replace(/ \|$/,' ; NP-C2 livré, NP-C3 préparé, recette applicative à terminer (03/11) |'):l).join('\n');
}
for(const titre of ['## RuneQuest','## Degenesis','## Chroniques Oubliées Contemporain','## Shadowrun Anarchy']) {
  const paragraphe='\n\n**NP-C2 / NP-C3 — reprise commune du 03/11.** Diagnostic et aperçu de reprise des anciennes fiches PJ livrés : conservation, export JSON et retour arrière protégé. Tests structurels verts ; six essais applicatifs de reprise, droits et variantes préparés mais non exécutés, démarrage local en attente d’autorisation. [Suivi et cases à cocher](2026-11-03-np-c2-c3-reprises-droits-variantes.md). Les fonctions du pilote déjà validées restent acquises ; aucun défaut de droits n’est déclaré sur la seule absence d’essai.';
  if(!texte.includes(titre+paragraphe)&&texte.includes(titre+'\n')) texte=texte.replace(titre+'\n',titre+paragraphe+'\n');
}
fs.writeFileSync(plan,texte);
console.log('Manuel (53, 54 ×4, 63, 90) et synthèse des pilotes actualisés.');
