# Alien — *Building Better Worlds* relu contre le livre, 15/11/2026

> David : « on va faire la même chose pour Building Better World pour Alien, tu peux regarder ? », puis
> « ok commence ». Même parcours que *Colonial Marines* : relire d'abord le corpus (skill
> `relire-un-corpus`), l'étape 2 de la Forge des suppléments ensuite. Aucun code touché : seulement des
> fiches de `docs/systems/alien/supplements/building-better-worlds/rules/`. Registre § 253.

## Ce qu'il y avait

- **Déjà dans le pilote 1.10.0** : les 14 créatures du supplément dans le bestiaire, tirées des deux fiches
  relues le 14/11 (`bestiaire.md`, `bestiaire-table-des-creatures.md`).
- **Forgé par David le matin du 15/11** : seize fiches, toutes `relu: false`, non suivies par git —
  carrières et talents, motivations, armes, tenues, véhicules, vaisseaux, campagnes, dangers de la
  Frontière, intermède, systèmes et planètes, attributs de colonie, cycle de colonie, abominations,
  Perfectionnés, Protomorphes, variantes XX121.

## Résultat

**Seize fiches relues, toutes `relu: true`**, empreintes intactes, note datée en pied de chaque fiche. Le
corpus d'Alien n'a toujours aucune fiche `relu: false` hors de l'archive `rules-v1/`.

Livre : *Alien - Building Better Worlds [EN].pdf* (NAS, `docs/systems/alien/livres.json`),
**PDF = imprimée + 4** (pied « 47 » sur la page PDF 51). Le texte n'est pas doublé ; l'extraction du 14/11
(`scratch/alien-audit/bbw.txt`) a servi. Pages lues en image, parce que leurs tableaux ou leurs symboles ne
passent pas dans le texte : 59 (symbole de panique de l'ES-7), 62 et 65 (tableaux des protections et du
matériel), 77 (tableau des classes de vaisseaux), 90 (aiguillon du Moissonneur), 93 (brèches de
combinaison). Copie du livre effacée après usage.

## Ce que la relecture a trouvé

- **Chiffres faux ou mal rangés** : le tableau des nouvelles classes de vaisseaux répartissait mal
  armements et modules entre J, U et X ; Heliades et Borrowdale sans Protection ; Affiance et Deucalion
  absents ; le Diacre sans profil.
- **Règles fausses** :
  - les jets d'incident de colonie en milieu hostile gardent le résultat **le plus haut** (le plus grave),
    pas « le pire » au sens où la fiche l'entendait (deux fiches) ;
  - un test de prospection raté ne trouve rien ; il ne fait pas « réinvestir le même temps » ;
  - Prospecting fait tirer deux fois et garder le meilleur ;
  - le Perfectionné saute deux fois plus loin qu'un humain, pas « deux zones » ;
  - l'Impératrice ne transmet que des émotions ; ses tentacules endommagés la privent de ses pouvoirs,
    pas « temporairement » ;
  - le Stade V des abominations vient après des jours ou des semaines, pas « D6 jours » ;
  - l'EL7-HXC est un sac déployé autour du porteur, pas une capsule larguée.
- **Règles de campagne données pour générales**, rendues à *The Lost Worlds* : rapport à Gaius, incidents
  d'intermède, atterrissage du *Solovetsky Island* (D3 dégâts, p. 208), panne « Not So State-of-the-Art »
  (p. 167), ogives de terraformation de l'*Ìyánlá* (un vaisseau, pas une classe, p. 146), Ma'Kayla (PNJ,
  p. 144).
- **Retiré, faute de le trouver dans le livre** : contrat, avance et rapport des expéditions ; poste vacant
  qui échoue d'office, cumul de postes et vote de l'équipe de commandement ; « Métropole » à 86 points ;
  causes et usages propres à chaque attribut de colonie ; test de Mobilité contre une éclaboussure ;
  copilote du XT-37C ; paie au quart en cryosommeil.
- **Hors sujet** : la fiche de l'intermède avait, en « À la table » et « Cas limites », la génération des
  planètes ; refaites d'après les p. 163-164.
- **Ajouté, d'après le livre** : talents et matériel de Frontière des neuf carrières de base, matériel du
  Prospecteur et de l'Artiste ; coup de chaleur, dyspraxie de gravité, cartographe Pups ; vitesses de pointe
  des véhicules ; et ces **tables**, utiles à l'étape 2 :
  - trouvailles de prospection (D66, p. 92) ;
  - brèches de combinaison (D6 + cumul, p. 93) ;
  - particularité globale (2D6), terrain régional (D66), potentiel de ressources (D66), personnalité de la
    planète (D66), p. 277-278 ;
  - sponsors (2D6), mission principale (D66) et ses modificateurs, p. 279 et 286 ;
  - incidents de colonie (D66, p. 287).
- **Conforme** : les tableaux des armes, des tenues, des véhicules, les tables des motivations (18 entrées
  de deux valeurs chacune : la fiche avait raison) et de l'aiguillon, les profils et tables d'attaques des
  créatures, comparés au bestiaire relu le 14/11. Le livre imprime lui-même une radio dans la veste Kevlar
  et deux FTL différents pour les classes J et U : signalé, pas tranché.

## Vérifications

- `npx vitest run src/modules/forge src/modules/ai src/modules/equipement electron --maxWorkers=4` (depuis
  `C:\`) : **186 fichiers, 2 903 essais réussis**, 4 ignorés.
- Contrôle : plus aucune fiche `relu: false` dans le supplément ; une empreinte par fiche, inchangée ;
  sections dans l'ordre. Outil : `scratch/alien-audit/bbw-relecture.py` (tout ou rien, remplacements
  exacts refusés s'ils ne tombent pas une seule fois).

## Étape 2 — faite le même jour (A13, § 254)

David : « oui au 1,2,3,4 ». Pilote **1.11.0** (`outils/alien/ameliorer-pilote-a13-building-better-worlds.mjs`) :
Prospecteur et Artiste dans la liste des carrières ; 53 objets au catalogue (9 armes, 2 munitions,
4 uniformes, 11 protections, 10 objets de matériel, 10 véhicules, 7 vaisseaux) ; 23 tables Table-OS
(`databases/tables/Alien/bbw_*.json`). Pour que le catalogue et Table-OS les lisent, six fiches ont été
mises en tableaux (en-têtes en français, listes changées en tableaux), sans changer une valeur.

**Reste** : l'essai de David, et la colonie (six attributs, initiatives, niveau de développement, Cycle),
donnée du groupe et non d'un personnage, dont la place dans GM-OS est à spécifier.
