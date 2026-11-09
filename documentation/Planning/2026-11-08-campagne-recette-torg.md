# Torg — Les Balises de l’Aube, campagne de recette complète

David, 08/11/2026 : « peux-tu créer une campagne de test pour TORG dans le même style que pour COC ».
Reprise de la richesse du lot COC et du contrat courant : **une campagne complète dans un seul .gmos**,
avec ateliers intégrés ; le lot historique de COC reste inchangé.

## Livraison et import

- [ZIP complet](../../output/campagnes-tests/torg/TORG-Les-Balises-de-l-Aube-Recette.zip).
- **Seule campagne à importer :** [01-Les-Balises-de-l-Aube.gmos](../../output/campagnes-tests/torg/01-Les-Balises-de-l-Aube.gmos),
  ID `recette-torg-aube-campagne-balises`. Premier import : **Tel quel**.
- Dépendance réelle : [Torg Eternity 2.0.0](../../Export%20Dirvers/corriges/Torg-Eternity-2.0.0.gmos-driver),
  ID `custom-1774618478256`, gabarit `tpl-1774618478258`, 80 champs. Copie identique dans le ZIP ;
  vérifier/remplacer explicitement le pilote si nécessaire, jamais les personnages pour l’installer.
- [Guide](../../output/campagnes-tests/torg/LIRE-MOI.md), [cahier](../../output/campagnes-tests/torg/CAHIER-DE-RECETTE.md),
  [états de référence](../../output/campagnes-tests/torg/ETATS-DE-REFERENCE.md),
  [préparation des cartes](../../output/campagnes-tests/torg/PAQUETS-DE-CARTES.md).
  Aucun import Table-OS requis.

## Une histoire suivie, douze séances préparées

Des appels authentiques de secours sont détournés vers des itinéraires de tri. Les PJ protègent
les réfugiés de Port-Serein, recoupent les horaires, négocient les passages d’Aysle, puis suivent
les composants et les captifs par l’Empire du Nil, Pan-Pacifica et Tharkold. Réparer le réseau
ne décide pas qui peut le contrôler : contrôle collectif, arrêt préparé ou diffusion/limitation
restent trois fins possibles, avec des coûts annoncés.

Quatre actes, **36 scènes de fiction et six ateliers**, douze lieux, seize PNJ, douze indices,
factions, liens, rencontres préparées, conséquences et bifurcations. Chaque séance contient
ouverture, trois situations, pression, réactions, issues et transition ; aucun fait indispensable
n’est enfermé derrière un seul jet. Les séances sont **prévues**, les bilans restent à jouer.
Sites et profils sont originaux, pas une campagne publiée ni une géographie canonique revendiquée.

Les trois nouveaux principaux rejoignent les **joueurs existants** : Salomé Derval chez Thomas D.
`p-1`, Ilyan des Verrières chez Marie C. `p-2`, Mei Tan chez Lucas R. `p-3`. Les anciens PJ et avatars
ne sont pas copiés. Les six `[RECETTE]` sont réservés aux ateliers, dans la même campagne : JET,
ATOUT, SANTE, ZERO, DECO et NU. Profils aux valeurs choisies ; Atouts, armes et axiomes des principaux
à vérifier avec le livre avant une création réglementaire. ATOUT possède artificiellement six
Atouts pour la recette, sans prétendre être un personnage novice légal.

## Les ateliers et les 63 cas

| Dans « ATELIERS DE RECETTE — hors fiction » | Ce qui est préparé |
| --- | --- |
| JET | Dé explosif, entraînement, Table des Bonus, Possibilité, critiques, favorisé, refus de dépense |
| SANTÉ | Frontières dommages/Résistance, Choc, KO, quatre cases, Annulation et restauration locale |
| CARTES | Action, Réserve, échanges une pour une, Moment critique, six Atouts et limites du paquet |
| COSMS | Ténacité, Souffrance, Action/Héroïsme, Domination, Magie, Persévérance et zone mixte |
| COMBAT | Vilain déclaré à Sbires, laquais proche à confirmer et profil distinct à capacité Horde |
| HUB | Trois tailles, jets et fiche HTML reçus au MJ, confidentialité et témoins de fiction conservés |

Le CSV est intégralement **NON TESTÉ par David**. Les résultats automatiques ne le remplissent pas.
`ETATS-DE-REFERENCE.md` est une annexe, pas un import d’états ; remettre uniquement les champs
du personnage de recette et recharger sa rencontre si nécessaire. **Nexus Remplacer réimporte
toute la campagne, jamais un atelier.** L’essai natif préserve une note de scène, une note de PJ
principal et XP 17 après la restauration de SANTE et un rechargement.

## Cartes, outils et limites

Les paquets sont ceux du pilote ; une campagne ne transporte pas leurs mains ni leurs définitions.
L’import a été éprouvé en conservant les définitions et un état de paquet sentinelle.
Le sous-ensemble de dix cartes du Destin ne permet pas trois mains de quatre et ne contient
pas Relation : le cas positif de Populaire demande la vraie carte du paquet complet.
Romance n’est pas Relation ; aucun faux paquet officiel fabriqué. Ajout de David du 08/11 :
Second souffle, Reconnexion, Revers, Précision et Étape A, faces relues. Dans Deck-OS, passer
explicitement le nombre Destin de cinq à dix ; le pilote original reste inchangé.

**Portée collective constatée :** `mainsDeLaCampagne` dans `deckSlice.ts` vise les neuf PJ de la
campagne, indépendamment des trois participants de la séance. Fin de scène/Acte demande donc
36 cartes à quatre par PJ, ou 45 sous Héroïsme. Pour l’histoire, distribuer manuellement aux
seuls principaux ; réserver les gestes collectifs aux ateliers. Constat consigné au registre
§ 1 bis, sans correction applicative. Le guide décrit aussi le mode Standard/défausse et l’ouverture aux joueurs.

Aucun module indépendant Torg compatible au catalogue courant ; aucun module Alien/Dune/TMR inventé.
Les outils de la fiche, Dice-OS, Combat-OS et Deck-OS sont utilisés. Trois fiches de corpus relues
le 07/11 et les fonctions réelles sont réutilisées ; pas de nouvelle relecture complète du livre.
Les treize autres fiches et l’inventaire restent à relire. Les effets imprimés des cartes,
la création réglementaire, la magie/miracles, Défaite, guérison, contradictions et progression
gardent leur arbitrage manuel. Le lien NotebookLM facultatif du pilote réel est conservé ;
aucune ouverture du carnet ou requête distante nécessaire à l’import.

## Vérifications et reproduction

[Rapport final](../../output/campagnes-tests/torg/RAPPORT-DE-VERIFICATION.md),
[anomalies et limites](../../output/campagnes-tests/torg/ANOMALIES-CONNUES.md),
[provenance](../../output/campagnes-tests/torg/provenance.json).
Les rapports sont liés aux SHA-256 du fichier effectivement importé. Vitest utilise quatre workers.

Recette native : une campagne ajoutée ; trois profils/anciens PJ/avatars fictifs conservés ; trois
Hub tactiles HTTP/WebSocket 360/768/1180 sans appBridge, trois jets et dépenses reçus au MJ,
trois défenses d’Esquive saisies dans le modèle `torg-eternity-fr`, persistance et restauration
locale vérifiées. Aucun marqueur privé fictif reçu dans cette exécution (GM-05).
41 SVG, un JPEG et trois WAV décodés hors ligne ; neuf rendus et six captures applicatives relus.
Ni matériel physique, ni écoute humaine, ni partie complète déclarés testés.

Sources : `outils/campagnes-de-recette/torg*.mjs`, `torg.test.ts`, `vitest-torg.config.mts`,
`emballer-torg.mjs`, `e2e/campagneDeRecetteTorg.spec.ts`. [Commandes](../../output/campagnes-tests/torg/REPRODUIRE.md).
Toute régénération impose de vérifier les empreintes et de refaire les contrôles dont l’entrée change.
Aucun code `src/` ou `electron/` modifié ; aucun paquet installé, profil personnel ou sauvegarde de David utilisé.
Services locaux déjà autorisés, profils/corpus/ports/sauvegardes jetables. Aucun commit/push demandé ici.
