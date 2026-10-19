# Rêve de Dragon — Livret du voyageur interactif

Fiche créée le 19 octobre 2026 avec GM-OS Studio, atelier fiche, depuis le PDF fourni par David :
`Livret du voyageur - 2.0.pdf`.

- SHA-256 du PDF : `636153453b7bc425f4dd7166b52869f61e3d771237be73d80bc80edf3903c9e0`.
- Livrable : `docs/fiches/Rêve de Dragon/reve-de-dragon-livret-voyageur-interactif.html`.
- Gabarit : `reve-de-dragon-voyageur-fr`, nouveau modèle, sans version HTML antérieure identifiée.
- Cinq pages de 595 × 842 unités ; fonds rendus à 200 %, intégrés en WebP.
- 922 zones, 813 clés logiques. Les répétitions sont les hotspots d'une même piste.

## Contenu

| Page | Zones | Contenu |
| --- | ---: | --- |
| Personnage | 206 | Identité, caractéristiques, XP, compétences, Draconic, combat, lignes libres |
| Équipement | 253 | Porté sur soi, bourse, contenants, armes, armures, rubriques libres |
| Sorts et rituels | 141 | 21 sorts/rituels, notes, repère zodiacal exclusif |
| Feuille de route | 200 | Ressources actuelles et historique, sorts en réserve, effets, fatigue, blessures, éthylisme, calendrier |
| Archétype | 122 | Compétences indépendantes du personnage actuel, lignes libres ; tables imprimées conservées |

Le nom est saisi une fois sur la première page et copié dans les autres bandeaux. Le SC est copié
dans les parenthèses de la ligne Vie sur la feuille de route. Ces cinq `derive: copy` ne mettent
en œuvre aucune règle de jeu. Les ressources de départ et les ressources actuelles ont des clés
distinctes. Aucun soin, seuil, bonus astrologique, progression ou effet de magie n'est calculé.

Les 60 cases imprimées de fatigue forment une jauge cumulative ; les cases à neutraliser selon
l'Endurance restent à déterminer avec le meneur, comme l'indique l'aide du HTML. Les blessures
sont aussi des jauges cumulatives. Éthylisme, jour courant et roue zodiacale sont des choix
exclusifs. La roue est un repère visuel, sans moteur astrologique. Les positions sont des champs
libres ; cette livraison ne modifie pas le module externe TMR.

Le HTML fonctionne seul, hors ligne : navigation, zoom 20–400 %, ajustement, raccourcis clavier,
Zones, sauvegarde locale, export/import JSON, réinitialisation confirmée et impression des cinq
pages. Les données d'essai restent dans le navigateur isolé du vérificateur, jamais dans le
livrable. La sauvegarde locale dépend du navigateur et du chemin d'ouverture ; l'export JSON
permet de conserver une copie et de la transférer.

## Reproduire et vérifier

À la racine du dépôt, avec les dépendances déjà présentes :

```powershell
node outils/reve-de-dragon/construire-fiche-voyageur.mjs 'C:/Users/david/Downloads/Livret du voyageur - 2.0.pdf'
node scripts/fiche-valider.mjs 'docs/fiches/Rêve de Dragon/reve-de-dragon-livret-voyageur-interactif.html' --json
node outils/reve-de-dragon/fiche-voyageur/verifier.mjs
```

Les rapports et captures se trouvent dans `scratch/reve-de-dragon-fiche/`. Le contrôle navigateur
utilise Edge sans interface, un contexte isolé et aucune connexion réseau. Il vérifie saisies,
copies, sauvegarde/rechargement, pistes et choix, export/import avec conservation des extensions,
rejet des imports invalides sans perte, remise à zéro, zoom, aide, navigation, Zones, absence de
chevauchements, barre mobile et impression de cinq pages au format natif.

Contrôle visuel effectué sur les cinq fonds, les cinq pages avec Zones et les cinq pages remplies.
Le validateur accepte la fiche sans erreur. Ses deux avertissements sont attendus : nouveau
gabarit absent du moteur et table de correspondance absente.

## Intégration ultérieure

La livraison concerne la fiche HTML autonome. Selon le § 7 du cahier des charges, Claude Code
écrit ensuite la correspondance depuis les champs du pilote GM-OS et intègre le modèle au moteur
avec une augmentation de `BUILTIN_VERSION`. Tant que cette étape n'a pas été faite, les saisies
de ce HTML ne remontent pas dans les données GM-OS. Aucun code `src/` ou `electron/`, aucune
donnée de campagne et aucune fiche existante n'ont été modifiés pour cette livraison.
