# Combat-OS — le jet des adversaires et le calcul des dégâts — spécification, 19/11/2026

> Demande de David (19/11) : « j'aimerais que l'on travaille un peu mieux l'ergonomie surtout du
> module Combat-OS », puis : « ce qui me gêne le plus c'est les lancer de dés des PNJ/Créatures,
> les calculs des dégâts, ce n'est pas toujours intuitif, je ne veux pas changer complètement
> l'interface, mais surtout faire en sorte que cela soit plus fluide ». Jeux visés : « Blade
> Runner, Dune, Alien et Cthulhu Hack ».
> État : **livré, à essayer par David** — T0 à T22 faits le 19/11 ; T19 : quatre pilotes
> validés, captures finales relues, manuels à jour, rien d'autre à réimporter. Historique :
> T0 à T9, T20, T21 et T22 faits le 19/11, plus la couleur `primary` de la
> carte et Dune sans « Calculer » ni console ; **Blade Runner complet** (pilote 2.1.0 à réimporter,
> « Attaquer ») ; **Alien complet** (T10 à T12 : créatures et humains, coups préparés sur la
> cible) ; Cthulhu Hack : T13 fait (bestiaire relu, fiche de corpus), ordre du 20 naturel
> tranché (D5 : les dégâts doublés, puis l'Armure), **Cthulhu Hack complet** (T14 à T17 :
> pilote 1.2.0, 22 adversaires, « Riposte », Armure des adversaires) ; **Blade Runner 2.1.0 et
> Cthulhu Hack 1.2.0 réimportés par David le 19/11** ; **Dune complet** (T18 : « Attaquer », test
> du PNJ, attaque Dune sur la cible) ; reste T19 (livraison, validation finale des quatre
> pilotes). Registre § 263.

## Ce qui existe — lu dans le code et les pilotes le 19/11

*Pilotes lus : `Export Dirvers/corriges/Alien-1.11.0`, `Export Dirvers/Blade Runner_driver_gmos_1794393351317`,
`Export Dirvers/Dune_driver_gmos_1794393367137`, `output/campagnes-tests/cthulhu-hack/Cthulhu-Hack-1.1.0`.
À recouper avec les pilotes installés chez David avant de coder.*

### Pour tous les jeux

- **Le jet d'un adversaire n'a pas de porte sur sa carte.** Seul Vampire lance un test pour un
  adversaire, et seulement dans la fenêtre « Fiche » (`combat/logic/jetDuCombattant.ts`,
  réservé à `jet.vampire`). L'Appel de Cthulhu a son panneau à part. Pour les quatre jeux visés,
  le meneur doit passer par Dice-OS puis revenir à Combat-OS.
- **Il y a deux portes pour les dégâts, et elles ne font pas la même chose.**
  - « Dégâts » sur la carte (`session/components/health/HealthManager.tsx:533`) part d'une
    intensité réglée par − et +, et **ignore le dernier jet**.
  - « Calculer » (`combat/components/DamageCalculator.tsx`) reprend le dernier jet, mais :
    - il **coche aussi l'attaquant** : `CombatCard.tsx:572` envoie `[attaquant, cible]`, si bien
      que valider sans décocher fait encaisser les deux ;
    - il reprend **le total brut** : après un jet à réserve (Alien, Blade Runner),
      `DiceEngine.rollYZE` met **le nombre de succès** dans `total`. « Dernier jet : 2 » vaut
      donc 2 dégâts, alors que la règle donne *dégâts de l'arme + 1 par succès au-delà du
      premier*.
- **Le code sait déjà tirer une table du jeu** (`pont.loadTable`, dans
  `HorsJeuDuCombattant.tsx:48` et `dice/suitesDuJetDeFiche.ts:176`).

### Par jeu

| Jeu | Qui lance pour l'adversaire (livre) | Dégâts (livre) | Ce que porte le pilote | Ce qui manque |
|---|---|---|---|---|
| **Alien** | Le meneur. Une créature tire sur **sa table d'attaques** (d6) ; un humain lance comme un PJ | Ceux de l'attaque tirée, ou arme + succès en plus | Bestiaire de 52 créatures, dont 37 avec attaques (table ou lignes « 1-2 · Impact · effet ») ; catalogue d'armes (bonus, dégâts) | Les attaques ne sont que du texte dans les notes (`invocationDeRencontre.ts:105`), et rien ne se tire depuis la carte |
| **Blade Runner** | Le meneur, avec les mêmes règles que pour un PJ (« bestiaire-et-adversaires », corpus) | Dégâts de base de l'arme + 1 par succès au-delà du premier (« degats-et-types-de-degats ») ; la cible lance ensuite sa protection | Bestiaire de 13 adversaires et catalogue d'armes (dégâts, dé de critique) | ⚠️ **Les colonnes du bestiaire ne sont reliées à aucun champ de la fiche** (`vig` n'alimente pas `vigueur`, ni `armes-a-feu` `armesAFeu`). Un adversaire du livre arrive avec ses valeurs dans les notes seulement, et il n'y a rien à lancer. Même défaut que Vampire avant le § 262 ; l'export date d'avant le contrôle `bestiaire.colonnes` de la Forge (17/11) |
| **Cthulhu Hack** | **Personne** : le meneur ne lance jamais. Le joueur fait une Sauvegarde, modifiée par le *Malus au toucher* de l'adversaire | Le PJ touche : il lance son dé de Dégâts, moins l'Armure de l'adversaire. Le PJ échoue : il subit **les dégâts fixes de l'adversaire**, doublés sur un 20 naturel, moins son Armure | Pas de bestiaire. Le livre donne pourtant des profils prêts (« Dés de Vie 3 · PV 14 · Armure 1 · Malus −2 · Revolver (4 dégâts), Matraque (2 dégâts) ×2 », p. 50 du texte extrait, à recaler sur le PDF) | Aucun endroit pour les dégâts fixes ni le Malus au toucher d'un adversaire, et aucun geste « l'adversaire riposte » |
| **Dune** | Le meneur lance pour un PNJ (2d20 sous compétence + mobile) | Pas de points de vie : une attaque réussie fait avancer **la Défaite** (`AttaqueDune`, `DefaiteDune`) | Pas de bestiaire ; la santé est en jauges (`clocks`) | `AttaqueDune` (un formulaire de 7 champs) n'apparaît **qu'après le jet d'un joueur** (`DuneAuJet.tsx:80`). Un PNJ qui attaque n'a ni jet ni formulaire pré-rempli |

## Le quoi

### Parcours

1. **Alien — un xénomorphe attaque.** Sur la carte du Biodrone, David clique « Attaquer ». Sa
   table d'attaques est tirée et l'attaque s'affiche : nom, effet, dés et dégâts s'il y en a. Le
   coup part sur la cible de la carte, avec ses dégâts et l'armure de la cible. Un humain
   (marine, colon) attaque comme en Blade Runner : arme, jet, dégâts.
2. **Blade Runner — un agent du LAPD tire.** Sur sa carte, David clique « Attaquer » et choisit
   l'arme, parmi celles de l'adversaire ou du catalogue. La réserve (AGI + Armes à feu) est
   lancée. S'il y a des succès, les dégâts proposés valent arme + succès − 1. La cible lance sa
   protection, ce qui existe déjà, puis le coup s'applique.
3. **Cthulhu Hack — un cultiste riposte.** Le joueur rate sa Sauvegarde. Sur la carte du
   cultiste, David clique « Riposte » et choisit l'attaque (Revolver, 4). Le PJ ciblé perd
   4 − son Armure, ou le double sur un 20 naturel. **Dans l'autre sens**, le joueur touche et
   annonce son dé de Dégâts. David l'applique d'un clic, moins l'Armure du cultiste.
4. **Dune — un soldat Harkonnen attaque.** Sur sa carte, David clique « Attaquer », et le test
   2d20 du PNJ se lance. Si l'attaque réussit, « Appliquer cette attaque » s'ouvre avec la
   cible de la carte déjà remplie.
5. **Pour tous les jeux.** « Calculer » ne frappe plus l'attaquant par erreur. « Dernier jet »
   propose des **dégâts**, et non un nombre de succès.

### Critères d'acceptation

- C1 · Depuis la carte d'un combattant qui a une cible, « Calculer » ouvre avec **la cible
  seule** cochée ; sans cible, avec le porteur seul — essai
- C2 · Après un jet à réserve (Alien, Blade Runner), « Dernier jet » ne propose pas le nombre de
  succès comme dégâts. Il propose arme + succès − 1 quand l'arme est connue, et rien sinon, en
  disant pourquoi — essai
- C3 · Alien : « Attaquer » sur une créature qui a une table ou des lignes d'attaques tire le d6
  et affiche l'attaque obtenue (nom, effet). Le tirage est consigné au journal du jet — essai
- C4 · Alien et Blade Runner : « Attaquer » sur un adversaire lance la réserve de l'arme choisie
  avec les valeurs de sa fiche, et le coup s'applique à la cible de la carte en un geste — essai
  et à l'écran par David
- C5 · Blade Runner : un adversaire posé depuis l'onglet « Livre » entre avec VIG, AGI, INT, EMP
  et ses compétences **dans les champs de la fiche**, pas seulement dans les notes. C'est une
  correction du pilote, vérifiée par `verifier_pilote` ou l'équivalent — essai
- C6 · Cthulhu Hack : un adversaire porte ses attaques à dégâts fixes, son Armure et son Malus au
  toucher. « Riposte » applique au PJ ciblé les dégâts fixes moins son Armure, doublés sur un
  20 naturel — essai
- C7 · Cthulhu Hack : les dégâts d'un PJ sur un adversaire retirent l'Armure de l'adversaire —
  essai
- C8 · Dune : « Attaquer » sur un PNJ lance son test 2d20 ; une réussite ouvre « Appliquer cette
  attaque » avec la cible déjà choisie — essai + à l'écran par David
- C9 · Aucun de ces gestes n'écrit deux fois la même santé : un seul écrivain, celui qui existe
  (`applyDamage` / `storeApplyImpact` / `ecrireLaFicheDuCombattant`) — essai
- C10 · La carte ne gagne **qu'un bouton** (« Attaquer » ou « Riposte »). Rien d'autre ne bouge
  sur la carte d'un jeu que le chantier ne vise pas — à l'écran par David, plus une capture
  avant/après

### Hors champ

- Refaire l'interface de la carte ou du calculateur (demande de David : « je ne veux pas changer
  complètement l'interface »).
- Les jeux autres que ces quatre. Vampire et L'Appel de Cthulhu ont déjà leur jet d'adversaire.
- Les jets des joueurs sur leur fiche ou leur tablette : ils restent où ils sont.
- Le conseil tactique de l'IA (Cortex) sur la carte.
- Le calculateur qui ne répartit pas les blessures d'un PJ chez Degenesis : constat du 06/11,
  déjà au § 1 bis.

### Ce que David garde

- Les dégâts appliqués s'écrivent par les chemins existants : fiche de campagne pour un PJ ou un
  PNJ rattaché, plateau sinon. Ils survivent donc au redémarrage, à l'export `.gmos` et à la
  sauvegarde automatique comme aujourd'hui.
- Les profils d'adversaires (bestiaire Blade Runner corrigé, bestiaire Cthulhu Hack) vivent
  **dans le pilote** : il faut les réimporter (`Export Dirvers/corriges/`), avec « Remplacer ».
- La dernière arme ou attaque de chaque adversaire (décision D4) est gardée **sur le combattant
  du plateau**, dans le stockage du combat (`gmos-combat-storage`). Elle survit au redémarrage
  et disparaît avec le combattant.

## Décisions

- 19/11 — D1 · David : « Correctifs communs d'abord » → lot 1 (« Calculer », « Dernier jet »),
  puis un jeu à la fois.
- 19/11 — D2 · David : « Fenêtre Fiche, ouverte sur le jet » → aucun écran neuf, donc pas de
  maquette Stitch. La carte gagne un bouton, qui ouvre la fenêtre existante directement sur le
  jet, avec l'arme et la cible remplies.
- 19/11 — D3 · David : « Oui, les deux » → le chantier corrige le bestiaire Blade Runner
  (colonnes reliées à la fiche) et crée celui de Cthulhu Hack (profils du livre). Les deux
  pilotes sont livrés dans `Export Dirvers/corriges/`.
- 19/11 — D4 · David : « Oui, retenue sur le combattant » → « Attaquer » propose d'emblée la
  dernière arme ou attaque.
- 19/11, après le lot 1 — David :
  - essai à l'écran de « Calculer » et « Dernier jet » : « c'est OK » ;
  - versions installées : « Ils sont exportés » → les pilotes installés sont les exports du
    dépôt lus en T0 (Alien 1.11.0, Blade Runner et Dune `…_driver_gmos_179439…`, Cthulhu Hack
    1.1.0) ; T8 et T15 partent de ceux-là ;
  - la double santé du Rôdeur : « Oui » → tâche T20 ajoutée ;
  - la couleur `primary` sur la carte : « Oui » → corrigée le 19/11 (voir T3 et le § 1 bis du
    registre), hors de la règle « un seul bouton » (C10) puisqu'elle ne fait que rendre visible
    ce qui existait.
- 19/11, après T13 — D5 · David : « c'est d'abord les dégâts puis l'armure » → sur un 20 naturel
  de Cthulhu Hack, le PJ subit 2 × dégâts fixes, puis son Armure se retire (Revolver 4 contre 1 PA
  : 7, pas 6). Corrige `riposteDeCthulhuHack` (T3 doublait après l'Armure), la fiche
  `degres-de-reussite-et-critiques.md` et la fiche du bestiaire ; vaut pour T16.

## Le comment

### Fichiers et réutilisation

*Chemins relatifs à `src/modules/`, sauf mention contraire.*

| Fichier | Ce qui change | Ce qu'on réutilise |
|---|---|---|
| `combat/components/CombatCard.tsx` | l. 571-575 : `ids` = la cible seule, ou le porteur seul sans cible. Un bouton « Attaquer » (« Riposte » pour Cthulhu Hack) près de « Fiche », visible seulement quand le jeu l'autorise | `Bouton`, `gmCustom('fiche-combattant', …)` |
| `combat/components/DamageCalculator.tsx` | l. 31-36 et 98-105 : un jet à réserve (`successes` présent) ne remplit plus le montant. La pastille dit « N succès — les dégâts dépendent de l'arme » | `RollResult.successes` |
| `combat/logic/jetDuCombattant.ts` | `jetDuCombattantPossible` ouvert à Alien, Blade Runner et Dune, **chacun après vérification** de ce que `PanneauDeJet` suppose d'un personnage (règle écrite en tête du fichier) | — |
| `combat/components/FicheDuCombattant.tsx`, `JetDuCombattant.tsx` | La fenêtre s'ouvre sur le jet (`{ combatantId, ouvrirSur: 'jet' }`) : jet en tête, arme et cible remplies. Un bouton « Appliquer à [cible] » une fois les dégâts connus | `PanneauDeJet`, `ecrireLaFicheDuCombattant` |
| `combat/types.ts` | `Combatant.derniereAttaque?: { id: string; libelle: string }` (D4) | Persistance existante `gmos-combat-storage` |
| `combat/logic/invocationDeRencontre.ts` | Rien ne change pour les notes. On relit `origineDuLivre.creatureId` pour retrouver les attaques de la créature dans le bestiaire | `exemplairesDeLaCreature` |
| `combat/logic/attaqueDeLAdversaire.ts` (**nouveau**) | Logique pure : tirer une ligne d'attaque (d6 contre « 1-2 »), lire « N dés de base, Dégâts M », calculer arme + succès − 1, et la riposte Cthulhu Hack (fixe − Armure, ×2 sur un 20) | `pont.loadTable` (déjà employé par `HorsJeuDuCombattant.tsx:48`) |
| `types/drivers.ts`, `bestiaire/bestiaire.ts` | `LigneDAttaque.degats?: number` et `fois?: number` (« ×2 »), plus leur contrôle | Contrôle existant des lignes (`bestiaire.ts:87`) |
| `combat/components/ConflitDune.tsx` | `AttaqueDune` reçoit `cibleInitiale` | `AttaqueDune`, `ecrireDefaiteDune` |
| `outils/blade-runner/`, `outils/cthulhu-hack/` (**scripts neufs**) | Bestiaire relié (Blade Runner) ; bestiaire créé depuis le livre (Cthulhu Hack) | `finir_blade_runner.py` (format), contrôle Forge `bestiaire.colonnes` (17/11) |

### Données : qui lit, qui écrit

- **La santé** a un seul écrivain par cas, et il existe déjà : `useCombatStore.applyDamage`
  (l. 1478, branches Torg, COC, Alien, Vampire, Degenesis, puis le cas commun) pour le plateau,
  `storeApplyImpact` / `handleApplyImpact` pour une fiche de campagne. Le nouveau geste
  **appelle** `applyDamage` et n'écrit jamais la santé lui-même (C9). À vérifier en T4 avec le
  skill `auditer-un-parcours` : la branche Alien ne transmet qu'androïdes et xénomorphes, et le
  cas commun applique `calculateDamageImpact`. Un humain d'Alien passe-t-il deux fois ?
- **`derniereAttaque`** n'a qu'un écrivain, le bouton « Attaquer » ; seule la fenêtre de jet la
  lit. `syncCombatantToSession` ne doit pas la recopier sur la fiche de campagne : c'est à
  vérifier en T6.
- **Le bestiaire** vient du pilote, et ce chantier ne l'écrit qu'à travers les scripts de
  `outils/`, en lecture seule dans l'application.

### Risques GM-OS

- [x] Fenêtres multiples : le jet se fait chez le meneur. `ecritureReserveeAuMJ` couvre déjà le
  magasin du combat. Rien de neuf côté hub ou projecteur.
- [x] Chemin de données : aucun module de `electron/` n'est touché.
- [x] Tablettes : sans objet. Les jets des joueurs restent sur leur tablette (hors champ).
- [x] Les deux ports : sans objet.
- [ ] Textes : nouveaux libellés (« Attaquer », « Riposte », « Appliquer à … ») en clés i18n
  présentes ; tailles vérifiées dans les deux régimes (`useRegimeDInterface`) — T5, T16.
- [x] Échap : la fenêtre « Fiche » passe déjà par `ModalProvider` et le registre des surcouches.
- [x] Écran neuf : aucun (D2). Un bouton ajouté à la carte ne demande pas Stitch. Les captures
  avant/après restent prévues (T0, T19).

### Essais

- `npx vitest run --maxWorkers=4 <fichiers>` (PowerShell, `C:\`), `npx tsc -b`,
  `npx eslint <fichiers>`.
- Pilotes : le script de chaque pilote, puis `controlerLePilote` (contrôle `bestiaire.colonnes`)
  sans constat.
- Captures avant/après de Combat-OS pour les quatre jeux (`e2e/capturesDesJeux.spec.ts`,
  `GMOS_PILOTES_DES_JEUX` + `--grep`), après `npm run build`, images relues.

## Tâches

### Lot 0 — point de départ

- [x] T0 · Captures « avant » de Combat-OS pour les quatre jeux — couvre C10 · ne touche pas src/
      — **fait le 19/11.** Nouvelle capture `e2e/combatDesAdversaires.spec.ts` (instance
      jetable, sortie hors du dépôt, relevés dans `constats.json`) :
      `GMOS_PILOTES_COMBAT=<4 exports> GMOS_SORTIE_COMBAT=<scratchpad>/captures-avant npx
      playwright test e2e/combatDesAdversaires.spec.ts` → 4 réussis. Relevé :
      « Calculer » coche **l'attaquant et la cible** dans les quatre jeux ; après « 2 Succès »,
      montant **2** ; aucun jet dans la fiche d'un adversaire ; l'Agent du LAPD entre **fiche
      vide** (`{}`, valeurs dans les notes). Trouvé en plus à l'image :
      - les cases cochées et le type de dégâts choisi étaient **invisibles** : `bg-primary`,
        `border-primary`, `text-primary` n'existent pas dans `tailwind.config.js` (seul
        `accent` est défini) ;
      - la carte du Rôdeur (Alien) affiche « Points de vie 10/10 » au-dessus de « Santé
        xénomorphe : 6/6 » → question posée à David.
      Les versions installées chez David sont ces exports (sa réponse du 19/11, Décisions).

### Lot 1 — correctifs communs (D1)

- [x] T1 · « Calculer » ne coche que la cible, ou le porteur sans cible — couvre C1 · touche
      src/ ⛔ — **fait le 19/11** (« gm-os est fermé »). `combat/logic/calculateurDeDegats.ts`
      (`ciblesDuCalculateur`), appelé par `CombatCard.tsx`. Les lignes de cible du calculateur
      deviennent des cases à cocher (`role="checkbox"`, `aria-checked`, Espace / Entrée), et les
      classes `primary` du calculateur, inexistantes, deviennent `accent`. Essais :
      `calculateurDeDegats.test.ts` (3 cas) et `DamageCalculator.test.tsx` (« les cibles du
      calculateur ») ; à l'écran (capture « après »), une seule cible cochée dans les quatre jeux.
- [x] T2 · « Dernier jet » : un jet à réserve ne remplit plus le montant, et la pastille dit
      pourquoi — couvre C2 · touche src/ ⛔ — **fait le 19/11.** `DiceEngine.rollYZE` et
      `rollYZEEchelonne` marquent leur résultat `compte: 'reussites'` (champ facultatif, absent
      sur tout autre jet) ; `degatsDuDernierJet` le refuse ; la pastille devient « DERNIER JET :
      2 SUCCÈS », non cliquable, avec une infobulle (clés `last_roll_successes` et `_hint` en
      fr/en). Essais : `calculateurDeDegats.test.ts` (3 cas, dont `rollYZE` réel) et
      `DamageCalculator.test.tsx` (montant inchangé, pastille). À l'écran : montant 10 après
      « 2 Succès », pastille lisible.
      **Vérifié** : `npx vitest run --maxWorkers=4 src/modules/combat src/modules/session/components/health`
      (74 fichiers, 573 essais) et `… src/modules/dice` plus les deux fichiers (88 fichiers,
      1 239 essais) ; `npx tsc -b` ; eslint des fichiers touchés ; `npm run build` puis
      capture « après » (4 réussis).

### Lot 2 — la porte « Attaquer » (D2, D4)

- [x] T3 · Logique pure `combat/logic/attaqueDeLAdversaire.ts` : ligne d'attaque tirée au d6,
      « N dés de base, Dégâts M » lus, arme + succès − 1, riposte fixe − Armure ×2 — couvre
      C2, C3, C6 · essai : `attaqueDeLAdversaire.test.ts` (nouveau) · touche src/ ⛔ — **fait le
      19/11** (« GM-OS est fermé », redit après la compaction). Quatre fonctions, sans dé ni
      écriture :
      - `tirerLAttaque(lignes, de)` / `attaqueDesEntrees(entrees, de)` : réutilisent
        `entreesDesLignes` (le tirage existant de `XenomorpheAlien.tsx`). Un dé qu'aucune ligne
        ne couvre rend `null`, au lieu du repli de `entreeDeLaTable` sur la première ou la
        dernière ligne, qui convient à la Panique mais tirerait en silence une autre attaque.
      - `lireLaReserveDeLAttaque(effet)` : « neuf dés de base, Dégâts 2 », « Dégâts de 1 »,
        nombres en lettres jusqu'à vingt ou en chiffres ; seule la première attaque de l'effet
        compte (une attaque bonus ne prête pas ses dégâts) ; signale `perforant` (« perforant »,
        « perce-armure ») et `oppose` (« test / jet opposé »).
      - `degatsDuCoup(arme, reussites)` : arme + réussites − 1 ; 0 sans réussite ; `null` si
        l'arme est inconnue (C2 : « rien sinon »). Règle lue dans les deux corpus (Blade Runner
        « RÉUSSITES MULTIPLES », Alien « dégâts de base de l'arme plus un par réussite
        supplémentaire »).
      - `riposteDeCthulhuHack(fixes, protection, vingtNaturel)` : fixes − protection ; sur un 20,
        **corrigé le 19/11 après T13 (décision D5)** : 2 × fixes − protection (T3 doublait après
        la protection, d'après une fiche de corpus fausse).
      Essais : `attaqueDeLAdversaire.test.ts` (18 cas, libellés réels du bestiaire). Balayage
      des **82 lignes d'attaques** du pilote Alien 1.11.0 : les 50 qui lancent une réserve sont
      lues juste (dés, dégâts, perforant, opposé), les 32 autres (Panique, fuite, renforts)
      rendent `null` ; aucun trou du d6.
      **Vérifié** : `npx vitest run --maxWorkers=4 src/modules/combat src/modules/session/components/health`
      (76 fichiers, 594 essais) ; `npx tsc -b` ; eslint des fichiers touchés.
- [x] T4 · Audit du parcours des dégâts pour les quatre jeux (`applyDamage`,
      `storeApplyImpact`), avec le skill `auditer-un-parcours`, consigné dans ce document — couvre
      C9 · essai : constat écrit, ou un test qui épingle un double écrivain trouvé · ne touche
      pas src/ (sauf correctif décidé avec David) — **fait le 19/11**, voir « Audit T4 » ci-dessous.
      Rien de corrigé : les correctifs attendent l'accord de David.

#### Audit T4 — le parcours des dégâts (19/11/2026)

**Les deux portes.** Un coup arrive par deux chemins :

- **la console de santé** de la carte (`HealthManager`, boutons Dégâts / Soins, « → cible ») :
  `storeApplyImpact` = `handleApplyImpact` (`entitySlice.ts:916`) quand la cible a une fiche,
  `onHealthChange` → `updateCombatant({ healthSystem })` (`CombatCard.tsx:523`, `:548`) quand elle
  est autonome ;
- **« Calculer »** (`DamageCalculator.tsx:62`) : `useCombatStore.applyDamage`
  (`useCombatStore.ts:1478`). Pour nos quatre jeux, ni Torg, ni COC, ni Vampire, ni Degenesis :
  c'est **le cas commun** (l. 1573-1688) qui s'applique. Il écrit `hp` et `healthSystem` sur le
  plateau, puis `syncCombatantToSession` recopie `hp` sur la fiche par `updateCharacterHP` /
  `updateEntityHP`. Seuls les androïdes et les xénomorphes d'Alien liés à une fiche passent par
  `handleApplyImpact` (l. 1511-1521).

**Ce que chaque pilote déclare** (exports du dépôt = pilotes installés) : Alien `sante` (santé
principale, max `force`), Blade Runner `sante` (max `santeMax`), Cthulhu Hack `hp` ; Dune compte
en horloges (`defaultHealthType: clocks`), sans santé principale.

**Défauts, du plus grave au moins grave.**

1. **DÉFAUT prouvé — « Calculer » sur un PJ ne touche pas la santé qui fait foi, et le coup se
   perd.** Pour Alien, Blade Runner et Cthulhu Hack, le champ de santé de la fiche **fait foi**
   (`santePrincipaleDeLaFiche`, `SanteDuCombattant.ts:505-541`) : la barre du PJ le lit
   (`HealthManager.tsx:209-214`), et le coup suivant en repart (`entitySlice.ts:1085-1092`). Or
   `updateCharacterHP` (`entitySlice.ts:527-552`) n'écrit que `hp`, jamais ce champ. C'est
   `updateCharacterHealth` qui le fait (l. 584-600), et « Calculer » ne l'appelle pas.
   *Ce que David voit* : « Calculer 3 » sur Rachel (Santé 8), la carte dit 5 mais la barre de
   sa fiche reste à 8 ; un coup de 1 porté ensuite à la console donne **7**, pas 4.
   *Preuve* : essai provisoire `auditT4SanteDeLaFiche.test.ts` (rangé hors du dépôt, dans le
   scratchpad de la session) : `expected 8 to be 5` (champ Santé), puis `expected 7 to be 4`.
   *Deux écrivains pour une même santé* : `hp` (plateau, `updateCharacterHP`) et le champ de la
   fiche (`updateCharacterHealth`), qui divergent.
   **Correction proposée** : dans le cas commun de `applyDamage`, un combattant **lié à une
   fiche** (PJ ou PNJ de la Galerie) passe par `handleApplyImpact`, comme les branches Torg,
   Vampire et Alien le font déjà. Les résistances du combattant sont calculées d'abord, puis le
   montant part sans type, comme la branche Alien (l. 1516-1519). C'est la décision de David du
   2026-08-19, « une seule règle pour les deux portes » (`synchronisationDesDeuxSens.test.ts`).
   L'essai provisoire devient l'essai du correctif.
2. **DÉFAUT lu dans le code — « Calculer » saute les conséquences propres au jeu.** Celles-ci ne
   vivent que dans `handleApplyImpact` : Cthulhu Hack signale l'impact (`signalerImpactCH`,
   `entitySlice.ts:1098-1104`) ; Alien ajoute +1 Stress sur une perte de Santé, arrête la
   panique et demande une blessure critique à 0 (l. 1106-1122), et suit la santé humaine d'un
   PNJ (l. 1008-1025). Un humain d'Alien frappé par « Calculer » ne gagne donc ni Stress ni
   critique. Le cas commun d'`applyDamage` ne connaît que l'androïde et le xénomorphe
   (l. 1630-1639). *Même correction que le 1* : passer par `handleApplyImpact` les fait toutes.
3. **DÉFAUT prouvé — adversaire autonome : la console et « Calculer » ne tiennent pas le même
   compte.** La console d'un combattant sans fiche (les créatures posées depuis le « Livre ») ne
   change que `healthSystem` (`CombatCard.tsx:523-525`, `:548-550`). `updateCombatant`
   (`useCombatStore.ts:936`) fusionne sans rien recalculer. « Calculer » part ensuite de `hp`
   (`pointsDeVieApres`, `SanteDuCombattant.ts:455`) : Cultiste à 12, console −2, « Calculer » 3
   → `healthSystem` 7 mais `hp` **9**. *Preuve* : même essai provisoire, `expected 9 to be 7`.
   La barre affiche `healthSystem` (`santeAffichee`), mais tout ce qui lit `hp` se trompe. Pour
   un xénomorphe autonome, la branche l. 1635-1638 écrit même `sante` sur sa fiche depuis ce
   `hp` périmé. **Correction proposée** : `onHealthChange` écrit aussi `hp` quand la santé est en
   points de vie (une ligne, deux appels dans `CombatCard.tsx`).
4. **DÉFAUT lu dans le code — la jauge du bas d'un adversaire autonome ne bouge pas.** La carte
   d'un Cultiste montre « POINTS DE VIE 12/12 » en haut (`healthSystem`) et « PV 12/12 » en bas
   (champ `hp` de sa fiche, `statsToTrack`). Le cas commun ne réécrit pas la fiche
   (`useCombatStore.ts:1640`) : après « Calculer », le haut descend, le bas reste à 12. C'est la
   même famille que T20 (Rôdeur, deux santés affichées) : à traiter ensemble.
5. **ABSENT, pas un défaut — l'armure.** `calculateDamageImpact` (`CombatRules.ts:49-95`) ne
   connaît que les immunités, résistances et vulnérabilités, **aucune armure**. C7 (Cthulhu
   Hack : les dégâts d'un PJ moins l'Armure de l'adversaire) n'existe donc pas : T17 est
   nécessaire. Pour Blade Runner et Alien, la protection a déjà ses gestes
   (`ProtectionDuCombattant`, « Préparer ce coup » de `SanteAlien.tsx`). T7 doit y passer et ne
   pas en écrire une troisième.
6. **À VÉRIFIER à l'écran — Dune.** Le jeu n'a pas de points de vie (`clocks`). « Calculer »
   remplit une horloge du plateau, que `syncCombatantToSession` ne recopie pas (pas de `hp`). Le
   geste n'a pas de sens dans les règles de Dune, où l'on est vaincu (T18) ; à regarder avec
   David : le masquer pour Dune, ou le laisser.

**Conforme.**

- La console sur une cible qui a une fiche : un seul écrivain, `handleApplyImpact`, qui reflète
  le plateau (`refleterLaFiche`) ; le commentaire de `HealthManager.tsx:266-288` le dit et
  l'essai `synchronisationDesDeuxSens.test.ts` le couvre.
- Pas de double application d'un même coup : aucun chemin n'appelle les deux portes pour un
  geste. Le défaut est l'inverse : deux portes qui tiennent deux comptes différents.
- Pas de retour muet dans `applyDamage` pour ces jeux : chaque cible reçoit son coup et sa ligne
  au journal (l. 1668-1683).

**Conséquence pour la suite.** T7 (« Appliquer à [cible] ») ne peut pas s'appuyer sur le cas
commun d'`applyDamage` tant que les défauts 1 à 3 restent : le coup d'un adversaire sur un PJ
serait perdu au coup suivant. **Corriger 1 et 3 avant T7.**

#### Correctifs issus de l'audit (à faire avant T7, sur l'accord de David)

- [x] T21 · Défauts 1 et 2 : dans le cas commun d'`applyDamage`, un combattant lié à une fiche
      passe par `handleApplyImpact` — `useCombatStore.ts` — couvre C9 · essai : l'essai provisoire
      de l'audit, rendu définitif, plus un humain d'Alien qui gagne son Stress · touche src/ ⛔ ·
      **à essayer par David** (« Calculer » sur un PJ, puis la console) — **fait le 19/11**
      (David : « Oui, fais T21 et T22 […] GM-OS est fermé » ; Vite muet sur 5173). Nouvelle
      branche après celle de Vampire : pour un PJ ou un PNJ de la Galerie dont la fiche est
      trouvée, `session.handleApplyImpact(source, pc|npc, impact)`. Comme la console : montant et
      type, pas de type sur un soin ; si les listes de résistances du combattant ont agi (elles
      ne sont écrites nulle part aujourd'hui), le résultat part sans type. L'état automatique
      (« En feu », « Soin ») se pose toujours sur le plateau. Le plateau apprend la santé par
      `refleterLaFiche`. Les combattants sans fiche gardent le cas commun. Les androïdes et
      xénomorphes d'Alien gardent leur branche, qui passe avant.
- [x] T22 · Défaut 3 : la console d'un adversaire autonome écrit aussi `hp` quand sa santé est en
      points de vie — `CombatCard.tsx:523`, `:548` — couvre C9 · essai : console −2 puis
      « Calculer » 3 → 7 partout · touche src/ ⛔ — **fait le 19/11** :
      `majDeLaConsole(sante)` (`calculateurDeDegats.ts`) rend `{ healthSystem, hp }` pour une
      santé en points de vie, `{ healthSystem }` sinon ; les deux `onHealthChange` de la carte
      l'emploient.
- [x] « Calculer » **masqué pour Dune** (David : « masque pour Dune », défaut 6) :
      `calculateurDisponible(pilote)` = pas de `jet.dune` ; sur la carte (`CombatCard.tsx`) et
      dans le panneau de commandes (`CombatControls.tsx`). La capture `combatDesAdversaires`
      vérifie son absence sur Dune.
      Essais : `combat/degatsParLaFiche.test.ts` (8 cas : Santé de la fiche à 5 puis 4, soin,
      « En feu », une ligne au journal avec son type, humain d'Alien +1 Stress, Cultiste à 7
      partout, horloge sans `hp`) ; `calculateurDeDegats.test.ts` (Dune).
      **Vérifié** : suite complète `npx vitest run --maxWorkers=4` → 914 fichiers réussis sur 916
      (1 sauté), 10 721 essais ; le seul échec était un dépassement de temps de
      `stores/nomsSansEcrivainNiLecteur.test.ts` (contrôle global, 6,9 s pour 5 s permises, sans
      nom en cause), porté à 30 s et repassé (51 essais) ; `npx tsc -b` ; eslint ciblé ;
      `npm run build` ; capture `combatDesAdversaires` (4 réussis : « Calculer » absent sur la
      carte de Dune, une cible cochée ailleurs).
      Sur Dune, la console « Dégâts / Soins » remplissait encore l'horloge du plateau. **Masquée
      aussi le 19/11** (David : « masque aussi la console pour Dune ») : option `sansConsole` de
      `HealthManager` (disposition « carte » : ni boutons Dégâts / Soins, ni cible des coups ; la
      jauge et les actions de la carte restent), passée par `CombatCard.tsx` avec la même règle
      `calculateurDisponible`. Essai : `carteDuChantier263.test.tsx` ; capture : la carte du Soldat
      Harkonnen ne garde que « Fiche ». Le cadre « Horloges 0/6 » reste affiché, sans geste pour
      le remplir.
- (Défaut 4, la jauge du bas d'un adversaire autonome, rejoint T20.)

#### Suite du lot 2

- [x] T5 · Bouton « Attaquer » sur la carte, et fenêtre « Fiche » ouverte sur le jet avec la cible
      remplie ; `jetDuCombattantPossible` ouvert jeu par jeu (T9, T12, T18) —
      `CombatCard.tsx`, `FicheDuCombattant.tsx`, `JetDuCombattant.tsx` — couvre C4, C8, C10 ·
      essai : `JetDuCombattant.test.tsx` (ouverture sur le jet, cible remplie) · touche src/ ⛔ —
      **fait le 19/11** (« GM-OS est fermé », demandé avant d'écrire). La porte est posée, **le
      bouton ne paraît encore dans aucun jeu** :
      - `attaqueSurLaCarte(combattant, pilote, gabarit)` (`logic/jetDuCombattant.ts`) : la seule
        règle du bouton. Elle suit `jetDuCombattantPossible`, **sauf Vampire** (C10 : la carte
        d'un jeu hors du chantier ne bouge pas ; Vampire garde son jet dans « Fiche »). Comme
        `jetDuCombattantPossible` ne s'ouvre qu'à Vampire aujourd'hui, le bouton viendra avec
        T9 (Blade Runner), T12 (Alien) et T18 (Dune) ; Cthulhu Hack aura « Riposte » (T16).
      - `cibleDeLAttaque(attaquant, plateau)` : la cible de la carte si elle est encore là, jamais
        soi-même.
      - La carte : « Attaquer » (icône d'épées, clés `combat.card.attack` et `_tooltip` en fr/en)
        à côté de « Fiche », qui ouvre `gmCustom('fiche-combattant', { combatantId, ouvrirSur:
        'jet' })`.
      - La fenêtre : `ouvrirSur: 'jet'` met le jet au premier plan (`data-ouvert-sur-le-jet`,
        bordure d'accent), son titre devient « X attaque Y », la cible est rappelée
        (`data-cible-de-l-attaque`). Ouverte par « Fiche », rien ne change. Sans jet possible, elle
        le dit (`data-aucun-jet`) au lieu de s'ouvrir muette.
      Essais : `JetDuCombattant.test.tsx` (+4 : règle du bouton, cible, premier plan, ouverture
      par « Fiche » inchangée), `FicheDuCombattant.test.tsx` (3, nouveau : le câblage de la
      fenêtre), `carteDuChantier263.test.tsx` (4, nouveau : Dune sans console ni « Calculer »,
      « Attaquer » absent, puis permis il ouvre la fenêtre sur le jet).
      **Vérifié** : `npx vitest run --maxWorkers=4 src/modules/combat src/modules/session/components/health src/modules/session/store`
      (98 fichiers, 751 essais) ; `npx tsc -b` ; eslint ciblé ; `npm run build` ; capture des
      quatre jeux (4 réussis ; aucun « Attaquer » encore, C10 tenu).
- [x] T6 · `derniereAttaque` retenue sur le combattant et proposée d'emblée — `combat/types.ts`,
      `JetDuCombattant.tsx` — couvre D4 · essai : `useCombatStore.test.ts` (persistée, pas
      recopiée sur la fiche) · touche src/ ⛔ — **fait le 19/11** (« gm-os est fermé »).
      - **Forme retenue** : `{ champs, libelle }` plutôt que `{ id, libelle }` prévu au plan. Une
        attaque, c'est ce que le jet compose (`{ attribut: 'agilite', competence: 'armesAFeu' }`),
        le format que le panneau sait déjà recevoir (`compositionInitiale`, celui des jets demandés).
      - `PanneauDeJet` gagne `surLeLancer(composition)`, appelé quand le jet part (après les gardes
        de `lancer`). Rien d'autre ne change pour ses appelants.
      - Seul écrivain : `useCombatStore.retenirLAttaque(id, attaque)`, sans
        `syncCombatantToSession`. Persistée avec le plateau (`partialize` garde les combattants
        entiers) ; disparaît avec le combattant.
      - `JetDuCombattant`, **ouvert par « Attaquer » seulement** : retient l'attaque au lancer
        (libellé par `libelleDeLAttaque`, qui reprend le nom porté par la fiche, « Armes à feu »
        d'un groupement de Vampire) ; à l'ouverture suivante, la propose d'emblée après
        `compositionValable` contre la fiche d'aujourd'hui (« Dernière attaque, proposée : … »), ou
        dit qu'elle ne se lit plus. Ouvert par « Fiche » : rien de retenu ni de prérempli (Vampire
        inchangé).
      - Noté : `broadcastSync` envoie déjà le combattant entier au Player Hub (fiche et notes
        secrètes comprises) ; `derniereAttaque` n'y ajoute rien de plus sensible.
      Essais : `combat/derniereAttaque.test.ts` (5, nouveau : retenue, persistée, jamais recopiée
      même après une synchronisation, disparaît avec le combattant, remplacée sans partage) ;
      `JetDuCombattant.test.tsx` (+5 : retenue au lancer, proposée, signalée périmée, rien par
      « Fiche », libellé). **Vérifié** : `npx vitest run --maxWorkers=4 src/modules/combat
      src/modules/session/components src/modules/session/store src/stores` (185 fichiers, 1 378
      essais, dont tous ceux de `PanneauDeJet`) ; `npx tsc -b` ; eslint ciblé. Rien de visible
      dans les quatre jeux tant que « Attaquer » n'y paraît pas (T9, T12, T18).
- [x] T7 · « Appliquer à [cible] » dans la fenêtre de jet : arme + succès − 1, envoyé par
      `applyDamage([cible])` — couvre C2, C4, C9 · essai : `JetDuCombattant.test.tsx` · touche
      src/ ⛔ — **fait le 19/11** (« Fermé », demandé avant d'écrire).
      - `coupAAppliquer` (`logic/attaqueDeLAdversaire.ts`), pur : jet à réserve (`compte:
        'reussites'`) → arme + succès − 1 (`degatsDuCoup`), 0 sans succès, rien sans arme ; autre
        jet → le montant saisi ; puis la protection retirée, jamais sous zéro. Le calcul se dit en
        mots (« arme 2 + 3 succès − 1 = 4, − protection 1 = 3 »).
      - `PanneauDeJet` gagne `surLeResultat(r)`, appelé à chaque résultat affiché (jet, forçage,
        relance) par un effet sur `resultat`.
      - `AppliquerALaCible` (nouveau) : sous le jet, dans la fenêtre ouverte par « Attaquer »
        seulement, une fois un résultat affiché. Champs « Dégâts de l'arme » (réserve) ou
        « Dégâts » (autre jet), « Protection retirée », type si le pilote en déclare plusieurs ;
        bouton « Appliquer N à [cible] », désactivé tant qu'il manque une donnée. Un résultat ne
        s'applique qu'**une fois** ; un nouveau jet (un nouvel objet résultat) rouvre le geste.
        « Rien à appliquer » sur un échec.
      - **Un seul écrivain (C9)** : `useCombatStore.applyDamage(montant, type, [cible])`, qui
        passe par la fiche d'un PJ ou d'un PNJ de la Galerie depuis T21, et dit le coup au journal.
      - La protection reste saisie à la main : le jet de protection de Blade Runner
        (`ProtectionDuCombattant`) et l'armure d'Alien y seront branchés en T9 et T12. Les dégâts
        de l'arme aussi : T9 (catalogue de Blade Runner) et T11 (« Dégâts M » d'une attaque
        d'Alien) les prérempliront.
      Essais : `attaqueDeLAdversaire.test.ts` (+5), `AppliquerALaCible.test.tsx` (3, nouveau :
      calcul dit, coup porté une fois puis rouvert par un nouveau jet, échec, montant saisi),
      `JetDuCombattant.test.tsx` (+2 : paraît après un jet ouvert par « Attaquer », jamais par
      « Fiche »). **Vérifié** : 186 fichiers, 1 388 essais (combat, sessions dont `PanneauDeJet`,
      magasins) ; `npx tsc -b` ; eslint ciblé. Rien de visible dans les quatre jeux tant que
      « Attaquer » n'y paraît pas.

### Lot 3 — Blade Runner

- [x] T8 · Pilote Blade Runner 2.1.0 : colonnes du bestiaire reliées aux champs de la fiche
      (`vig`→`vigueur`, `agi`→`agilite`, `int`→`intelligence`, `emp`→`empathie`, `sante`,
      `armes-a-feu`→`armesAFeu`, `corps-a-corps`→`corpsACorps`, `conduite`, `discretion`,
      `manipulation`, `mobilite`, `observation`, `psychologie`) ; armes des adversaires
      rattachées au catalogue quand le livre les nomme — `outils/blade-runner/` →
      `Export Dirvers/corriges/Blade-Runner-2.1.0.gmos-driver` — couvre C5 · essai : script plus
      contrôle `bestiaire.colonnes` sans constat ; un Agent du LAPD posé entre avec AGI C et
      Armes à feu C · ne touche pas src/ — **fait le 19/11** (skill `finir-un-pilote`).
      Script `outils/blade-runner/relier_le_bestiaire.py`, depuis l'export du 11/11 (2.0.0, celui
      que David a installé) ; aucun identifiant ne change :
      - 16 colonnes reliées (les 13 du plan, plus Assistance médicale, Technologie et « Santé
        maximale » → `santeMax`, que la jauge du pilote lit comme maximum) ;
      - les niveaux prennent la forme des options de la fiche (« B » → « B (D10) ») : recopié
        tel quel, « B » serait hors des options de la liste ;
      - les 9 créatures dont attributs et compétences n'étaient qu'un texte sont découpées ; les
        colonnes « Attributs » et « Compétences », vidées, sont retirées ;
      - colonne « Armes (catalogue) » (sans champ : elle va aux notes) pour 5 créatures sur 13,
        quand le livre nomme exactement une arme du catalogue ; rien de deviné (« Couteau »,
        « Matraque » ambigus ; fusil Ender et .357 absents du catalogue). T9 y lira les dégâts.
      - le bestiaire de la racine de l'export (`state.bestiaire`) est celui des modèles fabriqués
        par David (« Exeple ») : non touché.
      **Vérifié** : `node outils/blade-runner/verifier_bestiaire.mjs` — `controlerLePilote` et
      `controlerLeBestiaire` (avec les champs de la fiche) sans constat ; les 13 créatures ont
      attributs, Santé et Santé maximale sur leur fiche de plateau ; l'Agent du LAPD donne
      exactement sa fiche du livre, et `preparerLeJet` (Agilité + Armes à feu) rend deux D8 sans
      avertissement. Capture `combatDesAdversaires` (Blade Runner, pilote 2.1.0) : la fenêtre
      « Fiche » de l'Agent montre Vigueur B (D10), Agilité C (D8), Santé 5/5, Armes à feu C (D8) ;
      la jauge Santé de la carte dit 5/5. Synthèse des pilotes et manuel
      (`54-Jeu-Blade-Runner.md`, « Pilote décrit » 2.1.0, section « Les adversaires du livre au
      combat ») mis à jour ; `electron/manuelDesJeux.test.ts` passe (29).
      **Vu à l'image, pour T20** : la barre « Points de vie » de la carte dit 10/10 (santé par
      défaut, pas la Santé de la fiche), et une jauge « Sang-froid 0/10 » paraît alors que le
      livre n'en donne pas aux adversaires.
      **Consignes de réimport** (selon [AGENTS.md](../../AGENTS.md), « Pilotes à réimporter ») :
      dans GM-OS, Forge › importer `Export Dirvers/corriges/Blade-Runner-2.1.0.gmos-driver`, choisir
      **Remplacer**. Les adversaires déjà posés sur un plateau gardent leur fiche d'avant : les
      reposer depuis l'onglet « Livre ». Aucun personnage ni aucune campagne n'est touché.
- [x] T9 · Blade Runner : « Attaquer » lance attribut + compétence de l'arme (AGI + Armes à feu,
      VIG + Corps à corps), dégâts arme + succès − 1, puis la protection de la cible
      (`ProtectionDuCombattant`, existant) — couvre C4 · essai : `JetDuCombattant.test.tsx`, cas
      Blade Runner · touche src/ ⛔ · **à essayer par David** — **fait le 19/11** (« gm-os est
      fermé ») :
      - `jetDuCombattantPossible` s'ouvre à Blade Runner (`jet.bladeRunner` + `desEchelonnes`),
        après vérification de ce que le panneau suppose (souvenir clé absent d'un adversaire,
        forçage payé par `ecrireLaFicheDuCombattant`, qui déplace aussi ses points de vie depuis
        T20) : « Attaquer » paraît sur la carte d'un adversaire de Blade Runner.
      - `armesDeLAdversaire` : la colonne « Armes (catalogue) » du pilote 2.1.0 lue au catalogue ;
        une arme sans dégâts propres (Blaster PK-D 5223) propose ses munitions (même catégorie).
      - `attaqueParDefaut` : sans dernière attaque, Vigueur + Corps à corps pour une arme de combat
        rapproché, Agilité + Armes à feu sinon ; sans arme, la compétence portée. Relue par
        `compositionValable`, dite (« Attaque proposée : … »).
      - `protectionLue` (`logic/protectionDeLaCible.ts`) : la lecture de `ProtectionDuCombattant`
        extraite, partagée ; « Appliquer à [cible] » gagne le choix de l'arme (dégâts remplis) et
        le bouton « Protection de [cible] : 2D8 », qui remplit « Protection retirée ».
      - Trouvé en chemin : `forcerLeJet` (`yearZero.ts`) rebâtissait le résultat sans `compte` —
        un jet forcé redevenait « des dégâts » pour « Dernier jet » et « Appliquer ». Corrigé.
      Essais : `JetDuCombattant.bladeRunner.test.tsx` (7 : ouverture, armes et munitions, attaque
      proposée, préremplissage, protection lue, jet forcé, parcours complet Agent → Rachel : 2D8,
      2 succès, Matraque 2, protection 1, Rachel 8 → 6). Capture (pilote 2.1.0) : « Attaquer » sur
      la carte de l'Agent ; fenêtre « attaque Rachel », « Attaque proposée : Vigueur + Corps à
      corps (Matraque de policier) », D10 + D8. Manuel `54-Jeu-Blade-Runner.md` et synthèse des
      pilotes mis à jour.

### Lot 4 — Alien

- [x] T10 · Créature : « Attaquer » tire sa table (`pont.loadTable`) ou ses lignes, affiche
      l'attaque et la consigne au journal du jet — couvre C3 · essai :
      `attaqueDeLAdversaire.test.ts` plus un composant · touche src/ ⛔ — **fait le 19/11**
      (« gm-os est fermé »). `attaqueDeCreaturePossible` (`logic/jetDuCombattant.ts`) : une
      créature d'Alien déclarée xénomorphe qui a ses lignes ou sa table ; `attaqueSurLaCarte` la
      reçoit (la carte passe sa fiche) : « Attaquer » paraît. La fenêtre « Fiche » ouverte sur le
      jet montre `AttaqueDeCreature` (nouveau) au lieu du panneau d'un personnage : « Tirer
      l'attaque (D6) » ou « choisir » + « Prendre cette attaque » ; mêmes sources et même ordre que
      le tirage existant de la carte (lignes via `entreesDesLignes`, puis `pontDesTables`),
      `attaqueDesEntrees` (T3 : un dé non couvert se dit) ; l'attaque s'écrit au suivi
      (`xenomorphe.attaque`, que la carte affiche) par `ecrireLaFicheDuCombattant`, et se dit au
      journal par `setLastRoll` (« Rôdeur 1 — Attaque sur Vasquez », « D6 3 — … »). Table
      introuvable : dit. Le tirage du bloc « Xénomorphe » de la carte reste, inchangé.
      Essais : `AttaqueDeCreature.test.tsx` (6 : qui peut, qui ne peut pas, lignes tirées
      affichées et notées au suivi et au journal, choix de Maman, dé non couvert, table absente
      puis lue). **Vérifié** : 84 fichiers, 659 essais de Combat-OS et de la santé ; `tsc -b` ;
      eslint ; build ; capture (instance jetable, vraie table du jeu) : « Attaquer » sur le Rôdeur,
      tirage « 3 — ENLÈVEMENT : … Attaque avec 10 dés de base, Dégâts 1 … ». Manuel
      `54-Jeu-Alien.md` (A6) et synthèse des pilotes mis à jour.
      **Constat du 19/11 (T3)** : ce tirage **existe déjà sur la carte**, replié dans
      « Xénomorphe — actif, Vitesse N » (`session/components/fields/XenomorpheAlien.tsx:20-39`,
      bouton « Tirer une attaque spéciale D6 », lignes du bestiaire puis table du disque,
      consigné par `dire`). T10 ne le double pas : « Attaquer » doit **y mener** ou appeler le
      même tirage, plus `lireLaReserveDeLAttaque` pour T11. Défaut de données vu au passage :
      dans le pilote Alien 1.11.0, neuf créatures (Reine, Xénocobra, Perfectionnés…) ont un nom
      qui garde un reste d'italique (`Rassemblement des légions *(Assemble the Legions)`) et
      un effet qui commence par `*:`. Le nettoyer à l'affichage ou dans le pilote, à décider
      en T10.
- [x] T11 · Quand l'effet tiré dit « N dés de base, Dégâts M », le jet et les dégâts sont
      proposés ; sinon, l'effet seul — couvre C3, C4 · essai : cas tirés de
      `bestiaire-du-livre-de-base.md` (Rôdeur, Jeune Moissonneur) · touche src/ ⛔ — **fait le
      19/11** (« Fermé », demandé avant d'écrire). Dans `AttaqueDeCreature` : l'effet tiré passe
      par `lireLaReserveDeLAttaque` (T3) ; « Lancer N dés — Dégâts M » lance `DiceEngine.rollYZE(N,
      0)` (dés de base seuls, `compte: 'reussites'`) et le dit au journal (« Trilobite — Fouet
      renversant (10 dés) sur Vasquez ») ; « Appliquer à [cible] » (T7) reçoit l'attaque comme arme
      (Dégâts M), remonté à chaque attaque tirée ; sans « Dégâts » écrit, l'arme est à saisir.
      « Perforante » et « Test opposé » se signalent ; une attaque sans réserve dit qu'elle se
      résout telle quelle. Les cas d'essai viennent des lignes du pilote Alien 1.11.0 (Trilobite,
      Déacon) : le Rôdeur tire sa table du disque (vérifiée par la capture), et « quatre dés de
      base » du Jeune Moissonneur est une particularité, pas une ligne d'attaque.
      Essais : `AttaqueDeCreature.test.tsx` (+2 : dix dés lancés, trois succès, « arme 1 + 3 succès −
      1 = 3 », Vasquez 6 → 3 ; perforant, opposé, sans jet). **Vérifié** : 84 fichiers, 661 essais ;
      `tsc -b` ; eslint ; build ; capture sur la vraie table : « 3 — Enlèvement … 10 dés de base,
      Dégâts 1 », « 5 Succès », « arme 1 + 5 succès − 1 = 5 », « Appliquer 5 à Vasquez ». Manuel
      Alien et synthèse à jour.
- [x] T20 · Rôdeur (et tout xénomorphe) : la carte affiche « Points de vie 10/10 » au-dessus de
      « Santé xénomorphe : 6/6 ». Trouver quel chiffre fait foi (bestiaire : Santé 6 ;
      `maximum` du suivi xénomorphe ; `hp`/`hpMax` du plateau), puis n'en montrer qu'un ou les
      aligner, sans second écrivain de la santé — ajouté le 19/11 à la demande de David (« Oui »).
      Même famille, vue en T8 : une figure du livre de Blade Runner affiche « Points de vie 10/10 »
      (le `healthSystem` créé par défaut) au-dessus de sa Santé 5/5, et une jauge « Sang-froid
      0/10 » sans valeur du livre ; et la jauge du bas d'un adversaire autonome (défaut 4 de l'audit)
      · couvre C9, C10 · essai : composant de la carte avec une créature Alien · touche src/ ⛔
      · **à essayer par David** — **fait le 19/11** (David : « corrige t20 », « gm-os est fermé »).
      **Cause** : un combattant autonome tenait trois santés (la barre `healthSystem`, `hp`, le
      champ Santé de sa fiche) que cinq écrivains ne déplaçaient pas ensemble. **Règle** : celle
      des PJ — quand le jeu déclare sa santé principale, la fiche fait foi.
      `santeDeLaFicheDuCombattant` (`SanteDuCombattant.ts`) aligne `hp`, `hpMax` et la barre sur
      elle ; appelée par les cinq écrivains d'un combattant **sans fiche de campagne** (PJ et
      Galerie inchangés) :
      1. la naissance (`addCombatant`, `santeDuCombattantAutonome`) — sauf si l'appelant donne ses
         PV, et hors Delta Green et Vampire qui ont leur règle ;
      2. « Calculer » (cas commun d'`applyDamage`, `santeSurLaFicheAutonome`) : la fiche suit le
         coup, quand elle porte le champ ;
      3. la console (`majDeLaConsole`, avec le champ et la fiche) ;
      4. un clic sur la jauge (`ecrireLaFicheDuCombattant`) : écrire la Santé déplace aussi la
         barre et les PV ;
      5. la carte : une **figure du livre** (`origineDuLivre`) ne montre pas une jauge que sa fiche
         ne porte pas (le Sang-froid de Blade Runner ; Stress, Air, Eau… d'un xénomorphe). Un
         adversaire fabriqué garde ses jauges, même vides.
      Essais : `combat/santeDesCreatures.test.ts` (9 : naissance 5/5, « Calculer » 2 → 3 partout,
      clic sur la jauge, autre champ sans effet, console, PJ inchangé, PV donnés gardés, Rôdeur
      6/6, horloges hors règle) ; `carteDuChantier263.test.tsx` (+2 : jauge absente pour une figure
      du livre, gardée pour un fabriqué). Capture : l'Agent du LAPD « Points de vie 5/5 » sans
      Sang-froid ; le Rôdeur « Points de vie 6/6 », comme « Santé xénomorphe : 6/6 ».
- [x] T12 · Humain d'Alien : « Attaquer » passe par `preparerLeTir` et l'arme du catalogue ; le
      coup reçu garde la protection d'Alien existante (`CoupAlien`) — couvre C4 · essai : cas
      Alien de `JetDuCombattant.test.tsx` · touche src/ ⛔ · **à essayer par David** — **fait le
      19/11** (« gm-os est fermé ») :
      - `jetDuCombattantPossible` (reçoit la fiche) s'ouvre à un humain ou un synthétique d'Alien,
        pas à un xénomorphe (T10). Vérifié avant : armes lues sur la fiche (`equipementsAlien`), tir
        préparé (`preparerLeTir`), Stress, Panique, munitions et suivi du jet écrits par
        `ecrireLaFicheDuCombattant`.
      - L'arme vient de la **fiche** (les humains d'Alien ne sont pas au bestiaire) :
        `armesDeLaFicheAlien` (nom, dégâts, portée, armure, identifiant). `PanneauDeJet` gagne
        `equipementAlienInitial` (lu au montage) : l'arme proposée est choisie au panneau, sans quoi
        le tir refuse de partir (« Choisir une arme pour tirer »).
      - `attaqueParDefaut` pour Alien : Agilité + Combat à distance, Force + Combat rapproché au
        Contact ; sans arme, la compétence possédée. Trouvé à l'écran : le pilote déclare une
        troisième composante obligatoire, **Stress** (un seul champ, `niveau_de_stress`) ;
        `compositionValable` refusait l'attaque entière. `JetDuCombattant` remplit d'office une
        composante obligatoire **à champ unique** (rien de deviné quand il y a un choix).
      - **Le coup se prépare sur la cible** (`preparerLeCoupAlien`, même `CoupAlien` que « Préparer
        ce coup » de `SanteAlien` : dégâts, Protection du xénomorphe ou de la fiche, perce-armure
        selon l'arme ou l'attaque perforante, origine pour un synthétique ou une créature), écrit
        par `ecrireLaFicheDuCombattant` ; « Appliquer à [cible] » devient « Préparer ce coup de N
        sur [cible] » chez Alien, sans « Protection retirée » ni type de dégâts ; un coup en attente
        n'est pas écrasé (dit). Vaut aussi pour les créatures (T10–T11).
      Essais : `JetDuCombattant.alien.test.tsx` (5 : ouverture humain / pas xénomorphe, armes et
      attaque proposée, coup préparé et refus, parcours complet — 7 dés avec le +2 du pistolet, 2
      succès, « Préparer ce coup de 3 sur Vasquez », santé inchangée —, perforant et coup en
      attente). **Vérifié** : 276 fichiers, 2 648 essais (combat, sessions dont `PanneauDeJet`,
      magasins, dés), puis 639 de Combat-OS après la dernière retouche ; `tsc -b` ; eslint ; build ;
      capture d'un garde armé (instance jetable, vrai pilote 1.11.0) : « Agilité + Combat à distance
      (Pistolet M4A3) », « Base 5 + arme 2 → 7 dés », « Coup de 2 préparé sur la carte de
      Vasquez ». Manuel Alien et synthèse à jour.

### Lot 5 — Cthulhu Hack

- [x] T13 · Relire le chapitre des adversaires du livre (skill `relire-un-corpus`, décalage 1
      d'après `livres.json`) et écrire la fiche de corpus du bestiaire — couvre C6 · essai :
      pages citées et vérifiées en image · ne touche pas src/ — **fait le 19/11**. Livre v1v3 du
      NAS (copie de travail effacée après lecture), texte par pypdf avec marqueurs de page, pages
      imprimées 45-62 rendues en image (pdfjs + canvas) : la mise en page à deux colonnes mêlait
      le Caïd et le Commando dans le texte. Fiche neuve
      `docs/systems/cthulhu hack/rules/bestiaire-et-adversaires.md` (`hors_canevas`, relue) : la
      règle du combat contre un adversaire (p. 45-48 : Malus au toucher, attaques comptées par
      round, dégâts fixes sur une Sauvegarde ratée, 1 et 20 naturels ; Armure p. 51), la création
      d'un adversaire et la table « Adversaires moyens » (p. 52-53), **22 profils** (p. 54-62).
      **Trouvé** :
      - le Mi-Go n'a pas de Malus au toucher dans le livre (p. 60) — noté, rien d'inventé ;
      - **le 20 naturel** : « il subit deux fois les dégâts de son adversaire, le Couvert et
        l'Armure s'appliquent normalement » (p. 48). Le livre ne dit pas l'ordre ; la fiche
        `degres-de-reussite-et-critiques.md` (non relue) affirme « après application de
        l'Armure », et T3 l'a suivie : `riposteDeCthulhuHack` calculait (fixes − Armure) × 2.
        **Tranché par David le 19/11 (D5)** : « c'est d'abord les dégâts puis l'armure » →
        2 × fixes − Armure ; `riposteDeCthulhuHack` et son essai corrigés (Revolver 4 contre 1 PA :
        7), la fiche `degres-de-reussite-et-critiques.md` aussi (« corrigée » : son empreinte n'est
        pas recalculée) ;
      - « Cultiste » n'est pas un profil du livre (la capture `combatDesAdversaires` l'invente) ;
      - l'Armure d'un adversaire se retire des dégâts d'un investigateur (p. 51 : la goule à 1 PA
        perd 5 sur un 6) — la règle de C7, confirmée.
      **Vérifié** : `npx vitest run --maxWorkers=4 src/modules/forge/rules src/modules/bestiaire`
      (48 fichiers, 741 essais, dont `corpusDerivable`) et les douze essais qui lisent le corpus.
      Synthèse des pilotes (section Cthulhu Hack et compte du corpus) à jour.
- [x] T14 · `LigneDAttaque.degats` / `fois` et leur contrôle — `types/drivers.ts`,
      `bestiaire/bestiaire.ts` — couvre C6 · essai : `bestiaire.test.ts` · touche src/ ⛔ — **fait
      le 19/11** (« Fermé », demandé avant d'écrire). Lecteurs recensés avant (`LigneDAttaque`,
      `attaques.lignes`, `l.de`) : la mécanique d'Alien (tirage, `entreesDesLignes`, qui ignore
      déjà une ligne sans dé), le contrôle, les notes d'un combattant, le résumé « Livre » et
      l'éditeur ; la Forge ne décrit pas ce format à l'IA.
      - `LigneDAttaque` : `de` vide permis pour une attaque qui ne se tire pas ; `degats?` (dégâts
        fixes) et `fois?` (par round, 1 par défaut).
      - `controlerLeBestiaire` : une attaque dit son nom, et son dé **ou** ses dégâts ; `degats`
        entier ≥ 0, `fois` entier ≥ 1 (erreurs ciblées `….degats`, `….fois`).
      - `ecrireLAttaque` (`bestiaire.ts`) : « Revolver (4) », « Matraque (2) ×2 », « 1-2 — Impact :
        … » ; lue par les notes d'un combattant (`notesDeLaCreature`) et le résumé d'une créature
        du livre (`CreaturesDuLivre`, qui disait « N lignes (D6) » à tort pour des dégâts fixes).
      - Éditeur du bestiaire : colonnes « Dégâts » et « × » ; un champ vidé retire la clé.
      Essais : `bestiaire.test.ts` (+2 : le Garde du livre valide, quatre lignes fautives refusées,
      l'écriture), `EditeurDuBestiaire.test.tsx` (+1). **Vérifié** : 136 fichiers, 1 427 essais
      (bestiaire, éditeur, Combat-OS, Forge) ; `tsc -b` ; eslint.
- [x] T15 · Pilote Cthulhu Hack 1.2.0 : bestiaire (Dés de Vie, PV, Armure, Malus au toucher,
      attaques à dégâts fixes) — `outils/cthulhu-hack/` →
      `Export Dirvers/corriges/Cthulhu-Hack-1.2.0.gmos-driver` — couvre C6 · essai : script plus
      contrôles de la Forge sans constat · ne touche pas src/ — **fait le 19/11**. Source : le
      1.1.0 de T0 (`output/campagnes-tests/cthulhu-hack/Cthulhu-Hack-1.1.0.gmos-driver`, installé
      chez David) ; aucun identifiant ne change. Script `outils/cthulhu-hack/ajouter_le_bestiaire.mjs`,
      chiffres de la fiche de corpus relue en T13 :
      - colonnes « Dés de Vie » (texte), « Points de Vie » (→ `hp`), « Points d'Armure » et
        « Malus au toucher » (nombres, lus par T16-T17 via `origineDuLivre`) ;
      - 22 créatures (catégories « Ennemis communs » et « Ennemis du Mythe », page imprimée), 33
        attaques à dégâts fixes (T14) ; les attaques au choix disent « au choix (OU) » ; les
        attaques conditionnelles et capacités spéciales vont aux particularités ;
      - profils à échelle au plus faible de leur fourchette (Mort-vivant 1 DV / 4 PV / 3 PA ;
        Profond 2 DV), la règle entière en particularité ; Mi-Go sans Malus (le livre ne le donne
        pas).
      **Vérifié** : `node outils/cthulhu-hack/verifier_bestiaire.mjs` — `controlerLePilote` et
      `controlerLeBestiaire` sans constat, 22 créatures avec leurs PV sur la fiche de plateau,
      Garde « Revolver (4), Matraque (2) ×2 », riposte 3 et 7 sur un 20 (D5). Capture
      `combatDesAdversaires` (pilote 1.2.0, après `npm run build`) : le Garde posé depuis « Livre »
      entre avec PV 14/14, ses notes disent « Dés de Vie 3 · Points d'Armure 1 · Malus au toucher
      -2 », « Revolver (4) », « Matraque (2) ×2 ». La capture pose désormais le Garde au lieu du
      « Cultiste » inventé. Manuel `54-Jeu-Cthulhu-Hack.md` (« Pilote décrit » 1.2.0, section « Les
      adversaires du livre ») et synthèse des pilotes à jour.
      **Consignes de réimport** (selon [AGENTS.md](../../AGENTS.md), « Pilotes à réimporter ») :
      dans GM-OS, Forge › importer `Export Dirvers/corriges/Cthulhu-Hack-1.2.0.gmos-driver`, choisir
      **Remplacer**. Les personnages, campagnes et fiches ne changent pas ; seul le bestiaire
      s'ajoute.
- [x] T16 · « Riposte » sur la carte d'un adversaire Cthulhu Hack : choix de l'attaque, puis le
      PJ ciblé perd dégâts fixes − Armure, ×2 si la dernière Sauvegarde de ce PJ est un 20
      naturel (ou case à cocher) — couvre C6, C10 · essai : composant plus logique · touche
      src/ ⛔ · **à essayer par David** — **fait le 19/11** (« Fermé », demandé avant d'écrire) :
      - `ripostePossible` (`logic/jetDuCombattant.ts`) : un adversaire d'un pilote qui déclare
        `jet.cthulhuHack` ; reçu par `attaqueSurLaCarte` ; sur la carte, le même bouton (C10)
        s'appelle **« Riposte »** (clés `combat.card.riposte` et `_tooltip`, fr/en).
      - `RiposteDeCthulhuHack` (nouveau), dans la fenêtre « Fiche » ouverte sur le jet : l'attaque
        lue au bestiaire (`origineDuLivre`, pilote 1.2.0), ou les dégâts à saisir pour un adversaire
        fabriqué ; l'**Armure** du PJ ciblé lue sur sa fiche (`armureDeLInvestigateur` : PA du
        Matériel déclarés par `jet.cthulhuHack.armures`), modifiable pour le Couvert ; la case
        **20 naturel** (le choix « case à cocher » du plan : le 20 d'une Sauvegarde ne se relit
        pas sûrement — l'adversaire doit aussi riposter, p. 47) ; le calcul dit
        (`riposteDeCthulhuHack`, D5) ; « Appliquer N à [cible] » par `applyDamage([cible])` (T21),
        une fois par riposte ; une attaque « ×2 » le rappelle ; sans cible, c'est dit.
      Essais : `RiposteDeCthulhuHack.test.tsx` (6 : qui, l'Armure additionnée, Revolver 4 − 1 = 3
      appliqué une fois, 20 naturel 8 − 1 = 7, Matraque ×2 et Armure qui absorbe tout, sans cible
      et adversaire fabriqué), `carteDuChantier263.test.tsx` (+1 : « Riposte » chez Cthulhu
      Hack). **Vérifié** : 88 fichiers, 682 essais (Combat-OS, bestiaire) ; `tsc -b` ; eslint ;
      build ; capture (pilote 1.2.0) : « Riposte » sur la carte du Garde, « 4, − Armure 1 = 3 »,
      « 3 dégâts appliqués à Harvey », PV de sa **fiche de campagne** 9 → 6. Manuel Cthulhu Hack
      et synthèse à jour.
      Non fait, à dire : les attaques déjà utilisées dans le round ne sont pas comptées (le livre
      conseille des jetons, p. 46) — le meneur les suit.
- [x] T17 · Les dégâts d'un PJ sur un adversaire retirent l'Armure de l'adversaire. Vérifier
      d'abord si `applyDamage` le fait déjà (T4) — couvre C7 · essai : `useCombatStore.test.ts` ·
      touche src/ ⛔ — **fait le 19/11** (« Fermé », demandé avant d'écrire). T4 l'avait établi :
      aucune porte ne retirait d'armure. Cthulhu Hack n'a pas de geste propre pour les dégâts
      d'un investigateur : ils passent par « Calculer » ou la console de la carte.
      - `armureDeLAdversaire` (`logic/attaqueDeLAdversaire.ts`) : la colonne du bestiaire au rôle
        `protection`, pour la créature d'origine (`origineDuLivre`) ; 0 sinon. Le pilote 1.2.0 est
        **régénéré** avec ce rôle sur « Points d'Armure » (pas encore réimporté par David ;
        `verifier_bestiaire.mjs` le contrôle : Garde 1, Shoggoth 8). Le rôle `protection` n'est lu
        par la mécanique Alien que sous `combat.alien.actions` : sans effet ici.
      - `applyDamage`, cas commun : pour un adversaire autonome d'un pilote `jet.cthulhuHack`,
        l'Armure se retire du coup avant tout calcul, jamais d'un soin ; le journal ajoute
        « — 6 − Armure 1 ».
      - La console de la carte (`CombatCard`, `onApplyImpact`, le chemin déjà pris par Torg) envoie
        un tel coup à `applyDamage` : une seule règle pour les deux portes.
      Essais : `combat/armureDesAdversaires.test.tsx` (5 : lecture au bestiaire, « Calculer » 6 →
      perd 5 et le journal le dit, coup plus faible que l'Armure et soin, adversaire fabriqué, la
      console de la carte). **Vérifié** : 111 fichiers, 850 essais (Combat-OS, santé, bestiaire,
      magasins de séance) ; `tsc -b` ; eslint ; build ; capture (pilote régénéré) : Garde 14 → 9
      sur un coup de 6, riposte toujours « 4, − Armure 1 = 3 ». Manuel Cthulhu Hack et synthèse à
      jour.

### Lot 6 — Dune

- [x] T18 · « Attaquer » sur un PNJ de Dune : test 2d20 du PNJ, puis `AttaqueDune` avec
      `cibleInitiale` — `ConflitDune.tsx`, `DuneAuJet.tsx`, `jetDuCombattant.ts` — couvre C8 ·
      essai : `ConflitDune.test.tsx` · touche src/ ⛔ · **à essayer par David** — **fait le 19/11**
      (« Fermé », demandé avant d'écrire). Lu d'abord dans le livre (PDF = imprimée + 7) : un PNJ
      mineur a une compétence à 6, deux à 5, deux à 4, et **une seule valeur de principe** (4 à 8)
      ajoutée au seuil, sans maxime (p. 327) ; les PNJ ennemis paient en Menace, n'ont pas de
      Détermination et la remplacent par 3 Menace (p. 240).
      - `jetDuCombattantPossible` s'ouvre à `jet.dune` : « Attaquer » paraît sur la carte d'un PNJ.
        Le panneau compose son seuil depuis sa fiche, comme chez un PJ.
      - `attaqueParDefaut` : Combat + le principe le plus haut de la fiche (pour un PNJ mineur,
        sa seule valeur) ; sans principe chiffré, rien n'est proposé.
      - `PanneauDeJet` reçoit `duneDuCombattant` : « PNJ ennemi » coché d'emblée pour un
        adversaire hostile (Menace), la cible de la carte transmise par `SuitesDune` à
        `AttaqueDune` (`cibleInitiale`, lue au montage). La reprise de l'initiative (difficulté +1)
        reconnaît aussi un PNJ (`acteurDune`), et plus seulement un PJ.
      - Pas d'« Appliquer à [cible] » pour Dune (pas de points de vie) : l'attaque réussie
        s'applique par « Appliquer cette attaque réussie », la tâche de défaite existante.
      Essais : `combat/components/JetDuCombattant.dune.test.tsx` (4 : bouton, attaque proposée,
      test réussi → cible Duncan, « PNJ ennemi » coché, pas d'« Appliquer à » ; ouvert par
      « Fiche », cible à choisir). Le nom d'essai prévu (`ConflitDune.test.tsx`) garde son essai
      de la défaite. **Vérifié** : 215 fichiers, 2 220 essais (combat, panneau de jet, dés) ;
      `tsc -b` ; eslint ; build ; e2e Dune : « Attaque proposée : Combat + Domination », « PNJ
      ennemi » coché, cible Duncan, capture relue.
      Non fait, à dire : la case « Un dé vaut 1 (1 Détermination) » lit la Détermination de la
      fiche ; un PNJ n'en a pas et la paie 3 Menace (p. 240). Le meneur la dépense au bandeau.

### Lot 7 — livraison

- [x] T19 · Captures « après », manuel des jeux (`54-Jeu-…` des quatre jeux), synthèse des
      pilotes, registre ; consignes de réimport avec un lien vers `AGENTS.md` — couvre C10 ·
      essai : captures relues · ne touche pas src/ · **à essayer par David**.
      **Ajouté le 19/11 à la demande de David** (« je voudrais qu'on valide tous les drivers au
      final ») : une **validation finale des quatre pilotes**, ceux à réimporter (Blade Runner
      2.1.0, Cthulhu Hack 1.2.0) comme ceux inchangés (Alien 1.11.0, Dune) — `controlerLePilote`
      sans constat, un jet préparé avec `preparerLeJet` sur un cas du livre, la capture
      `combatDesAdversaires` des quatre jeux relue — puis la liste des pilotes à réimporter et
      des gestes à essayer par David, jeu par jeu. — **fait le 19/11**, sans toucher `src/`.
      - **Validation des pilotes** : script rejouable `outils/combat/valider_les_quatre_pilotes.mjs`.
        | Pilote | Constats | Jet du livre préparé (`preparerLeJet`) | Attaque proposée |
        | --- | --- | --- | --- |
        | Blade Runner 2.1.0 | 0 | Agilité C + Armes à feu C → D8 + D8 | Agilité + Armes à feu |
        | Alien 1.11.0 | 0 erreur, 34 avertissements connus¹ | Agilité 4 + Combat à distance 3, Stress 1 → 7 + 1 D6 | Agilité + Combat à distance |
        | Cthulhu Hack 1.2.0 | 0 | Sauvegarde de Force 12 → 1d20 sous ou égal à 12 | — (« Riposte », le meneur ne lance pas) |
        | Dune 2.0.0 (export du 11/11) | 0 | Combat 6 + Domination 6 → 2d20 sous 12, difficulté 1 | Combat + Domination |

        ¹ Valeurs imprimées en texte au catalogue (« Puissance 9 », « Spécial », équipage
        « 2-24 ») : 17 depuis la 1.9.0, 17 de plus en 1.11.0, consignées au registre Alien (14 et
        15/11). Aucune ne touche une arme qu'« Attaquer » propose avec des dégâts chiffrés.
        Contrôles des bestiaires repassés : `outils/blade-runner/verifier_bestiaire.mjs` (zéro
        constat, 13 créatures, Agent en 2D8), `outils/cthulhu-hack/verifier_bestiaire.mjs` (zéro
        constat, 22 créatures, riposte du Garde 3 et 7 sur un 20).
      - **Captures finales** : `e2e/combatDesAdversaires.spec.ts`, quatre scènes réussies avec les
        pilotes livrés, constats et images relus (Agent du LAPD → Rachel, Vigueur + Corps à corps ;
        Rôdeur → Vasquez, attaque tirée et dix dés ; humain d'Alien, Agilité + Combat à distance,
        Pistolet M4A3 ; Soldat Harkonnen → Duncan, attaque Dune ouverte ; Garde → Harvey, « 4,
        − Armure 1 = 3 », PV 9 → 6, Garde 14 → 9 sous un coup de 6). Deux réglages de l'e2e : un
        délai de 90 s à la fermeture (Electron dépassait 30 s après quatre scènes) et la riposte
        cadrée dans la capture. Quatre captures entrent aux manuels :
        `captures/jeu-blade-runner-attaquer.jpg`, `jeu-alien-attaquer-creature.jpg`,
        `jeu-cthulhu-hack-riposte.jpg`, `jeu-dune-attaquer.jpg`.
      - **Réimports** (selon [AGENTS.md](../../AGENTS.md), « Pilotes à réimporter ») : Blade
        Runner 2.1.0 et Cthulhu Hack 1.2.0, déjà réimportés par David le 19/11 ; Alien 1.11.0 et
        Dune 2.0.0 inchangés par le chantier : **rien d'autre à réimporter**.
      - ⛔ **Corrigé le 19/11 au soir — Cthulhu Hack 1.2.0 à réimporter de nouveau.** Trouvé en
        recensant les catalogues pour le chantier suivant (Loot-OS) : le script de T15 partait de
        la copie de recette du 25/10 (`output/campagnes-tests/cthulhu-hack/…1.1.0`), pas de
        l'export de David du 11/11. Le 1.2.0 livré, puis réimporté avec « Remplacer », **perdait
        le catalogue (57 objets) et l'identité visuelle** ; la fiche et le reste étaient
        identiques. `ajouter_le_bestiaire.mjs` part désormais de l'export du 11/11 et refuse une
        source sans catalogue ; le 1.2.0 est régénéré (seuls `version` et `bestiaire` diffèrent
        de l'export), contrôles repassés (`verifier_bestiaire.mjs`, `valider_les_quatre_pilotes.mjs`).
        Blade Runner 2.1.0 vérifié de la même façon : sain. **Leçon** : comparer le pilote livré à
        l'export installé, clé par clé, avant de le livrer.
      - **Constaté en relisant, hors chantier** (§ 1 bis du registre) : sur la carte de Combat-OS,
        une jauge `gauge` ignore son maximum (`CombatCard.tsx:805-809` ne lit le maximum que d'un
        champ `number`) : la Détermination de Dune (max 3) s'affiche « 0/10 », et un PNJ, qui n'en
        a pas (p. 240), la montre quand même.

## Analyse

- 19/11 — relecture croisée, écarts trouvés et traités :
  1. **Une pastille « dernier jet » sur la carte**, proposée à David le 19/11, contredisait C10
     (« la carte ne gagne qu'un bouton »). Retirée : « Appliquer à [cible] » (T7) mène du jet
     aux dégâts sans elle. Elle reste possible plus tard si David la redemande.
  2. **C7 existe peut-être déjà** (une armure soustraite par `calculateDamageImpact`) : T17
     commence par le vérifier (T4), pour ne rien coder en double.
  3. **Les tables d'attaques d'Alien vivent sur le disque de David** (`pontDesTables`). Si une
     table manque, T10 retombe sur les lignes du bestiaire et le dit, sans échouer en silence.
  4. **Les pilotes lus sont des exports**, pas forcément ceux installés : T0 les recoupe avant
     T8 et T15.
- Couverture : C1 → T1 ; C2 → T2, T3, T7 ; C3 → T3, T10, T11 ; C4 → T5, T7, T9, T11, T12 ;
  C5 → T8 ; C6 → T3, T13 à T16 ; C7 → T17 ; C8 → T5, T18 ; C9 → T4, T7, T20, T21, T22 ; C10 → T0, T5, T16, T20,
  T19. Aucune tâche sans critère (T6 couvre la décision D4).
- AGENTS.md et décisions : pas de branche ; pilotes dans `Export Dirvers/corriges/` ; manuel des
  jeux et synthèse des pilotes mis à jour (T19) ; « GM-OS tourne-t-il ? » avant T1. Aucune
  contradiction avec la passation § 5.
- `git status` du 19/11 : aucun fichier de `src/` du plan n'est modifié par un autre agent. Le
  registre porte des ajouts non commités de la séance Claude du 18/11 (le Vampire coché) : on les
  garde et on n'y ajoute que le § 263.
- 19/11 — après T2 : seuls les jets **Year Zero** portent `compte: 'reussites'`. `rollPool`
  (Vampire, Shadowrun, Dune) met aussi des réussites nettes dans `total`, et Torg pose
  `successes` sans que son total en soit un : ces jeux gardent leur comportement, faute d'être
  dans le périmètre. À reprendre pour Dune en T18 si le calculateur s'y montre trompeur.
  → Sans objet : « Calculer » est masqué pour Dune (T21-T22), et son attaque passe par
  `AttaqueDune` (T18).
- 19/11 — clôture (T19) : chaque critère a sa tâche et son essai. **Vérifiés par essai** : C1,
  C2, C5 à C7, C9 (essais unitaires et contrôles des pilotes), C3, C4, C8, C10 (aussi dans
  l'e2e des quatre jeux). **À l'écran par David** : le parcours entier de chaque jeu, avec ses
  propres campagnes.
