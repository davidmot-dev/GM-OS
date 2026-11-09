# Argyropée — anomalies et limites de la livraison

**Deux écarts reproduits dans les fonctions du moteur, sans correction applicative.** Ils sont conservés dans le cahier et dans verification-ecarts.json, qui porte le SHA de la campagne. Les tests de diagnostic prouvent ces écarts : leur réussite ne signifie pas que ces deux règles sont conformes.

## ARGY-SANTE-NEGATIVE — SAN-02

La règle p.52-53 distingue santé0 consciente aux possibilités limitées, et santé négative inconsciente, sans mort automatique. Le profil SANTE a4PS ; un impact générique de5 devrait donner−1. **HealthInterpreter.handleHP rend0 et l’état générique dead** (hors combat). L’inconscience spécifique et le négatif ne sont pas gérés par ce chemin.

Contournement pour la recette : tenir la valeur signée dans points_de_sante, accessible aussi par tracks.health sur la fiche HTML, et arbitrer l’état selon le livre. Le profil INCONSCIENT porte−1 sur la fiche et0 dans la projection HP, explicitement. Le panneau d’Exubérance lit bien−1 et refuse. Ne pas confondre cette valeur de fiche avec un moteur complet de santé Argyropée. Les soins, le retour à0 et le repos au tiers sont manuels.

## ARGY-INITIATIVE-ZERO — COM-01

La résolution de test Argyropée lit correctement la face moteur10 comme0. En revanche, **CombatRules.resolveInitiativeFormula** utilise le dé générique : avec Agilité2, Détection2, bonus0 et face moteur10, il rend14 ; la lecture0 d’Argyropée devrait donner4. L’écart est reproduit avec le vrai résolveur, sans écran de combat lancé.

Le Conteur corrige à la main le résultat d’initiative d’un10 brut en remplaçant ce dé par0. Les héros ont bonus_initiative0, pour ne pas ajouter une seconde fois Agilité et Détection via le total imprimé sur la fiche. Le Panache d’initiative et la Faveur divine sur initiative/dégâts restent manuels.

## Portée de la Guigne

DiceBoard sélectionne tous les PJ de la campagne. Guigne réglée ajoute3 à l’offrande existante de chacun et remet leurs repères à0 : ici11 personnages, dont les8 profils de recette. Le composant réel a été essayé sur ces données ; pas de sélection limitée aux participants de la séance. Réserver ce geste collectif au poste de recette et restaurer exactement les couples guigne_depense/guigne_offerte touchés. Ne jamais en faire un reset d’atelier.

## Préparation et essais restant à faire

- Import natif Electron, sauvegarde/rechargement réel, trois Hub 360/768/1180 px, réception de jets, accès refusés et matériel tous **NON EXÉCUTÉS**. Aucun service n’a été lancé ; aucun profil privé utilisé.
- GM-05 : le caviardage pur retire les marqueurs fictifs complets/partiels dans ces tests ; aucune conclusion sur le trajet réseau réel de cette livraison.
- Les 61 cas humains restent **NON TESTÉS**. Un rapport de fonctions ne préremplit aucun succès humain.
- Trois héros et huit [RECETTE] aux valeurs choisies ; PNJ originaux, ni budget novice, ni carrière réglementaire, ni prix/poids certifiés. Deux effets magiques de recette originaux servent aux consommations, sans se substituer à un choix de sorts dans le livre.
- Protection X/Y, compte des actions, portée des armes, poursuites/fatigue, soins, Châtiment vermeil et progression sont suivis à la main. Aucun module spécialisé ni réserve de table factice.
- 45 images : 44 SVG documentaires et 1 JPEG existant ; 3 WAV synthétiques de 4 secondes. Décodage réel hors ligne ; rendus relus ; aucune écoute humaine, illustration de portrait ou voix enregistrée revendiquée.
- Thème argyropee et modèle HTML intégré dépendent de la version actuelle du dépôt ; le .gmos emporte la bannière, pas une installation du thème ou du moteur HTML.
