# T3 — propositions meneur M1 et M2, 2026-10-06

David : « fait M1 et M2 », puis « continue ». La demande suit le commit J2 `0064f67a`.
**À présenter : [la galerie M1/M2](index.html)**, également accessible depuis
[la galerie joueurs](../T3-propositions/index.html). **Les huit écrans sont retenus le 06/10**
après « ok c'est bon pour moi, est-ce que t3 est fini ? » : accord consigné sur l’ensemble
présenté en T3. Les [références MJ](../../stitch/tablette-meneur/README.md) sont archivées pour T4.

M1 comprend Pads, Dés, Combat, la ligne d’état et « Couper le son ». M2 comprend Sons,
Scénario, Tableau, les six vues des Notes et Messages. Les versions téléphone et paysage
s’accompagnent des rendus iPad portrait et pupitre. Ce travail produit des maquettes T3 ;
T4 n’est pas commencé.

## Provenance

Projet Stitch existant : [Système Design Bureau Modulaire](https://stitch.withgoogle.com/projects/14179472786712390673).
Système réutilisé : `assets/f715d3f70c644671a1bdf4670b677326`, sans modification.
Huit générations téléphone, puis huit `edit_screens` depuis leurs identifiants pour les
déclinaisons paysage. Les seize identifiants, dimensions déclarées par Stitch et fichiers
associés sont dans [ecrans.json](ecrans.json). Les prompts effectivement envoyés sont dans
`*-requete.json` et dans [le document M1/M2](../../2026-10-05-prompts-stitch-tablettes-M1-M2.md).
Les réponses et suggestions sont conservées dans `*-reponse.json` et liées dans la galerie.

Le MCP utilisé accepte du texte ; les références T0 et le contrat de présentation ont été
transcrits dans les prompts, pas joints comme images. Les exports `*-original.html` sont
conservés intacts, avec leurs seize rendus Chromium. Les assertions automatiques de Stitch
ne valent pas validation.

Les versions locales `*.html` sont **reconstruites** à partir des panneaux proposés par Stitch,
avec le vocabulaire, les commandes et le décor fictif du [relevé T0](../../2026-10-05-T0-tablette-meneur.md).
`nettoyer.mjs` remplace le corps des exports par des éléments sémantiques ; `meneur.css` et
`meneur.js` portent leur présentation et leurs simulations. Ce sont des documents autonomes,
pas des composants prêts pour l’application. Le plan est copié depuis la fixture T0,
et les données des Notes sont conservées dans `donnees-demo.json`.

Les sources de contrôle sont `RemoteControl.tsx`, `RemoteStatusBar.tsx`,
`RemoteUniversalPads.tsx`, `RemoteDicePad.tsx`, `RemoteDiceResultOverlay.tsx`,
`RemoteCombatTracker.tsx`, `RemoteSoundboard.tsx`, `RemoteStoryboard.tsx`,
`RemoteWhiteboardView.tsx`, `RemoteNotes.tsx`, `RemoteObsidian.tsx`, `RemoteMessenger.tsx`
et `LigneDeVolume.tsx`, sous `src/modules/remote/`, ainsi que la semence du banc T0.

## Corrections locales des exports

- Suppression des diagnostics, matricules, chronomètres, compteurs et descriptions ajoutés.
  Les huit onglets gardent leurs noms complets ; navigation basse sur téléphone et latérale
  en paysage. Les commandes ont des cibles d’au moins 44 × 44 px.
- Pads : trois ambiances et le plan exact de Station Varn ; pas de musique fictive, de badge
  de lecture actif au départ ni de bus supplémentaire. Volumes et sortie restent visibles
  en état vide. La sortie disponible est uniquement « Sortie par défaut ».
  Sans appairage, les pads et le combattant actif sont absents ; arrêter le son laisse
  l’image projetée en place.
- Dés : retrait du D66 et des historiques inventés. Sept dés, onze modes, formule, compteurs,
  pilote et dés échelonnés. Le libellé de fermeture inopérant est conservé ; toucher le fond
  extérieur ou attendre quinze secondes ferme la surcouche, conformément au T0.
- Combat : noms, initiatives et PV du témoin ; Idris conserve l’absence de jauge. Pas de
  matricule, de profession ajoutée ni d’édition supplémentaire.
- Sons et Scénario : un bruitage et deux moments du témoin ; pas de filtre inutile ni
  de descriptions, durées, séquenceurs ou réglages supplémentaires.
- Tableau : noms entiers des outils, huit couleurs, épaisseurs, fond, annulation, rétablissement
  et Effacer tout. Le laser est temporaire et ne crée pas de trace.
- Notes : six vues en lecture, sans les actions d’écriture et les textes inventés de Stitch.
  Markdown des fixtures, recherche, dossiers et détails ; les Secrets fictifs sont absents
  du texte rendu en mode Aventure. Les secrets présentés au MJ viennent uniquement du témoin.
- Messages : fil vide au départ, personnages exacts, input d’une ligne, bouton et Entrée.
  Tous affiche aussi les conversations privées, comme la source ; le badge ouvre Messages
  sans inventer un marquage automatique comme lu.

## Vérification et limites

`rendre.mjs` rend et vérifie les huit écrans à **360 × 800, 390 × 844, 820 × 1180,
1180 × 820 et 1440 × 900**, soit quarante cas, plus leurs états particuliers. Les résultats
consignés dans [controles.json](controles.json) portent sur le débordement horizontal,
les dimensions des commandes visibles, la navigation, les erreurs JavaScript et les ressources.
Les captures sont dans `rendus/`. La galerie compare les propositions aux captures T0 ;
T0 ne possède pas de téléphone 360 px, donc sa référence reste explicitement à 390 px.

Les gestes vérifiés comprennent l’annulation d’un appui court et l’arrêt à 700 ms, les volumes
et sorties, les filtres, les compteurs et modes de dés, l’expiration du résultat à quinze
secondes, les PV et tours, le dessin et son historique, les six vues de lecture, le coffre
Markdown et l’envoi privé ou collectif. `verifier-galerie.mjs` vérifie les seize images,
les bascules T0/T3, les liens locaux et l’accès depuis J1/J2 à 360 et 1180 px ; son relevé
est [galerie-controles.json](galerie-controles.json). Les captures sont aussi relues visuellement.

Les interactions sont des simulations en mémoire, sans réseau GM-OS, stockage, son réel
ou lecture d’un coffre utilisateur. Le résultat de dés est une valeur de démonstration :
**aucune formule ni règle de pilote n’est évaluée par le moteur de l’application**.
Ces contrôles ne valident ni la synchronisation, ni les moteurs de jeu, ni Safari ou les
gestes sur un iPad physique. L’intégration T4 utilisera les composants et les polices locales
de GM-OS. Les prototypes chargent seulement leurs polices depuis Google Fonts ; les images
de la galerie se consultent entièrement hors ligne.

Les helpers `preparer.mjs` et `decliner.mjs` ont servi à rédiger les requêtes : les relancer
réécrirait ou doublerait le document de prompts. Pour reproduire les versions locales,
utiliser `node nettoyer.mjs`, `node rendre.mjs`, `node galerie.mjs`, puis
`node verifier-galerie.mjs` depuis ce dossier, sans appel Stitch ni lancement de GM-OS.
