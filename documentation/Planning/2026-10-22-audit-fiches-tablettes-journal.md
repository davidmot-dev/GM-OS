# Audit — fiches, tablettes et journal (sujet commun 5)

> 22/10/2026, Claude Code, à la demande de David (*« on va faire le sujet 5 et 6 »*, puis « Audit
> d'abord »). Lecture du code seulement : **rien n'est corrigé ici**, sauf le point A1, corrigé en
> passant par le sujet 6. David choisit ce qu'on corrige. Registre général : § 151.
> Synthèse : [améliorations de tous les pilotes](2026-10-20-ameliorations-tous-les-pilotes.md),
> ligne « Fiches, tablettes et journal ».

Le sujet demandait : **même calcul et mêmes ressources** partout, **clés stables**, **secrets
filtrés**, **modifications historisées**. Chaque constat dit s'il est **reproduit** (par un essai)
ou **lu dans le code** (chemin cité, pas encore éprouvé).

## Ce qui tient

- **Le même panneau de jet** sert la fiche du meneur et la tablette (`PanneauDeJet.tsx`) : même
  calcul du seuil, des dés, du modificateur et de l'opposition, du paiement ; le résultat d'une
  tablette remonte au meneur et s'inscrit à son journal (`fiche:resultat`, `ficheActions.ts`).
- **Les secrets déjà filtrés** avant les tablettes des joueurs : notes privées, fil de messages,
  avis de séance, `gmSecretInfo` et `roleplayingNotes` des entités et des combattants
  (`useNexusSynchronizer.ts`, vers la ligne 627) ; objectifs Alien (`caviarderObjectifsAlien`) ;
  astrologie de Rêve de Dragon, joueur par joueur, au serveur (`SyncServer.ts`,
  `filtrerAstrologieDistante`) ; cartes face cachée et ordre du paquet.
- **Les réserves de table** : une seule règle pour le meneur et la tablette (`tableActions.ts`
  rejoue `depenser`/`gagner`), la Menace refusée aux joueurs.
- **Les clés** : la Forge enrichit sans renommer, le contrôle du pilote nomme tout identifiant qui
  ne se raccorde pas, la correspondance des fiches HTML signale les clés inconnues. Pas de défaut
  trouvé sur cet axe dans le temps de l'audit — il a été survolé, pas épuisé.

> **Corrigés le 22/10 (registre § 152) : S1, S2 et S5**, par une seule fonction de caviardage
> appliquée à l'émission, au serveur et aux fenêtres locales. En corrigeant, un cas de plus : la
> diffusion rapide du **combat** partait sans rôle, donc sans aucun filtre — couverte par le serveur.
>
> **Corrigés le 22/10 (registre § 153) : S3 et S4.** Seuls les indices révélés partent ; le serveur
> retire `gmNotes` des actions des joueurs. Restent H1 et C1.
>
> **Corrigés le 22/10 (registre § 154) : H1 et C1**, choix de David : toutes les modifications de
> fiche au journal avec leur origine ; le pupitre et la télécommande règlent les réserves d'un jet
> 2d20, pour un personnage ou un PNJ. **Tous les constats de l'audit sont traités.**
>
> **Et les deux défauts antérieurs relevés par les recettes** (registre § 156) : un appareil refusé
> ne le disait pas — corrigé ; les recettes des tablettes, cassées depuis `a128c7af`, sont vertes.

## Les constats

| # | Axe | Constat | Gravité | Preuve |
| --- | --- | --- | --- | --- |
| **A1** | Journal | Le **motif** d'un mouvement de réserve venu d'une tablette s'arrêtait à l'action du meneur : le journal disait « Réserves de table » sans le jet qui avait dépensé. | Moyenne | **Corrigé le 22/10** avec le sujet 6 (`tableActions.ts`), essai `tableActions.test.ts` |
| **S1** | Secrets | Le segment **`lectureDuMeneur`** — actes et scènes avec leurs **notes du meneur**, wiki, **tous les indices, révélés ou non** — part sur **chaque tablette de joueur** : la charge des joueurs ne retire que `messages`. Le commentaire du code le destine à la tablette du meneur. | **Haute** | Lu dans le code : `useNexusSynchronizer.ts` (clé posée vers la ligne 482, charge des joueurs vers 627–660, aucune suppression), `segmentDeLecture.ts` (`notesDuMeneur`) |
| **S2** | Secrets | Les **notes du meneur** des **lieux** (`AtlasMap.gmNotes`, que la Forge de campagne remplit avec « ce que seul le meneur sait »), des **campagnes** (`Campaign.gmNotes`) et des **personnages** (`PlayerCharacter.gmNotes`) partent sur chaque tablette. Seules celles des entités et des combattants sont masquées. | **Haute** | Lu dans le code : mêmes lignes ; types `chronicle.types.ts`, `campaign.types.ts`, `player.types.ts` |
| **S3** | Secrets | Les **indices non révélés** partent aussi dans `session.clues` : la tablette ne les filtre qu'à l'affichage (`HubArchives.tsx`, `isRevealed`). | Moyenne | Lu dans le code |
| **S4** | Secrets | Une tablette peut **écrire les notes du meneur** de son personnage : `session:update-character-narrative` accepte `gmNotes` (`contratsSessionDistante.ts`, `sessionActions.ts`) et la politique ne vérifie que la propriété du personnage. Aucun écran de la tablette ne l'envoie : il faudrait forger le message. | Basse | Lu dans le code |
| **S5** | Secrets | La **fenêtre Hub et les projecteurs locaux** reçoivent **chaque** diffusion, y compris la charge **non caviardée** du meneur et de sa tablette : seule l'astrologie y est filtrée. Ces fenêtres sont à la table, devant les joueurs ; elles ne montrent que ce que leur écran affiche, mais les secrets y sont chargés. | Moyenne | Lu dans le code : `electron/main.ts`, `remote:broadcast-sync` (vers la ligne 841), qui ignore le rôle |
| **C1** | Même calcul | Le **pupitre** de Dice-OS et la **télécommande** ne touchent à aucune réserve : un jet 2d20 (Dune, Star Trek) lancé là ne paie pas ses dés achetés et ne crédite pas son Impulsion. Seul le panneau de la fiche le fait. | Moyenne — à décider | Lu dans le code : aucune référence aux réserves dans `DiceBoard.tsx` ni `RemoteDicePad.tsx` |
| **C2** | Même calcul | Le pupitre ne connaît pas le **modificateur du seuil** ni l'**opposition** (§ 149) : le seuil s'y tape déjà calculé. Dit dans le manuel. | Basse — voulu | Page `54-Jeu-Symbaroum.md` |
| **H1** | Historique | Une **modification de fiche** — par le meneur, la tablette (`session:update-character-sheet-data`) ou la fiche HTML — **ne s'inscrit nulle part** : seuls les coups et soins (`entitySlice.ts`, `addEvent` des impacts), les jets, les réserves et les gestes de table vont au journal. Qui a changé quoi, de combien, n'est pas retrouvable. | Moyenne | Lu dans le code : `updateCharacterSheetData` et `updateCharacter` n'écrivent pas au journal |

## Ce que je propose de corriger, dans cet ordre

1. **S1, S2 et S5 — les secrets du meneur sur les tablettes et les fenêtres de la table.** Retirer
   `lectureDuMeneur` de la charge des joueurs, caviarder `gmNotes` des lieux, des campagnes et des
   personnages, au même endroit que `gmSecretInfo` — une seule fonction pure de caviardage, que
   `main.ts` applique aussi aux fenêtres locales. Un essai qui construit la charge des joueurs et y
   cherche chaque secret. Le plus grave, et le plus court.
2. **S3** — n'envoyer aux joueurs que les indices révélés.
3. **S4** — refuser `gmNotes` venant d'un joueur.
4. **H1** — un journal des modifications de fiche, regroupées par personnage et par moment (un
   curseur qu'on fait glisser ne doit pas écrire dix lignes).
5. **C1** — à trancher : le pupitre doit-il payer et créditer l'Impulsion d'un jet 2d20, ou
   reste-t-il un lanceur sans fiche ?

## Limites de l'audit

Lecture du code, sans session réelle ni capture réseau : S1 à S4 et H1 ne sont **pas encore
reproduits** par un essai ; la première correction commencera par l'essai qui les montre. L'axe
des clés stables a été survolé.
