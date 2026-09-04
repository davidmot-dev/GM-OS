# ⚡ Guide : le calculateur de dégâts

Un panneau de Combat-OS qui applique un montant à plusieurs cibles d'un coup, en tenant compte de
ce que chacune encaisse.

---

## 🎯 S'en servir

**Combat-OS → Calculateur de Dégâts** (panneau de droite).

1. **Le montant.** Un bouton **DERNIER JET** reprend le total de votre dernier lancer de dés — plus
   besoin de le recopier. *Absent des guides jusqu'ici, et c'est le geste qui fait gagner le plus
   de temps.*
2. **Le type énergétique.** Magique, Physique, Feu, Froid, Foudre, Acide, Psychique, Nécrotique,
   Radiant — la liste vient du **pilote de jeu** et se modifie dans l'éditeur de règles, section
   Combat.
3. **Dégâts ou soins**, par un interrupteur.
4. **Les cibles** : cochez, ou **Tout cocher** / **Tout vider**.
5. **DÉCLENCHER**.

---

## 🛡️ Ce que le calcul applique

Avant même de valider, chaque cible affiche son **impact** prévu :

| Sur la fiche de la cible | Effet |
| :--- | :--- |
| **Immunité** au type | le montant tombe à **0** |
| **Résistance** | montant **divisé par deux**, arrondi à l'inférieur |
| **Vulnérabilité** | montant **doublé** |
| En mode soins | les PV sont plafonnés au maximum du personnage |

> [!TIP]
> **Le nom du type doit correspondre exactement.** Les listes *Résistances*, *Vulnérabilités* et
> *Immunités* de la fiche sont comparées au type choisi, mot pour mot. « Feu » et « feu » ne sont
> pas le même mot pour ce contrôle.

---

## ✨ Les statuts posés automatiquement

Selon le type, un statut peut s'ajouter tout seul. **Il y en a six**, plus le soin :

| Type contenant… | Statut | Durée |
| :--- | :--- | :---: |
| `feu` | **En feu** 🔥 | 3 tours |
| `froid` | **Gelé** ❄️ | 2 tours |
| `acide` | **Corrodé** 🧪 | 2 tours |
| `foudre` | **Choqué** ⚡ | 1 tour |
| `poison` | **Empoisonné** 🤢 | **5 tours** |
| `psychique` | **Confus** 🌀 | 1 tour |
| *(mode soins)* | **Soin** 💖 | 1 tour |

> ⛔ **Trois corrections.** Ce guide annonçait neuf correspondances : **« Nécrotique → Affaibli » et
> « Radiant → Ébloui » n'existent pas.** Les deux types existent bien dans la liste, mais aucun
> statut ne leur est attaché — ils font des dégâts, rien d'autre. Et **Empoisonné dure 5 tours**,
> pas 3.

<!-- -->

> ⚠️ **La correspondance se fait par mot contenu, pas par équivalence.** Le guide donnait
> « Froid / **Glace** » et « **Éclair** / Foudre » : seuls `froid` et `foudre` déclenchent quoi que
> ce soit. Un type que vous nommeriez « Glace » ou « Éclair » dans votre pilote **ne posera aucun
> statut**.

### Les conflits sont résolus

Poser un statut retire ceux qui l'excluent. Du feu sur une cible **Mouillée** enlève le mouillé ;
**Gelé** et **En feu** ne coexistent jamais.

---

## 🔄 Après application

Les jauges des cartes de combat se mettent à jour immédiatement, et le
[Cortex](./Cortex_OS_User_Guide.md) réévalue la situation — un adversaire à l'agonie peut faire
apparaître un conseil de repli.

Les PV modifiés en combat ne rejoignent les fiches de personnages que par le bouton
**Sync PV vers Session**, dans les contrôles de combat. → [la cohésion
Combat-OS](./combat_os_cohesion_guide.md)

---

*Guide révisé le 2026-09-04, code à l'appui. Trois affirmations fausses retirées : deux statuts
automatiques inventés (Nécrotique, Radiant), une durée erronée (Empoisonné, 5 tours et non 3), et
deux alias de type qui ne déclenchent rien (« Glace », « Éclair »). Ajouté : le bouton **Dernier
jet**, et les libellés réels des boutons.*
