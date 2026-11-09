# Argyropée — rapport du lot

**PRÉPARÉE — import natif et Hub réseau NON EXÉCUTÉS.** Données du 09/11/2026 ; pilote réel 2.1.0 conservé à l’identique.

## Ce qui a été exécuté

- Une archive de campagne, 12 séances prévues, quatre actes narratifs, 36 scènes de fiction et six ateliers ; trois héros, huit [RECETTE], 16 PNJ de fiction et deux PNJ synthétiques, 12 lieux et 12 indices. Intrigue, voies alternatives et trois fins relues dans le générateur et CAMPAGNE-DU-MENEUR.md.
- **120 essais Vitest réussis, zéro échec**, en mémoire jsdom : manifeste Nexus, champs/types/liens/empreintes, fonctions de jet, valeurs du pilote, composants natifs avec les profils livrés, Faveur, réveil, magie, silenciada, Exubérance et portée collective de la Guigne. Les deux diagnostics de non-conformité restent explicitement des écarts, détaillés dans verification-ecarts.json.
- **Injection réelle de NexusService en mémoire**, sur sentinelles fictives : une campagne ajoutée, anciens PJ et avatars conservés sous les trois mêmes profils. Ce n’est pas l’import natif Electron.
- Remise en état des seuls champs de SANTE par la vraie action updateCharacter ; note de scène et Panache 17 de Marin conservés après sérialisation JSON. **Pas de rechargement Electron** ni preuve de persistance sur disque annoncés.
- **GM-05 :** caviarderPourLesJoueurs retire les marqueurs fictifs de séance et des notes dans des charges complètes et partielles. Le réseau réel n’a pas été éprouvé.
- Correspondance : 128 clés vers la fiche HTML ; exemple de saisie de nom et d’Agilité remontant à la fiche GM-OS. Aucun trajet iframe/Hub physique prétendu.
- Utilitaire gmos_bundle.py : archive acceptée structurellement ; ce contrôle reste partiel.
- **45 images et 3 WAV décodés hors ligne**, 45 rendus et cinq planches conservés et examinés. Plans et cartouches sont des documents originaux, les signaux sont synthétiques.

## Ce qui reste distinct

Les 61 cas de David sont NON TESTÉS. Import Electron, profils sauvegardés/rechargés, Hub réseau aux trois tailles, matériel, IA/TTS, MIDI et lumières NON EXÉCUTÉS. Aucun paquet installé, service démarré, écriture git, fichier src/ ou electron/ modifié, donnée personnelle lue ou sauvegarde de David utilisée.

## Empreintes

- Campagne : 01-Les-Comptes-de-la-maree.gmos
- SHA-256 : 99ab03140af10542e26006d9bead494fd9f7fd7f11064711cee0a2525c1bdcaa
- Pilote : 1e73bb938cd0966dc2587fd21ba912068c3d1a0b555d16e22ec8c6a17d02f89a

Les rapports JSON et provenance.json emploient les mêmes empreintes. Le ZIP contient un unique .gmos, un pilote séparé, les guides, le CSV humain vierge, les médias, les rapports et les sources de reproduction.
