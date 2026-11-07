# État et reprise Codex — clip Torg, 07/11/2026

## Ce qui est livré

À la demande de David : [clip MP4 Torg de 2 min 58](../../output/clips/torg-mecanismes-et-tablette.mp4),
[WebM](../../output/clips/torg-mecanismes-et-tablette.webm), huit chapitres et légendes françaises,
sans voix ni musique. Electron MJ et vrai Hub joueur HTTP/WebSocket ; profils jetables,
personnages fictifs, dés préparés, images de cartes du dépôt.

Dé explosif et Table des Bonus ; Possibilité et minimum 10 ; Ingénieux, coût et usage
par scène ; carte d’Action *Gardez la pose !* et Un de plus ! ; Réserve et échange
atomique d’une carte contre une autre ; fiche HTML ; Ténacité en Pan-Pacifica ;
Sbires et Souffrance en Tharkold. La distribution des Cartes de Cosm n’est pas filmée.

Tablette 768×1024 en émulation mobile/tactile : 14 appuis, 18 événements de déplacement.
Le glissement est une séquence tactile Chromium, les appuis sont des `tap()` ;
sélections et saisies HTML, sans clavier tactile natif filmé. Aucun appareil physique.
Le MJ reçoit le jet et le coût de Possibilité de Teo (3→2), l’échange Monologue/Plan
de secours et la défense d’Esquive 9 saisie dans la fiche HTML.

Build, lint ciblé, répétition rapide et tournage normal passent. MP4 H.264 et WebM VP9
1440×900, 178,2 s ; décodage complet du MP4 sans erreur. Quatorze scènes et vingt-six
images du film relues, dont trois raccords. [Rapports et reproduction](../../output/clips/torg/README.md).
Aucun changement du code applicatif ou du pilote, aucune installation, aucune donnée personnelle.

Les lots TORG-A0 à A4 et la fiche reliée, déjà validés par David, restent au vert.
La relecture intégrale du corpus et l’essai matériel des modules MJ sont des sujets distincts.
Registre § 235, ligne 171 ; synthèse et manuel 54 actualisés.

## Par quoi reprendre

Ouvrir le MP4. Aucun reste de fabrication du clip. Pour un nouveau tournage :
`npm run build`, puis `npx playwright test e2e/clipTorg.spec.ts --reporter=list` ;
services locaux autorisés dans le profil jetable. Le script lit le pilote corrigé
dans `Export Dirvers/corriges/Torg-Eternity-2.0.0.gmos-driver` sans le modifier.

Non commités : `e2e/clipTorg.spec.ts`, `outils/clips/monter_clip_torg.mjs`, les deux
exports `output/clips/torg-mecanismes-et-tablette.*`, les médias/rapports/Markdown de
`output/clips/torg/`, cette note ; compléments dans `2026-08-23-chantiers-gares.md`,
`2026-10-20-ameliorations-tous-les-pilotes.md` et `User Guides/54-Jeu-Torg.md`.
Ces trois fichiers portaient déjà nos mises à jour de validation de Torg ; elles
sont conservées, comme les notes `2026-11-07-torg-ameliorations.md` et
`2026-11-07-etat-et-reprise-codex-torg.md`. Aucun commit ou push demandé ici.
Les changements étrangers, notamment le pilote RuneQuest, sont laissés intacts.

## Ce qu’il ne faut pas repayer

- Le moteur HTML met plus de dix secondes à rouvrir la bibliothèque après le retour
  du Hub : attendre ses champs (60 s maximum), pas un délai arbitraire. Les attentes
  de connexion et de cette ouverture sont identifiées dans `montage.json` et retirées.
- Créer les fiches de Mara et Teo avant le générique. Attendre le vrai bouton de
  création : `isVisible()` immédiat peut passer avant le chargement de la bibliothèque.
- La fiche du Hub est une fenêtre modale : toucher **Retour** avant l’onglet Cartes.
- Les chemins d’images `file://` de Deck-OS ne résolvent pas toujours les JPEG dans
  le paquet construit. Le tournage relie les images aux vrais JPEG intégrés en data URI,
  uniquement dans les pages isolées ; aucune carte dessinée ni règle remplacée.
- Ne pas confondre le n° imprimé 13-N et l’index 12 du fichier Action. Ses métadonnées
  reprennent la ligne standard Héros/Un de plus ! et Intimidation/Provocation.
- Le sous-ensemble Destin comporte cinq cartes, sans Relation. Ne pas faire une
  démonstration de Populaire ou du réapprovisionnement d’une table complète avec lui.
- Préparer `Math.random` seulement dans la pile du moteur de dés : les identifiants
  et les autres aléas gardent leur générateur. Rétablir le hasard après chaque geste.
- `GMOS_CLIP_RAPIDE=1` sert à répéter, jamais au film livré. Le rapport rapide est
  conservé séparément ; ses médias intermédiaires ont été supprimés après livraison.
- Sous PowerShell, employer `npx.cmd` et `npm.cmd`. Les logs redirigés sont UTF-16LE ;
  `exit $LASTEXITCODE` évite de confondre un avertissement Node avec l’échec de Playwright.
