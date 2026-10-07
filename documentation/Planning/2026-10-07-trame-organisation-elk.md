# Trame — organisation automatique avec ELK, 07/10/2026

David demande un moteur pour mieux répartir les scènes, limiter le mélange des
éléments et utiliser l'espace. Après la proposition d'ELK.js avec aperçu, trois
espacements et retour arrière, il répond **« ok vas y gm-os est éteint »**.
Cette réponse autorise l'intégration et l'installation proposées. **`elkjs`
0.12.0** est installé et verrouillé, sans scripts d'installation. Aucun commit
ni push demandé pour Trame.

## Ce qui est construit

Dans **Trame → Graphe**, choisir **Compact**, **Équilibré** ou **Aéré**, puis
**Organiser**. Le calcul porte sur les cartes actuellement affichées : régler
le niveau et les filtres avant de lancer. Les positions cachées sont conservées.

- Les cartes sont regroupées par acte, avec un cadre nommé. Une annexe partagée
  dans un seul acte reste dans ce cadre ; partagée entre actes, elle reste commune.
- ELK place les rectangles réels des cartes et calcule des trajets à angles droits,
  y compris les branches, retours et liens entre actes. Les conditions réservent
  une place. Les côtés choisis à la main et les styles des liens sont conservés.
- Deux orientations sont comparées en tenant compte des proportions de la toile
  et de la surface occupée. Les trois espacements changent les marges entre cartes.
  Il s'agit d'un compromis de lisibilité, pas d'une garantie d'optimum mathématique
  ni de suppression de tous les croisements possibles.
- Le résultat est un **aperçu local**, sans écriture. **Appliquer la disposition**
  conserve positions, cadres et trajets en une écriture de campagne.
  **Annuler l'aperçu** ou **Échap** retrouve la disposition précédente.
- **Disposition précédente** restaure le dernier arrangement remplacé, ses
  épingles, ses trajets et son état Libre/Figé. Ce retour unique reste disponible
  après fermeture et relance, et appartient à la campagne.
- Le calcul peut être annulé. Changer de campagne, de filtre ou de données
  abandonne le résultat en cours ; il ne revient pas tardivement à l'écran.
  Le moteur travaille dans un worker local, chargé à la demande, arrêté à la fin
  et limité à vingt secondes. Aucun service ni accès distant n'est nécessaire.

**Ranger** reste disponible pour le rangement antérieur en chaînes ou étoiles,
sur la Trame entière. Ranger ou réinitialiser les positions retire les cadres et
trajets ELK. Déplacer une carte après application écarte uniquement les trajets
devenus périmés : les liens concernés retrouvent une courbe jusqu'au prochain
Organiser. Le cadre d'un acte déplacé est masqué pour éviter une bordure périmée.

Les scènes, leur ordre, leurs actes, leurs suites, conditions et renvois ne sont
pas modifiés par Organiser. Les commentaires libres et les accroches multiples
restent des propositions distinctes.

## Ancres de code et contrôles

- `logic/organiserLaTrame.ts` : graphe composé, ports fixes, routage et worker.
- `logic/trajetsDeTrame.ts` : validation des trajets enregistrés et construction SVG.
- `adapterLeGrapheDeTrame.ts`, `LienDeTrame.tsx`, `ToileDeLaTrame.tsx` : dessin et cadres.
- `GrapheDeLaTrame.tsx` : aperçu, annulation, application et retour.
- `campaign.types.ts`, `campaignSlice.ts` : données persistées et actions atomiques.
- `organiserLaTrame.test.ts` : vrai moteur, trois densités, boucles, jonctions,
  absence de chevauchement, validité des trajets et conservation des données.
- `e2e/organisationDeLaTrame.spec.ts` : cinq scénarios Electron sur profils factices,
  avec relance, changement de campagne, annulations, densités, thèmes et Trame dense.

Construction/types et lint ciblé réussis ; **720 tests dans 58 fichiers** passent.
Les **cinq nouveaux scénarios Electron** passent. La Trame dense comporte
**137 cartes et 195 trajets**, sans chevauchement ; calcul et contrôle en
**3 663 ms** sur ce banc. Aucune écriture avant application, une seule après.
**41 scénarios de régression** passent sur la construction finale, soit **46
scénarios Electron distincts** avec le nouveau lot. Les 28 captures d'organisation
sont relues (24 vues sur quatre planches, trois espacements et une vue dense),
ainsi que les trois vues du manuel et les huit planches régénérées de cartes/liens.
Le contrôle des anciens gestes et la relecture finale sont consignés dans le
[manifeste de ce lot](graphe-trame/organisation/controles-integration.json).
Les manifestes des lots précédents gardent leurs résultats historiques.

[Galerie de l'organisation](graphe-trame/organisation/index.html) : trois
espacements, quatre thèmes, personnalités allumées/éteintes, trois formats et
vue dense. L'essai G7 de David reste attendu.

**Pièges du banc** : attendre la carte témoin après l'hydratation avant d'ajouter
des branches ; pour déplacer une carte au clavier, la focaliser puis la
sélectionner avec **Entrée** avant les flèches. Les instances Electron utilisent
uniquement des profils et campagnes factices ; les données de David sont intactes.
