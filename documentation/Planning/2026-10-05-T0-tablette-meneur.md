# T0 — la tablette du meneur avant la refonte

Demandé par David le **2026-10-05** : « termine T0 côté meneur ». Périmètre : § 5 du
[plan des tablettes](2026-10-04-refonte-tablettes.md), registre § 123. Code de référence :
`a26f6076`. Aucun changement de `src/` ou `electron/`.

## 1 · Le parcours et ses sources

La télécommande est `?window=remote` (`src/modules/remote/RemoteControl.tsx`), servie par le
SyncServer dans un navigateur sans `window.appBridge`. Elle réclame le jeton d'appairage dans le
fragment `#token=…`, puis l'enregistre dans le stockage du navigateur
(`src/modules/remote/pairingToken.ts`). Sans jeton valide, la connexion reste ouverte avec le rôle
joueur et la ligne d'état indique « Non appairée ». Avec le jeton, le MJ lui envoie son flux non
caviardé (`useRemoteSync.ts`, `useNexusSynchronizer.ts`). Le pupitre du bas emploie cette même
surface ; il n'a pas un écran distinct à inventorier.

Les sources abrégées du tableau sont sous `src/modules/remote/components/`.

| Écran ou état | Ce qu'il présente | Gestes existants | Source |
| --- | --- | --- | --- |
| Appairage et connexion | Voyant, « Reconnexion » ou « Non appairée » ; huit onglets même sans données | Scanner l'adresse avec jeton, retrouver la liaison après coupure | `RemoteControl.tsx`, `RemoteStatusBar.tsx`, `useRemoteSync.ts`, `pairingToken.ts` |
| Ligne d'état permanente | Musique, ambiance, round et combattant actif, minuteur, messages non lus selon l'état | Ouvrir les messages non lus ; maintenir « Couper le son » 700 ms pour arrêter bruitages, musique et ambiance | `RemoteStatusBar.tsx`, `actions/audioActions.ts` |
| Navigation | Pads, Dés, Sons, Scénario, Combat, Tableau, Notes, Messages ; colonne dès 900 px, barre basse dessous | Changer d'onglet | `RemoteControl.tsx` |
| Pads | Musique, thèmes d'ambiance, images favorites, compte des éléments masqués par le plafond ; volume et sortie de la musique et de l'ambiance | Filtrer, déclencher un pad, ajuster les volumes, choisir les sorties | `RemoteUniversalPads.tsx`, `LigneDeVolume.tsx`, `actions/sceneActions.ts` |
| Dés | Configuration du pilote, quantité, modificateur, seuil, modes manuels, formule et dés individuels ; choix des dés échelonnés si le pilote le prévoit | Composer et lancer un jet, réinitialiser les réglages | `RemoteDicePad.tsx`, `actions/diceActions.ts` |
| Résultat de dés | Total, détail des dés et verdict sur le reste de la télécommande | Se ferme au toucher du **fond** ou automatiquement après 15 s ; le texte « Cliquer pour fermer » ne réagit pas au toucher (défaut ci-dessous) | `RemoteDiceResultOverlay.tsx`, `useDernierJet.ts` |
| Sons | Bruitages de l'atmosphère active, volume et sortie des bruitages | Filtrer quand plus de huit, déclencher un bruitage, régler volume et sortie | `RemoteSoundboard.tsx`, `LigneDeVolume.tsx`, `actions/audioActions.ts` |
| Scénario | Moments du storyboard de la campagne, numérotés et ordonnés | Déclencher un moment | `RemoteStoryboard.tsx`, `actions/sceneActions.ts` |
| Combat | Round, ordre des combattants, initiative, PV et modèle de santé si présent | Passer au suivant, retirer ou ajouter un PV ; en mode Aventure les PV des ennemis sont cachés | `RemoteCombatTracker.tsx`, `actions/combatActions.ts` |
| Tableau | Dessin synchronisé et fond sombre ou clair | Crayon, gomme, laser, rectangle, cercle ; épaisseur et couleur ; annuler, rétablir, effacer, changer le fond, dessiner | `RemoteWhiteboardView.tsx`, `RemoteDrawingCanvas.tsx`, `actions/whiteboardActions.ts` |
| Notes · Séance | Scènes en cours, en pause, à jouer, résumé public | Déplier une scène et lire son résumé, les notes du MJ et ses suites | `RemoteNotes.tsx`, `segmentDeLecture.ts` |
| Notes · Trame | Actes, scènes, statuts, importance et secrets | Déplier un acte ou une scène | `RemoteNotes.tsx`, `segmentDeLecture.ts` |
| Notes · Chroniques | Wiki de campagne classé par catégorie | Chercher, déplier une fiche | `RemoteNotes.tsx`, `chroniquesParType.ts` |
| Notes · Nexus Wiki | Arborescence du coffre Obsidian, demandée à part du flux périodique | Chercher, naviguer, ouvrir une note, revenir à la liste, recharger | `RemoteObsidian.tsx`, `useRemoteSync.ts`, `actions/obsidianActions.ts` |
| Notes · Indices et Secrets | Indices du MJ révélés ou en main ; texte privé de la séance | Passer d'une vue à l'autre ; le mode Aventure protège les Secrets | `RemoteNotes.tsx` |
| Messages | Fil général et conversations par personnage, cinquante derniers messages transportés | Choisir Tous ou un personnage, envoyer par bouton ou Entrée ; le compteur de non-lus ouvre l'onglet | `RemoteMessenger.tsx`, `RemoteControl.tsx`, `actions/sessionActions.ts` |

Les menus de choix de sortie et de mode de dés, la note ouverte du coffre et les outils du tableau
sont également inventoriés dans leurs lignes. Le relevé décrit le code d'aujourd'hui, pas de
nouvelles fonctions à construire dans T4.

## 2 · Banc reproductible

[`e2e/tabletteMeneurT0.spec.ts`](../../e2e/tabletteMeneurT0.spec.ts) ouvre une véritable tablette
dans Edge/Chromium, sans pont Electron, sur le SyncServer d'un GM-OS lancé par `lancerGmOs` avec
un **profil jetable**. Sa campagne est `e2e/donnees/campagne-de-demo.json` (« Le Silence de Varn ») ;
le coffre est copié depuis `e2e/donnees/coffre-de-demo/` dans ce profil. Le test met en scène deux
moments, deux combattants, un pad d'image, un bruitage et un tracé. Tous les gestes passent par
l'interface de la tablette et leur effet est lu sur les magasins du MJ, jamais injecté dans le
navigateur pour réussir une assertion. L'application de test est muette. Aucun appareil réel et
aucune donnée de David n'entrent dans le banc.

La taille logique est fixée à **390 × 844**, **820 × 1180**, **1180 × 820** et **1440 × 900**.
Le jeton vient du pont du MJ jetable. Après appairage, le banc provoque une seconde connexion au
SyncServer pour demander un état complet : voir l'observation de première connexion ci-dessous.
Ce second client ne fournit aucune donnée ; il ne fait que déclencher le mécanisme de rattrapage
déjà prévu par le serveur. Les captures reflètent donc une tablette **appairée et synchronisée**.

```powershell
npm.cmd run build
npx.cmd playwright test e2e/tabletteMeneurT0.spec.ts --reporter=list
```

Edge est installé sur cette machine ; aucun paquet ni navigateur n'a été téléchargé.

## 3 · Résultat et captures

Le banc couvre l'appairage, les huit onglets, la ligne d'état et la fermeture du résultat de dés.
Il comporte **11 scénarios par taille, 44 au total**. Le seul échec attendu à chaque taille est
le toucher du libellé « Cliquer pour fermer » ; le toucher du fond fonctionne et est vérifié dans
le parcours Dés. Le test en échec attendu deviendra rouge si le libellé se met à fonctionner sans
qu'on retire son marquage. La course intermittente de première connexion est documentée mais
n'est pas classée en échec attendu, puisqu'elle peut aussi réussir.

**68 captures** (17 états × 4 tailles) sont rangées dans la
[galerie locale](tablettes/T0-meneur/index.html) et chaque PNG s'ouvre en pleine résolution.
Les quatre planches contact ont été relues : colonne de navigation en paysage, barre basse en
portrait, cadre du tableau, résultat de dés et vues internes des Notes. Ce sont des références
de mise en page, pas des snapshots au pixel près ; le total des dés et l'heure des messages
varient à chaque exécution.

**Deux constats hors T0, consignés au § 1 bis du registre :**

- La première connexion appairée a parfois gardé les pads absents jusqu'à une nouvelle demande de
  synchronisation. `SyncServer.handleConnection` demande l'état avant que `remote:register`
  attribue le rôle ; le résultat dépend de l'ordre effectif des deux traitements. Sur une série
  d'essais, trois tailles sont restées vides et une s'est peuplée spontanément. À traiter avant de
  tenir le critère de reconnexion de T1.
- Le libellé « Cliquer pour fermer » est à l'intérieur du panneau qui arrête la propagation du
  clic ; seul le fond ferme le résultat. Vérifié aux quatre tailles ; à reprendre avec le lot M1.

Le **relevé T0 meneur** est complet. Avec le [relevé joueurs](2026-10-04-T0-tablette-joueurs.md),
les deux surfaces sont inventoriées et capturées. La sortie stricte de T0 (« essais passent sur le
code d'aujourd'hui ») reste à arbitrer : les défauts connus de la fiche joueurs, de l'appairage
MJ et de la fermeture du résultat empêchent de qualifier la base d'entièrement saine. T1 n'est
pas commencé.
