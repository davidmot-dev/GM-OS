# Accélération IA — ce qui reste, et dans quel ordre

**Nature de ce document : référence vivante, et la SEULE autorité sur l'état des axes restants.**
Le plan du 2026-08-07 (`2026-08-07-acceleration-ia.md`) reste l'autorité sur **ce qu'est** chaque axe —
son diagnostic, ses mesures, ses arbitrages. Celui-ci dit **où on en est et par quoi commencer**.

> *Un reste vit à un seul endroit, et les autres y renvoient* — règle 2 du § 7 de
> `2026-08-19-reconciliation-plans-aout.md`. **Cocher ici, et nulle part ailleurs.**

**Créé le :** 2026-08-22, après la relecture du plan que le plan lui-même réclamait.
**Chaque état ci-dessous a été vérifié dans le code**, jamais recopié d'un document.

---

## 1. Ce qui est fait — et pourquoi le compter

| Axe | | Quand |
| --- | --- | --- |
| **A** — activer l'iGPU | ✅ | 12/08 |
| **B** — réparer le RAG | ✅ | 09/08 |
| **C** — ordre du prompt et contexte du Cortex | ✅ | 21/08 |
| **D** — annulation, verrou, plafonds | ✅ | 21/08 |
| **E.1-E.2** — la voie Ollama | ✅ | 21/08 (E.3 est **caduc** : `ChronicleService` n'existe plus) |
| **F.3** — les appels en partie qui portaient le RAG complet | ✅ | 21/08 |
| **H** — les canevas | ✅ | **déjà fait**, découvert le 22/08 |
| **I** — inverser la chaîne NotebookLM | ✅ | **déjà fait**, découvert le 22/08 |
| **K** — découper les Forges | ✅ | **déjà fait**, découvert le 22/08 |
| **L** — index des livres | ✅ | **déjà fait**, amélioré le 21/08 |
| **O** — la boucle de revue | ✅ | 22/08, ses cinq points |

**Quatre axes chiffrés à dix-huit heures étaient déjà faits** — H, I, K, L — par les chantiers de Forge,
sans jamais avoir été rapportés à ce plan. *Deux plans qui avancent sans se regarder finissent par se
croire en retard l'un sur l'autre.* C'est pourquoi cette colonne existe : pour ne pas les redécouvrir une
troisième fois.

---

## 2. Ce qui reste — six axes, ~26 h

### ⬜ E.4 — le plafond de texte de la Forge · *petit*

`MAX_TEXT_CHARS = 100 000` est **écrit en dur** (`ForgeService.ts:144`), sans lien avec le `num_ctx` réel
du modèle.

- [ ] Le plafonner sur le `num_ctx` effectif
- [ ] **Avertir à l'écran** quand un document est écarté

> C'est la **dernière troncature muette** du chemin IA : les autres sont tombées le 21/08. Une
> troncature qui ne se dit pas produit une réponse fondée sur la moitié d'un livre, et rien ne le
> signale.

### ⬜ F — brancher le mode · *~3 h · F.3 déjà fait*

Le signal « une séance est ouverte » existe depuis toujours et ne décide encore que des **plafonds de
temps**.

- [ ] F.1 — `AIService` en dérive aussi le **contexte, le fournisseur, le moteur d'image**
- [ ] F.2 — généraliser le motif du générateur de butin : *le choix de contexte visible et
      surchargeable, pas caché*
- [ ] F.4 — jamais de diffusion locale en partie (cloud direct pour les images)
- [ ] F.5 — **afficher le mode là où il agit**, pas seulement dans le cockpit

> F.5 porte sa propre justification : *si la Forge se comporte différemment parce qu'une session est
> ouverte, c'est la Forge qui doit le dire, avec le moyen de passer outre. Sinon on recrée l'action à
> distance qu'on cherche à éviter.*

### ⬜ G — la pause de séance · *~2 h · son prérequis est levé*

Un bouton pause avec chronomètre : la pause **lève les plafonds de partie**, la reprise récupère l'IA.

- [ ] Un champ `pausedAt`, **et pas un quatrième statut** — cinq composants testent
      `status === 'active'`, et un statut `paused` les ferait tous croire la séance absente
- [ ] À la reprise : **finir la passe en cours**, abandonner la file, prévenir
- [ ] Plafonner par le **temps de pause restant** — « pause de 15 min : cette Forge en demande 4, on y va »
- [ ] Le chronomètre, qui vaut le coup **même sans l'IA**

> Sa seconde raison d'être — « couper à la reprise » suppose des passes — est **levée** : l'axe K est
> fait.

### ⬜ J — sélecteur de moteur par Forge · *~4 h*

**Arbitrage de David : cloud accepté pour les Forges, choix explicite à chaque lancement**, jamais de
bascule automatique.

- [ ] Un `provider` passé à l'appel, qui court-circuite le fournisseur global **sans le modifier**
- [ ] Le badge moteur devient un sélecteur, avec estimation de durée
- [ ] Idem dans `ForgeDashboard` (attention à la plomberie partagée, § 8 du plan)
- [ ] Mémoriser le dernier choix par Forge, mais **toujours l'afficher**

> L'Oracle et le Cortex n'en ont pas besoin : depuis les axes A à C, le local tient leur budget.

### ⬜ M — l'Oracle bibliothécaire · *~6 h · chantier de fond*

Quatre étages, du moins coûteux au plus coûteux.

- [ ] 1 — **la fiche**, sans invoquer aucun modèle
- [ ] 2 — à défaut, **la référence dans le livre** (« p. 142, section Ivresse ») ; ouverture du PDF en
      secours ou sur demande, **jamais dans le chemin critique**
- [ ] 3 — à défaut, **un jugement de table** en deux lignes
- [ ] 4 — **le journal des lacunes**

Les quatre exigences du *ruling*, qui ne se négocient pas :

| | |
| --- | --- |
| **Deux lignes maximum** | *la longueur est le signal* : une réponse courte se lit comme une proposition, une longue comme une autorité |
| **L'étiquette AVANT le contenu** | placée après, elle arrive quand le meneur a déjà adopté la réponse |
| **Aucune citation, aucun numéro de page** | un ruling qui cite a l'apparence d'une règle ; *l'absence de source EST l'information* |
| **Versé au journal des lacunes** | un ruling est par définition une fiche manquante |

> **Le journal des lacunes est « la meilleure idée du lot »** selon le plan : les sujets à forger cessent
> d'être choisis à l'intuition, **l'usage réel en séance les désigne**. Deux points de conception :
> **pas de pouces haut/bas** (friction à table, jamais cliqués — une question reformulée dans la minute
> est un signal gratuit) et **regrouper avant de forger**, sinon dix questions sur l'ivresse produisent
> dix fiches au lieu d'une.
>
> **Ses trois appuis — L, H et O — sont désormais tous les trois faits.**

### ⬜ N — deux régimes d'interface · *~6 h · le plus visible, le moins urgent*

La partition existe **déjà de fait** dans `CurrentView`, et un module l'applique déjà (`session-prep` /
`session-focus`).

- [ ] 1 — **classer les vues** par affinité (préparation / partie / les deux) — quelques lignes, sert
      immédiatement la navigation
- [ ] 2 — **dédoubler `LayoutConfig`** par mode : il est déjà persisté par campagne, donc deux
      dispositions livrent l'essentiel du bénéfice pour très peu de code
- [ ] 3 — deux vues **seulement là où c'est justifié** : combat, carte, PNJ, Oracle, journal. Pas 24
      modules

> Ce qui change vraiment entre les deux modes n'est pas la liste des boutons : la **densité** (à table on
> regarde de loin, parfois debout, souvent en parlant), les **valeurs par défaut** (en préparation on
> veut choisir, en séance on veut que ce soit déjà choisi) et **ce qui est à portée de main**.
>
> *« On retrouve son atelier tel qu'on l'a laissé le samedi matin, et sa table telle qu'on l'a laissée le
> samedi soir. »*

---

## 3. L'ordre proposé, et pourquoi

| Rang | Axe | Pourquoi ici |
| --- | --- | --- |
| 1 | **E.4** | Petit, et il ferme la dernière troncature muette du chemin IA |
| 2 | **M** | C'est lui qui donne son sens à tout ce qui a été construit — et ses trois appuis viennent de tomber |
| 3 | **G** | Deux heures, un prérequis levé, et le chronomètre sert même sans l'IA |
| 4 | **J** | Du confort réel sur les Forges longues, sans dépendance |
| 5 | **F** | Le plus de plomberie pour le moins de gain immédiat |
| 6 | **N** | Le plus visible, le moins urgent — et il ne se juge qu'en jouant |

**Ce que cet ordre ne dit pas, et qui compte plus que lui** : rien de ce qui a été construit les 21 et
22 août n'a encore été vu tourner en séance. *Les onze défauts trouvés depuis le 17/08 l'ont tous été en
jouant — aucun à la lecture du code.*

---

## 4. Ce qui n'est pas dans ce plan, et qu'il ne faut pas y chercher

- **Le plafond du RAG à mesurer** (`MAX_CONTEXT_TOKENS = 4000`) — sa condition est remplie depuis le
  21/08. Il vit au § 5 de `2026-08-19-reconciliation-plans-aout.md`, avec le reste des restes.
- **Le corpus** — 194 fiches `relu: false`, 16 à régénérer, coc7 et dnd-5e vides. Même endroit.
- **Le Cortex** — ses cinq axes sont faits ; restent deux questions, dont *« fusionner les deux appels »*.
  Elles vivent dans `2026-08-07-fiabilite-cortex-combat.md`, § 5.
