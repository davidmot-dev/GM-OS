# Rêve de Dragon — consolidation R0, 18/10/2026

Suite du registre § 141. David confirme la référence **2.3.1**, fournit les livres sur Z:,
puis autorise la suite : **« vas-y »** après la proposition de consolider la fiche, les calculs,
les champs incomplets et l'export. Dernière vérification avant modification : **« non ca tourne
plus désolé »**, après avoir indiqué que GM-OS tournait. Aucun travail sur les données réelles.

## Résultat et livrable

[Export consolidé à réimporter](../../Export%20Dirvers/corriges/RDD_driver_gmos_r0-consolide.gmos-driver).
SHA-256 : `66501921abd73c2bc98805dacc917867996b3a6c677db24b86dd3e5dd5a2e51a`.

- Pilote et modèle gardent `custom-1777730495114` et `tpl-1777730495195`.
- **117 zones / 106 clés → 99 zones / 99 clés distinctes**.
- Les onze répétitions d'une même clé disparaissent. Neuf autres clés sont regroupées avec
  leur valeur correspondante, par une reprise explicite. Deux clés nouvelles : `reve_seuil`,
  `reve_eclatement`. Les anciennes valeurs ne sont pas supprimées des personnages.
- La caractéristique **Chance** reste distincte des **Points de chance**. **RÊVE**, **Points de
  rêve** et **Seuil de récupération du rêve** sont séparés ; le seuil ne suit pas automatiquement
  la caractéristique après la reprise. Les points courants peuvent dépasser ce seuil.
- Mêlée, Tir, Lancer, Dérobée, vie maximale, endurance maximale et encombrement suivent les
  caractéristiques. SC, sustentation et bonus dommages utilisent les tables imprimées de
  création, sans extrapolation hors domaine : alerte et saisie manuelle dans ce cas.
- Douze heures draconiques au choix. Le compteur de fatigue reste manuel, sans jauge arbitraire
  sur cent : **R1 n'est pas réalisé** dans cette livraison.
- Le pilote pointe vers les maxima de la fiche. Le repère de rêve est le triple du seuil,
  affiché comme repère d'éclatement, sans dépense, plafonnement ou éclatement automatique.

**Cet export nécessite le code de consolidation présent dans ce chantier.** Il ne suffit pas
de le réimporter dans une ancienne version de GM-OS : les formules affichées seules ne mettent
pas les données à jour. Relancer la version construite ici, puis réimporter ce fichier comme
mise à jour du pilote existant. Les deux exports R0 partiels précédents restent historiques.

## Reprise des personnages : geste et conservation

Le nouveau modèle déclare `reglesDeFiche: "rdd-231"`. Seuls les modèles qui déclarent cette
capacité utilisent ce lecteur ; les autres jeux restent sur leur chemin existant.

**L'import du pilote ne migre aucun personnage.** À l'ouverture d'une ancienne fiche, le
panneau « Reprendre la fiche du Voyageur » fait choisir entre les valeurs contradictoires,
y compris une éventuelle différence avec la santé du combat. Aucun choix radio n'est présélectionné.
Les sources égales sont présentées une seule fois. Un zéro enregistré est une vraie valeur.

« Appliquer la reprise et les calculs » :

1. conserve une copie complète des anciennes données dans `sheetData.__rddAvantReprise231`,
   avec les anciennes valeurs de santé de combat proposées au choix ;
2. reprend les valeurs retenues et recalcule les dérivées ;
3. inscrit `sheetData.__rddReprise231 = 1`, afin que les anciens alias ne reprennent plus
   autorité à la modification suivante ;
4. conserve aussi les saisies en cours dans le formulaire, sans remplacer la copie des
   anciennes données enregistrées par ces brouillons.

Les alias restent également dans les données courantes. Une reprise répétée conserve la
première copie d'origine, sans l'imbriquer à nouveau. Les notes et les champs hors modèle ne
sont pas effacés. Les points dépensés ne sont jamais remis à leur maximum par le recalcul.

Si aucun ancien seuil de rêve n'est renseigné, RÊVE sert de proposition initiale ; le seuil
reste ensuite éditable indépendamment. Si aucun compteur de chance n'était renseigné, il
part de la caractéristique Chance ; un zéro renseigné reste à zéro.

### Alias couverts

| Ancienne clé | Destination |
| --- | --- |
| `points_de_vie` | `vie` |
| `reve_base`, `points_de_reve` | `reve_pts` |
| `reve_pts_max` | `reve_seuil` |
| `tir_comp` | `tir`, recalculé depuis Vue/Dextérité |
| `beauter` | `beaute` |
| `poids` | `poids_kg` |
| `heure_de_naissance` | `heure_naissance`, numéro converti en heure nommée |
| `capacite_maximale` | `enc`, recalculé depuis Taille/Force |

## Code et reproduction

- `src/modules/session/logic/ficheDeVoyageur.ts` : lecture pure, conflits, calculs et reprise.
- `src/data/defaultSheetTemplates.ts` : capacité optionnelle du modèle, sans changement des pilotes ordinaires.
- `PanneauRepriseVoyageur.tsx` : le même choix explicite chez le meneur et dans le Hub.
- `useCharacterEditor`, `useSheetCalculator`, `CharacterSheetEditor`, `HubCharacterSheet` : lecture
  des résultats calculés, saisie locale, reprise et sauvegarde.
- `entitySlice` : après reprise, les écritures de fiche recalculent atomiquement les dérivées,
  la vie maximale et la santé de combat. Le même chemin sert aux données reçues des tablettes.
- [Script de consolidation](../../outils/reve-de-dragon/consolider-pilote.mjs) : prépare le pilote
  depuis l'original, conserve les identifiants, vérifie la couverture des anciennes clés et
  relit l'archive créée. Il refuse d'écraser l'original ou un livrable existant.

```powershell
node outils/reve-de-dragon/consolider-pilote.mjs "Export Dirvers/RDD_driver_gmos_1792322034805.gmos-driver" "Export Dirvers/corriges/RDD_driver_gmos_r0-consolide.gmos-driver"
```

Choisir un autre nom si le livrable existe. Les variantes précédentes se reproduisent avec
`auditer-pilote.mjs`. L'[audit initial](2026-10-18-rdd-r0-audit-export.md) conserve les empreintes
de l'original et des livres, les pages vérifiées et l'historique des deux premières copies.

## Contrôles

- **Forge : aucun diagnostic** sur l'export, IDs stables, archive relue et original inchangé.
- **Suite complète : 8 134 tests réussis, 4 ignorés, 670 fichiers réussis et 1 ignoré**.
  Après le dernier garde-fou sur les valeurs manuelles hors table : les 27 tests ciblés restent verts.
- `npx.cmd tsc -b` et `npm.cmd run build` réussis.
- Lint global : **0 erreur**, un avertissement préexistant dans `useSaisieDifferee.ts`.
- Tests de reprise : zéro conservé, alias seuls, conflit explicite, copie intégrale immuable,
  idempotence, seuil indépendant, dérivées arrondies, tables hors domaine, saisies en cours,
  heure numérique, séparation des deux Chances, santé de combat alignée et ressources non rechargées.
- Parcours Electron dans profil jetable : ancien personnage arbitré, nouveau personnage,
  modification d'attributs, jet utilisant Mêlée recalculée et rechargement avec conservation des données.
- Tablette réelle de test (Edge, profil jetable) : reprise d'un personnage contenant uniquement
  les anciens alias, retour vers le MJ, santé et dérivées alignées, puis jet à 84 % avec Mêlée 13.
  Le parcours complet Electron/tablette réussit en 20 secondes.
- `capturesDesJeux.spec.ts`, sélection Rêve de Dragon et export consolidé isolé : réussi.
  Captures de reprise et de jets relues visuellement, puis manuel actualisé.

Rapports, PDF privés et captures de travail sont dans `scratch/reve-de-dragon-r0/` (ignoré par Git).
Les images de manuel sont dans `documentation/User Guides/captures/jeu-reves-de-dragons-*` et la
page `54-Jeu-Reves-de-Dragons.md` est actualisée.

Pièges payés : le bac à sable laissait ici Electron sur une page en chargement, avant hydratation ;
les E2E ont été rejoués hors bac à sable, toujours avec les gardes de `lancerGmOs` et un profil
jetable. Une santé de combat identique à celle de la fiche créait deux radios de même valeur :
elles sont désormais dédoublonnées, avec test de régression. Une session de test doit déclarer
les personnages dans `sessionEntityIds` pour les proposer au lobby tablette.

## Ce qui reste

La **consolidation de la fiche R0** est livrée. L'initiative complète RdD appartient à la suite
du combat : phases, arme, compétence, d6 et engagement. Le pilote garde pour l'instant son tri
par Agilité, expliqué comme tel dans le manuel. La santé générique ne constitue pas encore
la gestion des blessures, du coma ou de l'encaissement RdD.

Suite recommandée : **R1 fatigue et état général**, puis **R2 encaissement/blessures et combat**,
avant la boucle **R8 TMR**. Sources Cyol/Kroc déjà récupérées et créditées ; aucune de leurs
fonctions n'est intégrée par R0. Aucun calcul d'astrologie, de récupération nocturne ou de
consommation TMR n'est ajouté en chemin.

Le registre, la note TMR, la page 53 du manuel et les fichiers Nephilim étaient déjà en cours
de modification par l'autre travail : laissés intacts. Cette note assure la passation du § 141.
**Aucun paquet installé, aucun accès aux données personnelles, aucun commit ni push.**
