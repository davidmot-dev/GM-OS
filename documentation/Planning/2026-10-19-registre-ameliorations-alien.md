# Registre des améliorations d’Alien

**Ouvert le 19/10/2026**, à la demande de David : « consigne cela dans un registre
d'amélioration d'alien ».

**Nature : registre vivant.** Il porte les priorités, décisions et états des améliorations.
L’[audit du 19/10](2026-10-19-alien-propositions.md) conserve le détail technique, les preuves
et les références au livre et à NotebookLM. Les états se mettent à jour **ici**.

**20/10/2026 : David choisit A0 et A1**, puis confirme que GM-OS est fermé et fournit son
export. A0 et A1 sont livrés et contrôlés. David valide son essai le 20/10 :
« ok j'ai fais le test c'est bien », puis demande « fait A2 » et confirme GM-OS fermé.
A2 est livré et contrôlé. Le 21/10, David confirme « ok A2 est testé c'est bien,
on fait A3 » : A2 est essayé et validé. GM-OS est de nouveau confirmé fermé.
A3 est livré et contrôlé le 21/10 ; David valide son essai : « ok c'est bon pour A3,
commit et pousse ». A0–A3 sont essayés et validés.
A4 est demandé par David le 21/10 (« reprend le travail, on va reprendre avec A4 »),
GM-OS confirmé fermé. A4 livré et contrôlé.
A5 est demandé par David le 21/10 (« on va continuer avec A5 »), GM-OS confirmé fermé.
A5 est livré et contrôlé : recette finale Electron/combat/Hub réussie.
David valide les essais A4 et A5 le 21/10 : « ok A4 et A5 tester c'est bon ».
A0–A5 sont livrés, essayés et validés. Le 21/10, David demande « on va continuer avec A6 et A7 »
et confirme « Non, GM-OS est fermé. ». **A6/A7 livrés et contrôlés le 22/10** ;
essai de David validé le 22/10. A8 demandé ensuite, GM-OS confirmé fermé.
**A8 livré et contrôlé le 22/10 ; essai de David validé le 23/10** : « ca marche A8 est testé ».
Voir les bilans [A0/A1](2026-10-20-alien-a0-a1.md), [A2](2026-10-20-alien-a2.md)
et [A3](2026-10-21-alien-a3.md), puis [A4](2026-10-21-alien-a4.md),
[A5](2026-10-21-alien-a5.md) et [A6/A7](2026-10-21-alien-a6-a7.md).

## Référence de travail

Livre français `ALIEN_le_jeu_de_rôle.pdf` du dossier CLOUDDAVID indiqué par David, errata
français des 09/04 et 04/11/2021 et carnet NotebookLM **ALIEN**, interrogé sur le livre de base.
Les chemins, liens et pages précis sont dans l’audit. Ne pas mélanger Evolved Edition,
Marines Coloniaux et livre de base sans décision distincte.

L'audit du 19/10 portait sur le moteur. Le 20/10, contrôle de l'export réel
`Export Dirvers/Alien_driver_gmos_1792528357734.gmos-driver` : 7 sections, 40 champs,
identifiants et correspondance conservés. Sortie :
`Export Dirvers/corriges/Alien_driver_gmos_a0_a1.gmos-driver`, version 1.1.0.
La recette fictive des accessoires ne remplace pas ce pilote.

A2 conserve ces identifiants et les 40 champs, ajoute trois colonnes d'armes (43 champs),
et produit `Export Dirvers/corriges/Alien_driver_gmos_a2.gmos-driver`, version 1.2.0.
Les 42 liens de correspondance et l'aller-retour des quatre colonnes HTML sont contrôlés.

A3 conserve ces 43 champs et ajoute `armes_proprietes` (44 champs), renseigné dans GM-OS.
Corrigé `Export Dirvers/corriges/Alien_driver_gmos_a3.gmos-driver`, version 1.3.0 ;
les 42 liens restent valides. Les archives précédentes restent intactes.

## Acquis à préserver

Forçage et Stress avant relance, talents de second forçage, test et cumul des paniques,
Points de Récit, gestes de repos/objet fétiche, Santé alignée sur la fiche, initiative par
cartes et fiche HTML reliée existent déjà. Les tables de critiques et d’attaques spéciales
sont présentes. MU/TH/UR et le détecteur sont déjà intégrés au Hub et sauvegardés.

Ces acquis ne constituent pas des travaux à recommencer ; les lots concernent leurs limites
et leurs raccords manquants.

## Lots proposés

| Lot | Priorité proposée | Amélioration et résultat attendu | État |
| --- | --- | --- | --- |
| **A0** | Préalable | Export réel contrôlé ; raccord Santé ajouté ; sélection de Stress limitée au bon champ, sans plafond de règle à dix ; références de Panique relues et errata 2021 reportés. | Livré — essai de David validé le 20/10 |
| **A1** | 1 | Verdict provisoire puis annulation à 10+, Point de Récit bloqué, effets persistants, Stress après dégâts, demandes hors jets, contagion ciblée, fins explicites et rappel/bilan des traumatismes. | Livré — 867 tests, types, build et lint ciblé réussis ; Electron/Hub validés ; essai de David validé le 20/10 |
| **A2** | 2 | **Jets, équipement et actions d’éclat** : Bonus/Dégâts/Portée reliés, réserve sans plafond artificiel, modificateurs signés, aide (max. 3), opposition et défenseur sans forçage, éclats de la compétence et budget persistant. Dégâts préparés avant protection, sans application automatique. | Livré — contrôles logiciels réussis et essai de David validé le 21/10 |
| **A3** | 2 | **Tir, protection et blessures** : visée/portée/lumière/taille, automatique et cibles secondaires, chargeurs/rechargement ; protection avant dégâts, vrais D66 humains, Brisé, Trépas récurrent, relèvement/stabilisation séparés, guérison et délais validés par Maman. PNJ humain explicitement déclaré. | Livré le 21/10 — 1 330 tests, types, build et lint ciblé réussis ; recette Electron/combat/Hub à trois tailles et sept captures vérifiées ; essai de David validé le 21/10 |
| **A4** | 3 | **Synthétiques** : aucun Stress/Panique/forçage, critiques D6 et aggravation du résultat immédiatement répété, avaries, activité à zéro sauf Arrêt du système, réactivation puis réparation Comtech distinctes, trauma et immunités. | Livré le 21/10 — 1 439 tests, types/build/lint ciblé sans erreur et recette Electron/combat/Hub à trois tailles réussis, cinq captures vérifiées ; essai de David validé le 21/10. Export v1.4.0, 44 champs conservés ; [bilan](2026-10-21-alien-a4.md) |
| **A5** | 3 | **Survie** : tests des réserves Air/Eau/Nourriture/Énergie individuels ou collectifs, échéances persistantes et reçus, quatre états reliés à l'HTML, restrictions de repos, Rads temporaires/permanents et surplus au-delà des dix cases, encombrement avec masses confirmées. | Livré le 21/10 : 49 champs et 46 liens, types/build/lint ciblé sans erreur, 1 460 tests dans 107 fichiers, recette finale Electron/combat/Hub à trois tailles réussie, huit captures relues. Essai de David validé le 21/10 ; [bilan A5](2026-10-21-alien-a5.md) |
| **A6** | 4 | **Actions et xénomorphes** : budget lente/rapide déclaré avant les dés, réactions et surveillance, cartes uniques selon la Vitesse avec une seule Santé, attaques et critiques D6, sang acide XX121. Conséquences narratives confirmées par Maman. | Livré et contrôlé le 22/10, export v1.6.0 : 1 567 tests dans 119 fichiers, types/build/lint ciblé sans erreur, recette réelle A0–A7 Electron/combat/Hub à trois tailles et neuf captures vérifiées ; essai de David validé le 22/10 ; [bilan A6/A7](2026-10-21-alien-a6-a7.md) |
| **A7** | 5 | **Cinéma et Campagne** : objectifs remis en messagerie privée par acte, Récit Cinéma, bilan PX conservé, apprentissages uniques, Camarade/Rival et fétiche par période. | Livré et contrôlé le 22/10, export v1.7.0 incluant A0–A6, 49 champs et 46 liens. Mêmes contrôles A6/A7 réussis ; confidentialité, reconnexion et absence de double gain/achat vérifiées ; essai de David validé le 22/10 ; [bilan A6/A7](2026-10-21-alien-a6-a7.md) |
| **A8** | Livré et essayé | **Accessoires et mode discret** : plan privé de zones, déplacements par Tour, scan M314 unique avec batterie propre et mouvements à portée ; dossiers d'acte publiés explicitement et objectifs remis au seul opérateur dans MU/TH/UR. Mise en scène conservée, arbitrage de Maman et report des Tours dans A5 explicites. Combat spatial séparé. | Livré et contrôlé le 22/10, export v1.8.0 incluant A0–A7, 49 champs et 46 liens ; 173 tests/21 fichiers et 74 vérifications autonomes, types/build/lint ciblé réussis. Recette A8 et quatre parcours existants Electron/Hub réussis, six captures relues ; [bilan A8](2026-10-22-alien-a8.md). Essai de David attendu ; inclus dans le présent commit |
| **A9** | Livré et essayé | **Combat spatial (p. 188-201)** : vaisseaux du livre ou libres, postes tenus par les PJ, Tours en quatre phases, ordres secrets depuis la tablette, verrouillage, pilotage, tirs, Protection, coque, avaries D66/2D6 (errata 55), réparations d'urgence, Panique spatiale ; pilote 1.9.0. Plan privé d'A8 affiché dès la première zone. | Livré le 23/10 (registre général § 162) |

## Ordre proposé et dépendances

A0–A5 sont livrés, essayés et validés par David ; validation A4/A5 reçue le 21/10.
A0–A7 sont livrés, contrôlés et validés par David. Le 22/10, David demande le commit/push,
puis A8, et confirme GM-OS fermé. A4–A7 sont poussés dans `3cffff3d`, après typage, lint,
8 590 tests et build réussis. A8 est livré, contrôlé et validé par David le 23/10.
Le 23/10, David demande la suite (« je voudrais aussi finir Alien aujourd'hui ») : **A9, le combat spatial**,
livré et essayé le même jour (« tout est testé, tu peux faire les commit et pousser »).

A1 fixe le résultat définitif du jet avant l’application des dégâts d’A3. A2 relie les armes
nécessaires au tir d’A3. A4 définit les exceptions de nature à respecter dans A1/A3/A5.
A6 doit utiliser ces mêmes conséquences, sans créer une seconde Santé pour la créature.

## Cas d’acceptation à reprendre pendant le développement

| Lot | Cas de recette indispensable |
| --- | --- |
| A1 | Des six suivis d’une panique effective 10 annulent l’action. Un Point de Récit ne contourne pas cette annulation. Une reconnexion ne réapplique pas la conséquence. |
| A2 | Un malus −4 avec deux dés de base et trois de Stress laisse zéro dé de base et un de Stress. Un bonus d’arme valable n’est pas perdu dans un plafond arbitraire. |
| A3 | Le chargeur se vide après le tir concerné, puis le rechargement consomme le bon type d’action. La protection précède les dégâts. Le critique humain utilise un vrai D66, jamais un entier uniforme 1–66. |
| A4 | Un androïde avec une ancienne saisie de Stress ne lance aucun dé de Stress ; il utilise les critiques synthétiques et Comtech, pas les soins humains. |
| A5 | Une réserve d’Air à 8 lance six dés au maximum ; chaque 1 retire un point sans provoquer une panique de compétence. Les états de privation empêchent les récupérations prévues par leurs règles. |
| A6 | Vitesse 2 donne deux initiatives pour une seule créature et une seule Santé. Les critiques et l’acide suivent les exceptions de l’espèce. |
| A7 | Les objectifs restent privés ; les gains et achats sont validés une seule fois ; les limites par acte et par séance sont distinguées. |
| A8 | Le mode de mise en scène actuel reste utilisable. Le raccord aux règles, s’il est activé, respecte portée, mouvements détectables et Énergie. |

Les recettes devront couvrir le poste MJ et les tablettes pour chaque fonction exposée sur
les deux écrans. Les choix de victimes, de portée audible/visible et de conséquences narratives
restent validés par Maman.

## Décisions et suivi

| Date | Auteur | Décision ou événement |
| --- | --- | --- |
| 19/10/2026 | David | Demande d’analyse du pilote avec le livre sur CLOUDDAVID et NotebookLM. |
| 19/10/2026 | Codex | Audit réalisé ; propositions A0–A8 et preuves consignées. Aucun code applicatif modifié. |
| 19/10/2026 | David | « consigne cela dans un registre d'amélioration d'alien » : création du présent registre ; aucun lot de développement choisi. |
| 20/10/2026 | David | « on va commencer les améloration d'Alien avec le A0 et A1 » ; « Non, GM-OS est fermé. » ; export déposé. |
| 20/10/2026 | Codex | A0/A1 livrés, export corrigé sans changer ses identifiants. Recette réelle Electron et Hub Edge à 360/768/1 180 px réussie, captures vérifiées ; 867 tests de régression réussis. Import et essai de David attendus. A2–A8 non engagés. |
| 20/10/2026 | David | « ok j'ai fais le test c'est bien » : essai A0/A1 validé ; « fait A2 » : lot A2 engagé. GM-OS de nouveau confirmé fermé. |
| 20/10/2026 | Codex | A2 livré : corrigé 1.2.0, trois colonnes d'armes ajoutées ; 1 005 tests réussis, types/build/lint ciblé et recette Electron/Hub réussis, captures relues. Import et essai A2 de David attendus. A3–A8 non engagés. |
| 21/10/2026 | David | « ok A2 est testé c'est bien, on fait A3 » ; GM-OS confirmé fermé. A2 essayé et validé, A3 engagé. |
| 21/10/2026 | Codex | A3 livré en v1.3.0 : 44 champs, 42 liens ; 1 330 tests réussis, types/build/lint ciblé, recette réelle Electron et Hub Edge à trois tailles réussis, même Santé/blessure sur la carte de combat ; sept captures relues. Manuel et synthèse actualisés. Import et essai A3 de David attendus ; A4–A8 non engagés. |
| 21/10/2026 | David | « ok c'est bon pour A3, commit et pousse » : essai A3 validé, commit et push autorisés. A4–A8 restent non engagés. |
| 21/10/2026 | David | « reprend le travail, on va reprendre avec A4 » ; « Non, GM-OS est fermé. » : A4 engagé, A5–A8 non engagés. |
| 21/10/2026 | Codex | A4 livré en v1.4.0, 44 champs et 42 liens conservés ; 1 439 tests dans 105 fichiers, types/build/lint ciblé sans erreur ; recette Electron/combat/Hub à trois tailles réussie et cinq captures relues. Manuel et synthèse actualisés. Essai de David attendu ; A5–A8 non engagés. |
| 21/10/2026 | David | « on va continuer avec A5 » ; « Non, GM-OS est fermé. » : A5 engagé. Aucun essai A4 explicitement confirmé. |
| 21/10/2026 | Codex | A5 livré, export v1.5.0 à 49 champs et 46 liens ; types/build/lint ciblé sans erreur et 1 460 tests dans 107 fichiers réussis. Recette finale A0–A5 Electron/combat/Hub à 360/768/1 180 px réussie (environ 2 min 06), huit captures relues, manuel et synthèse actualisés. Essai de David attendu. A6–A8 non engagés. |
| 21/10/2026 | David | « ok A4 et A5 tester c'est bon » : essais A4 et A5 validés. A0–A5 livrés, essayés et validés ; A6–A8 non engagés. |
| 21/10/2026 | David | « on va continuer avec A6 et A7 » ; « Non, GM-OS est fermé. » : A6 et A7 engagés. A8 non engagé ; aucun commit/push demandé. |
| 22/10/2026 | David | « continue » : poursuite de la réalisation et de la recette A6/A7. |
| 22/10/2026 | Codex | A6/A7 livrés en v1.6.0/v1.7.0, identifiants conservés, 49 champs et 46 liens ; 1 567 tests dans 119 fichiers, types/build/lint ciblé sans erreur et recette réelle A0–A7 Electron/combat/Hub à trois tailles réussis. Neuf captures relues, manuel et synthèse actualisés. Essai de David attendu ; A8 non engagé, aucun commit/push demandé. |

| 22/10/2026 | David | « ca marche pour A6 et A7, commit et pousse, après tu fais A8, GM-OS est fermé » : essais A6/A7 validés, commit/push A4–A7 autorisés, puis A8 demandé. |
| 22/10/2026 | Codex | Commit `3cffff3d` poussé sur `feature/tablet-hub-pwa` ; typage, lint global, 8 590 tests et build réussis. Deux guides synchronisés vers NotebookLM par le hook. A8 engagé. |
| 22/10/2026 | Codex | A8 livré en v1.8.0 : 153 tests/20 fichiers, 74 vérifications autonomes, types/build/lint ciblé réussis ; recette réelle A8 et quatre parcours existants Electron/Hub réussis, six captures relues. Manuel, registre et synthèse actualisés. Essai de David attendu ; A8 non commité. |
| 22/10/2026 | David | « commit tout ce qu'il reste sous ta responsabilité » : commit de la livraison A8, documentation et captures, avec les exports corrigés et états JSON Alien A4–A8 générés. Les autres chantiers restent hors commit ; aucun nouveau push demandé. |
| 23/10/2026 | David | « on va faire la suite d'Alien, je voudrais aussi finir Alien aujourd'hui » ; GM-OS fermé ; périmètre du combat spatial « complet » ; plan A8 dès la première zone : oui. |
| 23/10/2026 | David | « tout est testé, tu peux faire les commit et pousser » : essai A9 et cases à cocher de MU/TH/UR validés. A0–A9 livrés et validés. |
| 23/10/2026 | Claude Code | A9 livré : module `alien-combat-spatial` 1.0.0, pilote 1.9.0, 10 essais du moteur, 2 d'écran, recette réelle Electron et Hub Edge, deux captures ; suite complète 8 834 essais verts. Essai de David attendu. |
| 23/10/2026 | David | « ca marche A8 est testé » : essai A8 validé, pilote 1.8.0 réimporté. Le plan privé ne paraît qu'une fois « Raccorder le détecteur au plan et à sa batterie » cochée ; l'afficher dès la première zone est proposé, non fait. A0–A8 livrés et validés ; combat spatial non engagé. |

À chaque réalisation : mettre à jour le lot ici, citer les fichiers/commits, indiquer les
contrôles et distinguer réalisation logicielle et essai de David. Le manuel 54 Alien et les
captures suivent les changements effectivement livrés.

**Premier geste lors d’une reprise :** David choisit un lot et fournit l’export actuel du
pilote s’il a changé. Demander « GM-OS tourne-t-il ? » avant toute édition de `src/` ou
`electron/`, conformément à AGENTS.md. Aucun paquet, service ou opération Git d’écriture
n’est autorisé par la seule consignation de ce projet.

Le registre général partagé reste intact pendant cette consignation : il était déjà en cours
de modification par un autre écrivain. Ce fichier dédié est la référence des améliorations
d’Alien ; son lien pourra être ajouté au registre général après coordination.
