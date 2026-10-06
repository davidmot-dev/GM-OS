# T4 J1 — Direct des joueurs, 2026-10-06

Suite de l'[accueil intégré](2026-10-06-T4-tablette-joueurs.md). David confirme à nouveau
**« gm-os est fermé »** avant ce deuxième écran. Aucun commit ni push T4 demandé.

## Intégration

`src/components/hub/HubDirect.tsx`, monté depuis `TabletHub.tsx`, applique le gabarit commun
à la [référence Direct retenue](stitch/tablettes-joueurs/README.md).

- En-tête campagne, barre de connexion/qualité, puis zone de travail.
- Téléphone et portrait : horloges publiques, projection, chroniques en pile.
- Paysage : projection à gauche, horloges et chroniques à droite.
- Navigation Direct dans le flux : six onglets nommés sur deux rangées en portrait,
  une en paysage, et quatre actions en dessous ; toutes leurs cibles font au moins 44 px.
- Initiative accessible depuis la barre d'outils ; panneau refermable, textes de 14 px.

Le dédoublonnage des entités/images et le rendu des cartes projetées gardent leurs règles.
FondProjete conserve la vidéo silencieuse et le fondu entre images. Les onglets suivants
gardent leur disposition précédente à ce stade, avec leur navigation défilante. Fiche,
Notes et Messages conservent leurs surcouches et leurs commandes ; la fiche complète
n'est pas réagencée dans cette étape.

`ClockVisualizer` a une variante compacte : elle réutilise les calculs existants de date,
heure, fête et minuteur. Les cadrans du meneur et les appels sans cette option restent les
vues complètes. Aucun code Stitch, police distante ou nouveau paquet n'est introduit.

## Vérifications

La construction et le typage passent. Les 31 tests d'horloge passent, dont cinq nouveaux
cas qui vérifient heure/secondes/date, minuteur dans les trois thèmes et fête du calendrier
fantastique. Les fichiers nouveaux et ClockVisualizer passent ESLint. TabletHub conserve
**une erreur préexistante** `react-hooks/set-state-in-effect` à la ligne 193 : mêmes
diagnostics avant/après comparaison avec HEAD, aucun défaut supplémentaire de lint.

Le banc `e2e/tabletteDirectT4.spec.ts` couvre quatre formats de 360 à 1180 px : navigation
nommée et cibles, zones distinctes, ouverture/fermeture de fiche, résumé public long,
projection réelle d'image, partage réel d'un favori PNJ et dédoublonnage, minuteur,
masquage des horloges, ouverture/fermeture de l'initiative et adversaire invisible.
Le banc ne simule pas la liaison : il modifie uniquement le décor du meneur fictif,
le navigateur joueur reçoit le véritable WebSocket. Les secrets ne sont pas rendus.

Le rejeu final passe : **47 scénarios validés**, soit quatre cas Direct, quatre cas accueil
et les 39 cas T0 joueurs. Les quatre échecs attendus connus du banc T0 restent présents
(PV vers le meneur aux trois formats, commande Jouer masquée sur téléphone).
Les deux étapes du manuel passent ; la [nouvelle capture Direct](../User%20Guides/captures/tablette-des-joueurs-direct.jpg)
a été régénérée puis regardée. Guides 61/62 relus. Le test du manuel conserve ses
27 avertissements de lint préexistants, sans erreur ni diagnostic supplémentaire.
Les seize captures ciblées ont été regardées : Direct vide, image et résumé long,
favori PNJ partagé, initiative, aux quatre formats. Elles sont consultables dans
la [galerie Direct](tablettes/T4-joueurs/direct/index.html).
Le banc T0 conserve ses 55 captures dans `tablettes/T4-joueurs/regressions-direct/` ;
les trois vues Direct ont été regardées après le rejeu. Les résultats et empreintes
sont dans [controles-integration.json](tablettes/T4-joueurs/direct/controles-integration.json).

Commandes de reprise :

```powershell
npm.cmd run build
npx.cmd vitest run src/modules/clock/horlogeCompacte.test.tsx src/modules/clock/minuteurAuRepos.test.tsx src/modules/clock/aiguillesSurLAxe.test.tsx --maxWorkers=4
$env:GMOS_TABLET_CAPTURES_DIR='documentation/Planning/tablettes/T4-joueurs/regressions-direct'
npx.cmd playwright test e2e/tabletteAccueilT4.spec.ts e2e/tabletteDirectT4.spec.ts e2e/tabletteJoueursT0.spec.ts --reporter=list
npx.cmd playwright test e2e/capturesDuManuel.spec.ts --grep 'la séance commence|tablette-des-joueurs-direct$' --reporter=list
```

Les commandes Electron restent séquentielles, sur les profils temporaires du banc.
Le grep du manuel doit inclure la mise en séance ; sinon sa capture montre l'attente.
La fenêtre Electron locale est chargée en `file://` : sans hôte, le hook n'ouvre pas
de WebSocket. Le paramètre `sync` seul ne suffit donc pas. Le test Direct charge
l'adresse HTTP de tablette sur le serveur du banc déjà lancé, avant de choisir le
personnage. Les assertions de connexion et de campagne ont arrêté les deux captures
incorrectes. Les limites de déduction du port dans Electron sont déjà décrites dans
`src/utils/portsDuRenderer.ts` ; aucun transport n'est modifié ici.

## Défaut existant constaté pendant l’étape Direct

Lors de cette étape, à la première connexion, le snapshot complet de `useNexusSynchronizer.ts` omettait notamment
mode/theme de Clock-OS. La tablette reste alors sur ses valeurs initiales : heure réelle
au lieu de la date statique du meneur. Constaté aux quatre formats, consigné au § 1 bis du
registre. **Cette première étape ne modifiait pas ce transport**. Le banc exerçait donc
un vrai changement d'horloge après connexion, dont le segment transmet ces valeurs.
La lecture du calendrier fantastique est éprouvée en unité ; son transport n'est pas validé.
**Corrigé lors de la clôture du développement J1** : snapshot et changements prennent
le même `segmentDesHorloges`, et le banc vérifie l’heure statique dès la connexion.
Voir le [relevé J1](2026-10-06-T4-J1-joueurs.md).

Piège de décor payé : ajouter un favori directement public ne déclenche pas la projection.
Le vrai geste est de créer le favori puis `updateFavorite(..., { isSyncedToPlayerHub: true })`.
`projectEntity` envoie son portrait ; il ne faut pas supposer qu'il envoie aussi une fiche nommée.

## Reprise

Accueil, Direct, Inventaire et Cartes intégrés dans J1 ; le
[relevé J1](2026-10-06-T4-J1-joueurs.md) prend la suite. Conserver un écran par commit lorsqu'il est demandé, et
une séance jouée avec J1 avant J2. T4 reste non commité ; les modifications des autres
auteurs sont conservées.
