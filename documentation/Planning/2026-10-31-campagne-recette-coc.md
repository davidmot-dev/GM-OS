# COC2 — campagnes de recette, 31/10/2026

Demande de David : « utilise le plugin GM-OS Campagnes de test et Crée les campagnes de test
de COC avec ce pilote et ces règles, pour les joueurs de mon export fourni ».

## Livraison et import

Lot : `output/campagnes-tests/coc/COC2-Campagnes-de-recette.zip`.
**IMPORTÉ ET ÉPROUVÉ EN INSTANCE JETABLE**, avec échec de confidentialité **GM-05** conservé.
Les 70 cas humains restent NON TESTÉS.

1. **01-Les-Minutes-de-Verre.gmos** : enquête contemporaine originale à Belle-Rive, ville
   fictive, pour deux à quatre séances. Sami Delcourt (technicien), Inès Perrin (secouriste),
   Maël Varenne (journaliste), rattachés respectivement à Thomas D. `p-1`, Marie C. `p-2`,
   Lucas R. `p-3`. Quatre actes, seize scènes, huit lieux, douze PNJ, douze indices et trois
   rencontres facultatives. Preuves essentielles sans jet ; expertise publique, accord surveillé
   et publication vérifiée sont trois issues possibles.
2. **02-Sante-et-Etats.gmos** : neuf PJ S01–S09, seuils à 4/9/14/19, mourant, RD, mort
   instantanée, soin et malus physique. Cases construites par `casesAligneesSurLaFiche`.
3. **03-Heros-Blues-et-Tests.gmos** : douze PJ, H00/H01/H02/H09/H10/H20,
   B04/B05/B10/B15/B20, V01. Une seule échelle d’évolution par personnage.

**24 nouveaux PJ distincts**, mêmes trois joueurs existants, aucun ancien PJ/portrait/note copié.
Relevé minimal autorisé : `outils/campagnes-de-recette/cthulhu-hack-joueurs.json`. L’export
historique complet a été retiré du dépôt ; ce relevé conserve son origine et son empreinte.

Importer 01 en premier dans Nexus, tel quel. Pilote standard **COC 2.0.0 au d20**, ID
`custom-1793122664880`, gabarit `tpl-1793122664880`, **162 champs**. Les dépendances sont
embarquées ; vérifier et remplacer explicitement une ancienne version du pilote si nécessaire.
Les deux pilotes d20/3d6 sont fournis séparément et partagent leur ID : la variante 3d6 se teste
par remplacement volontaire en environnement jetable, puis retour au d20. Elle ne s’installe pas
comme un second pilote indépendant. Moteur HTML **22**, modèle `coc2-fr`, correspondance 151 clés
nécessaires dans l’application ; une campagne ne met pas ce moteur à jour.

Réimporter le **seul laboratoire** voulu avec **Remplacer pour cette campagne** pour le
réinitialiser ; ne pas remplacer l’enquête. Le mode Rejouer ne remet pas les ressources à zéro.

## Couverture et limites

**70 cas humains NON TESTÉS**, cahier, matrice JSON/Markdown, CSV vierge, rapports, provenance
et recette de régénération. D20, bonus/malus, conditions, aides, critiques, santé/RD, Héros,
Blues et option 3d6 ; cas manuels pour opposition, social, poursuite, bandes, dangers et XP.
Pas de module COC compatible enregistré ; aucun faux module, aucune table de règles remplacée.

Profils et armement aux valeurs choisies, sans conformité à une création novice revendiquée.
Les Voies et capacités officielles ne sont pas déduites du corpus de synthèse : les choisir dans
le livre pour une partie réglementaire. V01 porte un texte technique **NON CANONIQUE** sans
effet de règle. Les fiches de corpus ont été relues par Claude Code ; cet atelier réutilise
cette relecture sans revendiquer une nouvelle lecture intégrale du livre, inaccessible sur le NAS.

Médias embarqués : **36 SVG originaux**, plans schématiques, cartouches documentaires et pièces
d’enquête ; **une bannière JPEG** COC2 déjà produite ; **trois WAV synthétiques** de quatre
secondes. Ce ne sont pas des portraits illustrés ou des voix enregistrées. Storyboard, Sound-OS,
Music-OS et tuiles de lumière préparés sans appareil réel ni touche/MIDI affecté.

## Vérifications réalisées

- **71 tests passent** : archives réelles, validateurs Nexus/pilote, types, liens, santé via
  la porte réelle des dégâts, Héros/Blues, option 3d6, correspondance HTML, conservation des
  identifiants et comportement de clone/rejeu. Six fichiers de tests dont ceux du moteur COC.
- Les trois archives passent le contrôle structurel partiel `gmos_bundle.py verify` du plugin.
- **37 images / 3 WAV décodés hors ligne**, neuf rendus examinés et empreintes conservées.
  Écoute humaine non effectuée.
- `npm.cmd run build` réussit, comprenant `tsc -b` ; avertissements Vite de taille/imports et
  Browserslist visibles. ESLint ciblé : zéro erreur ; configuration Vitest hors périmètre ESLint.
- **Parcours applicatif exécuté, 52 secondes** : imports natifs des trois archives, remplacement
  isolé de 02, conservation des trois anciens PJ et avatars fictifs, rechargement et 27 PJ dont
  24 du lot ; note de l’enquête et échelons 8/9/10 conservés. Trois Hub simulés 360/768/1180 px,
  trois jets reçus par le MJ, trois dépenses Héros −1, fiches HTML liées (nom, AGI, arme),
  saisie et sauvegarde de l’évolution. Quatre captures examinées et empreintes conservées.
- **GM-05 confirmé en ÉCHEC**, seul échec du parcours : douze chemins
  `payload.session.sessions[*].gmSecrets` reçus par les Hub. Marqueurs exclusivement fictifs,
  assertion zéro fuite conservée. Aucun correctif applicatif glissé dans ce lot.
- David a autorisé « **Oui, lancer les essais isolés** », puis, après échec EPERM/GPU et refus
  de la revue automatique de l’escalade, « **Oui, autoriser cette relance hors bac à sable** ».
  Relance ensuite acceptée ; mêmes profils/corpus/sauvegardes jetables et interdiction de lire
  les données personnelles. Historique dans `verification-lancement.json`. Le premier processus
  et son profil temporaire étaient absents après fermeture ; le parcours complet ferme son
  instance via le helper. Aucun service de développement ni Vite démarré.

Lire les rapports du lot, qui portent les SHA-256 des archives effectivement vérifiées.
Aucun `src/`, `electron/`, profil ou sauvegarde personnel modifié par cet atelier.
Les changements de Claude Code qui ont fini le pilote sont conservés ; aucun commit demandé.

## Reproduire

Sources `outils/campagnes-de-recette/coc*.mjs`, `coc.test.ts`, `vitest-coc.config.mts`,
`emballer-coc.mjs`, et parcours e2e ; instructions dans `output/campagnes-tests/coc/REPRODUIRE.md`.
Date fixe **2026-10-31T12:00:00.000Z**, version GM-OS **6.5.0**.
Le script d’emballage refuse les rapports périmés, les sources modifiées et les médias non relus.
Toute régénération impose de relancer les contrôles dépendants avant emballage.
