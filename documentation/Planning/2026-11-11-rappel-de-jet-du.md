# Rappel d'un jet dû par une jauge — idées reprises de GM Codex, lot 2 — spécification, 11/11/2026

> Demande de David (11/11) : « tout est testé c'est bon, on va faire le lot 2 » — le lot 2 de
> [`2026-11-11-jets-demandes-et-caches.md`](2026-11-11-jets-demandes-et-caches.md), idée 3 :
> « **Rappel d'un jet dû** : bandeau qui pulse et signal de MU/TH/UR quand le temps a passé ».
> État : **livré, à essayer par David** — T1 à T6 faits le 11/11 ; reste T7 (essai de David). Registre § 244.

## Ce qui existe (lu dans le code le 11/11)

- **Clock-OS, les jauges** (`TensionClock`, `src/store/useClockStore.ts`) : nom, segments,
  forme, couleur, **sens** (monte / s'épuise), **cachée ou vue** (`vueParLesJoueurs`, une jauge
  neuve naît secrète), sur l'afficheur Ulanzi ou non, et **un pas par scène** (`pasParScene`) qui
  la fait bouger quand le meneur termine une scène dans la trame. Le **bout qui fait mal** est
  déjà calculé (`estCritique` : le plein pour une jauge qui monte, le vide pour une qui s'épuise)
  et l'écran le fait pulser (cran « critique » de `graviteDeLaJauge`). Les jauges sont
  **globales** (pas rangées par campagne), persistées par le meneur seul (`stockageLocalDuMJ`).
  Cinq lecteurs : pupitre `ClockDashboard`, Player Hub et tablettes (`NarrativeClock`), Ulanzi,
  compte rendu de séance.
- **Aucune jauge ne dit « quand j'arrive au bout, il faut lancer ceci »**. L'usure de fin de
  scène s'annonce par un toast (`annoncerLUsureDesJauges`), rien de plus.
- **Le cockpit a déjà une place pour ce genre d'alerte** : sous le bandeau des réserves,
  `AlertesDeFranchissement` propose au meneur les seuils franchis d'un pilote (la Séquelle de NOC),
  avec **Noter / Écarter**, et une fois par passage. Le rappel en serait le voisin, pas le doublon :
  le franchissement est déclaré par le **pilote**, sur une **fiche** ; le rappel par le **meneur**,
  sur une **jauge**.
- **Le lot 1** sait demander un jet composé à un personnage (« Demander à … »), le voir revenir
  (messagerie, carte volante 5 s) et se clore.

## Le quoi

### Parcours

1. **Préparer.** Dans Clock-OS, sur les réglages d'une jauge (là où se règlent déjà le sens et le
   « pas par scène »), David écrit **ce qu'il faudra lancer** quand elle arrivera au bout :
   « Jet de Panique — tout le monde », « Test d'Endurance », « La patrouille passe : 1d6 ».
   [À TRANCHER Q1 : au bout seulement, ou aussi à chaque pas ?]
2. **En séance.** La jauge bouge — un clic, une fin de scène — et atteint le bout. Au cockpit,
   sous le bandeau, un **rappel** paraît : « ⏰ Air respirable — à vide : Jet d'Endurance, tout le
   monde ». [À TRANCHER Q3 : il pulse ? un son ? une carte volante ?]
3. **Agir.** David lance (au pupitre, ou depuis une fiche), ou **demande** le jet aux joueurs
   (lot 1) [À TRANCHER Q2], puis marque le rappel **« Fait »**. Le rappel s'éteint, et le journal
   le note. Il peut aussi l'**écarter** sans rien lancer.
4. **Le prochain passage.** La jauge redescend (ou est remise à zéro, remplie) : le rappel se
   **réarme** ; la prochaine fois qu'elle atteint le bout, il revient.

### Critères d'acceptation

- C1 · Une jauge peut porter un rappel (texte libre), réglé et effacé dans ses réglages ; une
  jauge sans rappel se comporte exactement comme hier — essai
- C2 · Au bout de la jauge (plein si elle monte, vide si elle s'épuise — la règle commune
  `estCritique`), le rappel paraît au cockpit du meneur, quel que soit le geste qui l'y a amenée
  (clic, fin de scène, remplissage) — essai
- C3 · **Une fois par passage** : il ne revient ni au rechargement ni après « Fait » / « Écarter »
  tant que la jauge reste au bout ; il se réarme quand elle en repart — essai
- C4 · « Fait » et « Écarter » l'éteignent ; « Fait » s'inscrit au journal de séance — essai
- C5 · **Rien ne part à la table** : ni tablette, ni Player Hub, ni afficheur, même pour une jauge
  vue par les joueurs [À TRANCHER Q4] — essai (le segment `clock` et `jaugesVuesParLesJoueurs`
  ne portent pas le rappel)
- C6 · Le rappel tient dans les deux régimes (atelier / table) et le texte du meneur n'est jamais
  coupé sans recours — à l'écran par David
- C7 · Manuel : page Clock-OS et page 53 (« Demander un jet ») — relu

### Hors champ

- Les **réserves de table** des pilotes (l'Impulsion de Dune) et les **franchissements** de fiche :
  autres objets, déjà servis.
- Un rappel **par temps de jeu écoulé** (« toutes les 6 heures du calendrier ») [À TRANCHER Q1].
- Le **jet composé** porté par la jauge (choisir des champs de fiche à l'avance) [À TRANCHER Q2].
- Rien de propre à un jeu : la fonction est commune aux dix-sept pilotes.

### Ce que David garde

- Le rappel est un champ de la jauge : il vit, se sauvegarde et se restaure **avec elle**
  (persistance du meneur, sauvegarde automatique). Une jauge d'hier, sans le champ, ne change pas.
- Le journal garde « Fait ».

## Décisions

- 11/11 — David, Q1 (déclencheur) : « **Au bout seulement** » → la règle commune `estCritique`
  (plein si elle monte, vide si elle s'épuise), une fois par passage. Ni à chaque pas, ni par temps
  de jeu écoulé (hors champ).
- 11/11 — David, Q2 (contenu) : « **Un texte libre** » → pas de jet composé porté par la jauge ;
  le meneur lance ou demande lui-même (lot 1 existant), puis « Fait ». Commun aux dix-sept
  pilotes, sans réglage par jeu.
- 11/11 — David, Q3 (signal) : « **Bandeau + carte 5 s** » → une ligne au cockpit qui pulse
  jusqu'à « Fait » / « Écarter », et la carte volante de 5 s du lot 1 ; **pas de son**.
- 11/11 — David, Q4 (table) : « **Rien** » → le rappel ne quitte pas le meneur ; ni Ulanzi, ni
  MU/TH/UR, ni tablette (l'idée « signal MU/TH/UR » de GM Codex n'est pas reprise).
- Habillage : celui qui existe — la ligne reprend `AlertesDeFranchissement` (son voisin au cockpit),
  la carte reprend la carte volante du lot 1 (choisie par David le 11/11). **Pas de maquette Stitch**
  : aucun écran ni section neuve, un champ dans un menu de réglages existant et deux éléments
  repris. *Si David préfère une maquette pour la ligne du cockpit, T5 attend.*

## Le comment

### Fichiers et réutilisation

- `src/store/useClockStore.ts` — `TensionClock.rappel?: { texte: string; traite?: boolean }`
  (absent = comme hier) ; actions `reglerLeRappel(id, texte | null)` et
  `traiterLeRappel(id, 'fait' | 'ecarte')` ; `jaugesVuesParLesJoueurs` **retire `rappel`** (C5) ;
  **un abonnement** au magasin réarme les rappels (voir Données).
- `src/modules/clock/logic/rappelDeLaJauge.ts` (neuf, pur) — `rappelsEnAttente(tensions)` (texte
  non vide, `estCritique`, pas traité), `rearmerLesRappels(tensions)` (traité mais plus au bout →
  réarmé ; **rend le même tableau** si rien ne change, sans quoi l'abonnement bouclerait),
  `texteDuRappel` (rogné, 200 caractères au plus). Réutilise `estCritique` de `sensDeLaJauge.ts`.
- `src/modules/clock/components/CarteDeJauge.tsx` — dans le menu des réglages, un champ « Au bout,
  rappeler : … » (texte, effaçable). Clés i18n `clock.rappel_*` dans `locales/{fr,en}/modules.json`.
- `src/modules/clock/components/RappelsDesJauges.tsx` (neuf) — la ligne du cockpit, une par rappel
  en attente : « ⏰ <jauge> — <au bout / à vide> : <texte> », qui pulse ; **Fait** (journal) et
  **Écarter**. Habillage de `AlertesDeFranchissement`.
- `src/modules/session/SessionDashboard.tsx` — monte `RappelsDesJauges` sous les alertes de
  franchissement, **pour tous les jeux** (pas sous condition du pilote).
- Carte volante : extraire de `ResultatsDesDemandesVolants.tsx` une `CarteVolante` commune
  (en-tête, ✕, barre des 5 s, effacement) ; `RappelsVolants` s'en sert, monté dans la même colonne
  de `MessageAlertOverlay`. Un rappel **déjà en attente à l'ouverture** n'ouvre pas de carte (il est
  au cockpit).
- Journal : « Fait » → `useJournalStore.addEvent({ type: 'SYSTEM', title: 'Rappel — <jauge>', content: texte })`,
  comme « Noter » d'un franchissement.

### Données : qui lit, qui écrit

- `tensions` a **une douzaine d'écrivains** dans le magasin (clic ±, remplir, remettre à zéro, sens,
  fin de scène `laSceneSeTermine`…), plus **deux du dehors** : la synchronisation entre fenêtres
  (`CrossWindowEventService`, `setState` reçu) et la **restauration d'une séance**
  (`SessionService`, `useClockStore.setState(data.modules.clock)`). Réarmer dans chaque action en
  oublierait une : le réarmement vit **dans un seul abonnement** (`useClockStore.subscribe`), qui
  voit tous les chemins. Idempotent et convergent : il n'écrit que si un rappel traité n'est plus au
  bout, et `rearmerLesRappels` rend le même tableau sinon.
- `rappel` voyage avec la jauge : persistance du meneur (`stockageLocalDuMJ`), sauvegarde de
  séance (`modules.clock`), synchronisation entre fenêtres. **Il ne part pas aux tablettes** :
  `segmentDesHorloges` passe par `jaugesVuesParLesJoueurs`, qui le retire. L'Ulanzi
  (`horlogesPourLaTable`) ne recopie que ses champs. Le Player Hub (fenêtre du meneur) ne l'affiche
  pas.
- Lecteurs de la jauge (cinq, mémoire Clock-OS) : aucun ne lit `rappel` hors du cockpit, du réglage
  et de la carte.

### Risques GM-OS (cochés)

- [x] Fenêtres multiples : l'abonnement tourne aussi dans le Hub et le projecteur ; il y écrit la
  même chose que chez le meneur (convergent), et leur persistance est déjà bloquée
  (`stockageLocalDuMJ`). Le bandeau et la carte ne sont montés que chez le meneur.
- [x] Chemin de données : rien dans `electron/`.
- [x] Tablettes : rien de neuf n'y part (C5).
- [x] Les deux ports : non concerné.
- [x] Textes : clés i18n fr/en vérifiées par un essai ; la ligne dans les deux régimes (C6, à l'écran).
- [x] Échap et surcouches : ni modale ni surcouche (la carte n'est pas modale).

### Écran : prompt Stitch

- Aucun (décision ci-dessus : habillages existants).

### Essais

- `npx vitest run --maxWorkers=4 src/modules/clock src/modules/remote src/modules/session src/modules/dice`
  puis la suite complète ; `npx tsc -b` ; eslint sur les fichiers touchés. Depuis PowerShell en
  `C:\` (vitest échoue depuis `c:/`).

## Tâches

- [x] T1 · Le rappel, pur : `rappelsEnAttente`, `rearmerLesRappels`, `texteDuRappel` —
      `src/modules/clock/logic/rappelDeLaJauge.ts` · couvre C1, C2, C3 · essai :
      `rappelDeLaJauge.test.ts` (au bout dans les deux sens, une fois par passage, réarmement, même
      tableau rendu quand rien ne change, texte vide = pas de rappel) · touche src/ ⛔
- [x] T2 · Le magasin : champ `rappel`, `reglerLeRappel`, `traiterLeRappel` (« Fait » au journal),
      abonnement de réarmement ; `jaugesVuesParLesJoueurs` retire le rappel — `useClockStore.ts` ·
      couvre C1 à C5 · essai : `rappelDesJauges.test.ts` (bout atteint par clic, fin de scène,
      remplissage, `setState` d'une restauration ; réarmement par chacun ; segment des horloges sans
      `rappel`) · touche src/ ⛔
- [x] T3 · Le réglage dans la carte de la jauge + i18n fr/en — `CarteDeJauge.tsx`, `modules.json` ·
      couvre C1, C6 · essai : rendu (saisir, effacer) · touche src/ ⛔ · à essayer par David
- [x] T4 · La ligne du cockpit, qui pulse, « Fait » / « Écarter » — `RappelsDesJauges.tsx`,
      `SessionDashboard.tsx` · couvre C2, C4, C6 · essai : rendu (paraît au bout, Fait écrit le
      journal et l'éteint, Écarter l'éteint sans journal, revient au passage suivant) · touche src/ ⛔
      · à essayer par David
- [x] T5 · La carte volante 5 s — `CarteVolante` extraite, `RappelsVolants` dans la colonne de
      `MessageAlertOverlay` · couvre C2 · essai : paraît quand un rappel s'allume, s'efface à 5 s,
      rien pour un rappel déjà en attente à l'ouverture ; les essais de `ResultatsDesDemandesVolants`
      passent toujours · touche src/ ⛔ · à essayer par David
- [x] T6 · Manuel (page 36 Clock-OS, renvoi page 53), registre, synthèse des pilotes (ligne commune)
      — couvre C7 · essai : `electron/guidesDuManuel.test.ts`
- [ ] T7 · Essai de David : une jauge « Air respirable » qui s'épuise, rappel « Jet d'Endurance »,
      la vider ; la ligne et la carte ; Fait ; la remplir puis la revider — à essayer par David

## Réalisation (11/11)

- T1 · `rappelDeLaJauge.ts` — `rappelDeLaJauge.test.ts`, 8 réussis.
- T2 · `useClockStore.ts` : champ `rappel`, `reglerLeRappel`, `traiterLeRappel`, abonnement de
  réarmement (un seul, tous écrivains compris), `jaugesVuesParLesJoueurs` retire le rappel —
  `rappelDesJauges.test.ts` (clic, fin de scène, remplissage, `setState` du dehors, segment des
  tablettes sans rappel).
- T3 · `CarteDeJauge.tsx` : champ « Au bout, rappeler » (écrit en quittant le champ ou par Entrée,
  pour ne pas rogner l'espace tapé), mention ⏰ sur la carte ; clés `clock.rappel_*` fr/en —
  `rappelDansLaCarte.test.tsx`, 3 réussis.
- T4 · `RappelsDesJauges.tsx` monté dans `SessionDashboard` pour tous les jeux ; « Fait » au journal
  (`SYSTEM`, « Rappel — <jauge> ») — `rappelsAuCockpit.test.tsx`, 3 réussis.
- T5 · `CarteVolante` (`src/components/`) et `useCartesEphemeres` (`src/hooks/`) extraits de la carte
  du lot 1 ; `RappelsVolants` dans la colonne de `MessageAlertOverlay` — `rappelsVolants.test.tsx`,
  3 réussis ; ceux de `ResultatsDesDemandesVolants` passent toujours.
- T6 · Manuel page 36 (« Au bout, rappeler », une ligne de dépannage), renvoi page 53 ; registre
  § 244 ; synthèse des pilotes.
- Vérifié : suite complète **884 fichiers / 10 380 réussis**, `npx tsc -b`, eslint sur les fichiers
  touchés (PowerShell, `C:\`).

- **Essai de David (11/11) : « je ne vois pas de Fait pour cliquer ».** Il avait vidé la jauge dans
  **Clock-OS** ; la ligne au **Fait** ne vivait qu'au **Tableau de bord** (`SessionDashboard`), un autre
  module — il n'a vu que la carte volante, sans bouton. *Trou du plan : le rappel doit se traiter là
  où est la jauge.* Correctif : une réponse unique (`logic/repondreAuRappel.ts`) et ses boutons
  (`BoutonsDuRappel`) aux **trois** endroits — la ligne du cockpit, **la carte de la jauge dans
  Clock-OS** (au bout, le rappel en clair avec Fait / Écarter, icône qui pulse) et **la carte volante**
  (qui se ferme à la réponse). Répondre à l'un éteint les autres. Essais ajoutés :
  `rappelDansLaCarte.test.tsx` (Fait, Écarter sur la carte), `rappelsVolants.test.tsx` (Fait sur la
  carte volante) ; `clock`, `session`, résultats volants : 224 fichiers, 2 171 réussis — l'unique échec,
  `PanneauDeJet.shadowrun.test.tsx`, est l'instabilité connue sous charge (registre § 242) et passe seul
  (9/9) ; `tsc -b`, eslint.

## Analyse

- 11/11 — relecture croisée :
  1. C1 (T1, T2, T3), C2 (T1, T2, T4, T5), C3 (T1, T2), C4 (T2, T4), C5 (T2), C6 (T3, T4, à
     l'écran), C7 (T6). **Aucun critère sans tâche.**
  2. Aucune tâche sans critère (T7 est l'essai de David des C2, C4, C6).
  3. Aucune contradiction avec les décisions lues : drapeaux des jauges (« le drapeau choisit
     lesquelles, l'interrupteur décide si » — le rappel n'en est pas un), filtre unique vers la table
     (on l'étend, on ne le double pas), usure de fin de scène (on ne la touche pas : le rappel la
     lit après coup). AGENTS.md : pas de branche, pas de paquet, pas de git qui écrit sans demande.
  4. Aucun `[À TRANCHER]` restant ; une réserve de forme (Stitch pour la ligne du cockpit) signalée
     à David.
  5. `git status` : aucun fichier du plan modifié ailleurs ; seul ce document est neuf.
- Écart relevé, **hors chantier** : le Player Hub et l'Ulanzi ne passent pas par
  `jaugesVuesParLesJoueurs` (l'Ulanzi a son propre filtre `horlogesPourLaTable`) — rien à corriger
  ici, mais le commentaire « une seule fonction pour quatre chemins » de `useClockStore.ts` est
  inexact ; à vérifier avant de s'y fier.
