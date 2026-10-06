# La refonte des tablettes — joueurs, puis meneur

**Ouvert le 2026-10-04**, à la demande de David : *« fais-moi un plan pour mettre à jour l'interface
des tablettes MJ et Joueurs »*. Registre : § 123 de `2026-08-23-chantiers-gares.md`.

C'est la suite de la refonte du poste du meneur (registre § 76, plan
`2026-09-17-refonte-interface.md`), qui avait **exclu les tablettes** : *« Pas de tablette dans les
phases 0 à 4. Le Tablet Hub a sa propre surface et ses propres contraintes ; il passe après, ou
jamais — à trancher. »* C'est tranché : il passe maintenant.

---

## 1 · Les décisions de David — le 2026-10-04, toutes tranchées

| # | Question | Décision |
| :--- | :--- | :--- |
| 1 | Le thème des tablettes | **Elles suivent le PC** — thème de base, accent, personnalités et thème du jeu. Aucun réglage local. |
| 2 | Le matériel des joueurs | **Hétéroclite** : des tablettes, des **iPad Air**, des **téléphones**. |
| 3 | Les maquettes | **Stitch**, comme pour le poste du meneur. |
| 4 | L'ordre | **La tablette des joueurs d'abord**, la tablette du meneur ensuite. |
| 5 | L'habillage (T2) | **À apparence constante**, comme la phase 1 du PC. |

*Consignées ici pour qu'on ne les rouvre pas par accident.* Ce qu'elles coûtent :

- **(1)** Un joueur ne peut pas choisir le thème clair sur sa tablette si le PC est en Cyberpunk.
  C'est voulu : la table entière porte les couleurs du jeu.
- **(2)** Pas de mise en page « pour l'iPad » : chaque écran doit tenir **de 360 px à 1 180 px** de
  large, en portrait et en paysage. C'est la contrainte qui pèse le plus sur T3 et T4.
- **(4)** La tablette du meneur — que David utilise à chaque séance — attend la fin des lots J.

---

## 2 · Le constat, vérifié dans le code le 2026-10-04

- **Deux surfaces, ~6 600 lignes.** La tablette du meneur (`?window=remote`,
  `src/modules/remote/`) : 14 écrans, 3 159 lignes, **huit onglets** — Pads, Dés, Sons, Scénario,
  Combat, Tableau, Notes, Messages. La tablette des joueurs (`?window=tablet`,
  `src/components/TabletHub.tsx` + `src/components/hub/`) : 763 + 3 447 lignes, l'accueil
  « Qui es-tu ? » puis **six onglets** — Direct, Archives, PNJ, Lieux, Inventaire, Cartes — et la
  fiche, les jets, les notifications, la messagerie.
- **Aucune des deux n'emploie le socle** (`src/components/socle/` : `Bouton`, `Panneau`,
  `Etiquette`, `EnTeteDeModule`, `GabaritDeModule`) sur lequel tout le poste du meneur a été refait.
  Leurs couleurs sont déjà des jetons (la garde `electron/couleursBrutes.test.ts` couvre tout `src/`).
- ⛔ **Les tablettes ne reçoivent aucun thème.** Le thème du jeu se lit par
  `window.appBridge.ai.readDoc` (`src/theme/themeDuJeu.ts`), qui n'existe que dans l'application
  de bureau ; le thème de base, l'accent et les personnalités sont des réglages **locaux**
  (`useSessionStore`), jamais transmis. Une tablette affiche donc le thème par défaut **de son propre
  navigateur**, quel que soit le jeu — et les icônes du jeu (contrat v1.6) ne l'atteignent pas non plus.
- **Aucune maquette.** La section 7 du travail Stitch (Player Hub, tablettes, pupitre, fiche HTML)
  avait été laissée hors du premier et du second tour (`2026-09-27-prompts-stitch-tour-2.md`).
- **Peu d'essais de bout en bout** : `e2e/viderLePlayerHub.spec.ts` et les deux captures du manuel
  (`tablette-des-joueurs`, `tablette-du-meneur`). Les tests unitaires sont nombreux
  (`padsDeLaTelecommande`, `ligneDEtat`, `HubCombatTracker`…) mais **ne voient ni un libellé changé
  ni un réglage caché** — la leçon de la phase 5 du PC (huit e2e cassés par un réagencement).

---

## 3 · Le périmètre

**Dedans** : la tablette des joueurs (accueil, six onglets, fiche, jets, notifications,
messagerie) ; la tablette du meneur (huit onglets, ligne d'état, surimpressions — le jet projeté,
l'appairage). **Le pupitre de l'écran du bas** est la tablette du meneur : il profite de tout, sans
travail propre.

**Dehors** :

- **Le Player Hub** — l'écran projeté de la table, pas une tablette.
- **La fiche de personnage HTML** — elle vient de *Character Sheet HTML Studio* et a son propre
  thème (`documentation/Architecture/Flux-des-constructeurs.md`). La refonte touche son **cadre**,
  jamais son contenu.
- Tout ce qui changerait le **comportement** : la synchronisation, l'appairage, ce qu'un joueur a le
  droit de voir. Un défaut trouvé en chemin s'inscrit au § 1 bis du registre ; il ne se corrige pas
  dans un lot de refonte.

---

## 4 · Le matériel cible

| Appareil | Largeur logique | Orientation |
| :--- | :--- | :--- |
| Téléphone | **360 à 430 px** | portrait surtout |
| iPad Air | **820 × 1 180** | les deux |
| Tablette Android | ~800 × 1 280 | les deux |
| Pupitre de l'écran du bas (Zenbook Duo) | 1 440 × 900 | paysage, tactile |

**Trois tailles de référence** pour les captures et les essais : **390 × 844** (téléphone),
**820 × 1 180** (iPad Air portrait), **1 180 × 820** (iPad Air paysage). La tablette du meneur y
ajoute **1 440 × 900** (le pupitre).

⚠️ Les vrais appareils de David ne sont pas sur la machine des essais. **Safari d'iPad** se
comporte autrement que Chromium (hauteur d'écran avec la barre d'adresse, `100vh`, zones sûres,
clavier qui pousse la page) : chaque lot finit par **un passage sur un vrai iPad** (T6), pas
seulement par les captures.

---

## 5 · Les phases

Chaque phase a son **critère de sortie**. Aucune ne commence avant que la précédente l'ait atteint.

### T0 · L'état des lieux — invisible

1. **Inventaire écran par écran** : chaque onglet, chaque surimpression, chaque geste, avec son
   fichier. C'est la matière des prompts Stitch (T3) — *Stitch ne connaît que ce qu'on lui montre*.
2. **Les captures de référence** des deux tablettes aux trois tailles (§ 4), dans un état mis en
   scène — la campagne de démonstration « Le Silence de Varn » du manuel
   (`e2e/capturesDuManuel.spec.ts`), qui ne lit jamais les données du meneur.
3. **Un essai e2e par onglet**, avant de toucher à quoi que ce soit : ce qu'il affiche, et le geste
   principal (lancer un jet, accepter une carte, envoyer un message, déclencher un pad).

**Sortie** : les essais passent sur le code d'aujourd'hui ; les captures sont rangées.

### T1 · Le thème voyage jusqu'aux tablettes — décision 1

La seule phase **visible** avant les maquettes : les tablettes prennent les couleurs du PC et du jeu.

1. **Un segment de synchronisation « apparence »**, émis par la fenêtre du meneur
   (`useNexusSynchronizer`) : le thème de base, l'accent, l'interrupteur des personnalités, **les
   jetons du thème du jeu déjà résolus** par le PC, et les icônes du jeu (contrat v1.6).
2. **La tablette les applique** par le même chemin que le PC (`appliquerLeTheme`), sans rien lire
   sur disque.
3. ⛔ **On transmet des jetons, jamais la CSS du jeu** — la règle du « pont des jetons » (plan de
   la refonte, § 12) : le vocabulaire `.rpg-*` d'une page de livre entrerait en collision avec
   l'interface.
4. **Les polices du jeu** : le PC les a téléchargées (atelier de thème) ; la tablette doit les
   recevoir **par le SyncServer**, pas par Google — la table peut n'avoir que le réseau local. *À
   mesurer en T1.*
5. **Le poids** : jusqu'à trente icônes de 20 Ko. Le segment part **à la connexion et quand le thème
   change**, jamais à chaque battement.

**Sortie** : changer de thème ou de campagne au PC change la tablette dans la seconde (essai e2e) ;
une tablette qui se reconnecte retrouve le thème.

### T2 · L'habillage par le socle — à apparence constante (décision 5)

1. Les boutons, panneaux, étiquettes et en-têtes faits main deviennent les primitives du socle.
2. **Cibles tactiles d'au moins 44 px.** C'est le seul écart toléré : un bouton trop petit se
   rattrape, la mise en page ne bouge pas.
3. Lot par lot, dans l'ordre de la décision 4 : **joueurs**, puis **meneur**.

**Décision du 05/10** : les cinq étoiles de feedback et les commandes des réserves conservent
leur disposition actuelle en T2. Leurs cibles tactiles de 44 × 44 px seront traitées en T4.
Pour l'inventaire des joueurs, David retient l'option 1 : réserver dès T2 une zone de défilement
au-dessus de la navigation fixe sur téléphone, sans réagencer les cartes ni leurs actions.

**Sortie** : les captures de T0 passent sous la tolérance — *et on les regarde, on ne se fie pas au
compte* (registre § 76 : sur fond sombre, la tolérance a laissé passer un écran refait). Les essais
de T0 passent.

### T3 · Les maquettes Stitch — décision 3

La méthode payée au premier tour (`documentation/Planning/stitch/README.md`, mémoire *refonte de
l'interface*) :

- **Une conversation par écran**, un prompt **court écrit depuis le code** — contenu réel, gestes
  réels, « C'est TOUT. N'ajoute rien ». Dans une même conversation, Stitch recopie ses inventions.
- **Le même système de design** que le poste du meneur (`stitch/DESIGN.md`) : les tablettes doivent
  ressembler à GM-OS, pas à une autre application.
- **Chaque écran en deux tailles** : téléphone et iPad Air paysage (décision 2). Un écran qui ne
  tient pas à 360 px n'est pas retenu.
- **Rendre chaque export soi-même** (Chromium de Playwright) : une accolade manquante ou une graisse
  impossible noircit l'écran en silence.
- **Chaque invention de Stitch se vérifie dans le code** avant d'être déclarée inventée — et une
  fonction qui n'existe pas ne s'ajoute que sur décision de David.

Les prompts vivront dans `documentation/Planning/2026-10-xx-prompts-stitch-tablettes.md` ; les
exports retenus dans `documentation/Planning/stitch/tablettes-joueurs/` et `stitch/tablette-meneur/`.

**Sortie** : David a retenu une maquette par écran — ou écarté l'écran.

### T4 · Le réagencement, par lots

Dans **la grammaire commune** du poste du meneur (en-tête, barre d'action, zone de travail), adaptée
au tactile — la maquette retenue guide, la grammaire tranche (choix de David pour le PC, 30/09).

| Lot | Écrans | Pourquoi dans cet ordre |
| :--- | :--- | :--- |
| **J1** | Accueil « Qui es-tu ? », **Direct** (fiche, jets, jauges), Inventaire, Cartes | Ce que le joueur touche à chaque tour |
| **J2** | Archives (indices), PNJ, Lieux, notifications, messagerie | Ce qu'il consulte |
| **M1** | Pads, Dés, Combat, ligne d'état, Couper le son | Ce que le meneur touche en pleine scène |
| **M2** | Sons, Scénario, Tableau, Notes, Messages | Le reste |

Le réagencement de T4 inclut les étoiles de feedback et les commandes des réserves : rendre
leurs cibles tactiles d'au moins 44 × 44 px, sans figer ici leur future disposition.

Chaque lot comprend : ses essais e2e **relancés après chaque écran** (pas seulement les captures),
ses captures aux trois tailles, et les guides concernés — **60** (tablette du meneur), **61** et
**62** (tablette des joueurs), avec les captures du manuel régénérées.

**Sortie de chaque lot** : essais verts, captures regardées, guides relus — puis **une séance
jouée** avec le lot avant d'ouvrir le suivant.

### T5 · Le fini

Halos, anneau de focus, transitions — la phase 5 du PC, appliquée aux tablettes. Les icônes du jeu
y arrivent déjà par T1.

### T6 · L'épreuve en séance

Sur **les vrais appareils** des joueurs — un iPad Air, un téléphone, une tablette Android — et le
pupitre. Ce qui ne se voit qu'à la table : la lisibilité à bout de bras, le pouce sur un bouton, le
clavier de Safari, la reconnexion après une mise en veille.

**Sortie** : David déclare la refonte des tablettes terminée.

---

## 6 · Les règles du chantier

- ⛔ **« GM-OS tourne-t-il ? » avant toute modification de `src/` ou `electron/`** (`AGENTS.md`).
- ⛔ **Aucune donnée du meneur dans une capture** : la campagne de démonstration seulement.
- ⛔ **Pas de déplacement hors de T4.** T2 rhabille, T4 réagence — *David a trouvé à l'écran chacun
  des défauts nés d'un déplacement* (plan de la refonte, § 12).
- **Pas de bibliothèque de composants tierce**, pas d'injection de CSS de jeu.
- **Un commit par écran** en T4, pour qu'un écran raté se reprenne seul.
- **Le pré-push ne lance pas les e2e** : les relancer soi-même avant de pousser un lot.

---

## 7 · L'état

| Phase | État |
| :--- | :--- |
| T0 · État des lieux | 🔄 **Relevé complet sur les deux surfaces** : [joueurs, 54 captures et 39 scénarios](2026-10-04-T0-tablette-joueurs.md) ; [meneur, 68 captures et 44 scénarios](2026-10-05-T0-tablette-meneur.md). Le banc MJ compte 40 réussites ordinaires et 4 échecs attendus. Défauts connus au § 1 bis du registre ; sortie stricte encore à arbitrer. David a ouvert T1 malgré ces défauts. |
| T1 · Le thème voyage | ✅ **Implémenté le 05/10** : [relevé T1](2026-10-05-T1-apparence-tablettes.md), thème de base, accent, personnalités, jetons et icônes du jeu sur les deux tablettes ; reconnexion et bascule en moins d'une seconde éprouvées en E2E. Les polices du jeu sont incorporées sur le PC et diffusées localement quand leur source est disponible. |
| T2 · Habillage par le socle | ✅ **Terminé le 05/10 sur les deux tablettes** : [joueurs](2026-10-05-T2-tablette-joueurs.md), [meneur](2026-10-05-T2-tablette-meneur.md). Boutons, panneaux, étiquettes et en-têtes passés au socle à apparence conservée ; 39 scénarios joueurs et 44 meneur passent, et les 122 captures T0 ont été comparées aux captures T2. À 390 px, la navigation joueurs défile sur une ligne avec indice visible et onglet actif ramené à l'écran ; les actions d'inventaire restent accessibles au-dessus d'elle. Les étoiles de feedback et les commandes des réserves gardent leur disposition actuelle ; leurs cibles de 44 × 44 px sont reportées à T4 par décision de David. Les défauts fonctionnels de T0 restent consignés au registre. |
| T3 · Maquettes Stitch | ✅ **Terminé et retenu le 06/10** : David, « ok c'est bon pour moi, est-ce que t3 est fini ? ». Neuf écrans joueurs et huit onglets meneur, leurs états et les six vues des Notes ; références corrigées dans [tablettes-joueurs](stitch/tablettes-joueurs/README.md) et [tablette-meneur](stitch/tablette-meneur/README.md). [Galerie J1/J2](tablettes/T3-propositions/index.html), [galerie M1/M2](tablettes/T3-meneur-propositions/index.html), 36 contrôles joueurs et 40 meneur, copies vérifiées par SHA-256. |
| T4 · Réagencement (J1, J2, M1, M2) | 🔄 **Demandé le 06/10** : « commit et push T3, met à jour la documentation, et commence T4 ». Premier écran : accueil « Qui es-tu ? », lot J1 ; code à modifier après confirmation que GM-OS est fermé. Un écran vérifié à la fois, séance jouée avant le lot suivant. |
| T5 · Le fini | ⏳ |
| T6 · Épreuve en séance | ⏳ |

*L'état se tient ici et au § 123 du registre — jamais dans une mémoire de session.*
