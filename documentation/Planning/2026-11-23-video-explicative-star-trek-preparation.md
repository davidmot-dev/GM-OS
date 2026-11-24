# Vidéo explicative Star Trek — préparation, 23/11/2026

**Historique de préparation, désormais terminé.** Le film final de 11 min 04 s est livré : [note de livraison](2026-11-23-video-explicative-star-trek.md) et [état de reprise](2026-11-23-etat-et-reprise-video-star-trek.md). Les mentions « reste à faire » ci-dessous décrivent les étapes antérieures.

**Historique de préparation, désormais terminé.** Le film final de 11 min 04 s est livré : [note de livraison](2026-11-23-video-explicative-star-trek.md) et [état de reprise](2026-11-23-etat-et-reprise-video-star-trek.md). Les mentions « reste à faire » ci-dessous décrivent les étapes antérieures.

Demande de David : GM-OS Vidéos explicatives sur Star Trek. Préférence : textes français sans voix, rythme légèrement plus rapide que le réglage initial, gestes à vitesse réelle.

**État : préparation engagée ; aucun tournage ni vidéo livrée.** Le 23/11, inspection structurelle des deux archives dans `output/videos-explicatives/star-trek/2026-11-23-r1/inspection.json` : identifiants, 36 champs, trois joueurs et douze PNJ confirmés. `npx.cmd vitest run --config outils/campagnes-de-recette/vitest-star-trek.config.mts --maxWorkers=4` : **145 tests réussis sur neuf fichiers** avec le code courant. Une copie strictement identique de la campagne est déposée dans `output/videos-explicatives/star-trek/2026-11-23-r1/Star-Trek-Nacre-TOURNAGE.gmos` ; son import et son adaptation pour filmer restent à faire.

Suite : `preparer.test.ts` importe cette copie dans le magasin en mémoire avec Nexus, remappe les 43 médias embarqués, vérifie le pilote/gabarit et les profils JET/CORPS/opposant, puis écrit `semence-tournage.json` validée et `modules-tournage.json` validé séparément. Test ciblé réussi ; `npm.cmd run build` réussi. À cette étape en mémoire, les modules restaient à charger dans Electron ; la copie `.gmos` reste identique à l'original. Figer le build avant de l'utiliser pour les prises.

**Repérage Electron effectué ensuite :** `reperage.spec.ts`, sortie `reperage-r4`, passe entièrement. Instance officielle jetable, sauvegardes/corpus/coffre isolés, appareils désactivés, HTTP externe bloqué ; ports locaux 4100/4101 autorisés dans cette conversation. Campagne Nacre et deux instances de modules chargées, rendus `.lcars-prototype` et `[data-pupitre-operations]` attendus. Le jet préparé 4/14 donne trois réussites contre difficulté 1, Impulsion 0→2 ; image finale du résultat examinée. Dans Opérations, seule la tâche `[RECETTE] Effort` reçoit Fonction 4 moins obstacle 1, soit trois coches ; leur persistance après rechargement réel de fenêtre est vérifiée. `reperage-r4/verification.json` porte ces résultats. Les répétitions antérieures sont conservées. L'instance a été fermée. **Ce repérage n'est pas un tournage final et aucun MP4 nouveau n'a été produit.**

Point de vigilance du prochain script : la ligne de phaseur de l'opposant écrit « gravité2 », tandis que `attaqueDeStarTrek` ne reprend automatiquement la gravité que dans une ligne « Distance, 2 ». Régler la gravité explicitement dans le panneau, ou adapter la seule copie de tournage et consigner la modification ; ne pas annoncer une reprise automatique de cette valeur. Aucun fichier applicatif modifié.

## Sources identifiées

- Star Trek Adventures deuxième édition ; manuel `documentation/User Guides/54-Jeu-Star-Trek.md`.
- Campagne de test `output/campagnes-tests/star-trek/01-Star-Trek-Les-Voix-de-Nacre.gmos`, SHA-256 `1d7f519954d661b062f17a0d100d71df9f73c0c29e9554e1dfeb199af5bca21d` ; état et limites dans `documentation/Planning/2026-11-21-campagne-test-star-trek.md`.
- Pilote `Export Dirvers/Star Trek_driver_gmos_1794393318614.gmos-driver`, 2.0.0, SHA-256 `2bad6225c15bc20e31402dfa62d3a185df224bcd88a9c40ea7ffe1a48f460e40`, identique à la copie livrée avec la campagne. IDs rapportés par le lot : `custom-1787403136277`, gabarit `tpl-1787403136278`, 36 champs. Inspecter les archives et leur compatibilité avec le moteur courant avant tournage.
- Modules préparés dans le lot : LCARS 0.5.0 et Opérations 1.0.0. Leurs commandes ne prélèvent pas automatiquement les réserves globales ; vérifier chaque effet réellement filmé.
- Registre § 267 T5 : attaque PNJ Star Trek et paiement en Menace livrés le 23/11. Vérifier le profil de l’opposant de recette et l’équipement dans le moteur courant avant de fixer l’échange.
- L’archive contient une rencontre `[RECETTE] Conflit physique` avec un opposant synthétique ennemi, Stress 0/max 8, résistance 0 et phaseur de référence gravité 2. La rencontre demande d’ajouter CORPS ; le comportement de l’attaque reste à vérifier dans l’interface.

## Trame à construire et vérifier

Scénario préparatoire détaillé : `output/videos-explicatives/star-trek/2026-11-23-r1/scenario-preparatoire.md`. L’ancien `e2e/clipStarTrek.spec.ts` contient des locators utiles pour les deux modules, mais utilise une autre fiction et ne constitue ni la campagne Nacre ni la nouvelle vidéo ; ne pas le livrer comme tel.

1. Présenter campagne et profils RECETTE, fiche HTML réelle et réserves. Les réserves ne sont pas transportées par l’archive : préparer explicitement Impulsion 0 et Menace 6 pour trois héros présents, sans prétendre que l’import les a fixées.
2. Composer une tâche 2d20 attribut + fonction, spécialisation, difficulté et dé acheté avec son paiement visible ; annoncer les dés préparés, lire résultat et conséquences ; montrer une option et son coût.
3. Montrer Détermination et Stress/blessure, avec les effets réellement pris en charge.
4. Préparer la rencontre de test, montrer l’alternance PJ/adversaire, attaque et réponse native PNJ, paiement en Menace et conséquence sur la cible, suite et clôture.
5. Démontrer LCARS puis Opérations dans leurs interfaces réelles ; distinguer intentions et arbitrages manuels, paiements et persistance. Ne pas présenter un état côté MJ comme une preuve de transport vers une tablette.
6. Récapituler les gestes, limites, chapitres et campagne ; vérifier la persistance par rechargement réel.

## Reste à faire

Inspecter les archives et manifestes, le moteur, le catalogue et les tests actuels ; préparer une copie de tournage isolée par les imports réels ; écrire scénario, plan séquencé, textes et scripts ; build, répétition et prise normale ; calage, montage, contrôle du MP4 final et livraison avec SRT, chapitres, sources et limites. La campagne historique rapporte 145 contrôles ciblés, mais aucun import Electron ni essai matériel ; ne pas transformer ces contrôles en preuve de tournage. Préserver les fichiers en cours de modification d’autres agents et les données personnelles.
