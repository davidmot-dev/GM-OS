# Lint — contrats de Session et du pont Electron, 08/10/2026

David : **« commit, pousse et passe à l'étape suivante (GM-OS est éteint) »**.
Le [premier lot](2026-10-08-lint-dependances-react.md) est commité et poussé sous
`8c0e4aa9`, après le contrôle pré-push complet : types, lint, 6 811 tests et
construction. Le présent lot reprend les contrats communs proposés par l'audit.

## Assemblage des slices

Les 33 `any` de `store/index.ts` provenaient de onze appels à un
`StateCreator<Partie>`. Ce type autorise aussi un remplacement complet
(`set(partie, true)`), alors qu'une partie ne suffit pas à remplacer le magasin
Session entier. Il fallait donc masquer l'incompatibilité à l'assemblage.

`src/modules/session/store/contratDesSlices.ts` définit désormais les capacités
utilisées par les slices : fusion d'une mise à jour partielle, lecture de
l'état et accès aux lecteurs du magasin. Le remplacement complet n'est pas
exposé. Les onze slices restent assemblées avec les mêmes fonctions Zustand,
sans conversion à l'appel. Elles peuvent toujours être éprouvées isolément.
Le contexte du butin est explicitement celui de Session pour accéder aux PJ,
inventaires, notifications et campagne active.

Les mêmes types de lecture et d'écriture servent à SessionManager et aux
gestionnaires de campagne forgée et d'images. Leurs paramètres et retours sont
vérifiés sans `any`. Aucun appel, ordre de mise à jour, événement de journal ni
réglage de persistance n'est modifié. Les accès au journal utilisent son
contrat global existant, sans nouvel import de magasin au runtime. La marque
`status` d'un objet transféré reste retirée, avec un champ optionnel typé pour
les objets d'anciennes versions.

## Pont Electron

Les 17 `any` de `src/types/window.d.ts` sont retirés :

- arguments supplémentaires des journaux : `unknown[]` ;
- réponse du relais Hue/Ulanzi : `unknown`, car il peut rendre du JSON, du texte
  ou `null` ; les lecteurs continuent d'interpréter la réponse ;
- action diffusée : contrat existant `RemoteAction` (`type`, `payload` facultatif) ;
- platines musicales et moteur de dés : types issus des implémentations par
  imports de types seuls, plutôt que signatures copiées et non vérifiées.

Il n'y a aucun changement dans les canaux IPC ni dans `electron/`.

## Contrôles

`tsc -b` passe après ces changements. Les contrôles ciblés de Session,
persistance, sauvegarde, Trame, transferts et synchronisation avec Combat
passent : **229 tests dans 23 fichiers** avant l'élargissement au pont Electron.
La construction du lot final passe, incluant `tsc -b`. Le lint global analyse
**1 531 fichiers, zéro erreur et 448 avertissements** (521 avant ce lot).
Les **73 alertes retirées concernent toutes le code applicatif** : 33 à
l'assemblage, 14 dans SessionManager, trois dans le butin, six dans les accès au
journal et le transfert d'objet, 17 dans le pont Electron. Restent 424 `any`
(200 applicatifs et 224 dans les tests), 20 effets, trois diagnostics de
mémoïsation et une directive inutile. Aucune règle n'est abaissée.
La suite complète du lot final passe : **6 811 tests dans 531 fichiers**,
un fichier et quatre tests ignorés. **Sept scénarios Electron passent** :
les trois gestes de revue de Trame (`curerLaTrame.spec.ts`) et les quatre
commandes/gardes de projection (`viderLePlayerHub.spec.ts`), avec le lanceur
de profils jetables et les appareils muets. `git diff --check` passe.
Ce lot de contrats est validé ; les messages de synchronisation restent le
prochain sous-lot de la même étape de typage.

## Reprise

Continuer les contrats des messages de synchronisation : `useHubSync`, les
actions de tablette et `CrossWindowEventService`. Le contrat de lecture des
magasins et le contrat des données transportées sont deux points à vérifier
ensemble : les segments de `RemoteSyncData` sont partiels et ne décrivent pas
tout ce qu'applique le Player Hub. Un simple remplacement par ce type serait
inexact. Les 20 effets et le typage des faux objets de tests viennent ensuite.

Publication de ce deuxième lot demandée par David le 08/10 :
**« commit, pousse et passe à l'étape suivante (GM-OS est éteint) »**.
Les modifications étrangères des guides,
de la note du 07/10, de `HubDiceDisplay.tsx` et du lanceur Electron sont conservées.
