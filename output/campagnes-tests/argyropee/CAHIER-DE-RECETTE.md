# Argyropée — cahier de recette

61 cas humains **NON TESTÉS**. Un seul fichier 01-Les-Comptes-de-la-maree.gmos. Les résultats aléatoires en interface sont constatés, jamais imposés par l’archive ; les seuils déterministes sont testés séparément dans le moteur.

Les ateliers sont dans le cinquième acte de la Trame. Préserver les héros, leurs inventaires et l’histoire. Pour Guigne réglée, le geste collectif est réservé au poste de recette ; il touche aussi les héros et ne sert jamais de restauration locale.

## IMP-01 — import

**Repère :** recette-argyropee-maree-20261109-atelier-ecrans ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / ecrans / [RECETTE] JET. Le pilote 2.1.0 est installé ; conserver un PJ et une campagne existants comme témoins. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Importer une seule fois la campagne avec Tel quel, puis regarder les trois profils de joueurs.

**Attendu :** Une seule campagne ajoutée ; les nouveaux PJ rejoignent p-1/p-2/p-3 ; les anciens PJ et avatars sont conservés.

**Support :** natif. **Source :** src/modules/system/archive/nexus.types.ts ; NexusService.ts.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## IMP-02 — import

**Repère :** recette-argyropee-maree-20261109-atelier-ecrans ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / ecrans / [RECETTE] JET. Campagne importée une fois, données sauvegardées. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Recharger GM-OS et ouvrir la Trame, les douze séances et l’Atlas.

**Attendu :** Quatre actes narratifs, un acte hors fiction, 36 scènes de fiction, six ateliers, douze séances prévues et les liens demeurent. Ne pas importer de nouveau pour recharger.

**Support :** natif. **Source :** src/modules/system/archive/nexus.types.ts ; NexusService.ts.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## JET-01 — jets

**Repère :** recette-argyropee-maree-20261109-atelier-jets ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / jets / [RECETTE] JET. Serrurerie 3 ; métier Malandrin +2 ; modificateur 0 ; aidants 0 ; aucune option complexe/Faveur/opposition. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Choisir Serrurerie et Malandrin, lancer et relever la face effectivement tirée.

**Attendu :** Total = face lue 0–9 + 5 ; la face moteur 10 représente 0 ; le résultat se lit sur les cinq paliers fixes. Aucun jet imposé en interface.

**Support :** natif. **Source :** docs/systems/argyropee/rules/resolution-des-jets.md, p. 44-45 ; manuel 54-Jeu-Argyropee.md (décision de David : total ≤ 0 critique).

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## JET-02 — jets

**Repère :** recette-argyropee-maree-20261109-atelier-jets ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / jets / [RECETTE] JET. Même fiche ; préparation neuve. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Lancer une fois avec Aucun métier et comparer la composition avec Malandrin sans confondre deux dés différents.

**Attendu :** La préparation passe de +3 à +5 ; seul le métier choisi est ajouté, pas tous les métiers de la fiche.

**Support :** natif. **Source :** docs/systems/argyropee/rules/resolution-des-jets.md, p. 44-45 ; manuel 54-Jeu-Argyropee.md (décision de David : total ≤ 0 critique).

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## JET-03 — jets

**Repère :** recette-argyropee-maree-20261109-atelier-jets ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / jets / [RECETTE] JET. Modificateur du Conteur composé de deux sources −4 et −3, annoncé −7. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Saisir −7 puis lancer Serrurerie avec Aucun métier.

**Attendu :** Le global −7 est conservé ; total = face +3−7 ; à 0 ou moins, échec critique selon la décision de David.

**Support :** natif. **Source :** docs/systems/argyropee/rules/resolution-des-jets.md, p. 44-45 ; manuel 54-Jeu-Argyropee.md (décision de David : total ≤ 0 critique).

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## JET-04 — jets

**Repère :** recette-argyropee-maree-20261109-atelier-jets ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / jets / [RECETTE] JET. Aucun métier ; annoncer au plus cinq aidants qualifiés. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Comparer la composition avec zéro puis cinq aidants ; essayer d’en saisir six.

**Attendu :** Bonus d’entraide plafonné à +5 ; la qualification de chaque aidant reste vérifiée à la table.

**Support :** natif. **Source :** docs/systems/argyropee/rules/resolution-des-jets.md, p. 44-45 ; manuel 54-Jeu-Argyropee.md (décision de David : total ≤ 0 critique).

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## JET-05 — jets

**Repère :** recette-argyropee-maree-20261109-atelier-jets ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / jets / [RECETTE] JET. Combat rapproché 7 ; choisir le métier de recette +5 uniquement pour cette expérience. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Lancer et relever le dé ; classer le total face+12.

**Attendu :** 12–14 réussite ; 15–21 critique. Les essais automatiques imposent séparément chaque seuil 0/1/7/8/9/10/14/15 ; l’interface reste aléatoire.

**Support :** natif. **Source :** docs/systems/argyropee/rules/resolution-des-jets.md, p. 44-45 ; manuel 54-Jeu-Argyropee.md (décision de David : total ≤ 0 critique).

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## PAN-01 — panache

**Repère :** recette-argyropee-maree-20261109-atelier-jets ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / jets / [RECETTE] JET. Panache 12 ; Serrurerie 3 + Malandrin2 ; après un jet dont le dé lu est inférieur à9. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Noter la réserve, cliquer +1 et relire le résultat et le journal.

**Attendu :** Dé final +1, total +1, Panache −1, guigne_depense +1 ; pas de nouveau d10. Si dé9, relever le refus de plafond.

**Support :** natif. **Source :** docs/systems/argyropee/rules/jauges-et-ressources-individuelles.md, p. 84-85 ; argyropee.ts.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## PAN-02 — panache

**Repère :** recette-argyropee-maree-20261109-atelier-jets ; recette-argyropee-maree-20261109-pj-zero.

**Avant :** ATELIERS DE RECETTE / jets / [RECETTE] ZERO. Panache 0 ; jet dont le dé est inférieur à9. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Essayer +1 ou un palier proposé.

**Attendu :** Boutons de dépense indisponibles ; réserve reste0 et aucun Panache négatif.

**Support :** natif. **Source :** docs/systems/argyropee/rules/jauges-et-ressources-individuelles.md, p. 84-85 ; argyropee.ts.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## PAN-03 — panache

**Repère :** recette-argyropee-maree-20261109-atelier-jets ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / jets / [RECETTE] JET. Panache12 ; relever un résultat avec dé inférieur à9. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Dépenser jusqu’au dé9, en notant chaque coût ; essayer ensuite un point de plus.

**Attendu :** Le dé n’excède jamais9 ; coût total =9−face initiale, limité aussi par la réserve. Le résultat initial reste lisible.

**Support :** natif. **Source :** docs/systems/argyropee/rules/jauges-et-ressources-individuelles.md, p. 84-85 ; argyropee.ts.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## PAN-04 — panache

**Repère :** recette-argyropee-maree-20261109-atelier-sante ; recette-argyropee-maree-20261109-pj-sante.

**Avant :** ATELIERS DE RECETTE / sante / [RECETTE] SANTE. Un jet de dégâts libre, distinct d’un test d’attaque. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Lancer 1d4 de dégâts et chercher une dépense Panache pour ce dé.

**Attendu :** Aucune dépense Panache sur les dégâts n’est proposée ; un critique d’attaque se résout avec deux jets de dégâts ou une manœuvre au choix.

**Support :** manuel. **Source :** docs/systems/argyropee/rules/jauges-et-ressources-individuelles.md, p. 84-85 ; argyropee.ts.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## CMP-01 — complexe

**Repère :** recette-argyropee-maree-20261109-atelier-jets ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / jets / [RECETTE] JET. Escalade1, Furtivité4 ; Aucun métier ; modificateur0, aidants0. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Composer Escalade et ajouter Furtivité dans Action complexe, puis lancer.

**Attendu :** Moyenne2 ; total=face+2. Succès à8 ou plus accomplit l’action ; sur échec, rattrapage=face+4 : partiellement ratée si ce total atteint8.

**Support :** natif. **Source :** docs/systems/argyropee/rules/jets-opposes-aide-et-cooperation.md, p. 45-46 ; argyropee.ts.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## CMP-02 — complexe

**Repère :** recette-argyropee-maree-20261109-atelier-jets ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / jets / [RECETTE] JET. Action complexe précédente ; après le jet, Panache disponible. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Si un palier est atteignable, dépenser le coût annoncé puis relire l’issue complexe.

**Attendu :** Le même dé est rehaussé, la moyenne reste2 et le rattrapage est recalculé ; aucune nouvelle compétence ni second dé inventé.

**Support :** natif. **Source :** docs/systems/argyropee/rules/jets-opposes-aide-et-cooperation.md, p. 45-46 ; argyropee.ts.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## OPP-01 — complexe

**Repère :** recette-argyropee-maree-20261109-atelier-jets ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / jets / [RECETTE] JET. Commerce3 ; Aucun métier ; adversaire score4 ; nouvelle opposition. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Activer Test en opposition ; lancer les manches jusqu’à une issue.

**Attendu :** Réussite partielle ou simple=1 succès, critique=2 ; premier à5 ; si les deux atteignent5 dans la même manche, égalité. Journal de l’adversaire présent.

**Support :** natif. **Source :** docs/systems/argyropee/rules/jets-opposes-aide-et-cooperation.md, p. 45-46 ; argyropee.ts.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## OPP-02 — complexe

**Repère :** recette-argyropee-maree-20261109-atelier-jets ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / jets / [RECETTE] JET. Opposition terminée. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Cliquer Nouvelle opposition, puis changer de compétence.

**Attendu :** Le compte neuf ne réutilise pas les succès anciens. Vérifier aussi le comportement après fermeture/réouverture ; toute conservation inattendue est à relever.

**Support :** natif. **Source :** docs/systems/argyropee/rules/jets-opposes-aide-et-cooperation.md, p. 45-46 ; argyropee.ts.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## OPP-03 — pnj

**Repère :** recette-argyropee-maree-20261109-atelier-guigne ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / guigne / [RECETTE] JET. Opposition neuve ; Adversaire PNJ coché ; carrière+modificateurs2. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Lancer deux manches avec compétence privilégiée, puis une nouvelle opposition sans cette case.

**Attendu :** Chaque manche tire un nouveau d6 : degré d6 ou plancher(d6/2), plus2 puis d10 lu0–9 ; ne pas saisir une compétence fixe de PNJ.

**Support :** natif. **Source :** docs/systems/argyropee/rules/bestiaire-et-adversaires.md, p. 185, 196 ; lancerUnPnj.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## JOU-01 — journee

**Repère :** recette-argyropee-maree-20261109-atelier-journee ; recette-argyropee-maree-20261109-pj-jour.

**Avant :** ATELIERS DE RECETTE / journee / [RECETTE] JOUR. Panache3, bonus permanent2, offrande3, prières1, magie4, repère Guigne6. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Cliquer Réveil après le repos de fiction ; relever le dé et toutes les valeurs après.

**Attendu :** Panache=face0–9+15, donc15–24 ; prières0, magie0, guigne_depense0 et guigne_offerte0. La réserve3 de la veille n’est pas additionnée.

**Support :** natif. **Source :** docs/systems/argyropee/rules/jauges-et-ressources-individuelles.md, p. 84 ; argyropee.ts.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## JOU-02 — journee

**Repère :** recette-argyropee-maree-20261109-atelier-journee ; recette-argyropee-maree-20261109-pj-jour.

**Avant :** ATELIERS DE RECETTE / journee / [RECETTE] JOUR. Restaurer Panache3 ; aucune autre action entre les lectures. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Cliquer Repas +3 une fois.

**Attendu :** Panache6 ; santé et prières inchangées. Le repas ne soigne pas automatiquement les PS.

**Support :** natif. **Source :** docs/systems/argyropee/rules/jauges-et-ressources-individuelles.md, p. 84 ; argyropee.ts.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## JOU-03 — journee

**Repère :** recette-argyropee-maree-20261109-atelier-journee ; recette-argyropee-maree-20261109-pj-jour.

**Avant :** ATELIERS DE RECETTE / journee / [RECETTE] JOUR. Restaurer Panache3. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Cliquer Collation +1 une fois.

**Attendu :** Panache4 ; pas de modification des sorts ou de la Guigne. La fréquence des repas relève de la fiction.

**Support :** natif. **Source :** docs/systems/argyropee/rules/jauges-et-ressources-individuelles.md, p. 84 ; argyropee.ts.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## FAV-01 — faveur

**Repère :** recette-argyropee-maree-20261109-atelier-journee ; recette-argyropee-maree-20261109-pj-jour.

**Avant :** ATELIERS DE RECETTE / journee / [RECETTE] JOUR. Sciences religieuses2, prières1 ; option Faveur décochée. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Cocher Faveur divine avant un test puis lancer.

**Attendu :** Deux d10 lus0–9, meilleur gardé ; prières passe2 et case décochée après le jet. La faveur reste notée après une dépense de Panache.

**Support :** natif. **Source :** docs/systems/argyropee/rules/la-faveur-divine.md, p. 81 ; PanneauDeJet.tsx.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## FAV-02 — faveur

**Repère :** recette-argyropee-maree-20261109-atelier-journee ; recette-argyropee-maree-20261109-pj-bas.

**Avant :** ATELIERS DE RECETTE / journee / [RECETTE] BAS. Sciences religieuses2, prières2. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Essayer de déclarer une Faveur.

**Attendu :** Aucune prière restante ; option indisponible, sans décrément supplémentaire. Réveil rétablit deux possibilités pour le nouveau jour.

**Support :** natif. **Source :** docs/systems/argyropee/rules/la-faveur-divine.md, p. 81 ; PanneauDeJet.tsx.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## FAV-03 — faveur

**Repère :** recette-argyropee-maree-20261109-atelier-jets ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / jets / [RECETTE] JET. Sciences religieuses0. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Ouvrir Préparer et chercher la Faveur divine.

**Attendu :** Zéro prière ; aucune faveur lancée ni comptée.

**Support :** natif. **Source :** docs/systems/argyropee/rules/la-faveur-divine.md, p. 81 ; PanneauDeJet.tsx.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## FAV-04 — faveur

**Repère :** recette-argyropee-maree-20261109-atelier-sante ; recette-argyropee-maree-20261109-pj-sante.

**Avant :** ATELIERS DE RECETTE / sante / [RECETTE] SANTE. Une Faveur sur dégâts ou initiative décidée par le Conteur. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Résoudre deux dés à la main et conserver le meilleur ; consigner la prière.

**Attendu :** Le livre permet tout dé ; le panneau natif automatise seulement le test. Aucune automatisation des dégâts/initiative revendiquée.

**Support :** manuel. **Source :** docs/systems/argyropee/rules/la-faveur-divine.md, p. 81 ; PanneauDeJet.tsx.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## EXU-01 — exuberance

**Repère :** recette-argyropee-maree-20261109-atelier-journee ; recette-argyropee-maree-20261109-pj-jour.

**Avant :** ATELIERS DE RECETTE / journee / [RECETTE] JOUR. Panache3, santé0 ; raconter un péril puis obtenir l’accord du Conteur. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Cliquer Exubérance puis confirmer le sacrifice3.

**Attendu :** La santé0 est encore consciente ; second clic requis ; Panache0, sans guérison automatique ni changement imposé du récit.

**Support :** natif. **Source :** docs/systems/argyropee/rules/l-exuberance.md, p. 85-86 ; obstacleALExuberance.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## EXU-02 — exuberance

**Repère :** recette-argyropee-maree-20261109-atelier-journee ; recette-argyropee-maree-20261109-pj-bas.

**Avant :** ATELIERS DE RECETTE / journee / [RECETTE] BAS. Panache2, santé4. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Essayer Exubérance.

**Attendu :** Refus expliqué : moins de3 points ; Panache2 inchangé.

**Support :** natif. **Source :** docs/systems/argyropee/rules/l-exuberance.md, p. 85-86 ; obstacleALExuberance.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## EXU-03 — exuberance

**Repère :** recette-argyropee-maree-20261109-atelier-journee ; recette-argyropee-maree-20261109-pj-inconscient.

**Avant :** ATELIERS DE RECETTE / journee / [RECETTE] INCONSCIENT. Fiche points_de_sante−1, Panache3 ; projection HP générique0 documentée. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Ouvrir la journée et essayer Exubérance.

**Attendu :** Refus pour santé sous0. Vérifier la fiche HTML tracks.health−1 ; ne pas assimiler le libellé HP générique à une mort de règle.

**Support :** natif. **Source :** docs/systems/argyropee/rules/l-exuberance.md, p. 85-86 ; obstacleALExuberance.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## MAG-01 — magie

**Repère :** recette-argyropee-maree-20261109-atelier-magie ; recette-argyropee-maree-20261109-pj-magie.

**Avant :** ATELIERS DE RECETTE / magie / [RECETTE] MAGIE. Restaurer Panache10 et magie_du_combat0 ; domaines Eau/Verre distincts. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Choisir le sort de recette, Sans lueur décoché, puis Exprimer.

**Attendu :** Panache9, magie1, guigne_depense inchangé ; coût1 avec lueur. L’effet reste arbitré, aucun bonus officiel fabriqué.

**Support :** natif. **Source :** docs/systems/argyropee/rules/l-art-thaumaturgique-magie-innee-des-humeurs.md, p. 127, 135-136 ; décision David 09/11 : un tirage au franchissement de 7.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## MAG-02 — magie

**Repère :** recette-argyropee-maree-20261109-atelier-magie ; recette-argyropee-maree-20261109-pj-magie.

**Avant :** ATELIERS DE RECETTE / magie / [RECETTE] MAGIE. Restaurer Panache10, magie0 ; domaines distincts. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Cocher Sans lueur puis Exprimer une fois.

**Attendu :** Panache8, magie2 ; coût2, aucune dépense Guigne.

**Support :** natif. **Source :** docs/systems/argyropee/rules/l-art-thaumaturgique-magie-innee-des-humeurs.md, p. 127, 135-136 ; décision David 09/11 : un tirage au franchissement de 7.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## MAG-03 — magie

**Repère :** recette-argyropee-maree-20261109-atelier-magie ; recette-argyropee-maree-20261109-pj-double.

**Avant :** ATELIERS DE RECETTE / magie / [RECETTE] DOUBLE. Panache3, magie0 ; deux domaines Verre. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Exprimer le sort avec Sans lueur.

**Attendu :** Panache2 et magie1 ; coût1 grâce à la double humeur, pas2. Le nom du domaine seul ne certifie pas une création novice.

**Support :** natif. **Source :** docs/systems/argyropee/rules/l-art-thaumaturgique-magie-innee-des-humeurs.md, p. 127, 135-136 ; décision David 09/11 : un tirage au franchissement de 7.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## MAG-04 — magie

**Repère :** recette-argyropee-maree-20261109-atelier-magie ; recette-argyropee-maree-20261109-pj-zero.

**Avant :** ATELIERS DE RECETTE / magie / [RECETTE] ZERO. Panache0 ; sort de recette présent. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Essayer Exprimer avec et sans lueur.

**Attendu :** Bouton indisponible ; aucun compte ne change.

**Support :** natif. **Source :** docs/systems/argyropee/rules/l-art-thaumaturgique-magie-innee-des-humeurs.md, p. 127, 135-136 ; décision David 09/11 : un tirage au franchissement de 7.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## MAG-05 — magie

**Repère :** recette-argyropee-maree-20261109-atelier-magie ; recette-argyropee-maree-20261109-pj-magie.

**Avant :** ATELIERS DE RECETTE / magie / [RECETTE] MAGIE. Panache10, magie6, silenciada false ; expression normale coût1. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Exprimer une fois ; relever le d100 au journal.

**Attendu :** Panache9, magie7 ; un d100 au franchissement ; muet si résultat≤20, sinon non. L’issue précise n’est pas promise avant le tirage.

**Support :** natif. **Source :** docs/systems/argyropee/rules/l-art-thaumaturgique-magie-innee-des-humeurs.md, p. 127, 135-136 ; décision David 09/11 : un tirage au franchissement de 7.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## MAG-06 — magie

**Repère :** recette-argyropee-maree-20261109-atelier-magie ; recette-argyropee-maree-20261109-pj-magie.

**Avant :** ATELIERS DE RECETTE / magie / [RECETTE] MAGIE. Restaurer Panache10, magie7, silenciada false. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Exprimer une fois de plus.

**Attendu :** Panache9, magie8 ; aucun nouveau d100 de silenciada pour ce combat déjà au seuil.

**Support :** natif. **Source :** docs/systems/argyropee/rules/l-art-thaumaturgique-magie-innee-des-humeurs.md, p. 127, 135-136 ; décision David 09/11 : un tirage au franchissement de 7.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## MAG-07 — magie

**Repère :** recette-argyropee-maree-20261109-atelier-magie ; recette-argyropee-maree-20261109-pj-magie.

**Avant :** ATELIERS DE RECETTE / magie / [RECETTE] MAGIE. Magie_du_combat6 et Panache10 ; relever silenciada. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Cliquer Fin du combat.

**Attendu :** Magie0 ; Panache10 et silenciada inchangés. Ce geste ne soigne pas le mutisme.

**Support :** natif. **Source :** docs/systems/argyropee/rules/l-art-thaumaturgique-magie-innee-des-humeurs.md, p. 127, 135-136 ; décision David 09/11 : un tirage au franchissement de 7.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## MAG-08 — magie

**Repère :** recette-argyropee-maree-20261109-atelier-magie ; recette-argyropee-maree-20261109-pj-magie.

**Avant :** ATELIERS DE RECETTE / magie / [RECETTE] MAGIE. Cocher silenciada true dans la fiche, Panache10, magie0. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Résoudre deux tests réussis de Sens magique avec le Conteur puis remettre la case à faux.

**Attendu :** Guérison arbitrée et case tenue manuellement ; pas de deux succès ni soin automatique inventés par la campagne.

**Support :** manuel. **Source :** docs/systems/argyropee/rules/l-art-thaumaturgique-magie-innee-des-humeurs.md, p. 127, 135-136 ; décision David 09/11 : un tirage au franchissement de 7.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## SAN-01 — sante

**Repère :** recette-argyropee-maree-20261109-atelier-sante ; recette-argyropee-maree-20261109-pj-sante.

**Avant :** ATELIERS DE RECETTE / sante / [RECETTE] SANTE. Endurances3+3, santé actuelle4, maximum8. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Comparer fiche HTML, fiche GM-OS et compteur du combat, avant toute blessure.

**Attendu :** Maximum8 selon2+3+3, actuel4 aux trois lectures. Le champ de maximum est renseigné, pas une formule persistante automatique promise.

**Support :** natif. **Source :** docs/systems/argyropee/rules/sante-et-blessures.md, p. 52-54 ; pilote combat.santeDeDepart ; HealthInterpreter.ts.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## SAN-02 — sante

**Repère :** recette-argyropee-maree-20261109-atelier-sante ; recette-argyropee-maree-20261109-pj-sante.

**Avant :** ATELIERS DE RECETTE / sante / [RECETTE] SANTE. Actuel4, maximum8 ; cible de recette seule. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Appliquer un impact générique de5 puis comparer à la règle de santé sous0.

**Attendu :** Règle : santé−1, inconscience sans mort automatique. Constat technique connu : HP générique borne à0. Relever l’écart ; ne pas valider la règle sur ce seul affichage.

**Support :** à vérifier. **Source :** docs/systems/argyropee/rules/sante-et-blessures.md, p. 52-54 ; pilote combat.santeDeDepart ; HealthInterpreter.ts.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## SAN-03 — sante

**Repère :** recette-argyropee-maree-20261109-atelier-sante ; recette-argyropee-maree-20261109-pj-inconscient.

**Avant :** ATELIERS DE RECETTE / sante / [RECETTE] INCONSCIENT. Fiche−1, maximum8 ; le modèle de combat est à0. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Au tour suivant, résoudre Endurance morale ; sur réussite restaurer la fiche à0.

**Attendu :** Retour à0 conscient aux capacités limitées ; sur échec, rester inconscient selon p.53. États et réveil médical restent manuels.

**Support :** manuel. **Source :** docs/systems/argyropee/rules/sante-et-blessures.md, p. 52-54 ; pilote combat.santeDeDepart ; HealthInterpreter.ts.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## SAN-04 — sante

**Repère :** recette-argyropee-maree-20261109-atelier-sante ; recette-argyropee-maree-20261109-pj-sante.

**Avant :** ATELIERS DE RECETTE / sante / [RECETTE] SANTE. Santé1, maximum8, aucun soin en cours. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Après un vrai repos de fiction, remonter à ceil(8/3)=3 puis noter ce soin ; recommencer le repos.

**Attendu :** Le premier repos remonte AU tiers3, pas +3 ; une seconde nuit seule ne monte pas à6. Panache Réveil est un autre geste.

**Support :** manuel. **Source :** docs/systems/argyropee/rules/sante-et-blessures.md, p. 52-54 ; pilote combat.santeDeDepart ; HealthInterpreter.ts.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## SAN-05 — sante

**Repère :** recette-argyropee-maree-20261109-atelier-sante ; recette-argyropee-maree-20261109-pj-sante.

**Avant :** ATELIERS DE RECETTE / sante / [RECETTE] SANTE. Restaurer actuel4 ; maximum8 ; patient non encore soigné. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Réussir Médecine, tirer1d4 et ajouter le soin selon le Conteur ; noter le patient traité.

**Attendu :** Un seul test efficace par patient ; pas de répétition infinie automatique. Ne pas attribuer une essence de salmycète absente à l’inventaire.

**Support :** manuel. **Source :** docs/systems/argyropee/rules/sante-et-blessures.md, p. 52-54 ; pilote combat.santeDeDepart ; HealthInterpreter.ts.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## PRO-01 — protection

**Repère :** recette-argyropee-maree-20261109-atelier-sante ; recette-argyropee-maree-20261109-pj-sante.

**Avant :** ATELIERS DE RECETTE / sante / [RECETTE] SANTE. Protection de recette2/3 ; actuel4 ; impact solide fixé à3 par l’essai humain. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Déduire absorption2 puis1 PS ; modifier usure à2/2 dans le champ texte de protection.

**Attendu :** Actuel3, protection2/2 ; l’usure et l’absorption X/Y restent manuelles. Aucun champ d’armure générique n’est inventé.

**Support :** manuel. **Source :** docs/systems/argyropee/rules/degats-et-types-de-degats.md, p. 49, 52 ; protections texte du gabarit.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## PRO-02 — protection

**Repère :** recette-argyropee-maree-20261109-atelier-sante ; recette-argyropee-maree-20261109-pj-sante.

**Avant :** ATELIERS DE RECETTE / sante / [RECETTE] SANTE. Protection2/3 ; actuel4. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Comparer un poing1d4 et un contact de feu1 PS/tour, en restaurant entre les deux.

**Attendu :** Poing : absorption2 mais usure inchangée. Feu : pas d’absorption2, −1 PS et −1 usure par tour de contact.

**Support :** manuel. **Source :** docs/systems/argyropee/rules/degats-et-types-de-degats.md, p. 49, 52 ; protections texte du gabarit.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## COM-01 — combat

**Repère :** recette-argyropee-maree-20261109-atelier-sante ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / sante / [RECETTE] JET. Agilité2, Détection2, bonus_initiative0 ; enregistrer les valeurs avant combat. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Tirer l’initiative une seule fois et noter le dé du moteur.

**Attendu :** Composition du pilote1d10+4 ; bonus0 évite de recompter Agilité+Détection. Contrôler la lecture du zéro : le chemin générique peut rendre10 ; noter l’écart.

**Support :** à vérifier. **Source :** docs/systems/argyropee/rules/initiative-et-deroulement-du-tour.md et distances-et-portees.md, p. 46-51 ; pilote.combat et tactical.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## COM-02 — combat

**Repère :** recette-argyropee-maree-20261109-atelier-sante ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / sante / [RECETTE] JET. Rencontre d’atelier ouverte ; tour de5 secondes. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Faire deux actions puis changer le tour ; essayer attaque après une parade non déclarée.

**Attendu :** Deux actions sont arbitrées par le Conteur ; une parade exige déclaration et Agilité. Aucun compteur spécialisé ni défense universelle automatique annoncé.

**Support :** manuel. **Source :** docs/systems/argyropee/rules/initiative-et-deroulement-du-tour.md et distances-et-portees.md, p. 46-51 ; pilote.combat et tactical.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## COM-03 — combat

**Repère :** recette-argyropee-maree-20261109-atelier-sante ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / sante / [RECETTE] JET. Arme et portée annoncées par le Conteur. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Comparer une cible à3m, puis au-delà et hors portée propre à l’arme.

**Attendu :** À3m ou moins : Combat rapproché/Rixe ; au-delà : Combat à distance. Pas de malus automatique par bande du pilote ; saisir celui de l’arme à la main.

**Support :** manuel. **Source :** docs/systems/argyropee/rules/initiative-et-deroulement-du-tour.md et distances-et-portees.md, p. 46-51 ; pilote.combat et tactical.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## POU-01 — poursuite

**Repère :** recette-argyropee-maree-20261109-atelier-sante ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / sante / [RECETTE] JET. Distance15m ; Endurance physique2, fatigue après5 tours. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Noter deux tests simultanés de course ; comparer succès/échec ; poursuivre au sixième tour.

**Attendu :** Un seul camp réussit : écart±5m ; mêmes issues : inchangé. Au6e tour, malus−1 puis cumulatif ; suivi de distance et de fatigue manuel.

**Support :** manuel. **Source :** docs/systems/argyropee/rules/poursuites.md, p. 51-52.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## POU-02 — poursuite

**Repère :** recette-argyropee-maree-20261109-atelier-sante ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / sante / [RECETTE] JET. Même course ; obstacle annoncé ; deux chemins de sortie. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Le fuyard accepte−1 et tente l’obstacle ; distinguer son échec d’une réussite.

**Attendu :** L’obstacle ne gêne le poursuivant que si le fuyard réussit ; fuite possible après deux tours hors vue. Ne pas appliquer l’opposition premier à5 à cette course.

**Support :** manuel. **Source :** docs/systems/argyropee/rules/poursuites.md, p. 51-52.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## PNJ-01 — pnj

**Repère :** recette-argyropee-maree-20261109-atelier-guigne ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / guigne / [RECETTE] JET. Pupitre Dice-OS Argyropée ; PNJ humain synthétique carrière2 ; compétence privilégiée. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Lancer un test de PNJ et relever d6 puis d10.

**Attendu :** Total=d6+2+face0–9+modificateur ; nouveau d6 à chaque test, pas de compétence permanente sauvegardée.

**Support :** natif. **Source :** docs/systems/argyropee/rules/bestiaire-et-adversaires.md, p. 185, 196 ; lancerUnPnj.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## PNJ-02 — pnj

**Repère :** recette-argyropee-maree-20261109-atelier-guigne ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / guigne / [RECETTE] JET. Pupitre ; même PNJ ; compétence non privilégiée puis animal sans carrière. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Relever le d6 non privilégié, puis tester avec carrière0.

**Attendu :** Humain non privilégié : plancher(d6/2)+2+face ; animal : aucune carrière. Ces profils sont synthétiques, pas des entrées officielles du bestiaire.

**Support :** natif. **Source :** docs/systems/argyropee/rules/bestiaire-et-adversaires.md, p. 185, 196 ; lancerUnPnj.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## GUI-01 — guigne

**Repère :** recette-argyropee-maree-20261109-atelier-guigne ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / guigne / [RECETTE] JET. Guigne_depense0 ; Panache12 ; test au dé inférieur à9. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Dépenser +1 sur le test et relire la carte La Guigne.

**Attendu :** Repère du seul personnage +1 ; aucune réserve partagée, aucun incident automatique imposé à6.

**Support :** natif. **Source :** docs/systems/argyropee/rules/la-guigne.md, p. 176-177 ; GuigneDArgyropee.tsx.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## GUI-02 — guigne

**Repère :** recette-argyropee-maree-20261109-atelier-guigne ; recette-argyropee-maree-20261109-pj-magie.

**Avant :** ATELIERS DE RECETTE / guigne / [RECETTE] MAGIE. Guigne_depense0 ; magie0 ; Panache10. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Exprimer le sort à1 ou2 points puis relire le repère.

**Attendu :** Repère0 ; seul le compte magique augmente.

**Support :** natif. **Source :** docs/systems/argyropee/rules/la-guigne.md, p. 176-177 ; GuigneDArgyropee.tsx.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## GUI-03 — guigne

**Repère :** recette-argyropee-maree-20261109-atelier-guigne ; recette-argyropee-maree-20261109-pj-jour.

**Avant :** ATELIERS DE RECETTE / guigne / [RECETTE] JOUR. Les profils de recette et les héros partagent la même campagne. Relever leurs valeurs avant le geste collectif. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Sur un poste d’essai, cliquer Guigne réglée puis consulter chaque PJ.

**Attendu :** Le geste est collectif : offrande augmentée de3 et repère0 pour chaque personnage ; JOUR passe de3 à6 offerts. Ne pas le présenter comme un reset d’atelier isolé ; restaurer toutes les cibles modifiées depuis l’état de référence.

**Support :** natif. **Source :** docs/systems/argyropee/rules/la-guigne.md, p. 176-177 ; GuigneDArgyropee.tsx.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## GUI-04 — guigne

**Repère :** recette-argyropee-maree-20261109-atelier-guigne ; recette-argyropee-maree-20261109-pj-jour.

**Avant :** ATELIERS DE RECETTE / guigne / [RECETTE] JOUR. Offrande3 ; bonus2 ; Panache3 ; accord du Conteur sur le repos. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Cliquer Réveil une fois puis vérifier l’offrande ; ne pas cliquer deux fois pour le même réveil.

**Attendu :** Panache15–24 ; offrande0. Les3 ne sont pas donnés une deuxième fois. Le droit à un nouveau repos reste arbitré.

**Support :** natif. **Source :** docs/systems/argyropee/rules/la-guigne.md, p. 176-177 ; GuigneDArgyropee.tsx.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## FIC-01 — fiche

**Repère :** recette-argyropee-maree-20261109-atelier-ecrans ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / ecrans / [RECETTE] JET. Onglet Fiche du jeu du PJ de recette ; modèle argyropee-fr déjà intégré au moteur courant. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Changer Nom et cliquer le cercle5 d’Agilité sur le modèle HTML.

**Attendu :** La fiche GM-OS reçoit nom et agilite5 ; les cercles précédents sont allumés ; aucun champ de héros principal changé.

**Support :** natif. **Source :** docs/systems/argyropee/fiche/correspondance.json ; docs/fiches/Argyropée/argyropee-fiche-interactive.html.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## FIC-02 — fiche

**Repère :** recette-argyropee-maree-20261109-atelier-ecrans ; recette-argyropee-maree-20261109-pj-sante.

**Avant :** ATELIERS DE RECETTE / ecrans / [RECETTE] SANTE. Modèle HTML et fiche GM-OS du même personnage. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Changer Santé actuelle, une arme, un métier et un équipement ; recharger puis relire dans les deux sens.

**Attendu :** Les128 clés reliées persistent. Les9 champs propres à GM-OS, dont Guigne et Faveur, ne sont pas imprimés en HTML et restent tenus côté GM-OS.

**Support :** natif. **Source :** docs/systems/argyropee/fiche/correspondance.json ; docs/fiches/Argyropée/argyropee-fiche-interactive.html.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## FIC-03 — fiche

**Repère :** recette-argyropee-maree-20261109-atelier-ecrans ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / ecrans / [RECETTE] JET. Une scène de fiction et sa note témoin existent ; conserver le Panache de Marin comme témoin. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Modifier uniquement le PJ de recette puis suivre la restauration manuelle de ETATS-DE-REFERENCE.md ; recharger.

**Attendu :** Les seuls champs d’essai retrouvent leurs valeurs ; note de scène, Panache de Marin et autres fiches restent identiques. Ne pas utiliser Nexus Remplacer.

**Support :** natif. **Source :** docs/systems/argyropee/fiche/correspondance.json ; docs/fiches/Argyropée/argyropee-fiche-interactive.html.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## DRO-01 — droits

**Repère :** recette-argyropee-maree-20261109-atelier-ecrans ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / ecrans / [RECETTE] JET. Trois Hub appairés à p-1/p-2/p-3 dans une instance jetable autorisée ; aucun vrai secret utilisé. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Ouvrir séances et scènes ; inspecter les charges reçues et rechercher SECRET_MJ_ARGY_MAREE.

**Attendu :** Aucun marqueur privé reçu ; GM-05 contrôlé sur charges complètes et partielles. Le test pur ne remplace pas ce parcours réseau.

**Support :** à vérifier. **Source :** src/modules/remote/logic/caviardageDesJoueurs.ts ; parcours Hub de GM-OS.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## DRO-02 — droits

**Repère :** recette-argyropee-maree-20261109-atelier-ecrans ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / ecrans / [RECETTE] JET. Trois Hub en360/768/1180px ; chaque joueur a son personnage. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Lancer un test et modifier une compétence depuis sa fiche ; essayer une écriture sur le PJ d’un autre joueur.

**Attendu :** Le MJ reçoit jet et modification autorisés ; l’autre PJ ne reçoit aucune écriture interdite. Capture et rechargement requis.

**Support :** à vérifier. **Source :** src/modules/remote/logic/caviardageDesJoueurs.ts ; parcours Hub de GM-OS.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## MED-01 — campagne

**Repère :** recette-argyropee-maree-20261109-atelier-ecrans ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / ecrans / [RECETTE] JET. Campagne ouverte ; réseau externe coupé. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Ouvrir les douze plans, révéler un document préparé, projeter le plan du quai et lire un signal.

**Attendu :** Médias embarqués lisibles ; plans et cartouches documentaires, pas portraits peints ; signaux synthétiques, pas voix enregistrées. Matériel externe non configuré.

**Support :** natif. **Source :** src/types/trame.types.ts ; nexus.types.ts ; archives de campagne.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## TRA-01 — campagne

**Repère :** recette-argyropee-maree-20261109-atelier-ecrans ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / ecrans / [RECETTE] JET. Trame et séances importées. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Passer d’un acte narratif à R1 puis revenir à l’histoire ; fermer et rouvrir la scène.

**Attendu :** Ateliers directement accessibles et optionnels ; aucune obligation de terminer l’histoire ; leurs PJ ne sont pas affectés aux scènes de fiction.

**Support :** natif. **Source :** src/types/trame.types.ts ; nexus.types.ts ; archives de campagne.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## CHA-01 — progression

**Repère :** recette-argyropee-maree-20261109-atelier-sante ; recette-argyropee-maree-20261109-pj-jet.

**Avant :** ATELIERS DE RECETTE / sante / [RECETTE] JET. PJ de recette seul, noter ses valeurs de départ. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Modifier un métier/une compétence et recalculer les charges depuis Endurance physique : légère10+2EP, lourde×2, soulevable×4, poussable×6.

**Attendu :** Les champs nommés existent et persistent ; pas de budget de création ou dépense d’expérience automatique inventé. Si les Endurances changent définitivement, recalculer la santé maximale avec le Conteur.

**Support :** manuel. **Source :** docs/systems/argyropee/rules/composition-de-la-fiche-de-personnage.md et jauges-et-ressources-individuelles.md ; arbitrage du Conteur.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**

## CHA-02 — progression

**Repère :** recette-argyropee-maree-20261109-atelier-sante ; recette-argyropee-maree-20261109-pj-sante.

**Avant :** ATELIERS DE RECETTE / sante / [RECETTE] SANTE. Châtiment vermeil0 sur le PJ de recette ; aucune action réelle de fiction. Restaurer les seuls champs d’essai avant ce cas.

**Geste :** Simuler une marque dans la jauge et consigner une variation de pécule choisie.

**Attendu :** Marque1 et monnaie saisie persistantes ; aucune marque de meurtre ou conversion monétaire automatique attribuée aux héros.

**Support :** manuel. **Source :** docs/systems/argyropee/rules/composition-de-la-fiche-de-personnage.md et jauges-et-ressources-individuelles.md ; arbitrage du Conteur.

**Preuve :** Valeurs avant/après, capture datée et journal ; vérifier la persistance après rechargement.

**Résultat humain : NON TESTÉ.**
