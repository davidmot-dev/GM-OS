# Dune — reprise des lots D0–D8, 25/10/2026

David : « Je voudrais finir les améliorations du driver Dune (ameliorations tous les pilotes) ».
Il confirme : « Non, GM-OS est fermé ». La demande reprend le projet garé le 19/10 ; elle
n'autorisait initialement ni commit ni push ; David les demande ensuite explicitement le 25/10. Aucun profil personnel ou dossier de sauvegarde de David consulté.

## Sources et export de départ

- Livre fourni : `C:/Users/david/OneDrive/Jeux de Rôles/03. Futur/1. Space Opera/Dune/Dune_Aventures_dans_l'Imperium_BQ.pdf`, 344 pages PDF ; pages imprimées = PDF − 7.
- Errata fourni : `DUNE-Errata.pdf`, une page, **version 1.0**. Il confirme les spécialisations à
  la création sans minimum 6, les relances sélectives et l'achèvement à égalité des tâches étendues.
- [Errata officiel 1.1, 11/08/2022](https://www.arkhane-asylum.fr/medias/2/DUNE-Errata-5100.pdf) :
  correction supplémentaire p. 139, amélioration d'atout à **2 × nouvelle qualité**.
- Passages consultés : p. 87 (Maison), 138–139 (progression), 146–158 (principes, aide, monnaies,
  Détermination, complications, opposition), 165–170 (ordre, atouts, attaques et récupération),
  182–187 (guerre et intrigue). Le corpus Dune 20/20 avait déjà été relu le 24/10 (§ 173).
- Export réel : `Export Dirvers/Dune_driver_gmos_1792659586664.gmos-driver`, pilote 1.0.0,
  gabarit `tpl-1774724573418`. Il portait encore `hp`, `critRange`, des portées de grille et
  aucune spécialisation déclarée. Pas de thème ni de fiche HTML dans cette archive.

## Réalisation

| Lot | Acquis du 25/10 | Ancre |
| --- | --- | --- |
| D0 | Export audité, PV erronés et portées métriques retirés ; clés conservées ; contrôles Forge pour tous les champs Dune | `scripts/exporter-dune.mjs`, `controlesDuPilote.ts` |
| D1 | Liste de spécialisations sur la fiche, choix au jet, critique étendu à la compétence | `defaultGameDrivers.ts`, `defaultSheetTemplates.ts` |
| D2 | Bilan du test distinct de la réserve ; Impulsion normale/bonus ; dépenses contextualisées ; conservation explicite unique ; paiement ennemi en Menace | `duneRegles.ts`, `DuneAuJet.tsx`, `PanneauDeJet.tsx` |
| D3 | Maximes, Détermination, 1 automatique dans la réserve, relances sélectives, offre du MJ, biffage après résolution, récupération et rééquilibrage, action supplémentaire, début d'aventure explicite | mêmes fichiers et `PanneauDAlternance.tsx` |
| D4 | Rétention payée par le bon camp ; reprise du même acteur ; plafond conservé ; résultats d'action et discrétion ; Détermination distincte de la rétention | `OrdreDuTour.ts`, `useOrdreDuTourStore.ts` |
| D5 | Attaque réussie appliquée une fois au combattant ; mineur ou tâche étendue ; qualités offensive/défensive ; vaincu distinct de mort ; survie par scène ; aide contre effet durable ou récupération | `ConflitDune.tsx`, `defaiteDeDune.ts`, `SanteDuCombattant.ts` |
| D6 | Aide par d20 séparé, jamais relancée avec le principal ; opposition au-delà de 5 ; marge 1–5 ; rachat des complications ; réussite mitigée sans réussite mécanique ; reliquat du défenseur PNJ | `duneRegles.ts`, `DuneAuJet.tsx` |
| D7 | Module « Dune : conflits et Maison » ; cinq arènes, Agent/Architecte, zones reliées, atouts, secrets, désir et enquête d'intrigue ; projection joueur filtrée ; stockage de campagne existant | `conflitsDeDune.ts`, `VuesDune.tsx`, manifeste dans `outils/dune/conflits/` |
| D8 | Fiche de Maison dans le module ; Menace selon type/effectif/ajustement ; carnet de progression, aperçu avant achat, reconversion, plafonds, historique et une acquisition par aventure | mêmes fichiers, `acheterProgressionDune` |

Les suivis du personnage vivent sous **`_gmos_dune`** sur sa vraie fiche. La carte de combat
réutilise ce suivi lorsqu'un personnage revient sur le plateau ; survivre ne remet pas
silencieusement la progression de défaite à zéro. Les atouts déjà écrits en texte ne sont
pas interprétés ou écrasés automatiquement : le MJ les transcrit dans le suivi structuré.

## Gestes qui restent explicitement au meneur

Le logiciel tient les comptes et propose des commandes, sans décider de la pertinence morale
d'une maxime, du récit d'une complication, du résultat d'une attaque à la place du jet,
de l'existence d'un talent, de la séquelle durable ni de l'éligibilité d'un gain de progression.

- La difficulté liée aux atouts défensifs se règle avant le lancer ; le bonus de qualité
  défensive s'ajoute ensuite aux conditions de la tâche de défaite.
- Le plateau partagé tient les positions et les atouts de la scène ; les atouts individuels
  restent sur les fiches. Le MJ prépare la représentation de scène et choisit l'atout offensif
  lors de l'application d'une attaque. Une unité en mode Architecte doit être ciblée comme unité.
- Les tests de mouvement/aide/enquête sont lancés au panneau puis reportés au module/carte.
  Les dépenses de mouvement supplémentaire se prélèvent au bandeau avant le second geste.
- L'Impulsion immédiate du défenseur est déclarée par le MJ ; le reliquat du PNJ se convertit
  lors de la clôture au poste MJ. Depuis la tablette, le MJ prend cette décision au bandeau.
- Si une réponse à une question d'Impulsion est impossible, rendre le point au bandeau.
- Une nouvelle scène du personnage et la fin de scène de la table sont deux gestes explicites.
  Le dernier applique l'érosion de l'Impulsion. Aucun changement de fenêtre ne réinitialise rien.
- La fiche de Maison est une vue du module partagé, pas un gabarit HTML ajouté à la bibliothèque.
  L'atelier Studio demandé ensuite a créé les deux HTML fidèles PJ/Maison, une page chacun,
  dans `output/fiches/dune/` : 30 et 40 champs, avec import d'armoiries. Validateur sans erreur,
  fonctionnement autonome et import dans un moteur jetable vérifiés. Voir la
  [livraison](../../output/fiches/dune/LIVRAISON.md). L'intégration à la bibliothèque et les
  correspondances au pilote restent à réaliser ; ces HTML ne changent pas le module partagé.

## Vérifications

Les journaux de travail sont dans `tmp/dune-fin/`. La recette n'utilise que l'export corrigé,
une campagne fictive et un profil Electron jetable. Les captures sortent d'abord dans ce
dossier pour être relues avant copie au manuel.

- Cas de règles et composants : spécialisation, aide perdue et complication conservée,
  relance sélective, absence de double versement, bonus non conservable, achat ennemi,
  rétention ennemie, PJ seul, attaque ratée, qualité défensive et égalité, récupération de
  principe, Menace de Maison, coût d'atout et limite de progression.
- Module : manifeste valide, migration, refus des commandes joueurs, filtrage réel des
  désirs/atouts/zones/liens secrets, déplacement adjacent, neutralisation et fin de scène.
- Recette Electron `e2e/capturesDesJeux.spec.ts --grep Dune` : **passée**, onze captures
  relues (réserves, jet, résultat, préparation, bilan, maximes, plateau et vues Hub).
  **Vrai Hub Edge à 360/768/1 180 px** : pas de débordement, paiement en Menace transmis au MJ,
  plateau consultable et secrets absents des messages WebSocket. L’essai de matériel physique reste à David.
- Types et lint ciblé : **passés** ; construction : **passée**.
- Suite globale : **9 111 tests passés**, 762 fichiers, 4 tests et 1 fichier ignorés.
  Après les garde-fous finaux de défaite et de changement de personnage : **53 tests ciblés passés**.

## Livraison et reprise

Export : **`Export Dirvers/corriges/Dune_driver_gmos_2.0.0.gmos-driver`**.
Reconstruction : `node scripts/exporter-dune.mjs`. L'archive est reconstruite puis relue
immédiatement ; `adm-zip.updateFile` conservait un drapeau de descripteur sans le réécrire,
ce qui rendait le premier corrigé illisible. L'original est resté intact.

**Validation de David le 25/10/2026 : « tout est testé, c'est bon , commit et pousse l'ensemble ».**
D0–D8 passent au vert dans la synthèse. Les deux HTML autonomes sont livrés et validés ;
leur intégration à la bibliothèque et leur raccordement au pilote restent un travail distinct.

Le bac à sable Windows empêchait Electron de lire son preload dans le profil temporaire :
la recette a été relancée avec l'élévation autorisée par la revue automatique, toujours dans
le profil jetable. Ne pas diagnostiquer ce blocage comme une panne de la fiche de David.

**Commit et push sur `production` demandés explicitement par David le 25/10/2026.**
