# Crimes 2 — campagne de test « Les Heures rayées »

**Livrée le 20 novembre 2026**, demande de David : « GM-OS Campagnes de test — Crimes ».
Une campagne complète dans un seul `.gmos`, avec ateliers intégrés, selon le plugin 0.2.0.
Aucun commit demandé ni exécuté.

[ZIP du lot](../../output/campagnes-tests/crimes/Crimes-Les-Heures-rayees-Campagne-de-test.zip) ·
[Unique campagne](../../output/campagnes-tests/crimes/01-Crimes-Les-Heures-rayees.gmos) ·
[Guide d’import](../../output/campagnes-tests/crimes/LIRE-MOI.md) ·
[Rapport](../../output/campagnes-tests/crimes/RAPPORT-DE-VERIFICATION.md).

## Contenu et sources

Saint-Aubin-sur-Lisse, ville industrielle fictive, automne 1898 : des personnes déclarées mortes réclament leur identité, tandis que registres, indemnités et accidents annoncés se répondent. Fiction originale : douze séances prévues, quatre actes narratifs et quatre fins alternatives. Chaque séance prépare trois situations, voies alternatives, réactions, issues et transition. Deux démarches peuvent changer d’ordre. Aucun indice essentiel derrière un seul jet.

- Trois nouveaux héros, un par joueur du relevé déjà autorisé `cthulhu-hack-joueurs.json` : Gabriel Bréant / Thomas D. (p-1), Éloi Soria / Marie C. (p-2), Noémie Faure / Lucas R. (p-3). Aucun ancien PJ, avatar ou export privé relu.
- Trois profils `[RECETTE]` distincts : JET, CORPS, ESPRIT. Huit ateliers autonomes dans l’acte **ATELIERS DE RECETTE — hors fiction** ; pas de lien narratif obligatoire vers eux.
- Quinze PNJ dont une cible synthétique d’atelier, dix lieux et plans schématiques, vingt-six indices dont deux de recette, trois rencontres. Quarante-trois médias embarqués : bannière existante et SVG originaux de plans/cartouches/aides de lecture. Aucun portrait illustré, fac-similé historique ou son revendiqué.
- Pilote actuel `Export Dirvers/Crime_driver_gmos_1794393223784.gmos-driver`, **version 1.0.0**, ID `custom-1792441893774`, gabarit `tpl-1792441893774`, **231 champs**. Le contenu du pilote et du gabarit est identique à celui du clip du 06/11 ; il n’a pas été modifié. Copie inchangée jointe, pas de nouveau pilote corrigé à réimporter.
- Corpus `docs/systems/crime/rules/`, dix-neuf fiches relues le 23/10 ; manuel 54 et fonctions actuelles. Aucune nouvelle relecture intégrale du PDF revendiquée. Pas de module externe Crimes compatible inventé.

## Vérifications exécutées

**Lot PRÉPARÉ avec échec de conformité documenté**, pas une campagne déclarée éprouvée dans Electron ou par David.

- **133 contrôles : 132 réussis, 1 échec nommé CRI-A01.** Assertion négative conservée en échec ; le runner refuse tout autre échec. CSV de **58 cas humains NON TESTÉS** séparé.
- Manifeste natif, médias/empreintes et liens croisés, types et bornes des champs, vraie naissance/santé des personnages, contrôle partiel des budgets des héros, jets/garde/atteintes/psychologie/contacts/Fortune/expérience et dossier d’enquête.
- Fonction d’initiative du plateau : six et trois pour les profils de recette. Opposition et calcul de cinq blessures testés. Assommer exige deux succès d’avance pour produire la fatigue ; un seul laisse le coup au hasard avec son type d’arme. Le cahier le précise.
- Vrai `NexusService.injectState` **en mémoire** : une seule campagne ajoutée, anciens personnages/avatars/campagne sentinelles fictifs conservés. `construireLaSauvegarde` puis `validateSession` acceptent le résultat.
- Restauration locale par `updateCharacter`, sérialisation et relecture : seul pratique de JET change puis revient ; note témoin et Physique 5 de Gabriel restent identiques. **Pas un rechargement Electron réel.**
- Correspondance HTML pure aller-retour ; secrets MJ et indices privés filtrés dans les cas vérifiés ; révélation au seul lecteur, seuils alternatifs et partage sans nouvelle dépense.
- Outil du plugin : structure Nexus v1 partielle valide. Edge hors ligne : 43 médias décodés et rendus, onze planches relues. Relecture éditoriale IA de l’histoire et des états, pas une partie humaine.
- ZIP : un seul `.gmos`, 91 fichiers, 90 empreintes internes vérifiées après emballage. Fiche HTML/correspondance inchangées, rapports et sources de reproduction joints.

## CRI-A01 — constat à intégrer au registre quand il sera libre

> ✅ **Corrigé le 24/11/2026** (registre § 273, Claude Code) : la loyauté et les appels ne partent plus vers les joueurs. La suite liée passe 135/135 ; `crimes-executer-tests.mjs` et `crimes-verifier.mjs` n'attendent plus d'échec. Les preuves ci-dessous et l'archive livrée datent d'avant la correction et sont gardées telles quelles ; le cas POR-04 est à reprendre.

Le caviardage pur conserve `contacts_0_rating` et `contacts_0_appels` dans la charge joueur (valeurs fictives 3 et 0), alors que Contacts est présenté comme réservé au MJ, livre p. 430. `preuve-cri-a01.json` et l’assertion négative sont liés à l’archive. L’émetteur et le serveur appellent ce filtre ; **transport réseau et écran de tablette non exécutés ici**. La confidentialité des loyautés n’est pas validée. Aucun correctif applicatif glissé dans cette campagne.

Le contrôle de Forge émet aussi un avertissement générique `combat.statsToTrack` / `isMainHP`, conservé dans `verification-pilote.json`. Le chemin spécifique Crimes lit les Potentiels et leurs marques ; ses tests passent. Ne pas transformer ce warning en défaut d’écriture observé ni le masquer en modifiant le pilote.

## Limites et reprise

Import par la fenêtre Electron, sauvegarde/rechargement réel, HTML dans Electron, Hub aux trois tailles, réception réseau des jets, matériel et recette humaine **NON EXÉCUTÉS**. Aucun service démarré pour cette fabrication, aucune installation ni sauvegarde personnelle touchée.

Fin de scène, Bonne nuit et Nouvelle affaire sont des gestes collectifs, pas des resets locaux. Restaurer manuellement les seuls champs des profils d’atelier. **Nexus Remplacer concerne toute la campagne.** Les budgets de Potentiels/compétences/spécialisations passent un contrôle partiel ; aucune création novice intégrale certifiée. Fortune 10 et variantes de Névrose sont distinguées de la règle du livre.

Sources : `outils/campagnes-de-recette/crimes*.mjs`, `crimes.test.ts`, `vitest-crimes.config.mts`.
Régénération, contrôles et emballage : `REPRODUIRE.md` dans le lot. Toute régénération invalide les rapports dépendants.

SHA-256 campagne : `c0af90ecc55ebf57da14d9b5601bd3ab90ba97f0f645a1bd01cd3eeded8c231c`.
SHA-256 ZIP : `c8d7003958836e3498f11d7128588f26f9f276167f8271f7871a213de1874153`.

Le registre partagé est actuellement modifié par un autre chantier (avec MediaBrowser et ModalProvider) : laissé intact. À y intégrer plus tard : lien de livraison et constat CRI-A01. La synthèse des pilotes n’est pas modifiée, aucun pilote n’ayant été amélioré. Les changements Alien préexistants sont également laissés intacts.
