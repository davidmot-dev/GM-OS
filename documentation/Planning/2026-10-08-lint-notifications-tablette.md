# Treizième lot du lint — notifications de la tablette

> Publication demandée le 08/10 : **« commit, pousse et passe à l'étape suivante
> (GM-OS est éteint) »**. Ce lot est maintenant commité sous **`af2d6b2c`**.
> La [note du jour](2026-10-08-etat-et-reprise.md) suit l'envoi et la reprise.
> Les mentions « non commité » ci-dessous décrivent l'état avant cette demande.

David demande le 08/10 **« passe à l'étape suivante (GM-OS est éteint) »**.
Les lots 9 à 12 restent non commités ; aucune publication n'est demandée dans
ce tour. Le dernier commit publié reste **`a749007e`**.

## Une notification et une échéance pour chaque message reçu

`TabletHub` délègue le signal de message à `useNotificationDeMessage`.
Le suivi local reconnaît chaque nouveau message par son identifiant et son
personnage, avant le commit. Une recopie de la liste ou un changement sans
nouveau message ne rejoue pas un signal déjà expiré ou masqué. Les messages
sortants, destinés à quelqu'un d'autre ou antérieurs au repère de lecture
ne créent pas de signal ; sans identité, aucun signal n'est affiché.

L'effet garde uniquement l'échéance de **cinq secondes**, liée à l'identifiant
du signal et au personnage. Un nouveau message pertinent remplace le signal
et reçoit ses cinq secondes. Un message étranger laisse le signal courant
et son échéance ; la recopie des messages ou des métadonnées ne prolonge pas
le délai. Un rappel dépassé ne peut pas retirer le signal d'un autre message
ou d'un autre personnage. Démontage et remplacement nettoient le rappel.

Cela corrige aussi un défaut de l'ancien effet : toute modification de la
liste annulait le rappel précédent, même si le nouveau dernier message
n'était pas destiné au joueur et ne créait donc aucun rappel de remplacement.
La notification pouvait alors rester visible sans échéance. Le scénario
tablette reproduit maintenant cette séquence avec le vrai flux WebSocket.

La conversation déjà ouverte ne crée pas de signal et n'est pas rejouée à
sa fermeture. Le rendu masque immédiatement un message lu ou sa conversation
ouverte. Les actions existantes d'ouverture et de changement de destinataire
masquent explicitement le signal ; un message suivant peut en créer un nouveau.
Vider la liste ou changer d'identité retire le signal de l'ancien contexte.

Les destinations et libellés restent : canal général, privé vers l'expéditeur
ou Maître du Jeu. Le clic ouvre le destinataire du signal, ferme notes et
inventaire, et avance le repère de lecture. L'affichage, la pastille de messages
non lus, les gestes et les animations restent. Aucune règle désactivée ni
temporisation ajoutée pour masquer une alerte ; aucun gain de fluidité annoncé.

## Contrôles

Types et construction passent. **21 tests ciblés dans deux fichiers**, dont
**20 nouveaux cas** du hook, passent. Ils vérifient le premier commit, les
destinations, les filtres, les cinq secondes, les recopies, le message étranger,
le remplacement, les rappels dépassés, le masquage, l'identité, la liste vide
et le nettoyage sous StrictMode. Le test existant de montage de `TabletHub` passe.
Suite complète : **6 981 tests dans 545 fichiers**, un fichier et quatre tests ignorés.

**Quatre scénarios Electron/tablette passent**, sélection `Notifications T4 J2`
de `e2e/tabletteJ2T4.spec.ts`, à **360, 390, 820 et 1 180 px**. Le joueur consulte
d'abord une autre conversation privée ; le signal suivant ouvre bien le message
du MJ. Le second signal reçoit ensuite un message destiné à Idris : on vérifie
sa réception dans le magasin de la tablette, la présence du signal pour Nel,
puis son expiration. La position au-dessus de la navigation et les cibles
tactiles sont contrôlées aux quatre tailles.

Profils, corpus et sauvegardes jetables, appareils désactivés ; le lancement
hors bac à sable reprend la solution au blocage d'Electron constaté au lot 12.
Quatre captures dans un dossier temporaire via `GMOS_TABLET_CAPTURES_DIR`,
sans remplacer celles du manuel ; vues 360 et 1 180 px relues, signal lisible
et placé au-dessus de la navigation.

Lint global : **1 556 fichiers, zéro erreur, 361 avertissements**, contre 362.
**Une alerte `set-state-in-effect` retirée**. Restent 353 `any` (130 applicatifs,
223 dans les tests), **quatre effets**, trois diagnostics de mémoïsation et
une directive inutile. Règles et inventaire JSON des 540 alertes initiales inchangés.
`git diff --check` passe.

## Reprise

Treizième lot réalisé et documenté, **non commité** : `TabletHub`, un hook,
ses tests, le scénario de notification J2 et cinq documents (dont la reprise
du douzième lot). Aucun commit ni push demandé dans ce tour.

Les lots **9 à 13** représentent **29 fichiers propres à Codex non commités** :
vingt de code/tests et neuf documents. Préserver les changements de Claude.
Reprendre les dés de `PlayerHub` et `useHubSync` (deux effets), puis `ProjectorView`
(deux effets), soit quatre alertes dans trois fichiers. Le typage des autres
domaines/tests, les trois diagnostics de mémoïsation et la directive inutile
restent dans la suite du chantier.
