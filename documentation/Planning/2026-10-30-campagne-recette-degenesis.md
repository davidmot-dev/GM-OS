# Campagnes de recette Degenesis — 30/10/2026

David : « utilise le plugin GM-OS Campagnes de test et Crée les campagnes de test de Degenesis
avec ce pilote et ces règles, pour les joueurs de mon export fourni. »

## Livraison et import

Lot : [Degenesis-Campagnes-de-recette.zip](../../output/campagnes-tests/degenesis/Degenesis-Campagnes-de-recette.zip),
produit avec le plugin **GM-OS Campagnes de test**. Importer d’abord
`01-La-Station-des-Cendres.gmos`, puis `02-Sante-et-Limites.gmos` et
`03-Reserves-et-Declencheurs.gmos` dans Nexus. Le guide, le cahier, la matrice, les anomalies,
les empreintes et les sources de reproduction sont dans le ZIP.

Pilote corrigé **2.0.0**, `custom-1793142284065`, fiche `tpl-1793142284072` de **131 champs**.
Fiche HTML `degenesis-fr`, moteur **21**, correspondance des **129 clés** ; corpus relu **16/16**.
Le pilote séparé est joint : une dépendance existante en 1.0.0 exige un remplacement explicite,
pas une mise à jour supposée à l’import de campagne. Date fixe : 30/10/2026 à 12:00 UTC.

Thomas D. `p-1`, Marie C. `p-2`, Lucas R. `p-3` reçoivent **21 nouveaux PJ** : trois dans
l’aventure, neuf dans chacun des laboratoires. Le relevé autorisé de l’export fourni est le seul
contenu réutilisé ; ni anciens PJ, ni notes, ni secrets privés ne sont copiés.

**La Station des Cendres** est une aventure originale : quatre actes et séances prévues,
seize scènes, huit lieux, douze PNJ et indices, trois rencontres évitables, neuf pages Wiki,
butin, quatre moments Storyboard, ambiances et tuiles lumineuses sans appareil. Une vanne inversée,
une caisse détournée et des horaires falsifiés ont trois causes distinctes. Documents, témoins
et constats donnent plusieurs voies ; aucun indice essentiel derrière un jet unique.

Profils avancés et matériel synthétique aux valeurs choisies, sans création novice ni arme
officielle revendiquées. Narek Voss (Thomas), Sova Kern (Marie), Mira Lenz (Lucas) offrent
technique/soins, exploration/escorte et négociation/archives. Les compétences opposées sont
exclusives, les plafonds lus par les fonctions réelles, la santé alignée sur les pistes.

## Couverture et limites

02 : S01…S09, Blessures superficielles, Traumatismes, soin, mort, Égo et Sporulation.
03 : D01…D09, réserves de zéro à plus de douze, déclencheurs, échecs, Égo et initiative.
Les **66 cas humains sont NON TESTÉS** ; CSV vierge. Réinitialiser un laboratoire en réimportant
son seul fichier avec **Remplacer** ; conserver 01. Le « rejeu » n’est pas un soin.

Aucun module spécifique Degenesis compatible dans le catalogue. Les fonctions natives servent
aux réserves, Égo, Traumatismes, deux pistes et initiative. Armure, défense, coopération,
combinaisons, actions supplémentaires, Potentiels, Brûlure, contamination permanente,
progression, poursuites et dangers restent à arbitrer/saisir. Ne pas débiter deux fois l’Égo
entre initiative et première action. Les trois tables originales Table-OS s’importent à part.

Médias embarqués : **36 SVG documentaires originaux, un JPEG de bannière déjà livré et trois
WAV synthétiques**. Aucun cartouche présenté comme portrait illustré ni signal comme voix.
Identité visuelle reprise dans la campagne ; thème activé. Aucun appareil configuré.

## Vérifications exécutées

- **67 tests passent** : archives livrées, validateurs réels, liens, champs, plafonds, santé,
  profils, réserves, cas préparés, correspondance HTML, tables, clone/rejeu et cas humains vierges.
- Utilitaire portable du plugin : trois archives valides selon son contrôle structurel partiel.
- Médias décodés hors ligne : 37 images et trois WAV de quatre secondes ; neuf rendus examinés.
  Écoute humaine non exécutée.
- `npm.cmd run build` : `tsc -b` puis Vite, artefacts renouvelés. ESLint ciblé : zéro erreur ;
  seule la configuration `.mts` est ignorée par la configuration existante.
- Electron jetable : trois imports natifs, remplacement du seul 02, trois anciens PJ/avatars
  sentinelles conservés ; rechargement avec 24 PJ dont 21 du lot et note de 01 conservée.
- Hub simulés **360/768/1180 px** : trois jets reçus par le MJ et trois débits d’Égo ; fiches
  HTML remplies, modifications d’Égo à 8/9/10 retrouvées après rechargement. Quatre captures
  applicatives examinées ; zoom nécessaire sur téléphone pour les petits champs.
- **GM-05 ÉCHEC confirmé** : douze chemins `payload.session.sessions.0…11.gmSecrets` reçus par
  les Hub. Marqueurs fictifs uniquement. Le test E2E finit en échec sur `expect(...).toBe(0)` ;
  import et parcours réussis sont des constats séparés. Aucun correctif applicatif dans ce lot.

David a autorisé les services isolés : « Oui, lancer les essais isolés ». Le bac à sable a
fait expirer Electron ; relance hors bac à sable acceptée par la revue automatique. L’ancienne
instance jetable occupait encore 4100/4101 : ses trois processus ont été identifiés par leur
`--user-data-dir` exact et fermés, son dossier vérifié sous Temp puis retiré. Une assertion
`aria-pressed` a ensuite été remplacée par le contrôle de la classe `active` réellement utilisée
par la fiche intégrée. Détails dans `verification-lancement.json`. Les profils, corpus,
sauvegardes, clés vides et ports étaient jetables ; appareils désactivés, réseau externe bloqué
sur les Hub. Aucun profil ni sauvegarde personnel utilisé.

## Reproduire

Sources `outils/campagnes-de-recette/degenesis*.mjs`, `degenesis.test.ts`,
`vitest-degenesis.config.mts`, `emballer-degenesis.mjs` et
`e2e/campagneDeRecetteDegenesis.spec.ts`. Suivre `REPRODUIRE.md` dans le lot ; chemins de l’outil
Python ajustables par `GMOS_PYTHON` et `GMOS_BUNDLE_TOOL`. Les contrôles et l’emballage vérifient
les mêmes SHA-256 ; toute modification d’archive exige une nouvelle recette dépendante.

**Reste :** les cas humains, les droits GM-06, la partie complète, les appareils et la correction
séparée de GM-05 (registre § 1 bis). Aucun `src/` ou `electron/` modifié. David a demandé
« commit et pousse » le 30/10 ; ce lot est livré sur `production`, avec les contrôles du dépôt.
