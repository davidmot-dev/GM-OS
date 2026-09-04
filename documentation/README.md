# 📚 La documentation de GM-OS

**306 documents.** Cette page dit lequel ouvrir, et surtout **lequel ne pas croire sur parole**.

---

## ⛔ D'abord, la règle qui évite les faux départs

> **L'état du projet ne vit PAS dans cette documentation.** Il vit dans la **section ⭐** de
> [`Planning/2026-08-23-chantiers-gares.md`](./Planning/2026-08-23-chantiers-gares.md) — le registre —
> et il s'y vérifie **dans le code** avant d'être annoncé.
>
> *Une liste de ce qui reste, qui existe à deux endroits, en désigne un faux.* Tout le reste de ce
> dossier décrit **ce qui a été construit un jour**, pas ce qui tourne aujourd'hui.

Trois pages tiennent l'état courant :

| Page | Ce qu'elle dit |
| :--- | :--- |
| [⭐ Registre des chantiers](./Planning/2026-08-23-chantiers-gares.md) | **La seule liste de ce qui reste**, avec les ancres de code de ce qui est clos. |
| [État & reprise du jour](./Planning/2026-09-04-etat-et-reprise.md) | Par quoi reprendre, et ce qu'il ne faut pas repayer. Un par journée de travail. |
| [Leçons apprises](./Lessons_Learned.md) | Les défauts qui ont coûté cher, et la règle qu'ils ont laissée. **À lire avant de recommencer un module.** |

---

## 🧭 Les cinq sortes de documents

Elles ne se lisent pas de la même façon. La confusion entre elles est la première source de perte
de temps dans ce dossier.

| Dossier | Nature | Comment le lire |
| :--- | :--- | :--- |
| [**User Guides**](./User%20Guides/00_Documentation_Index.md) | *Comment on s'en sert.* 46 guides. | Fait autorité sur les **gestes**. Peut décrire un écran qui a bougé. |
| [**Technical Docs**](./Technical%20Docs/00_Index_Technique.md) | *Comment c'est fait.* 31 documents. | Fait autorité sur les **intentions d'architecture**. En cas de doute, **le code fait foi**. |
| [**Architecture**](./Architecture/) | Vue d'ensemble, magasins d'état, feuille de route. | Le socle. Change rarement. |
| [**Planning**](./Planning/) | Les plans, les décisions, l'état du jour. 59 documents. | **Daté par nature.** Un plan dit ce qu'on voulait faire, pas ce qui existe. |
| [**Walkthroughs**](./Walkthroughs/) | Le journal des chantiers, 86 récits. | Archéologie : *pourquoi* une chose est ainsi. Jamais une description du présent. |

> ⚠️ **Un plan et une analyse ne sont pas des descriptions du produit.** Exemple vivant :
> [`analysis/Encounter_Loot_Generator_Analysis.md`](./Technical%20Docs/analysis/Encounter_Loot_Generator_Analysis.md)
> propose depuis mars une architecture de butin **qui n'a jamais été construite**. Elle porte
> désormais son avertissement en tête — mais elle n'est sûrement pas la seule.

---

## 🚪 Trois entrées, selon ce que vous venez faire

### « Je veux mener une partie avec GM-OS »

1. [Session-OS — le cockpit](./User%20Guides/Session_OS_User_Guide.md) — créer une campagne, préparer, lancer.
2. [Tablet Hub](./User%20Guides/Tablet_Hub_User_Guide.md) — ce que vos joueurs auront sous les yeux.
3. Puis, à la carte, dans [l'index des guides](./User%20Guides/00_Documentation_Index.md) : le combat,
   les dés, le son, l'IA.

### « Je veux décrire mon jeu à GM-OS »

1. [Rule Engine & la Forge](./User%20Guides/Rule_Engine_Forge_Guide.md) — le pilote d'un système.
2. [Moteur de calcul des fiches](./User%20Guides/Character_Formula_Guide.md) — les scores dérivés.
3. [Loot-OS — écrire ses tables](./User%20Guides/Loot_System_Guide.md) et
   [Table-OS](./User%20Guides/Table_OS_User_Guide.md) — le hasard et le butin.

### « Je viens toucher au code »

1. [⭐ Le registre](./Planning/2026-08-23-chantiers-gares.md) — où en est ce que je m'apprête à changer.
2. [Leçons apprises](./Lessons_Learned.md) — ce qui a déjà été payé cher sur ce terrain.
3. [Architecture modulaire de Session-OS](./Technical%20Docs/session-os-modular-architecture.md) — le
   modèle de découpage que tout module suit.
4. [Protocole anti-régression](./Technical%20Docs/anti_regression_protocol.md) — ce que le hook
   `pre-push` exigera de vous.
5. [Standards de code v6](./Planning/V6_Code_Standards.md) et
   [Standard AppBridge](./Planning/AppBridge_Architecture_Standard.md).

---

## 🚀 Migration v7 (Tauri)

Le dossier [`Migration/`](./Migration/) porte les plans de la transition vers Tauri :
[plan général](./Migration/High_Level_Migration_Plan.md),
[blueprints](./Migration/Architecture_Blueprints.md),
[état module par module](./Migration/Module_Migration_Status.md).
**Chantier en sommeil** — à lire comme un plan, pas comme un état.

---

## ✍️ Écrire dans ce dossier

- **Un nouveau module** → un guide dans `User Guides/`, ajouté à
  [son index](./User%20Guides/00_Documentation_Index.md). Un guide que l'index ne cite pas
  n'existe pour personne : c'était le cas de 22 d'entre eux avant le 2026-09-04.
- **Une décision d'architecture** → `Technical Docs/`, et une ligne dans
  [l'index technique](./Technical%20Docs/00_Index_Technique.md).
- **Ce qui reste à faire** → **uniquement** la section ⭐ du registre. Nulle part ailleurs.
- **Un défaut qui a coûté cher** → [`Lessons_Learned.md`](./Lessons_Learned.md), avec le *pourquoi*
  et pas seulement le correctif.
- **Les liens sont relatifs**, jamais `file:///` : un chemin absolu meurt au premier déplacement du
  projet — 149 liens l'ont appris le 2026-09-04.

---

*Page reconstruite le 2026-09-04 : les 149 liens cassés de la documentation sont réparés, deux
index complets couvrent les 77 guides et documents techniques, et la distinction entre « ce qui est
construit » et « ce qui était prévu » est écrite noir sur blanc.*
