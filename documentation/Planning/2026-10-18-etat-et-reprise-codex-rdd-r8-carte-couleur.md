# R8 — carte officielle en couleur, intégrée

David, 18/10/2026 : « pour le TMR je veux que tu prennes l'image officielle en couleur ».
Suite de [R8 raccord](2026-10-18-etat-et-reprise-codex-rdd-r8-raccord.md).

## Livraison

- Image exacte de l'archive déjà récupérée : `tmr/img/fondTMR.jpg`, identique visuellement
  à la carte du livre 2.3.1, p. 180. Copiée sans modification dans
  `outils/reve-de-dragon/tmr/images/carte-officielle.jpg` (900 × 1 000, 458 136 octets).
- SHA-256 : `59403e4c090105079b9c07d7fdba3ce4e23bed57c7430390e5689348f1df76dd`.
- Provenance et distinction des crédits de l'illustration / de l'aide informatique dans
  `outils/reve-de-dragon/tmr/CREDITS.md` et README. Aucun téléchargement supplémentaire.
- `VuesTMR.tsx` importe le JPG dans le paquet. La carte symbolique est remplacée par
  l'image officielle avec 189 boutons transparents, leurs libellés accessibles, sélection,
  voisins, pion de demi-rêve et marqueurs de sorts en réserve. Aucun changement du moteur,
  des données persistées ou du raccord aux fiches.
- Crédits visibles, README, manuel RdD et captures MJ/joueur mis à jour.

## Autorisation et géométrie

David a confirmé **« Non, GM-OS est fermé. »** avant toute modification dans `src/`.
Aucun git écrit, aucun paquet installé, aucune lecture des profils personnels.

Image à 900 × 1 000 ; grille : origine **(49, 50)**, 13 colonnes × 60 px,
15 rangées × 60 px, colonnes B/D/F/H/J/L décalées de 30 px et limitées à 14 cases.
Centres repères : G4 **(439, 260)**, J4 **(619, 290)**, D13 **(259, 830)**.
Styles isolés dans `tmr.css`. L'image conserve ses dimensions pour la lisibilité et des
cibles tactiles de 60 px ; sur un écran étroit, la carte défile horizontalement dans son
cadre, sans élargir la page. La liste des coordonnées reste une alternative accessible.

## Vérifications

- Trois tests unitaires de la vue réussis ; vérification des types `npx.cmd tsc -b` réussie.
- ESLint ciblé sur la vue et la recette : aucune erreur ni avertissement.
- `npm.cmd run build` réussi. Le précache PWA exclut les JPG séparés : import `?inline`
  pour embarquer les octets de l'image dans le module JavaScript précaché, sans changement
  de la configuration commune ni de l'image source.
- `e2e/tmrVoyageur.spec.ts` réussi sur le paquet final en 24,1 secondes, instance et profils jetables fermés.
  Image chargée depuis le paquet (900 × 1 000), alignement des centres G4/J4/D13 et clics
  vérifiés, déplacement H4 par clic côté joueur ; parcours privé MJ/deux joueurs, reprise,
  révocation et absence de débordement à 360 px conservés.
- Captures MJ, joueur 820 px et téléphone 360 px relues visuellement ; les deux captures
  de carte du manuel remplacées. La capture du raccord ne contient pas de carte et reste
  inchangée. Sorties dans `scratch/reve-de-dragon-r8/captures/` ; log de construction
  `scratch/reve-de-dragon-r8/build-carte-couleur.log`.
- `node scratch/reve-de-dragon-r8/verifier-image-embarquee.mjs` confirme que les 458 136
  octets du JPG source figurent à l'identique en base64 dans le module construit, et que
  ce module est référencé par le précache PWA.
- `git diff --check` : aucune erreur, avertissements habituels de fins de ligne seulement.

La suite complète de 8 232 tests du lot précédent n'a pas été relancée pour ce remplacement
d'image et de présentation. Le livre et les tableaux Cyol restent inchangés.

## Suite

Reprendre les rencontres/maîtrises et les sorts exécutables selon la note R8 raccord.
Ce lot d'image est terminé, **non commité et non poussé**.

**Demande suivante de David, 18/10/2026 : « commit et pousse ».** Publication du lot RdD
complet (R0, R1, R2 et R8 livré), 97 fichiers sélectionnés, avec contrôles pré-push habituels.
Les mentions « non commité » des notes décrivent l'état avant cette demande ; le journal Git
fait foi après publication. Registre, travaux Nephilim, autres guides et exports locaux exclus.

Ne pas toucher aux fichiers d'un autre travail, au registre déjà modifié par Claude,
aux profils personnels ou au pilote R0. Le module externe, ses droits et son raccord aux
fiches restent inchangés par ce remplacement d'image.
