# Torg — cahier de recette

63 cas humains **NON TESTÉS** au 2026-11-08. Lire ETATS-DE-REFERENCE.md avant chaque groupe ; les rapports automatiques ne remplissent pas ce CSV.

## IMP-01 — import

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-portabilite / recette-torg-aube-pj-salome
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > portabilite ; PJ principal Salomé. Un poste de recette possède déjà une campagne et les profils p-1, p-2, p-3.
- **Geste :** Importer le pilote réel si nécessaire, puis l’unique fichier .gmos, stratégie Tel quel.
- **Attendu :** Une seule nouvelle campagne ; anciens PJ, noms et avatars conservés. Les nouveaux PJ rejoignent les trois joueurs existants.
- **Source :** src/modules/system/archive/nexus.types.ts ; NexusService.ts ; contrat campagne-complete.md
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## IMP-02 — import

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-portabilite / recette-torg-aube-pj-salome
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > portabilite ; PJ principal Salomé. L’import est terminé.
- **Geste :** Ouvrir les quatre actes de fiction, les douze séances et l’acte de recette.
- **Attendu :** Douze séances prévues ; 36 scènes de fiction et six ateliers. Aucun atelier dans les enchaînements obligatoires de l’histoire.
- **Source :** src/modules/system/archive/nexus.types.ts ; NexusService.ts ; contrat campagne-complete.md
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## IMP-03 — import

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-portabilite / recette-torg-aube-pj-salome
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > portabilite ; PJ principal Salomé. Le profil est jetable ; aucune vraie campagne à remplacer.
- **Geste :** Consulter le conflit Nexus sans confirmer Remplacer.
- **Attendu :** Le guide dit explicitement que Remplacer touche toute la campagne, jamais un seul atelier ; annuler ne change rien.
- **Source :** src/modules/system/archive/nexus.types.ts ; NexusService.ts ; contrat campagne-complete.md
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## IMP-04 — import

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-portabilite / recette-torg-aube-pj-salome
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > portabilite ; PJ principal Salomé. Une note narrative et la valeur XP d’un PJ principal ont été consignées.
- **Geste :** Recharger GM-OS, puis rouvrir le même atelier.
- **Attendu :** Campagne, note et valeur principale conservées ; les PJ de recette restent distincts.
- **Source :** src/modules/system/archive/nexus.types.ts ; NexusService.ts ; contrat campagne-complete.md
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## JET-01 — jets

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-jets / recette-torg-aube-pj-jet
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > jets ; [RECETTE] JET. Dextérité 9, Esquive 2, Blessures 1, ND 10.
- **Geste :** Choisir Dextérité + Esquive et lancer ; relever les dés.
- **Attendu :** Le niveau est 11 et le malus −1 ; total = 10 + bonus du total des dés. Ne jamais comparer le dé brut au ND.
- **Source :** docs/systems/torg/rules/resolution-des-jets.md et degres-de-reussite-et-critiques.md, relus le 07/11 ; livre p. 77, 108–110 ; src/modules/dice/systemes/torg.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## JET-02 — jets

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-jets / recette-torg-aube-pj-jet
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > jets ; [RECETTE] JET. Compétence formée. Pour un contrôle déterministe, utiliser les fonctions pures du test ; à la table, attendre les dés indiqués.
- **Geste :** Observer 10 puis 7, ou comparer cet exemple au cahier.
- **Attendu :** Total des dés 17, bonus +4, total d’action 14 : succès Simple contre 10. Un 20 formé explose aussi.
- **Source :** docs/systems/torg/rules/resolution-des-jets.md et degres-de-reussite-et-critiques.md, relus le 07/11 ; livre p. 77, 108–110 ; src/modules/dice/systemes/torg.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## JET-03 — jets

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-jets / recette-torg-aube-pj-jet
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > jets ; [RECETTE] JET. Compétence laissée vide, attribut Dextérité 9, Blessures 1.
- **Geste :** Lancer sans entraînement ; constater le comportement d’un 20 puis d’un 10.
- **Attendu :** Le 20 non formé ne relance pas ; le 10 relance. Le résultat aléatoire n’est pas imposé par la campagne.
- **Source :** docs/systems/torg/rules/resolution-des-jets.md et degres-de-reussite-et-critiques.md, relus le 07/11 ; livre p. 77, 108–110 ; src/modules/dice/systemes/torg.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## JET-04 — jets

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-jets / recette-torg-aube-pj-jet
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > jets ; [RECETTE] JET. Possibilités 3 ; premier dé différent de 1.
- **Geste :** Dépenser une Possibilité après le jet.
- **Attendu :** 3→2 ; le d20 additionnel est ajouté avant la table. Un résultat naturel 1–9 y compte pour 10, sans relance.
- **Source :** docs/systems/torg/rules/resolution-des-jets.md et degres-de-reussite-et-critiques.md, relus le 07/11 ; livre p. 77, 108–110 ; src/modules/dice/systemes/torg.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## JET-05 — jets

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-jets / recette-torg-aube-pj-zero
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > jets ; [RECETTE] ZERO. Possibilités 0.
- **Geste :** Lancer puis tenter de dépenser une Possibilité.
- **Attendu :** Aucune ressource négative ni dé de Possibilité gratuit ; refus ou bouton indisponible. Ne pas confondre avec l’interdiction narrative du KO.
- **Source :** docs/systems/torg/rules/resolution-des-jets.md et degres-de-reussite-et-critiques.md, relus le 07/11 ; livre p. 77, 108–110 ; src/modules/dice/systemes/torg.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## JET-06 — jets

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-jets / recette-torg-aube-pj-jet
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > jets ; [RECETTE] JET. Un 1 au premier dé est obtenu ; utiliser la preuve déterministe du test si aucun 1 n’est tiré.
- **Geste :** Tenter de modifier ce jet.
- **Attendu :** Échec automatique ; aucune Possibilité ni relance favorisée ne rattrape le 1 initial.
- **Source :** docs/systems/torg/rules/resolution-des-jets.md et degres-de-reussite-et-critiques.md, relus le 07/11 ; livre p. 77, 108–110 ; src/modules/dice/systemes/torg.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## JET-07 — jets

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-jets / recette-torg-aube-pj-jet
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > jets ; [RECETTE] JET. Choisir la plage critique 1–4 ; premier dé 2–4 et total final suffisant.
- **Geste :** Comparer succès et indication critique, éventuellement après une Possibilité autorisée.
- **Attendu :** Le total peut réussir ; la conséquence critique reste annoncée. Ne pas transformer 2–4 en échec automatique comme le 1.
- **Source :** docs/systems/torg/rules/resolution-des-jets.md et degres-de-reussite-et-critiques.md, relus le 07/11 ; livre p. 77, 108–110 ; src/modules/dice/systemes/torg.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## JET-08 — jets

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-jets / recette-torg-aube-pj-jet
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > jets ; [RECETTE] JET. Compétence favorisée permise par le MJ ; premier dé hors plage critique ; aucun autre ajout encore utilisé.
- **Geste :** Relancer le premier dé une fois.
- **Attendu :** Le nouveau résultat remplace le premier ; pas de choix du meilleur et pas de deuxième relance gratuite.
- **Source :** docs/systems/torg/rules/resolution-des-jets.md et degres-de-reussite-et-critiques.md, relus le 07/11 ; livre p. 77, 108–110 ; src/modules/dice/systemes/torg.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## JET-09 — jets

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-jets / recette-torg-aube-pj-jet
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > jets ; [RECETTE] JET. Une carte d’Action accordant Un de plus ! est décrite et active.
- **Geste :** Ajouter le dé de la carte après le test.
- **Attendu :** Le dé s’ajoute sans minimum 10. Un résultat 8 ajoute 8 ; le bénéfice se distingue de la Possibilité.
- **Source :** docs/systems/torg/rules/resolution-des-jets.md et degres-de-reussite-et-critiques.md, relus le 07/11 ; livre p. 77, 108–110 ; src/modules/dice/systemes/torg.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## JET-10 — jets

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-jets / recette-torg-aube-pj-deco
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > jets ; [RECETTE] DECO. Déconnecté vrai ; Possibilités 3.
- **Geste :** Avant un jet ordinaire, vérifier les interdictions avec le MJ ; ne pas contourner la déconnexion avec le panneau générique.
- **Attendu :** Le MJ interdit les dépenses incompatibles. Le panneau ordinaire n’est pas présenté comme une garde universelle des états.
- **Source :** docs/systems/torg/rules/resolution-des-jets.md et degres-de-reussite-et-critiques.md, relus le 07/11 ; livre p. 77, 108–110 ; src/modules/dice/systemes/torg.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## SAN-01 — sante

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-sante / recette-torg-aube-pj-sante
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > sante ; [RECETTE] SANTE. Remettre Blessures 1, Choc 0, KO faux ; Résistance 10.
- **Geste :** Charger la rencontre de l’atelier puis saisir 4 comme total de dommages dans Dégâts.
- **Attendu :** Le nouveau coup produit aucun effet ; il s’ajoute à l’état préparé, sans traiter ce total comme un nombre de cases.
- **Source :** documentation/User Guides/54-Jeu-Torg.md, table vérifiée le 07/11 ; src/modules/combat/logic/dommagesDeTorg.ts et impactDeTorg.ts ; l’ancien résumé sante-et-blessures.md reste non relu
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## SAN-02 — sante

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-sante / recette-torg-aube-pj-sante
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > sante ; [RECETTE] SANTE. Remettre Blessures 1, Choc 0, KO faux ; Résistance 10.
- **Geste :** Charger la rencontre de l’atelier puis saisir 5 comme total de dommages dans Dégâts.
- **Attendu :** Le nouveau coup produit 1 Choc ; il s’ajoute à l’état préparé, sans traiter ce total comme un nombre de cases.
- **Source :** documentation/User Guides/54-Jeu-Torg.md, table vérifiée le 07/11 ; src/modules/combat/logic/dommagesDeTorg.ts et impactDeTorg.ts ; l’ancien résumé sante-et-blessures.md reste non relu
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## SAN-03 — sante

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-sante / recette-torg-aube-pj-sante
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > sante ; [RECETTE] SANTE. Remettre Blessures 1, Choc 0, KO faux ; Résistance 10.
- **Geste :** Charger la rencontre de l’atelier puis saisir 10 comme total de dommages dans Dégâts.
- **Attendu :** Le nouveau coup produit 2 Choc ; il s’ajoute à l’état préparé, sans traiter ce total comme un nombre de cases.
- **Source :** documentation/User Guides/54-Jeu-Torg.md, table vérifiée le 07/11 ; src/modules/combat/logic/dommagesDeTorg.ts et impactDeTorg.ts ; l’ancien résumé sante-et-blessures.md reste non relu
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## SAN-04 — sante

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-sante / recette-torg-aube-pj-sante
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > sante ; [RECETTE] SANTE. Remettre Blessures 1, Choc 0, KO faux ; Résistance 10.
- **Geste :** Charger la rencontre de l’atelier puis saisir 15 comme total de dommages dans Dégâts.
- **Attendu :** Le nouveau coup produit 1 Blessure et 2 Choc ; il s’ajoute à l’état préparé, sans traiter ce total comme un nombre de cases.
- **Source :** documentation/User Guides/54-Jeu-Torg.md, table vérifiée le 07/11 ; src/modules/combat/logic/dommagesDeTorg.ts et impactDeTorg.ts ; l’ancien résumé sante-et-blessures.md reste non relu
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## SAN-05 — sante

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-sante / recette-torg-aube-pj-sante
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > sante ; [RECETTE] SANTE. Remettre Blessures 1, Choc 0, KO faux ; Résistance 10.
- **Geste :** Charger la rencontre de l’atelier puis saisir 20 comme total de dommages dans Dégâts.
- **Attendu :** Le nouveau coup produit 2 Blessures et 4 Choc ; il s’ajoute à l’état préparé, sans traiter ce total comme un nombre de cases.
- **Source :** documentation/User Guides/54-Jeu-Torg.md, table vérifiée le 07/11 ; src/modules/combat/logic/dommagesDeTorg.ts et impactDeTorg.ts ; l’ancien résumé sante-et-blessures.md reste non relu
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## SAN-06 — sante

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-sante / recette-torg-aube-pj-sante
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > sante ; [RECETTE] SANTE. Esprit 9, Choc 8, Blessures 1, KO faux.
- **Geste :** Recevoir 5 dommages contre Résistance 10, puis un autre point de Choc.
- **Attendu :** 8→9 sans KO à l’égalité ; le point supplémentaire déclenche le KO et laisse le Choc plafonné à 9.
- **Source :** documentation/User Guides/54-Jeu-Torg.md, table vérifiée le 07/11 ; src/modules/combat/logic/dommagesDeTorg.ts et impactDeTorg.ts ; l’ancien résumé sante-et-blessures.md reste non relu
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## SAN-07 — sante

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-sante / recette-torg-aube-pj-sante
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > sante ; [RECETTE] SANTE. Choc 8, hors mêlée ; le personnage sacrifie son tour.
- **Geste :** Cliquer Récupérer −2 ; puis Reprendre son souffle seulement si la scène le permet.
- **Attendu :** 8→6 sans jet ; le second geste ramène à 0 quand le MJ autorise la récupération. Les Blessures ne disparaissent pas.
- **Source :** documentation/User Guides/54-Jeu-Torg.md, table vérifiée le 07/11 ; src/modules/combat/logic/dommagesDeTorg.ts et impactDeTorg.ts ; l’ancien résumé sante-et-blessures.md reste non relu
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## SAN-08 — sante

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-sante / recette-torg-aube-pj-sante
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > sante ; [RECETTE] SANTE. Blessures 3 avant le coup ; Esprit 9 ; c’est un personnage chargé en Possibilités.
- **Geste :** Recevoir une Blessure supplémentaire puis consulter le test de Défaite.
- **Attendu :** La quatrième case signifie Vaincu. Le test de Défaite et ses conséquences restent arbitrés ; ce n’est pas une guérison automatique.
- **Source :** documentation/User Guides/54-Jeu-Torg.md, table vérifiée le 07/11 ; src/modules/combat/logic/dommagesDeTorg.ts et impactDeTorg.ts ; l’ancien résumé sante-et-blessures.md reste non relu
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## SAN-09 — sante

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-sante / recette-torg-aube-pj-sante
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > sante ; [RECETTE] SANTE. Possibilités 1 ; dommages calculés mais non appliqués.
- **Geste :** Ouvrir Annulation des dommages et effectuer le test Réalité ND 10.
- **Attendu :** 1→0 ; Simple annule 1 Blessure et tout le Choc, Supérieur 2, Spectaculaire toutes. Reporter uniquement le reste du coup ; ne pas soigner des dommages antérieurs.
- **Source :** documentation/User Guides/54-Jeu-Torg.md, table vérifiée le 07/11 ; src/modules/combat/logic/dommagesDeTorg.ts et impactDeTorg.ts ; l’ancien résumé sante-et-blessures.md reste non relu
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## SAN-10 — sante

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-sante / recette-torg-aube-pj-sante
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > sante ; [RECETTE] SANTE. Blessures 2 et Choc 8.
- **Geste :** Avec accord du MJ sur le soin, utiliser Soins pour retirer une Blessure.
- **Attendu :** Blessures 2→1 ; Choc reste 8. Guérison naturelle, délais et séquelles ne sont pas inventés par ce bouton.
- **Source :** documentation/User Guides/54-Jeu-Torg.md, table vérifiée le 07/11 ; src/modules/combat/logic/dommagesDeTorg.ts et impactDeTorg.ts ; l’ancien résumé sante-et-blessures.md reste non relu
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## CAR-01 — cartes

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cartes / recette-torg-aube-pj-jet
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cartes ; [RECETTE] JET. Le pilote réel et ses trois paquets sont installés.
- **Geste :** Ouvrir Deck-OS et vérifier les rôles Action, Destin, Cosm.
- **Attendu :** Paquets du jeu, pas de copie de leur état dans la campagne. La pioche et les mains du poste ne sont pas réinitialisées par l’import.
- **Source :** documentation/User Guides/54-Jeu-Torg.md ; livre p. 112–113, 117 ; src/modules/session/logic/cartesDuDestin.ts et echangesDeTorg.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## CAR-02 — cartes

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cartes / recette-torg-aube-pj-jet
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cartes ; [RECETTE] JET. Carte d’Action index 12 : Gardez la pose !, imprimée 13-N.
- **Geste :** Décrire la ligne standard Héros/Un de plus !, la dramatique Vilains/Fatigués et les actions Intimidation/Provocation ; ouvrir un round.
- **Attendu :** L’ordre vient de la ligne choisie ; aucune initiative individuelle n’est inventée. Les métadonnées sont saisies une fois par le MJ.
- **Source :** documentation/User Guides/54-Jeu-Torg.md ; livre p. 112–113, 117 ; src/modules/session/logic/cartesDuDestin.ts et echangesDeTorg.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## CAR-03 — cartes

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cartes / recette-torg-aube-pj-jet
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cartes ; [RECETTE] JET. Un round est ouvert et une Intimidation approuvée a réellement réussi.
- **Geste :** Cliquer l’action approuvée sur le bon héros.
- **Attendu :** Une carte du Destin en main ; le bouton de cette action est consommé pour ce round. Réussite à confirmer par le MJ avant le clic.
- **Source :** documentation/User Guides/54-Jeu-Torg.md ; livre p. 112–113, 117 ; src/modules/session/logic/cartesDuDestin.ts et echangesDeTorg.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## CAR-04 — cartes

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cartes / recette-torg-aube-pj-jet
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cartes ; [RECETTE] JET. Hors rounds ; une carte en main chez JET et une chez ATOUT.
- **Geste :** Proposer une carte, choisir la contrepartie et accepter.
- **Attendu :** Les deux cartes changent de porteur ensemble. Accepter sans contrepartie est impossible.
- **Source :** documentation/User Guides/54-Jeu-Torg.md ; livre p. 112–113, 117 ; src/modules/session/logic/cartesDuDestin.ts et echangesDeTorg.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## CAR-05 — cartes

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cartes / recette-torg-aube-pj-jet
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cartes ; [RECETTE] JET. En rounds ; une carte encore en main et une en Réserve.
- **Geste :** Tenter l’échange puis poser les deux en Réserve et recommencer.
- **Attendu :** Refus tant que les deux cartes ne sont pas en Réserve ; réussite atomique après préparation correcte.
- **Source :** documentation/User Guides/54-Jeu-Torg.md ; livre p. 112–113, 117 ; src/modules/session/logic/cartesDuDestin.ts et echangesDeTorg.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## CAR-06 — cartes

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cartes / recette-torg-aube-pj-jet
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cartes ; [RECETTE] JET. En rounds ; la Réserve de JET contient une carte ; l’effet Désorientés est décrit sur la carte active.
- **Geste :** Tenter de jouer la carte puis poser une autre carte en Réserve.
- **Attendu :** Jouer est bloqué pour ce round ; la pose et le gain restent possibles. Ne pas supprimer les cartes tenues.
- **Source :** documentation/User Guides/54-Jeu-Torg.md ; livre p. 112–113, 117 ; src/modules/session/logic/cartesDuDestin.ts et echangesDeTorg.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## CAR-07 — cartes

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cartes / recette-torg-aube-pj-jet
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cartes ; [RECETTE] JET. Une carte est en main ; Moment critique non utilisé.
- **Geste :** Déclencher Moment critique puis réessayer.
- **Attendu :** Toute la main passe en Réserve une fois par Acte ; le second usage est refusé. La gestion des cartes non jouées reste à suivre au lecteur.
- **Source :** documentation/User Guides/54-Jeu-Torg.md ; livre p. 112–113, 117 ; src/modules/session/logic/cartesDuDestin.ts et echangesDeTorg.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## CAR-08 — cartes

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cartes / recette-torg-aube-pj-jet
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cartes ; [RECETTE] JET. Au moins une carte en Réserve.
- **Geste :** Terminer le combat depuis les gestes du Destin.
- **Attendu :** Les Réserves reviennent en main ; les rounds se ferment. Le stock des autres paquets reste distinct.
- **Source :** documentation/User Guides/54-Jeu-Torg.md ; livre p. 112–113, 117 ; src/modules/session/logic/cartesDuDestin.ts et echangesDeTorg.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## CAR-09 — cartes

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cartes / recette-torg-aube-pj-jet
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cartes ; [RECETTE] JET. Poste d’essai, mains vides ; lire le stock : dix cartes seulement dans le sous-ensemble livré.
- **Geste :** Fin de scène, puis comparer le stock au nombre de destinataires.
- **Attendu :** La cible normale est 4 par héros, 5 sous Héroïsme. Le geste collectif vise les neuf PJ de la campagne, profils de recette inclus : il demande 36 cartes et en manque 26 avec ce sous-ensemble. Ne pas le jouer pendant la fiction ; distribuer alors manuellement aux seuls principaux.
- **Source :** documentation/User Guides/54-Jeu-Torg.md ; livre p. 112–113, 117 ; src/modules/session/logic/cartesDuDestin.ts et echangesDeTorg.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## CAR-10 — cartes

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cartes / recette-torg-aube-pj-jet
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cartes ; [RECETTE] JET. Les mains d’essai sont identifiées et aucun choix d’Atout n’est ouvert.
- **Geste :** Fin d’Acte ; vérifier la confirmation et les usages.
- **Attendu :** Mains et Réserves sont reprises selon le geste ; les usages d’Acte reviennent. Ce geste touche le paquet du jeu : le réserver aux exercices contrôlés.
- **Source :** documentation/User Guides/54-Jeu-Torg.md ; livre p. 112–113, 117 ; src/modules/session/logic/cartesDuDestin.ts et echangesDeTorg.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## ATO-01 — atouts

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cartes / recette-torg-aube-pj-nu
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cartes ; [RECETTE] NU. Aucun Atout coché, Possibilités 3 ; texte libre contenant le mot Ingénieux.
- **Geste :** Ouvrir les gestes de la fiche.
- **Attendu :** Le texte libre n’accorde pas l’Atout ; aucune dépense ni pioche pour un droit non possédé.
- **Source :** docs/systems/torg/rules/atouts-cartes-et-capacites.md, relu le 07/11 ; livre p. 85, 94, 99–100, 105 ; Empire du Nil v1 p. 17
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## ATO-02 — atouts

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cartes / recette-torg-aube-pj-atout
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cartes ; [RECETTE] ATOUT. Ingénieux coché, Possibilités 3, pioche suffisante pour ce cas, bénéficiaire JET.
- **Geste :** Utiliser Ingénieux puis garder la carte autorisée.
- **Attendu :** 3→2 ; une carte d’abord pour ATOUT, test Raison ND 10, puis choix 1/2/3 selon le succès pour le bénéficiaire ; une fois par scène.
- **Source :** docs/systems/torg/rules/atouts-cartes-et-capacites.md, relu le 07/11 ; livre p. 85, 94, 99–100, 105 ; Empire du Nil v1 p. 17
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## ATO-03 — atouts

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cartes / recette-torg-aube-pj-deco
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cartes ; [RECETTE] DECO. Ingénieux coché, Déconnecté vrai, Possibilités 3.
- **Geste :** Tenter d’ouvrir Ingénieux.
- **Attendu :** Refus lié à l’état ; ni coût ni carte ; ne pas déconnecter un PJ principal pour cet exercice.
- **Source :** docs/systems/torg/rules/atouts-cartes-et-capacites.md, relu le 07/11 ; livre p. 85, 94, 99–100, 105 ; Empire du Nil v1 p. 17
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## ATO-04 — atouts

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cartes / recette-torg-aube-pj-atout
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cartes ; [RECETTE] ATOUT. Chef naturel coché, Possibilités 3, exactement deux cartes en main et autre bénéficiaire choisi.
- **Geste :** Sélectionner les deux cartes puis confirmer le placement.
- **Attendu :** 3→2 ; deux cartes vont dans la Réserve de l’autre personnage. Une carte seule ou soi-même ne satisfait pas la préparation.
- **Source :** docs/systems/torg/rules/atouts-cartes-et-capacites.md, relu le 07/11 ; livre p. 85, 94, 99–100, 105 ; Empire du Nil v1 p. 17
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## ATO-05 — atouts

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cartes / recette-torg-aube-pj-atout
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cartes ; [RECETTE] ATOUT. Conscience environnementale cochée ; une carte en main.
- **Geste :** La poser par l’Atout puis tenter un deuxième usage dans la même scène.
- **Attendu :** Placement immédiat en Réserve ; deuxième usage refusé ; aucun coût de Possibilité inventé.
- **Source :** docs/systems/torg/rules/atouts-cartes-et-capacites.md, relu le 07/11 ; livre p. 85, 94, 99–100, 105 ; Empire du Nil v1 p. 17
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## ATO-06 — atouts

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cartes / recette-torg-aube-pj-atout
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cartes ; [RECETTE] ATOUT. Occultiste coché ; le MJ a confirmé un début de combat contre une créature surnaturelle maléfique.
- **Geste :** Cocher la condition, tester Sciences humaines et garder une carte parmi celles autorisées.
- **Attendu :** Simple 1, Supérieur 2, Spectaculaire 3 ; une gardée. Une pose gratuite en Réserve reste possible selon l’Atout ; fréquence par combat.
- **Source :** docs/systems/torg/rules/atouts-cartes-et-capacites.md, relu le 07/11 ; livre p. 85, 94, 99–100, 105 ; Empire du Nil v1 p. 17
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## ATO-07 — atouts

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cartes / recette-torg-aube-pj-atout
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cartes ; [RECETTE] ATOUT. Aspect effrayant coché ; Intimidation approuvée réellement réussie ; au moins deux cartes disponibles.
- **Geste :** Ouvrir le choix depuis la carte de combat.
- **Attendu :** Deux proposées, une gardée et l’autre défaussée ; pas de troisième pioche gratuite ni de nouveau test par changement du choix.
- **Source :** docs/systems/torg/rules/atouts-cartes-et-capacites.md, relu le 07/11 ; livre p. 85, 94, 99–100, 105 ; Empire du Nil v1 p. 17
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## ATO-08 — atouts

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cartes / recette-torg-aube-pj-atout
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cartes ; [RECETTE] ATOUT. Populaire coché. Le sous-ensemble courant ne contient aucune Relation.
- **Geste :** Ouvrir la recherche de Relation ; pour le cas positif, nommer une vraie carte Relation de votre paquet complet dans Deck-OS.
- **Attendu :** Sans Relation : aucun faux remplacement par Romance. Avec une Relation réelle : elle seule est proposée, une prise par Acte. Le cas positif reste dépendant du paquet complet.
- **Source :** docs/systems/torg/rules/atouts-cartes-et-capacites.md, relu le 07/11 ; livre p. 85, 94, 99–100, 105 ; Empire du Nil v1 p. 17
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## ATO-09 — atouts

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cartes / recette-torg-aube-pj-zero
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cartes ; [RECETTE] ZERO. KO vrai ; Possibilités 0 ; une carte tenue préparée dans un poste d’essai.
- **Geste :** Tenter de jouer ou d’échanger une carte.
- **Attendu :** Refus du KO ; les cartes et les ressources restent identiques. L’import de la campagne ne purge pas les mains existantes.
- **Source :** docs/systems/torg/rules/atouts-cartes-et-capacites.md, relu le 07/11 ; livre p. 85, 94, 99–100, 105 ; Empire du Nil v1 p. 17
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## COS-01 — cosms

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cosms / recette-torg-aube-pj-sante
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cosms ; [RECETTE] SANTE. Scène d’atelier en Pan-Pacifica ; Esprit 9, Choc 8, Blessures 1.
- **Geste :** Recevoir 11 dommages contre Résistance 10, puis choisir Ténacité.
- **Attendu :** Le coup met KO ; Ténacité ajoute une Blessure, efface Choc et KO : Blessures 2, Choc 0, KO faux. Pas avant réception du coup.
- **Source :** documentation/User Guides/54-Jeu-Torg.md ; src/modules/session/logic/cosmsCourants.ts ; src/modules/combat/suitesDeTorg.ts ; cosms du pilote 2.0.0
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## COS-02 — cosms

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cosms / recette-torg-aube-pj-sante
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cosms ; [RECETTE] SANTE. Même préparation en Prime Terre, sans Pan-Pacifica courant.
- **Geste :** Recevoir le même coup.
- **Attendu :** Pas de geste Ténacité accordé par ce seul coup ; changer le cosm est une décision explicite, pas une façon d’effacer le coût.
- **Source :** documentation/User Guides/54-Jeu-Torg.md ; src/modules/session/logic/cosmsCourants.ts ; src/modules/combat/suitesDeTorg.ts ; cosms du pilote 2.0.0
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## COS-03 — cosms

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cosms / recette-torg-aube-pj-atout
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cosms ; [RECETTE] ATOUT. Scène courante explicitement Tharkold ; un coup réel a infligé une Blessure et son auteur possède 3 Choc.
- **Geste :** Choisir l’auteur dans les suites du coup et activer Souffrance.
- **Attendu :** Choc de l’auteur 3→2, une fois pour cette attaque. La victime n’est pas soignée et une attaque multiple ne cumule pas le gain par cible.
- **Source :** documentation/User Guides/54-Jeu-Torg.md ; src/modules/session/logic/cosmsCourants.ts ; src/modules/combat/suitesDeTorg.ts ; cosms du pilote 2.0.0
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## COS-04 — cosms

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cosms / recette-torg-aube-pj-jet
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cosms ; [RECETTE] JET. Empire du Nil courant ; Possibilités suffisantes ; une Possibilité vient d’être lancée.
- **Geste :** Utiliser la seconde Possibilité de la Loi de l’Action.
- **Attendu :** Un coût supplémentaire, meilleur des deux dés de Possibilité retenu ; pas addition des deux bénéfices.
- **Source :** documentation/User Guides/54-Jeu-Torg.md ; src/modules/session/logic/cosmsCourants.ts ; src/modules/combat/suitesDeTorg.ts ; cosms du pilote 2.0.0
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## COS-05 — cosms

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cosms / recette-torg-aube-pj-atout
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cosms ; [RECETTE] ATOUT. Tharkold courant ; aucune Aspect effrayant nécessaire ; Intimidation approuvée réussie.
- **Geste :** Ouvrir le choix des cartes.
- **Attendu :** Domination propose deux cartes, une gardée ; pas de double choix si Aspect effrayant est aussi coché.
- **Source :** documentation/User Guides/54-Jeu-Torg.md ; src/modules/session/logic/cosmsCourants.ts ; src/modules/combat/suitesDeTorg.ts ; cosms du pilote 2.0.0
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## COS-06 — cosms

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cosms / recette-torg-aube-pj-jet
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cosms ; [RECETTE] JET. Scène 11 en zone mixte Prime Terre/Aysle ; lire les choix Cosm et Zone mixte avec.
- **Geste :** Ouvrir la scène et vérifier le panneau des Lois ; tenter un usage incompatible seulement après arbitrage.
- **Attendu :** Les Lois des deux cosms sont annoncées ; contradictions, axiomes et conséquences restent décidés à la table, sans géolocalisation ou déplacement automatique.
- **Source :** documentation/User Guides/54-Jeu-Torg.md ; src/modules/session/logic/cosmsCourants.ts ; src/modules/combat/suitesDeTorg.ts ; cosms du pilote 2.0.0
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## COS-07 — cosms

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cosms / recette-torg-aube-pj-jet
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cosms ; [RECETTE] JET. Un paquet de Cosm est installé et rattaché au cosm choisi.
- **Geste :** Consulter Début d’Acte et Changement de cosm ; annoncer l’opération avant de confirmer.
- **Attendu :** Carte de Cosm hors main de Destin, une par Acte selon les gestes réels ; un paquet manquant ne crée pas de carte. Le texte reste à lire et arbitrer.
- **Source :** documentation/User Guides/54-Jeu-Torg.md ; src/modules/session/logic/cosmsCourants.ts ; src/modules/combat/suitesDeTorg.ts ; cosms du pilote 2.0.0
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## COS-08 — cosms

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cosms / recette-torg-aube-pj-atout
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cosms ; [RECETTE] ATOUT. Aysle courant ; un test magique autorisé par le MJ et une compétence formée avec ses rangs connus.
- **Geste :** Dans la préparation du jet, prendre le Choc volontaire de la Loi de la Magie.
- **Attendu :** Un Choc volontaire par +1 au total, au plus les rangs de compétence ; la jauge du bon personnage augmente. Pas de sort ni de droit magique créé par ce choix.
- **Source :** documentation/User Guides/54-Jeu-Torg.md ; src/modules/session/logic/cosmsCourants.ts ; src/modules/combat/suitesDeTorg.ts ; cosms du pilote 2.0.0
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## COS-09 — cosms

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cosms / recette-torg-aube-pj-sante
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cosms ; [RECETTE] SANTE. Orrorsh courant ; dommages calculés mais non appliqués ; Possibilité disponible.
- **Geste :** Effectuer une Annulation des dommages et comparer le niveau de succès à Prime Terre.
- **Attendu :** Sous Persévérance : Simple annule tout le Choc mais aucune Blessure ; Supérieur une Blessure ; Spectaculaire toutes. Pas le bénéfice normal de Prime Terre.
- **Source :** documentation/User Guides/54-Jeu-Torg.md ; src/modules/session/logic/cosmsCourants.ts ; src/modules/combat/suitesDeTorg.ts ; cosms du pilote 2.0.0
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## COS-10 — cosms

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-cosms / recette-torg-aube-pj-sante
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > cosms ; [RECETTE] SANTE. Pan-Pacifica courant ; Blessures 3 et Choc 8 avant un coup qui provoque le KO.
- **Geste :** Choisir Ténacité, jouer le dernier tour accordé puis le terminer.
- **Attendu :** La quatrième Blessure est payée ; un tour complet est accordé avant le test de Défaite. Terminer le tour ne remet ni Blessures ni état à zéro.
- **Source :** documentation/User Guides/54-Jeu-Torg.md ; src/modules/session/logic/cosmsCourants.ts ; src/modules/combat/suitesDeTorg.ts ; cosms du pilote 2.0.0
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## SBI-01 — sbires

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-sbires / recette-torg-aube-pj-atout
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > sbires ; [RECETTE] ATOUT. Rencontre « RECETTE — Sbires et Horde » chargée ; vilain à capacité Sbires, laquais de même camp, total 17.
- **Geste :** Choisir le laquais ; tenter le test avant de confirmer sa proximité.
- **Attendu :** Le geste reste interdit avant la confirmation des quelques mètres ; pas de transfert implicite vers un PNJ quelconque.
- **Source :** docs/systems/torg/rules/atouts-cartes-et-capacites.md ; livre p. 264–265, 271 ; porterUnCoupDeTorg.ts ; impactDeTorg.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## SBI-02 — sbires

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-sbires / recette-torg-aube-pj-atout
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > sbires ; [RECETTE] ATOUT. Proximité confirmée, Réalité ND 10 ; vilain Résistance 12, laquais Résistance 8.
- **Geste :** Réussir le test de Sbires puis Confirmer le coup.
- **Attendu :** Coup 17 contre 8 : une Blessure et 2 Choc au laquais ; vilain intact. Confirmer une seconde fois est impossible.
- **Source :** docs/systems/torg/rules/atouts-cartes-et-capacites.md ; livre p. 264–265, 271 ; porterUnCoupDeTorg.ts ; impactDeTorg.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## SBI-03 — sbires

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-sbires / recette-torg-aube-pj-atout
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > sbires ; [RECETTE] ATOUT. Même attaque mais test de Réalité échoué, ou pas de laquais proche.
- **Geste :** Appliquer l’attaque au vilain sans transfert réussi.
- **Attendu :** Cible finale vilain, Résistance 12 : une Blessure et 2 Choc. Un ennemi ordinaire sans capacité n’obtient pas Sbires.
- **Source :** docs/systems/torg/rules/atouts-cartes-et-capacites.md ; livre p. 264–265, 271 ; porterUnCoupDeTorg.ts ; impactDeTorg.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## SBI-04 — sbires

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-sbires / recette-torg-aube-pj-atout
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > sbires ; [RECETTE] ATOUT. PNJ [RECETTE] Horde déclaré ; groupe distinct du vilain Sbires.
- **Geste :** Comparer regroupement optionnel et capacité Horde dans Combat-OS.
- **Attendu :** Le Choc commun du regroupement ne donne pas à lui seul le bonus de dommages de la capacité spéciale. Effectifs et proximité restent annoncés par le MJ.
- **Source :** docs/systems/torg/rules/atouts-cartes-et-capacites.md ; livre p. 264–265, 271 ; porterUnCoupDeTorg.ts ; impactDeTorg.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## HUB-01 — hub

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-portabilite / recette-torg-aube-pj-jet
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > portabilite ; [RECETTE] JET. Une séance d’essai est active : JET, ATOUT, SANTE sont associés aux trois joueurs existants.
- **Geste :** Connecter trois Hub simulés en 360, 768 et 1180 px ; ouvrir un test.
- **Attendu :** Chaque joueur voit son PJ de recette et le thème Torg, sans débordement horizontal global. Aucun navigateur ne lit les données personnelles.
- **Source :** src/components/hub/HubCharacterSheet.tsx ; docs/systems/torg/fiche/correspondance.json ; e2e/lancerGmOs.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## HUB-02 — hub

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-portabilite / recette-torg-aube-pj-jet
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > portabilite ; [RECETTE] JET. Un Hub connecté a ouvert Dextérité + Esquive.
- **Geste :** Lancer et dépenser une Possibilité si le premier dé le permet.
- **Attendu :** Le MJ reçoit le jet ; la ressource du bon personnage baisse de 1 et persiste après rechargement.
- **Source :** src/components/hub/HubCharacterSheet.tsx ; docs/systems/torg/fiche/correspondance.json ; e2e/lancerGmOs.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## HUB-03 — hub

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-portabilite / recette-torg-aube-pj-jet
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > portabilite ; [RECETTE] JET. Le Hub ouvre Ma fiche, modèle torg-eternity-fr.
- **Geste :** Saisir une défense d’Esquive, sauvegarder puis recharger.
- **Attendu :** La clé defenses.dodge rejoint le champ esquive_def du bon PJ ; le compteur de Choc et les Blessures restent lisibles.
- **Source :** src/components/hub/HubCharacterSheet.tsx ; docs/systems/torg/fiche/correspondance.json ; e2e/lancerGmOs.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## HUB-04 — hub

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-portabilite / recette-torg-aube-pj-jet
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > portabilite ; [RECETTE] JET. Notes MJ contenant uniquement le marqueur fictif SECRET_MJ_TORG_AUBE.
- **Geste :** Inspecter les trames joueur dans l’essai isolé.
- **Attendu :** Aucun marqueur privé reçu. Si une fuite apparaît, conserver l’échec GM-05 ; ne jamais le présenter comme un résultat attendu.
- **Source :** src/components/hub/HubCharacterSheet.tsx ; docs/systems/torg/fiche/correspondance.json ; e2e/lancerGmOs.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## HUB-05 — hub

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-portabilite / recette-torg-aube-pj-jet
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > portabilite ; [RECETTE] JET. Aucun module indépendant compatible Torg au catalogue courant.
- **Geste :** Ouvrir les modules du jeu et les outils natifs de la fiche, Dice-OS, Combat-OS et Deck-OS.
- **Attendu :** Aucun module Alien, Dune ou TMR ajouté pour simuler une règle absente ; les outils Torg natifs sont utilisés.
- **Source :** src/components/hub/HubCharacterSheet.tsx ; docs/systems/torg/fiche/correspondance.json ; e2e/lancerGmOs.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**

## RST-01 — hub

- **Archive :** 01-Les-Balises-de-l-Aube.gmos
- **Repère :** recette-torg-aube-acte-recette / recette-torg-aube-atelier-portabilite / recette-torg-aube-pj-sante
- **Avant :** Trame > ATELIERS DE RECETTE — hors fiction > portabilite ; [RECETTE] SANTE. Une note de scène et XP 17 sur Salomé servent de témoins.
- **Geste :** Modifier Choc/Blessures sur SANTE ; rétablir uniquement ses champs du tableau ETATS-DE-REFERENCE, puis recharger.
- **Attendu :** SANTE retrouve Choc 8, Blessures 1, Possibilités 1 et KO faux ; note narrative et XP 17 de Salomé sont inchangés. Aucun Remplacer de campagne.
- **Source :** src/components/hub/HubCharacterSheet.tsx ; docs/systems/torg/fiche/correspondance.json ; e2e/lancerGmOs.ts
- **Preuve :** Capture du geste, valeurs avant/après et vérification après rechargement.
- **Résultat David : NON TESTÉ**
