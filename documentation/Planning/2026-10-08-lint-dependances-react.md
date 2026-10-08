# Lint — premier lot : dépendances React, 08/10/2026

David demande **« ok on commence suivant ton ordre »** après l'
[audit des 540 avertissements](2026-10-08-audit-avertissements-lint.md).
GM-OS fermé, confirmé avant les modifications. Le premier lot porte sur
les **15 alertes `react-hooks/exhaustive-deps` dans 12 fichiers**.

## Corrections

| Fichier dans `src/` | Correction et comportement conservé |
| --- | --- |
| `hooks/useMediaUrl.ts` | Sélection de l'action stable `getMediaBlob` ; résolution déclenchée par l'entrée et l'arrivée du média restauré, sans dépendre de l'URL produite. |
| `modules/ai/components/AISettings.tsx` | Présence de clé Gemini et adresse du fournisseur actif comme valeurs dépendantes ; éditer une température ou l'adresse d'un fournisseur inactif ne recharge pas la liste. |
| `modules/combat/components/AtelierDesAdversaires.tsx` | Aperçu déterministe calculé directement ; la liste du bestiaire était recréée à chaque rendu, donc la mémoïsation précédente recalculait déjà toujours cet aperçu. |
| `modules/dice/DiceBoard.tsx` | Les deux rappels de lancer relisent la traduction après un changement de langue. |
| `modules/dice/DiceBox3D.tsx` | Dernier jet conservé dans une référence mise à jour après rendu ; l'identifiant du jet reste le déclencheur. Recevoir une nouvelle copie du même jet ne rejoue pas la chute ; changer le style ou activer la projection conserve son effet. |
| `modules/fiches/FicheHote.tsx` | Les rappels dépendent réellement d'`accueillirEtCopier`, incluant la liaison qui gouverne la copie. |
| `modules/forge/rules/components/BrainstormOverlay.tsx` | Les rappels dépendent des valeurs et actions utilisées, et de la construction des candidats ; le magasin entier ne devient pas un déclencheur. Le verrou du carnet reste partagé. |
| `modules/session/components/AddEntityForm.tsx` | La traduction est prise en compte dans le préremplissage Wiki. |
| `modules/session/components/TemplateDashboard.tsx` | Campagnes et modèles de fiche sont relus pour la sélection initiale ; la garde protégeant une sélection existante reste en place. |
| `modules/session/components/fields/PanneauDeJet.tsx` | Le contexte de monnaie est mémoïsé selon la campagne et ses ressources. |
| `modules/session/hooks/useDeckPlayer.ts` | Le retournement projeté suit la langue courante, même si le paquet et la carte ne changent pas. |
| `modules/session/hooks/useHubSync.ts` | La connexion dépend aussi du port demandé. |

Aucune modification des règles ESLint ni ajout de désactivation. Les quatre
diagnostics de mémoïsation retirés recoupent ces changements : deux dans
l'Atelier des adversaires, un dans DiceBoard et un dans useDeckPlayer.

## Contrôles

Le lint global analyse **1 530 fichiers**, avec **zéro erreur et 521 avertissements**
(540 avant) : 497 `any`, 20 effets, trois diagnostics de mémoïsation et une
directive inutile. Il ne reste aucune alerte de dépendances React.
`npm run build`, comprenant `tsc -b`, réussit.

Neuf essais de régression sont ajoutés : conversion de data URI sans répétition,
réponse de média périmée, langue d'une carte projetée, même jet 3D reçu à nouveau,
jet reçu avant activation, déclencheurs Ollama et Gemini, découverte de la Forge
avec sujet modifié pendant l'attente et reprise sur disque sans nouvelle requête.
Les appels IA et NotebookLM y sont simulés. Les premiers essais ciblés passent.
**Six scénarios Electron Dice-OS passent**, avec `lancerGmOs`, la campagne témoin
et son profil jetable : faces proposées, plage du d20, cohérence du total,
formules, résultat affiché et historique. La suite unitaire complète passe :
**6 811 tests dans 531 fichiers**, un fichier et quatre tests ignorés.
`git diff --check` ne signale aucune erreur d'espacement. Premier lot validé.

## Reprise

Poursuivre par les contrats communs : assemblage des slices Session, accès aux
magasins, pont Electron et messages entre fenêtres/tablettes. Les 33 `any` de
`modules/session/store/index.ts` viennent d'une même signature d'assemblage.
Conserver l'inventaire JSON de l'audit comme photographie des 540 alertes initiales.
Les effets et le typage des autres modules/tests viennent ensuite.

Publication demandée par David le 08/10 : **« commit, pousse et passe à l'étape
suivante (GM-OS est éteint) »**. Les modifications
antérieures des guides, de la note du 07/10, de `HubDiceDisplay.tsx` et du
lanceur Electron ont été conservées hors de ce lot.
