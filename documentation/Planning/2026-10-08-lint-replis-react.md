# Neuvième lot du lint — replis des vignettes, ambiances et tables

David demande le 08/10 **« commit, pousse et passe à l'étape suivante (GM-OS est
éteint) »**. Le huitième lot est commité et poussé sous **`a749007e`** sur
`origin/feature/tablet-hub-pwa`, après les contrôles complets du hook. Ce lot
poursuit l'étape 3 avec les trois autres replis synchrones identifiés dans l'audit.

## Le rendu fournit le repli

`MediaItemThumbnail` considère directement la vignette visible si
`IntersectionObserver` est absent. Avec cet observateur, le décodage attend
toujours l'intersection à 200 px, puis la vignette reste visible et l'observateur
se déconnecte. Sons, texte et PDF gardent leurs limites de taille et leur aperçu.

Le visualiseur de `AmbientTrack` associe chaque mesure au contexte de lecture
(canal et état de lecture). À l'arrêt, à la reprise ou au changement de canal,
les seize barres rendent leur minimum jusqu'à la prochaine mesure du contexte
courant. Le changement de couleur garde la mesure et la boucle. L'effet ne met
plus l'état à zéro : il lance seulement l'échantillonnage par animation et
l'annule au nettoyage, y compris si son identifiant vaut zéro. Un rappel tardif
ne peut plus réarmer une boucle arrêtée. La transition CSS de 75 ms reste.

`AtelierDesTables` associe la liste lue à l'univers choisi, à son ouverture et à
une révision de rafraîchissement. Sans univers, sans pont ou pendant une nouvelle
lecture, la liste est vide au rendu ; l'effet ne l'efface plus. Les réponses
abandonnées après changement d'univers ou fermeture ne publient rien. Une
réouverture relit la liste. Sauvegarde et suppression déclenchent une nouvelle
révision depuis leur action et préviennent toujours le pupitre. Sauvegarder dans
un nouvel univers recharge bien celui-ci. L'éditeur et ses contrôles restent.

Les effets gardent leur travail externe et son annulation. Aucune règle
désactivée ni temporisation ajoutée ; aucun gain de fluidité annoncé sans mesure.

## Contrôles

Types et construction passent. **18 nouveaux tests dans trois fichiers**
passent : replis son/texte/PDF, attente de visibilité et nettoyage de l'observateur,
premier rendu des barres à l'arrêt, reprise/changement de canal/couleur, annulation
de la frame zéro et rappel tardif ; listes hors ordre, fermeture/réouverture,
absence de pont/univers, panne, sauvegarde/suppression et nouvel univers.

**16 scénarios Electron passent** : les sept d'Ambient-OS et les neuf de Table-OS,
dont les gestes d'écriture, d'import, de consultation et de suppression dans
l'atelier. Les profils, sauvegardes et corpus sont jetables, la campagne fictive
et les appareils désactivés ; aucune capture du manuel n'est remplacée.
Ils ne valident pas le son réellement entendu ni le pilotage des appareils.

Suite complète : **6 909 tests dans 541 fichiers**, un fichier et quatre tests
ignorés. `git diff --check` passe.

Lint global : **1 549 fichiers, zéro erreur, 368 avertissements**, contre 371.
**Trois alertes `set-state-in-effect` retirées**. Restent 353 `any` (130
applicatifs, 223 dans les tests), **11 effets**, trois diagnostics de mémoïsation
et une directive inutile. Les règles et le JSON des 540 alertes initiales restent.

## Reprise

Neuvième lot réalisé et documenté, **non commité** : six fichiers de code/tests et
cinq documents. Le commit publié au début de ce tour concerne le huitième lot.
Le fondu croisé est traité dans le [dixième lot](2026-10-08-lint-fondu-croise.md),
à la demande suivante de David, sans publication de ce neuvième lot.
Le décodage préalable, l'annulation des chargements dépassés et les durées restent.
Reprendre les dix autres synchronisations
de notes, notifications, QR, projection et verrou de souris, écran par écran,
avant les autres domaines et les faux objets de tests. Les changements antérieurs
de Claude restent hors du lot.
