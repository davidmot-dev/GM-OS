# Quatorzième lot du lint — déroulé des dés du Player Hub

David demande le 08/10 **« commit, pousse et passe à l'étape suivante (GM-OS
est éteint) »**, puis **« continue »**. Les lots 9 à 13 sont commités et poussés,
avec leur documentation, jusqu'à **`861eaca4`** sur `feature/tablet-hub-pwa`.
Le hook complet passe avant l'envoi : types, lint à 361 avertissements sans
erreur, 6 981 tests et construction. Les changements de Claude restent hors
des six commits. Le quatorzième lot ci-dessous est commencé après le push.

## Le résultat suit le signal, la pose suit le jet

`useAffichageDuJet` reconnaît le nouveau signal de projection avant le commit.
Il garde le dernier signal observé, la visibilité et la révision du délai.
L'effet garde seulement les cinq secondes du résultat ; un nouveau signal
ou une pose réarme son échéance. Une ancienne échéance ne ferme pas le nouveau
jet ni une révision plus récente. Un ancien callback de pose ne prolonge pas
le nouveau signal, et un callback tardif ne rouvre pas un résultat expiré.
Le démontage annule l'échéance, contrairement à l'ancien rappel sans nettoyage.

La projection désactivée ne consomme pas un nouveau signal : l'activation
pourra le montrer. Désactiver la projection sans nouveau signal laisse finir
le délai courant, et réactiver un signal déjà expiré ne le rejoue pas, comme
auparavant. Sans pose signalée, la tablette et le mode 2D gardent leur filet
de cinq secondes au lancer. `useHubSync` conserve ses lectures dynamiques,
ses abonnements et le contrat de synchronisation ; il appelle ce hook.

`usePoseDesDes` ajuste le drapeau au changement d'identifiant du jet, avant
le commit. Le maintien de **deux secondes** et le callback de scène appartiennent
au cycle de ce jet. Un nouveau jet annule le maintien précédent ; un ancien
callback ou rappel ne retire pas les nouveaux dés. Le cycle est invalidé et
le rappel annulé au démontage. `PlayerHub` garde la condition de visibilité
de la 3D et le branchement de la scène.

## Couvrir aussi la pose au plafond de chute

Le même flux portait un cas limite : le plafond de chute est de quatre secondes,
puis le maintien dure deux secondes. L'ancien filet initial expirait à cinq
secondes, avant l'effacement à six secondes. Le rappel d'effacement redémarrait
un compte, mais ne rendait pas le résultat déjà fermé visible.

La pose **réarme maintenant immédiatement le filet**, puis l'effacement réarme
les **cinq secondes de lecture**. Ainsi une pose à quatre secondes conserve le
résultat pendant le maintien jusqu'à six secondes, puis la lecture jusqu'à onze.
Sans aucun signal, le filet initial reste cinq secondes. Les constantes, le
plafond, la scène physique, son unique signal de repos, les matières, couleurs
et animations sont conservés. La différence est la prolongation locale au
début du maintien ; aucune nouvelle charge de synchronisation.

Aucune règle désactivée ni temporisation ajoutée pour masquer une alerte.
Aucun gain de fluidité annoncé sans mesure.

## Contrôles

Types et construction passent. **40 tests ciblés dans quatre fichiers** passent,
dont **22 nouveaux cas** : 21 pour les hooks et un pour le vrai `useHubSync`
avec une réception de synchronisation. Premier commit, cinq secondes, projection
désactivée, jets successifs, pose, ancien callback/rappel, expiration, deux
secondes de maintien, changement d'identifiant, démontage et StrictMode sont
exercés à horloge pilotée. Le cas de pose à quatre secondes vérifie le résultat
jusqu'à onze secondes. Les tests du combat dans Player Hub restent.

Quatre anciennes recherches de chaînes dans les effets sont remplacées par
ces tests de comportement ; les six contrôles des constantes et les deux
gardes existantes de scène/branchement restent dans `choregraphieDuJet.test.ts`.
Le nombre de tests augmente donc de 18, et les garanties de délai ne reposent
plus sur l'emplacement d'un `setState` dans le texte du fichier.
Suite complète : **6 999 tests dans 546 fichiers**, un fichier et quatre tests ignorés.

**Trois scénarios Electron passent** dans `e2e/derouleDuJet.spec.ts` : vrai pont
IPC vers une fenêtre Player Hub, résultat 2D qui expire, second jet pendant
le premier, vraie scène 3D avec canvas qui s'efface puis résultat encore affiché
pendant la lecture. La pose au plafond est déterministe dans le test unitaire ;
le scénario Electron laisse la vraie physique décider de la pose. Profils,
sauvegardes et corpus jetables, appareils désactivés ; aucune capture du manuel.

Lint global : **1 559 fichiers, zéro erreur, 359 avertissements**, contre 361.
**Deux alertes `set-state-in-effect` retirées**. Restent 353 `any` (130 applicatifs,
223 dans les tests), **deux effets**, trois diagnostics de mémoïsation et une
directive inutile. Règles et inventaire JSON des 540 alertes initiales inchangés.
`git diff --check` passe.

## Reprise

Quatorzième lot réalisé et documenté. Ce nouveau lot est **non commité**, distinct des lots 9 à 13
publiés au début de ce tour. Il porte **12 fichiers propres à Codex** : sept
de code/tests et cinq documents. Préserver les changements de Claude.

Reprendre `src/modules/image/components/ProjectorView.tsx` : suivi initial du
magasin avant le premier IPC, et détection du type de média, dont le marqueur
YouTube. Ce fichier porte les deux dernières alertes d'effets dans le lint
courant. Les autres domaines/tests, les trois diagnostics de mémoïsation et la
directive inutile suivent ensuite dans le chantier du lint.

**Reprise effectuée** sur la demande suivante de David :
[quinzième lot, projecteur](2026-10-08-lint-projecteur.md). Ses deux alertes
d'effets sont retirées, zéro erreur et **357 avertissements**. Types,
construction, **7 025 tests** et six scénarios Electron passent. Lots 14 et 15
non commités ; reprendre le typage des autres modules, d'abord projection
(`ImageService`/`useImageStore`, onze `any`), puis Storyboard et les tests.
