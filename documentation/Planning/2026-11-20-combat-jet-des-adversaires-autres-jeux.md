# Combat-OS — le jet des adversaires pour les autres jeux — spécification, 20/11/2026

> Demande de David (20/11) : « est-ce que le module combat os a été revu pour tous les drivers ? »,
> puis, après la réponse (quatre jeux seulement ont « Attaquer » ou « Riposte » sur la carte) :
> « fait un plan ».
> État : **spécifié, pas commencé — garé le 21/11** (David : « note le plan on va l'exécuter plus tard ») — périmètre tranché le 20/11 ; premier geste quand David le demandera : T0. Registre § 267.
> Suite du § 263 ([spécification](2026-11-19-combat-jets-des-adversaires-et-degats.md)), dont ce
> chantier reprend les règles : D2 (la fenêtre « Fiche » ouverte sur le jet, aucun écran neuf),
> C9 (un seul écrivain de la santé), C10 (rien ne bouge sur la carte d'un jeu non visé).

## Ce qui existe — lu dans le code et les pilotes le 20/11

### La porte du § 263

- Le bouton de la carte (`CombatCard.tsx:584`) paraît si `attaqueSurLaCarte` le permet
  (`combat/logic/jetDuCombattant.ts`) : Blade Runner, Alien (humains et créatures), Dune,
  Cthulhu Hack (« Riposte »). **Vampire en est exclu exprès** (C10 du § 263) : son jet
  d'adversaire existe, mais seulement dans la fenêtre « Fiche ».
- La fenêtre « Fiche » (`FicheDuCombattant.tsx:188-203`) choisit entre « Riposte », l'attaque
  d'une créature, et `JetDuCombattant` — le panneau de jet commun posé sur la fiche de
  l'adversaire, qui écrit par `ecrireLaFicheDuCombattant` (l'écrivain unique) et reçoit l'arme
  proposée (`attaqueParDefaut`) et la protection de la cible. Sinon, elle dit « Aucun jet
  d'adversaire n'est prévu pour ce jeu ».
- Le code pose la condition : *« L'étendre à un autre jeu demande d'y vérifier d'abord ce que son
  panneau suppose d'un personnage »* (`jetDuCombattant.ts:10`).
- Douze jeux ont une carte propre au panneau de jet (`session/components/fields/<Jeu>AuJet.tsx`).
  Onze sont des composants purs (ni `players` ni magasin) ; **RuneQuest lit le magasin** de la
  séance : à examiner en premier pour ce jeu.
- COC a déjà son panneau dans Combat-OS (`PanneauDeCoc`, « Lancer un test ») ; il ne passe pas par
  la carte.

### Par pilote — exports du dépôt (`Export Dirvers/`), relevé du 20/11

| Jeu | Mécanique de jet | Carte au panneau | Bestiaire (créatures · colonnes reliées à la fiche) | Armes au catalogue | Remarque |
| --- | --- | --- | --- | --- | --- |
| Vampire 2.2.0 | `jet.vampire` | oui | 23 · 70/70 | 18 | jet d'adversaire déjà dans « Fiche » ; manque le bouton |
| COC 2.2.0 | `jet.coc` | oui | 19 · 0/19 | 36 | panneau propre ; bestiaire non relié |
| Delta Green 2.1.0 | `jet.deltaGreen` | oui | 0 | 52 | |
| Barbarians of Lemuria 2.0.0 | `jet.barbarians` | oui | 83 · 0/13 | 23 | bestiaire non relié |
| Star Trek 2.0.0 | `jet.starTrek` | oui | 0 | 0 | 2d20 comme Dune |
| Symbaroum 2.0.0 | `jet.symbaroum` | oui | 0 | 0 | jeu où, au livre, les joueurs lancent tout : peut-être une « Riposte » comme Cthulhu Hack — **à vérifier au livre** |
| Argyropée 2.1.0 | `jet.argyropee` | oui | 0 (export du 09/11 ; bestiaire versé le 12/11) | 0 | export à refaire |
| Degenesis 2.3.0 | `jet.degenesis` | oui | 0 | 0 | |
| RuneQuest 2.3.0 | `jet.runequest` | oui (lit le magasin) | 0 | 0 | coups localisés |
| Shadowrun Anarchy 2.2.0 | `jet.shadowrun` | oui | 0 | 0 | |
| Nephilim 2.0.0 | `jet.nephilim` | oui | 0 | 0 | |
| Torg Eternity 2.0.0 | `jet.torg` | non | 0 | 0 | |
| Crimes 1.0.0 | générique (réserve) | non | 0 | 0 | |
| NOC 2.0.0 | générique (réserve) | non | 0 | 0 | |
| Rêve de Dragon 2.0.0 | générique (d100) | non | 0 | 0 | combat en phases |
| Within 1.0.0 | aucune | non | 0 | 0 | pilote à reprendre (🔴) |
| Pénombre 2.0.0 (ajouté le 22/11) | `jet.penombre` | oui | 0 (six adversaires au corpus) | 0 | **le Psycholune ne lance jamais** : l'action adverse réussit d'office, les Éminences grises lancent contre l'adversité (p. 40-45) — une « Riposte », pas « Attaquer » |

⚠️ Les exports datent de dates diverses : un bestiaire ou un catalogue versé depuis n'y figure
pas (Argyropée). **À recouper avec les pilotes installés chez David avant de coder** (export
frais des jeux retenus).

## Le quoi

### Parcours

1. **En séance, un adversaire attaque.** Sur la carte de l'adversaire, David clique « Attaquer ».
   La fenêtre « Fiche » s'ouvre sur le jet de ce jeu, avec les valeurs de la fiche de
   l'adversaire, l'arme retenue ou proposée, et la cible de la carte en tête. Il lance.
2. **Le coup porte.** Si l'arme est connue, les dégâts proposés suivent la règle du jeu ; David
   les applique à la cible en un geste, par la porte des dégâts que le jeu a déjà (encaissement
   de COC, pistes de Degenesis, moniteur de Shadowrun, coups localisés de RuneQuest…).
3. **Un jeu où le meneur ne lance pas** (à confirmer au livre : Symbaroum) : le bouton s'appelle
   « Riposte » et applique les dégâts de l'adversaire au PJ ciblé, comme Cthulhu Hack.

### Critères d'acceptation

- C1 · Pour chaque jeu retenu, « Attaquer » (ou « Riposte ») paraît sur la carte d'un adversaire
  et ouvre la fenêtre « Fiche » sur le jet du jeu, la cible de la carte en tête — essai par jeu
- C2 · Le jet se prépare avec les valeurs de la fiche de l'adversaire et la mécanique du jeu ;
  un cas témoin tiré du livre donne le bon nombre de dés et le bon seuil (`preparerLeJet`) — essai
- C3 · Ce que le jet dépense ou écrit (ressource, suivi) va sur la fiche de l'adversaire par
  l'écrivain unique, jamais sur un PJ — essai
- C4 · Quand l'arme est connue, les dégâts proposés suivent la règle du jeu et s'appliquent à la
  cible par la porte existante du jeu, une seule écriture de la santé — essai
- C5 · Un adversaire dont la fiche n'a pas les valeurs du jet : le panneau le dit, il ne lance
  pas une réserve vide en silence — essai
- C6 · Les jeux non retenus ne changent pas : pas de bouton, « Aucun jet d'adversaire » dans
  « Fiche » — essai
- C7 · Manuel des jeux (`54-Jeu-<Jeu>.md`, ligne au 53), captures et synthèse des pilotes à jour
  pour chaque jeu ouvert — essai du manuel + relecture des captures
- C8 · Un adversaire par jeu retenu, essayé à l'écran par David — à l'écran par David

### Hors champ

- Within : son pilote ne déclare ni jet ni combat (🔴 dans la synthèse) ; il se reprend d'abord.
- Refaire la carte, le calculateur ou la fenêtre « Fiche » (D2 du § 263).
- Les jets des joueurs depuis leur fiche ou leur tablette.
- Le conseil tactique de l'IA sur la carte.
- Créer ou relier les bestiaires (décision Q3) : le bouton lance avec ce que porte la fiche de
  l'adversaire. Les bestiaires suivront jeu par jeu, avec le skill `finir-un-pilote`.

### Ce que David garde

- La santé et les ressources s'écrivent par les chemins existants (fiche de campagne pour un PJ ou
  un PNJ rattaché, plateau sinon) : redémarrage, export `.gmos` et sauvegarde automatique comme
  aujourd'hui.
- La dernière arme de chaque adversaire reste sur le combattant du plateau (D4 du § 263).
- Un pilote corrigé (si Q3 l'ouvre) se livre dans `Export Dirvers/corriges/` et se réimporte
  avec « Remplacer ».

## Décisions

- 20/11 — Q1 · David : les quatre lots → **quinze jeux**, dans l'ordre des lots : 1 (Vampire,
  COC, Delta Green, Barbarians), 2 (Star Trek, Symbaroum), 3 (Argyropée, Degenesis, RuneQuest,
  Shadowrun Anarchy, Nephilim, Torg), 4 (Crimes, NOC, Rêve de Dragon). Within reste hors champ.
- 20/11 — Q2 · David : « Oui, ajouter le bouton » → la carte de Vampire gagne « Attaquer » ; C10
  du § 263 est levé pour ce jeu seulement.
- 20/11 — Q3 · David : « Hors champ » → aucun bestiaire relié ni créé ici.
- 20/11 — Q4 · David : « Un jeu à la fois » → chaque jeu livré, vérifié et documenté avant le
  suivant ; David peut l'essayer entre deux.
- Q5 (non posée, réglée par la méthode) · les exports du dépôt ne sont pas toujours les pilotes
  installés (Argyropée) → **chaque tâche de jeu commence par un export frais demandé à David**.
  On ne code pas sur un export douteux.

- 22/11 — David, en validant le pilote Pénombre 2.0.0 (registre § 270) : « consigne les affrontements dans la révision de combat-os pour les drivers » → **Pénombre entre au plan, seizième jeu (T17)**, après le lot 4. Ses affrontements ne suivent pas le jet d'adversaire des autres : voir T17.

## Le comment

### Ce qui se réutilise (lu le 20/11)

- La porte : `attaqueSurLaCarte` / `jetDuCombattantPossible` / `ripostePossible`
  (`combat/logic/jetDuCombattant.ts`), le bouton de `CombatCard.tsx:584`, la fenêtre « Fiche »
  (`FicheDuCombattant.tsx:188-203`).
- Le jet : `JetDuCombattant` pose `PanneauDeJet` sur la fiche de l'adversaire et écrit par
  `ecrireLaFicheDuCombattant`. Dernière attaque retenue (`retenirLAttaque`, D4) et attaque
  proposée (`attaqueParDefaut`, `attaqueDeLAdversaire.ts:150`, une branche par jeu).
- Les dégâts : `AppliquerALaCible` → `coupAAppliquer` (`attaqueDeLAdversaire.ts:259`) →
  `applyDamage([cible])` (`useCombatStore.ts:1517`), l'écrivain unique. `applyDamage` connaît
  déjà les portes de **Torg** (`combat.dommages`), de **COC** (`combat.encaissement`) et
  d'**Alien**. Les autres portes vivent dans des panneaux : pistes de Vampire et de Degenesis,
  moniteur de Shadowrun (`CartesShadowrun.tsx`), coups localisés de RuneQuest
  (`CoupsLocalisesDuCombattant.tsx`), cases de Nephilim et de NOC.
- La riposte (jeu où le meneur ne lance pas) : `RiposteDeCthulhuHack`, modèle pour Symbaroum si
  le livre le confirme.
- La validation des pilotes : `outils/combat/valider_les_quatre_pilotes.mjs` (contrôle du pilote
  et cas témoin du livre par `preparerLeJet`), à étendre d'un cas par jeu.

### ⚠️ Le piège trouvé en écrivant le plan

`coupAAppliquer` applique à **tout** jet compté en réussites la règle de Year Zero : « arme +
succès − 1 ». C'est juste pour Blade Runner et Alien, **faux** ailleurs (Vampire : marge + arme ;
Shadowrun : VD de l'arme + succès nets ; Degenesis : arme + déclencheurs — à relire au livre de
chaque jeu). Ouvrir « Attaquer » à un nouveau jeu sans y toucher proposerait des dégâts faux,
avec un bouton qui les applique. D'où **T0 avant tout jeu** : la règle des dégâts se déclare par
jeu, et un jeu sans règle déclarée **demande le montant** (le chemin « montant à saisir » existe
déjà), ou renvoie à la porte du jeu.

### Fichiers touchés

- `combat/logic/jetDuCombattant.ts` : une table des jeux ouverts (clé de `jet`, geste
  « Attaquer » ou « Riposte ») au lieu d'une chaîne de booléens qui s'allonge ; Vampire retiré
  de l'exclusion.
- `combat/logic/attaqueDeLAdversaire.ts` : `coupAAppliquer` reçoit la règle du jeu ;
  `attaqueParDefaut` une branche par jeu qui a des armes.
- `combat/components/AppliquerALaCible.tsx` : le coup passe par la porte du jeu quand
  `applyDamage` ne la connaît pas (ou le geste renvoie à elle, en le disant).
- `session/components/PanneauJetDeFiche.tsx` et `<Jeu>AuJet.tsx` : seulement si un jeu suppose
  un personnage de joueur (RuneQuest lit le magasin de la séance : à examiner).
- Essais : `JetDuCombattant.<jeu>.test.tsx` par jeu ; `jetDuCombattant.test.ts` (C6) ;
  `e2e/combatDesAdversaires.spec.ts` (une étape par jeu) ; le script de validation.
- Documentation : `54-Jeu-<Jeu>.md`, `53-Les-jeux-et-leurs-mecaniques.md`, synthèse des pilotes,
  registre.

### Données : qui lit, qui écrit

- **Santé de la cible** : un seul écrivain, `applyDamage` (C9 du § 263) ; ou la porte du jeu, qui
  écrit déjà par `ecrireLaFicheDuCombattant`. Jamais les deux pour un même coup.
- **Fiche de l'adversaire** (ressource dépensée, suivi du jet) : `ecrireLaFicheDuCombattant`
  seul — fiche de campagne d'un PNJ rattaché, plateau sinon.
- **Dernière attaque** : `derniereAttaque` sur le combattant (`gmos-combat-storage`), écrite par
  `retenirLAttaque` seulement.
- Aucun magasin neuf.

### Risques GM-OS (cochés)

- [x] Fenêtres multiples : Combat-OS est un écran du meneur ; rien n'écrit depuis le hub ou le
  projecteur.
- [x] Chemin de données : aucun code dans `electron/`.
- [x] Tablettes : hors champ (les jets des joueurs ne changent pas).
- [x] Les deux ports : sans objet.
- [ ] Textes : les libellés suivent ceux du § 263 ; vérifier chaque clé ajoutée en fr et en, et
  la carte dans les deux régimes (atelier / table).
- [x] Échap et surcouches : la fenêtre « Fiche » existe et passe déjà par le registre.

### Écran : prompt Stitch

Aucun écran neuf (D2 du § 263) : pas de maquette. La carte gagne un bouton déjà dessiné.

### Essais

`npx vitest run --maxWorkers=4 src/modules/combat <fichiers du jeu>`, `npx tsc -b`, eslint ;
`npm run build` puis l'étape du jeu dans `e2e/combatDesAdversaires.spec.ts` ; le script de
validation des pilotes ; `npx vitest run electron/manuelDesJeux.test.ts --maxWorkers=4`.

## Tâches

**Le gabarit de chaque tâche de jeu** (T1 à T15), une séance au plus — coupée en deux si le jeu
le demande (Rêve de Dragon, RuneQuest) :

1. Demander à David un **export frais** du pilote ; relire jet, combat, armes.
2. **Lire au livre** (`docs/systems/<jeu>/livres.json`) qui lance pour un adversaire et comment
   se comptent ses dégâts ; noter les pages imprimées.
3. **Vérifier le panneau** du jeu posé sur une fiche d'adversaire : ce qu'il suppose d'un
   personnage (magasin, joueur, ressources propres aux PJ).
4. Ouvrir le jeu dans la table de T0 ; sa règle des dégâts ; `attaqueParDefaut` s'il a des armes ;
   la porte des dégâts du jeu.
5. Essais : `JetDuCombattant.<jeu>.test.tsx` (C1 à C5), cas témoin dans le script de validation,
   étape e2e et capture relue.
6. Manuel 54 et 53, synthèse des pilotes, registre. **À essayer par David** (C8).

- [ ] T0 · La table des jeux ouverts et la règle des dégâts par jeu ; un jeu sans règle demande le
      montant — `jetDuCombattant.ts`, `attaqueDeLAdversaire.ts`, `AppliquerALaCible.tsx` ·
      couvre C4, C6 · essai : `jetDuCombattant.test.ts`, `attaqueDeLAdversaire.test.ts` (les
      quatre jeux du § 263 inchangés, un jeu inconnu demande le montant) · touche src/ ⛔
- [ ] T1 · Vampire — « Attaquer » sur la carte ; dégâts : marge + arme (à relire au livre), pistes
      de Vampire · couvre C1 à C5, C7 · touche src/ ⛔ · à essayer par David
- [ ] T2 · COC — le jet de l'adversaire et l'encaissement de COC (`applyDamage` le connaît) ;
      voisinage avec `PanneauDeCoc` à vérifier · C1 à C5, C7 · src/ ⛔ · à essayer par David
- [ ] T3 · Delta Green — d100, 52 armes, létalité · C1 à C5, C7 · src/ ⛔ · à essayer par David
- [ ] T4 · Barbarians of Lemuria — jet à somme (`jet.barbarians`), 23 armes · C1 à C5, C7 ·
      src/ ⛔ · à essayer par David
- [ ] T5 · Star Trek — 2d20 comme Dune (Menace des PNJ) · C1 à C5, C7 · src/ ⛔ · à essayer par
      David
- [ ] T6 · Symbaroum — confirmer au livre que le meneur ne lance pas ; si oui « Riposte » sur le
      modèle de Cthulhu Hack · C1 à C5, C7 · src/ ⛔ · à essayer par David
- [ ] T7 · Argyropée · C1 à C5, C7 · src/ ⛔ · à essayer par David
- [ ] T8 · Degenesis — pistes de santé à la porte des dégâts · C1 à C5, C7 · src/ ⛔ · à essayer
      par David
- [ ] T9 · RuneQuest — sa carte lit le magasin (étape 3 d'abord) ; coups localisés · C1 à C5, C7
      · src/ ⛔ · à essayer par David
- [ ] T10 · Shadowrun Anarchy — moniteur d'état · C1 à C5, C7 · src/ ⛔ · à essayer par David
- [ ] T11 · Nephilim — cases de santé · C1 à C5, C7 · src/ ⛔ · à essayer par David
- [ ] T12 · Torg Eternity — `applyDamage` connaît ses dommages ; pas de carte au panneau · C1 à
      C5, C7 · src/ ⛔ · à essayer par David
- [ ] T13 · Crimes — jet générique · C1 à C5, C7 · src/ ⛔ · à essayer par David
- [ ] T14 · NOC — jet générique, Destin · C1 à C5, C7 · src/ ⛔ · à essayer par David
- [ ] T15 · Rêve de Dragon — jet générique d100 et combat en phases · C1 à C5, C7 · src/ ⛔ · à
      essayer par David
- [ ] T17 · Pénombre — les affrontements du livre (p. 40-45), ajoutés le 22/11 · C1 à C5, C7 · src/ ⛔ ·
      à essayer par David. Ce qui diffère des autres jeux :
      - **aucun jet du Psycholune** : comme la « Riposte » de Cthulhu Hack, le bouton de la carte de
        l'adversaire ouvre le jet d'une Éminence grise (`jet.penombre`) avec l'**adversité** pour
        difficulté (attaque, défense, feinte qui le vise) ; un effet magique garde sa propre difficulté
        (p. 44) ;
      - **adversité et résilience** : adversité = nombre d'informations de la description, résilience =
        5 × ce nombre ; une attaque réussie, même de justesse, retire **1 point de résilience par succès**
        (conséquence « attaque », p. 41, 44) ; une conséquence qui ôte une information baisse l'adversité ;
      - **actions adverses** : une par adversaire et par tour, **réussie d'office** ; par défaut une cible
        perd autant de jetons conscience que l'adversité, ou toutes la moitié arrondie au supérieur ;
        moitié de perte contre un effet (tour perdu, succès en moins, élément désavantageux…) ; sacrifice
        de résilience pour doubler (p. 42). La carte propose les actions de l'adversaire et applique la
        perte aux jetons des cibles (`perdreDesJetons` du module de Pénombre, les inactifs d'abord) ;
      - **défense** : une Éminence grise qui a réservé une action ; chaque succès annule la perte d'un
        jeton, une autre conséquence coûte autant de succès que l'adversité (p. 44) ; **riposte** : +1
        succès à la cible d'une attaque adverse qui réussit (p. 45) ;
      - **dissonance** : jetons de dissonance (fable 1, mythe 2, muse 3) ; à 0 de résilience, action de
        dissonance gratuite, résilience remise au maximum, un jeton en moins ; contamination par la peste
        sur une action de clé de difficulté 1 ratée (p. 43) ; **opéra harmonique** contre la résilience
        actuelle (p. 45) ;
      - **ordre du tour** : les Éminences grises d'abord, dans l'ordre de leur choix, deux actions
        chacune ; puis les adversaires ; défaite quand toutes sont épuisées (p. 40, 45) ;
      - **bestiaire** : les six profils du corpus (`bestiaire-et-adversaires.md`, Antrustion p. 41, Férale
        p. 347, Harpelle p. 348, le trio p. 360, Verizon p. 362, Mandigo p. 364) — « Remplir depuis le
        corpus » les lit (colonnes Adversité, Résilience, Dissonance) ; la décision Q3 (bestiaires hors
        champ) est à reposer à David pour ce jeu. Le pilote 2.1.0 (22/11) porte déjà ces six adversaires ;
        `controlerLePilote` avertit qu'aucune colonne ne remplit la santé : la **résilience** doit devenir
        la santé d'un adversaire posé au combat, sans passer par la conscience des Éminences grises ;
      Essais : ceux du module de Pénombre (résilience, actions adverses), un essai de la carte, et l'e2e
      `combatDesAdversaires.spec.ts`.
- [ ] T16 · Livraison — script de validation sur les seize pilotes, e2e complet, captures,
      registre et synthèse · couvre C6, C7 · essai : le script, `combatDesAdversaires.spec.ts`

## Analyse

- 20/11 — relecture croisée :
  1. Chaque critère est couvert : C1 à C5 par T1 à T15 (essai par jeu), C4 et C6 aussi par T0,
     C6 et C7 par T16, C8 à l'écran par David après chaque jeu.
  2. Aucune tâche sans critère.
  3. Aucune contradiction : D2 et C9 du § 263 repris ; C10 levé pour Vampire seulement, sur
     décision de David (Q2) ; AGENTS.md respecté (⛔ « GM-OS tourne-t-il ? » avant T0).
  4. Aucun `[À TRANCHER]` de périmètre.
  5. `git status` : aucun fichier du plan n'est en cours chez l'autre agent.
- **Écart à signaler** : le § 263 est encore 🟠 (essai de David attendu). T0 s'appuie sur lui ;
  un défaut trouvé à son essai se propagerait aux quinze jeux. **Recommandation : essayer le
  § 263 avant T0.**
