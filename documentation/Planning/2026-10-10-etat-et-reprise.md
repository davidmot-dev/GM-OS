# État et reprise — 10/10/2026

## Point de départ

AGENTS.md, passation du 04/10, dernière note du 09/10 et registre lus.
Dernier commit local au début du chantier : **`59d4bbb0`**, branche
`feature/tablet-hub-pwa`. Les §§ 130–133 ont été traités depuis la session
Codex précédente ; ne pas les rouvrir d'après la note historique du 09/10.

David demande **« compléter le thème de jeu Blade Runner (icônes, et plus si
pertinent) »**, avec **RPG Theme Builder**, en conservant le thème existant.
Il demande ensuite « continue », puis **« ok commite et pousse »** le 10/10 :
commit et push explicitement autorisés pour ce chantier.

## § 134 — paquet Blade Runner complété et validé

Instructions du plugin RPG Theme Builder et **contrat du dépôt v1.7** appliqués.
Le paquet Cthulhu Hack est le modèle de structure, pas la source des dessins.

- Dix SVG originaux : `pj`, `pnj`, `combat`, `des`, `indice`, `lieu`,
  `scene`, `sante`, `oracle`, `journal` ; `icones.json` associe leurs chemins.
  Trait technique néo-noir, carré 24 × 24, `currentColor`, trait de 1,75,
  fichiers de 242 à 300 octets. Aucun nouveau nom de contrat.
- Dans `theme.css`, **deux valeurs** changent :
  `--rpg-info: #84bcd2 → #84b2e4`, pour distinguer information et réussite.
  `--rpg-texture-panel` remplace les lignes répétées par
  `url('matieres/papier-froid.svg')`, selon le choix de David ci-dessous.
  `success`, les autres couleurs, les polices, les arrondis et tous les
  autres jetons sont conservés, dont l'opacité de matière **0,14** et le fond
  sans matière. Quatre commentaires corrigent les mentions
  v1.2/V2 : v1.7 et application avec les personnalités.
- `intention.md` distingue les jetons réellement lus de la démonstration SDK.
  Il précise les polices approchées et les limites réelles.
- Planche [des icônes à 16, 24 et 48 px](../../docs/systems/blade-runner/theme/apercu/icones.png),
  relue. C'est le rendu des SVG dans un navigateur isolé, pas une capture GM-OS.
- [Rapport complet du validateur](../../docs/systems/blade-runner/theme/apercu/rapport-validation.md)
  fourni dans `apercu/`, dossier ignoré par le lecteur de thème.

**Décision du 10/10.** Après les options et la recommandation « papier froid très
léger + coins techniques + séparateur discret », David répond **« ok avec ta
proposition »**. Ajouts réalisés : `matieres/papier-froid.svg`, `ornements.json`,
`ornements/coin.svg`, `ornements/separateur.svg`. Grain alpha monochrome, sans
changer les couleurs, et ornements en `currentColor`. Ni en-tête ni filigrane.
[Planche matière/ornements](../../docs/systems/blade-runner/theme/apercu/matiere-ornements.png)
relue : comparaison avec la matière précédente, coins à 28 px, séparateur à
16 px et détails agrandis ; polices système, pas une capture GM-OS.

**Choix ouvert.** `humanite` et `promotion` n'existent pas dans `NOMS_D_ICONES` ;
signalés dans l'intention, aucun nom ajouté. Une évolution du contrat relèverait
d'une décision distincte de David.

## Contrôles et protections

- `npm run theme:valider -- blade-runner` : **ACCEPTÉ, zéro erreur,
  zéro avertissement** (avant : un avertissement sur réussite/information).
  Contrastes lus dans le rapport, jamais recalculés :
  texte/fond **17,7**, texte/panneau **16,66**, information/fond **9,1**.
  Sous la nouvelle matière : texte/panneau **16,66**, texte discret/panneau **5,88**.
  Texte sur accent **6,59**, au-dessus du minimum 4,5 mais sous le recommandé 7,
  valeur inchangée.
- `npx vitest run electron/validationDesThemes.test.ts --maxWorkers=4` :
  **neuf tests réussis**, un fichier ; la vraie commande valide tous les thèmes.
- `git diff -- docs/systems/blade-runner/theme/theme.css` relu :
  six lignes changées, deux valeurs et quatre commentaires justifiés.
- `git diff --check` propre, empreintes des **19 fichiers étrangers** inchangées.
- Aucune modification de `src/`, `electron/`, d'autres jeux ou de `.ragignore`.
  Hors du paquet, seuls **ce registre et la note du jour**, explicitement demandés,
  sont écrits. Aucun paquet installé, aucun service réseau démarré, aucune
  lancement GM-OS/vitrine ni lecture de sauvegarde. Les seules écritures Git
  autorisées ensuite sont la livraison demandée par David.

**Pièges de cette session.** PowerShell refuse `npm.ps1` par sa politique
d'exécution ; utiliser `npm.cmd`/`npx.cmd` ou `cmd.exe /d /c`, sans changer
la politique. Le Chromium de Playwright n'est pas installé : la planche utilise
le Chrome déjà présent, en mode headless avec profil temporaire et requêtes
réseau bloquées, sans installer de navigateur. La source du dessin reste le SVG.

## Reprise

**Livraison Git demandée le 10/10 : 22 fichiers Codex** : 20 dans le paquet (deux modifiés,
18 créés), registre et nouvelle note du jour. Préserver les guides, `.claude`
et `outils/jdr-pdf-vers-md/` étrangers.

Pour juger dans GM-OS : personnalités allumées, puis changer de campagne pour
relire le thème. Autre possibilité, **vitrine seulement avec l'accord de David** :
elle lit ses sauvegardes. Ne pas l'exécuter pour une simple planche d'icônes.
Matière et ornements choisis, réalisés et revalidés ; le jugement en GM-OS reste
à David. Commit autorisé : `feat(theme): completer les icones et ornements de
Blade Runner`, attribution Codex, puis push sur `feature/tablet-hub-pwa` avec
la validation du hook. Le commit fait foi pour son identifiant et le périmètre
livré ; ne pas inclure les fichiers étrangers.
