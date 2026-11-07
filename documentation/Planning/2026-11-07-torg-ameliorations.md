# Torg Eternity — terminer les améliorations du pilote

Demande de David du 07/11/2026 : « on va finir les amélioration de TORG des améliorations tous les pilotes ».
GM-OS déclaré fermé le 07/11 ; aucun commit ni push demandé pour ce chantier.

## Périmètre

- [x] TORG-A0 : livre de base et passages du supplément *Empire du Nil* confrontés à l'export réel.
- [x] TORG-A1 : Atouts et capacités explicitement déclarés sur la fiche ; gestes et coûts contrôlés.
- [x] TORG-A2 : échanges des Cartes du Destin une pour une, de main à main hors rounds, de Réserve à Réserve en rounds ; MJ et Hub.
- [x] TORG-A3 : Désorientés, Domination, Ténacité et Souffrance raccordés ; décisions narratives conservées au meneur.
- [x] TORG-A4 : capacité Sbires réservée aux porteurs, proximité confirmée et coup transféré vers la bonne cible sans double application.
- [x] Pilote corrigé dans `Export Dirvers/corriges/`, manuel, captures, synthèse et registre ; validation de David toujours attendue.

## Sources et constats de départ

Export : `Export Dirvers/Torg_driver_gmos_1792659632793.gmos-driver`, version 1.0.0,
identifiant `custom-1774618478256`. Ne pas changer les identifiants du pilote et du modèle.
Les autres changements et exports du dossier partagé restent hors de ce chantier.

Livre de base : `docs/systems/torg/livres.json`, PDF = page imprimée + 2.
Supplément retrouvé dans le même dossier : `tor_05_empire_du_nil_web_v1.pdf`, PDF = imprimée + 2
(pieds de page 16 et 17 vérifiés). Extraction de travail dans `scratch/torg-audit/`, aucun PDF copié.

- Livre p. 113 : échange une carte pour une **dans les deux modes** ; seule la provenance change.
- Livre p. 85 : Chef naturel coûte une Possibilité pour poser deux cartes de sa main dans la Réserve d'un autre personnage.
- Livre p. 94 : Occultiste, au début d'un combat contre une créature surnaturelle maléfique validée par le MJ ; test de Sciences humaines, une à trois cartes selon le succès, une gardée ; peut ensuite poser une carte en Réserve.
- Livre p. 105 : Aspect effrayant donne deux cartes à choisir lors d'une Intimidation approuvée réussie.
- Empire du Nil p. 17 : Ingénieux coûte une Possibilité, une fois par scène ; première carte pour soi, puis test de Raison et une à trois cartes à choisir pour un bénéficiaire selon le succès. Populaire cherche uniquement une Relation, une fois par Acte.
- Livre p. 61 et 67 : Ténacité et Souffrance restent proposées par un texte après les dommages ; leur application doit nommer sa cible.
- Livre p. 265 : seul un adversaire doté de Sbires peut tenter de transférer une attaque qui le touche vers un laquais à quelques mètres.

Les mentions de NotebookLM ont été remplacées par les sources vérifiées dans la page du manuel.

## Livraison du 07/11/2026

- **Pilote 2.0.0 :** [Torg-Eternity-2.0.0.gmos-driver](../../Export%20Dirvers/corriges/Torg-Eternity-2.0.0.gmos-driver), à réimporter avec **Remplacer**. Identifiants du pilote `custom-1774618478256` et du modèle `tpl-1774618478258` conservés ; les trois paquets de l'export restent dans l'archive. Dix cases ajoutées : six Atouts, Sbires, Horde, KO et Déconnecté. Elles sont fausses par défaut : cocher les possessions et états réels, puis sauvegarder.
- **Atouts :** Ingénieux, Occultiste, Populaire, Chef naturel, Conscience environnementale et Aspect effrayant. Contrôle des cases enregistrées, coût, bénéficiaire, fréquences scène/combat/Acte ; choix interrompu conservé. Le test pur de Raison d'Ingénieux explose sur 10/20, la compétence non entraînée seulement sur 10.
- **Cartes :** contrepartie obligatoire, contrôle du propriétaire et de la zone au dernier moment, échange atomique chez le meneur et depuis le Hub. Début/fin du combat raccordés au mode en rounds ; Désorientés interdit de jouer sans interdire de gagner ou poser. KO bloque le geste ; Déconnecté interdit les dépenses de Possibilités et Drame/Héros, sans bannir toutes les cartes.
- **Dégâts ordinaires :** boutons Dégâts/Soins et calculateur raccordés à la même table pour PJ, Galerie et adversaires autonomes ; un reçu d'action commun sur plusieurs cibles empêche de cumuler Souffrance.
- **Lois :** Ténacité sur un reçu de coup ayant dépassé le maximum de Choc, une Blessure payée une seule fois ; dernier tour avant Défaite. Souffrance rend un Choc par action ayant blessé, même avec plusieurs cibles. Domination/Aspect effrayant : deux cartes, une gardée ; « Toutes » permet de choisir Intimidation. Inspiration et la reprise du souffle effacent aussi le KO déclaré.
- **Sbires :** porteur déclaré, cible du même camp et proximité confirmée avant Réalité ND 10 ; calcul sur la Résistance de la cible finale et confirmation unique. Horde ne s'accorde plus par une case libre dans le combat.
- **Corpus :** faux exemple utilisant directement le d20 corrigé ; sur la plage critique étendue 2–4, le total peut réussir et la conséquence demeure, seul le 1 échoue toujours. Trois fiches métier relues intégralement sur seize ; corrections ciblées de Déconnexion dans trois autres fiches, laissées `relu: false`. Treize fiches métier et l'inventaire restent à relire intégralement. Empreintes d'origine conservées.

## Vérifications

- `outils/torg/finir_torg.mjs` reconstruit le pilote ; `outils/torg/verifier_pilote.mjs` : **zéro constat**, vrai jet préparé Dextérité 9 + Esquive 2, niveau 11, 1d20, ND 10. [Rapport](../../output/torg-ameliorations/controle-pilote.json).
- Build exécuté, types et lint contrôlés ; thème accepté, zéro erreur et deux avertissements de proximité des couleurs existants. Aucun nouveau thème. La fiche HTML a été produite ensuite à la demande de David, dans l'atelier décrit ci-dessous.
- Suite complète finale `npx vitest run --maxWorkers=4` : **10 070 réussis, quatre sautés, zéro échec** ; 856 fichiers réussis, un sauté, 493,88 secondes. Les quatre essais sautés ne sont pas comptés comme réussis. [Rapport des contrôles](../../output/torg-ameliorations/verification-automatique.json).
- `e2e/torgAmeliorations.spec.ts` : **un test passé**, vrai import puis réimport Remplacer, Ingénieux et Populaire, coût/fréquence, échange tactile Edge 768×1024 par HTTP/WebSocket sans appBridge, Sbires appliqué une seule fois, dégâts ordinaires du vilain autonome et du PJ par les vrais boutons, Souffrance, Ténacité et persistance après rechargement. [Rapport Electron](../../output/torg-ameliorations/verification-electron.json).
- `e2e/capturesDesJeux.spec.ts --grep Torg` : **un test passé**, dix captures de base refaites ; quatre nouvelles captures intégrées au manuel. Images relues. Les illustrations des cartes sont fictives ; elles ne reproduisent pas les paquets du jeu. Profils jetables uniquement, aucun appareil physique essayé.

## Essai de David et limites

**Livré, pas encore essayé par David : cinq lignes orange dans la synthèse.**
Après réimport Remplacer, essayer un Atout et son coût depuis la fiche, un échange une pour une
avec la tablette, puis Sbires et une suite Ténacité/Souffrance dans le cosm concerné.
Les anciennes valeurs des personnages restent conservées ; le réimport n'infère pas leurs Atouts.

Les autres Lois (Gloire, Outsider, Vie, Sauvagerie, Vengeance), les effets imprimés des cartes,
les conditions fictionnelles et le test de Défaite restent arbitrés à la table.
L'Annulation conserve son fonctionnement préexistant : annonce du résultat et correction manuelle,
sans raccord automatique à un coup. La relecture intégrale du corpus est un chantier distinct.
Les gardes KO/Déconnecté de ce lot portent sur les cartes et les Atouts ; le meneur contrôle
ces états avant un jet ordinaire ou une Annulation.

Suivi au registre § 231 ; [note de reprise](2026-11-07-etat-et-reprise-codex-torg.md).

## Suite — fiche PJ demandée à GM-OS Studio

David : « fais la fiche PJ pour Torg, vide les champs qui sont rempli, ne touche pas à la table
des bonus ». Page exacte retrouvée dans `274_jour_unpretires.pdf`, p. PDF 84, Vikas Ord.
Retrait de 88 blocs de texte PDF, en conservant les commandes graphiques octet pour octet :
aucune donnée préremplie restante, **zéro pixel changé** sur la bande de la Table des Bonus.

[HTML autonome](../../docs/fiches/Torg/torg-eternity-fiche-pj-vierge-interactive.html),
[PDF vierge](../../output/fiches/torg/torg-eternity-fiche-pj-vierge.pdf),
[PNG vierge](../../output/fiches/torg/torg-eternity-fiche-pj-vierge.png).
Une page, 152 zones, 145 clés nouvelles, aucune clé retirée ; modèle stable `torg-eternity-fr`.
Saisie manuelle, trois pistes cumulatives, zoom 20–400 %, sauvegarde locale, JSON,
réinitialisation confirmée et impression. Aucun portrait ajouté à la zone de description.

`outils/torg/preparer-fiche-vierge.py`, `construire-fiche.mjs` et `verifier-fiche.mjs` reproduisent
le livrable et ses contrôles. Validation acceptée, zéro erreur et deux avertissements attendus :
nouveau modèle absent des gabarits intégrés et correspondance non écrite. La fiche est
importable dans un moteur de navigateur jetable, avec retour JSON vérifié ; aucun raccord
au pilote actif ou aux données de David n'a été effectué. Six captures relues et un essai tactile
768×1024, zéro erreur JavaScript et aucune requête réseau. [Rapport](../../output/fiches/torg/verification.json).
Essai de David et raccord GM-OS ultérieur à distinguer de la création terminée. Registre § 232.
