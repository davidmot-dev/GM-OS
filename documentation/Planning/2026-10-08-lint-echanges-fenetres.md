# Sixième lot du lint — échanges entre fenêtres

David demande le 08/10 **« commit, pousse et passe à l'étape suivante (GM-OS est
éteint) »**. Le cinquième lot, messages du Hub, est commité et poussé sous
**`43854adb`** sur `origin/feature/tablet-hub-pwa`, après les contrôles complets
du hook. Ce lot poursuit les contrats de données de l'étape 2 de l'audit.

## Messages et transport

`src/services/contratsEntreFenetres.ts` associe les sept types de messages à leurs
charges réelles : carte, tableau blanc, combat, horloge, verrouillage,
déverrouillage et annonce du Hub. Les données dérivent des magasins, via des
imports de types seuls. La carte locale complète la vue du Hub avec son moniteur,
les jetons/pings sources, la météo et les effets/zones projetés.

Les producteurs de `CrossWindowEventService` émettent sous ce contrat. Une union
de tuples conserve la relation entre le nom du message et sa charge dans `broadcast`.
La réception relit les données avant de construire la variante applicable.
Elle réutilise `lireChamps` et les règles du Hub, sans méthodes de magasin et
sans ajouter des défauts aux diffusions partielles. Cette lecture contrôle les
conteneurs et champs nécessaires au transport ; **elle n'est pas un schéma
exhaustif des modèles métier imbriqués ni un import de campagne**.

`WindowTransport` relit la même enveloppe sur le relais JSON et sur le
`BroadcastChannel` : objet non tableau, type et identifiant d'émetteur textuels.
Les rôles reconnus restent ceux du relais ; un rôle inconnu vaut `unknown` et
l'absence reste une absence. Aucun rôle annoncé dans le message n'est pris en
compte. Les sept flux relayés, leur aiguillage et leur encodage restent identiques.

## Autorité et fusion

Les helpers de retrait de projection gardent leurs deux signatures : omission
typée sur un objet connu, tolérance à une valeur inconnue à la frontière.
Le MJ garde la cible et le moniteur de carte ainsi que la cible du tableau quand
une fenêtre secondaire transmet sa copie. Les minuteurs de rediffusion par
flux, les verrous, leur expiration et le filtrage de ses propres messages restent.

Un message inconnu ou dont les données connues sont mal formées est ignoré ;
il ne lève plus la garde de démarrage d'une fenêtre secondaire. Les verrous et
l'annonce du Hub gardent leur exemption. Pendant l'application d'un état valide,
`isSyncing` reste levé pour que les abonnements ne le renvoient pas en boucle.

La fusion des jetons travaille sur une copie. Avant ce lot, elle réassignait
directement des champs de la charge reçue, pendant la protection d'un jeton saisi
ou la remontée des positions vers les jetons sources du MJ. Une charge partagée
avec un autre destinataire pouvait donc être modifiée. Les deux tableaux de
jetons gardent désormais leurs coordonnées locales pendant une saisie ; le MJ
remonte les positions reçues et les pings sans modifier le message d'origine.
Les champs absents restent en place, et les zéros, tableaux vides, `false` et
`null` restent explicites. La retenue des tracés lourds conserve sa comparaison
par référence et son suivi après diffusion réussie.

## Contrôles

Types et construction passent. **120 tests ciblés dans huit fichiers**, puis
**6 858 tests dans 533 fichiers** passent ; un fichier et quatre tests sont ignorés.
Les **12 nouveaux cas unitaires** exercent les identités/rôles, les verrous mal
formés, les méthodes, la garde de démarrage, les charges gelées, les positions et
les champs d'environnement. Le harnais existant à deux fenêtres conserve la
politique et le véritable relais du processus principal.

**13 scénarios Electron passent** : six Map-OS, six tableau blanc et le nouveau
`e2e/relaisEntreFenetres.spec.ts`. Ce dernier ouvre les véritables fenêtres MJ
et Player Hub par le geste d'interface, puis vérifie le trajet par IPC d'un
déplacement et d'un tracé, la convergence et le maintien des cibles du MJ.
Les profils sont jetables, les ports ceux des tests et les appareils muets.
Aucune capture du manuel n'est remplacée. `git diff --check` passe.

Lint global : **1 539 fichiers, zéro erreur, 377 avertissements**, contre 389.
**12 `any` retirés : 11 applicatifs de `CrossWindowEventService` et un dans le
helper de réception de son test.** Restent 353 `any` (130 applicatifs, 223 dans
les tests), 20 effets, trois diagnostics de mémoïsation et une directive inutile.
Les règles restent inchangées ; l'inventaire JSON garde les 540 alertes initiales.

## Reprise

Lot commité et poussé sous **`513e4d94`** sur `origin/feature/tablet-hub-pwa`,
à la nouvelle demande de David **« commit, pousse et passe à l'étape suivante
(GM-OS est éteint) »**. Le hook complet valide types, lint, les **6 858 tests**
et la construction avant l'envoi. Le [septième lot](2026-10-08-lint-saisies-react.md)
commence les **20 effets**, suivant l'étape 3 de l'audit : états dérivables et
initialisations d'abord, synchronisations ensuite, écran par écran. Préserver
les durées des dés, les fondus, les notes et les projections ; ne pas injecter
des temporisations destinées seulement à faire taire la règle. Le typage des
autres domaines et des faux objets de tests suit. Les changements antérieurs
de Claude sont conservés hors du lot.
