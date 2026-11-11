# État et reprise — 11/11/2026

## Ce que la session a produit

**Le lot 1 des idées reprises de GM Codex : jets demandés et jets cachés** — livré, **à essayer
par David**. Registre § 243, ligne 179 ; spécification et suivi tâche par tâche :
[`2026-11-11-jets-demandes-et-caches.md`](2026-11-11-jets-demandes-et-caches.md) (T1 à T10).
**Lot commité dans `27c832a9`.** Reprise par Codex le 11/11 : David demande
« on reprend commit tout ce qu'il te reste ». Les fichiers encore en attente sont enregistrés
par sujet : registre Alien (carrières saisies par David), corpus de campagne « Premiers pas »,
exports et travail de préparation Argyropée, extractions des cartes Torg et script associé.
Cette reprise ne modifie pas le code de l'application et ne comprend pas de push.

- **Demander un jet** : « Demander à (personnage) » dans « Lancer un test » chez le meneur ; la
  tablette montre une bannière (Hub et fiche) et ouvre le test composé ; le résultat clôt la
  demande. Données : `src/modules/dice/demandeDeJet.ts`, `filDesDemandes.ts`,
  `demandesDeLaTablette.ts` ; transport : `SessionMessage.demandeDeJet` / `suiteDeDemande`,
  `electron/destinatairesDesMessages.ts` (`sansLesChampsDuMeneur`), `electron/SyncServer.ts`.
- **Jet caché** : `src/modules/dice/jetsCaches.ts` (magasin en mémoire, jamais `setLastRoll`),
  `consignerLeJet({ cache })` ; interrupteur au panneau de fiche (`fields/CommandesDuMeneur.tsx`)
  et au pupitre (`DiceBoard.tsx`).
- **Écrans** d'après trois maquettes Stitch adoptées par David
  (`documentation/Planning/stitch/jets-demandes/`).
- **Manuel** : pages 53, 34, 61 ; deux captures neuves. **Synthèse des pilotes** : ligne commune.
- Plus tôt dans la journée, commité et poussé : `1e3a769c` (les documents Markdown prennent les
  couleurs du jeu — le grimoire d'Argyropée illisible).

## Par quoi reprendre

1. **David** : ouvrir un PJ, « Lancer un test », composer, **« Demander à … »** ; sur la tablette
   du joueur, toucher **Lancer** dans la bannière, lancer ; vérifier « lancé » chez le meneur.
   Puis « Jet caché » au pupitre. Photographier la bannière pour le guide 61.
2. Le lot est déjà commité (`27c832a9`) ; consigner le résultat de l'essai de David.
3. Ensuite : spécifier le **lot 2** (rappel d'un jet dû par une jauge Clock-OS) avec
   `specifier-un-chantier`.

## Ce qu'il ne faut pas repayer

- **Tablette qui se reconnecte = jeton de reprise.** Un client WebSocket qui se réinscrit sous le
  même `deviceId` doit présenter le `repriseModules` reçu à la première inscription, sinon
  `reprise_refusee` et aucune confirmation. Un e2e qui « attend » l'inscription cale en silence.
- **La règle « test ou Sauvegarde » est celle de la tablette** : `estUneSauvegarde(
  decrireLeJetDuPilote(pilote))` (`HubCharacterSheet`). Un d20 « sous ou égal » au moteur
  `standard` est une Sauvegarde pour elle. Tout ce qui vise la tablette depuis le meneur doit lire
  la même règle (`composerPourLaTablette`).
- **`localStorage` différé de 250 ms** : un essai qui lit le disque appelle
  `viderLesEcrituresDifferees()` ; sans cela, l'essai « rien n'est écrit » passe à vide.
- **Stitch par le MCP** : le premier `generate_screen_from_text` a calé sans écran ; relancé avec
  `modelId: GEMINI_3_8_FLASH`, les trois écrans ont abouti en une minute. Les fichiers se
  téléchargent avec l'en-tête `X-Goog-Api-Key: $STITCH_API_KEY` et arrivent en JSON
  `{ dataString }` (base64 pour l'image) ; rendre le HTML avec
  `chromium-1217/chrome-win64/chrome.exe` (le Chromium attendu par Playwright n'est pas installé).
- **Le bouton du pupitre s'appelle « LANCER »** (majuscules, `dice.actions.roll`) : `/^lancer$/i`.
- **Lint `react-refresh/only-export-components`** : un fichier de composant n'exporte pas de
  fonction utilitaire ; la ranger dans le module de données.
- **Scripts Python d'édition** : les écrire dans un fichier (le heredoc de Bash casse sur les
  guillemets et accents graves) ; une écriture Windows échoue parfois en `OSError 22` : vérifier
  que le fichier est intact, puis refaire.

## Fichiers du lot commité (`27c832a9`)

Ce lot : `electron/SyncServer.ts`, `electron/destinatairesDesMessages(.test).ts` ;
`src/types/session.types.ts`, `src/modules/session/store/uiSlice.ts` ;
`src/modules/dice/` — `demandeDeJet(.test, DesPilotes.test).ts`, `filDesDemandes(.test).ts`,
`demandesDeLaTablette.ts`, `jetsCaches(.test).ts`, `jetCacheAuPupitre.test.tsx`,
`jetDepuisLaFiche.ts`, `resultatVenuDeLaTablette(.test).ts`, `DiceBoard.tsx` ;
`src/modules/journal/consignerLeJet.ts` ; `src/modules/remote/actions/ficheActions(.test).ts` ;
`src/modules/session/components/` — `CharacterSheetEditor.tsx`, `PanneauJetVoyageur.tsx`,
`fields/PanneauDeJet.tsx`, `fields/CommandesDuMeneur.tsx`, `fields/PanneauDeJet.demande.test.tsx`,
`fields/PanneauDeJet.meneur.test.tsx` ; `src/components/TabletHub.tsx`,
`src/components/hub/` — `HubCharacterSheet.tsx`, `HubCharacterSheet.demande.test.tsx`,
`BanniereDeDemande(.test).tsx`, `JetsDeLaFiche(.test).tsx` ; `src/locales/{fr,en}/modules.json` ;
`e2e/jetsDemandesEtCaches.spec.ts` ; `output/verification-jets-demandes/` ;
`documentation/User Guides/` — pages 34, 53, 61 et deux captures ;
`documentation/Planning/` — la spécification, `stitch/jets-demandes/`, cette note, la synthèse
des pilotes et le registre (§ 243, ligne 179).

**Présents avant la session de Claude**, puis inclus dans les commits de reprise de Codex
à la demande de David : la ligne du § 242 dans le registre,
`docs/campaigns/premiers-pas/`, `tmp/…`, `Export Dirvers/Argyropee…` et son export corrigé.
Ces fichiers sont conservés en l'état ; leur archivage ne vaut pas relecture du corpus
(`relu: false`) ni nouvel essai des pilotes et des cartes.
