# 🎲 Table-OS

**Table-OS** est le moteur de génération de contenu aléatoire de GM-OS. Il permet de gérer des milliers d'entrées (Butins, Rencontres, Météo, Oracles) et de les intégrer instantanément dans votre narration.

---

## 🖥️ Le pupitre

Colonne de gauche, dans l'ordre où on s'en sert :

| Contrôle | À quoi il sert |
| :--- | :--- |
| **Univers / Jeu** | Le dossier de tables : Alien, Blade Runner, Cthulhu Hack, MedFan, cyberpunk, générique |
| **Table Aléatoire** | Les tables de cet univers. Le dé requis s'affiche dessous — *Jet Requis : 1d20* |
| **Modificateur de Jet** | Ajouté au **résultat brut**, pas au dé |
| **Jet Manuel** + **Afficher** | ⚭ **Vous avez lancé un vrai dé ?** Tapez le chiffre et cliquez *Afficher* : la table donne l'entrée correspondante sans rien retirer |
| **LANCER** | Le tirage par GM-OS |
| **Historique Récent** | Les **dix** derniers tirages à l'écran ; cinquante sont gardés en mémoire |

> 🔎 **Le jet manuel n'était documenté nulle part**, et c'est pourtant le geste des meneurs qui
> tiennent à lancer leurs propres dés. Ajouté le 2026-09-04.

---

## 🎲 La syntaxe des dés

Table-OS lit deux familles :
- **Standard** : `1d20`, `2d6+5`, `1d100`...
- **Juxtaposés** : `d66` lance deux d6 et colle les chiffres — résultats de 11 à 66. Utile pour
  *Alien* ou *Cthulhu Hack*.

> ⚠️ **La règle exacte : un seul chiffre, répété, et seulement 4, 6 ou 8.** `d44`, `d66`, `d88`,
> `d444`, `d666`, `d888` fonctionnent. `d1010` et `d36` **non** — ils seront lus comme des dés
> ordinaires, ou pas du tout.

---

## 📦 Sous-Modules thématiques
Bien que Table-OS soit un module unique, il se décline en plusieurs "sous-modules" via ses fichiers de données :
- **Butin & Objets** : Tables de trésors avec effets mécaniques (dégâts, bonus).
- **Rencontres** : Générateurs d'ennemis ou de situations de voyage.
- **Oracles** : Prompts narratifs pour relancer l'intrigue (inspirés d'Ironsworn).
- **Météo** : Gestion des conditions climatiques et de leurs impacts.
- **PNJ & Lieux** : Listes de noms, métiers et secrets (en lien avec NPC-OS).

> 🔎 **Six univers sont livrés** : *Alien* (attaques, panique, avaries, blessures critiques),
> *Blade Runner*, *Cthulhu Hack*, *MedFan*, *cyberpunk* et *générique*. Les plus fournis sont Alien
> et MedFan.

---

## 📝 Alimenter le module (Data Ingestion)

Il existe trois façons d'ajouter du contenu à Table-OS :

### 1. Création Manuelle (JSON)
Ajoutez vos fichiers `.json` dans le dossier : `databases/tables/[Nom_de_l_Univers]/`.
Utilisez le modèle suivant (`databases/modele_table.json`) :
```json
{
    "name": "Titre de la table",
    "dice": "1d20", 
    "entries": [
        {
            "min": 1, "max": 5,
            "title": "Titre du résultat",
            "description": "Ambiance narrative...",
            "effect": "Effet mécanique ou technique..."
        }
    ]
}
```

### 2. Assistance par IA (Expert Prompt)
GM-OS inclut un prompt spécialisé pour transformer vos PDF ou vos idées en tables prêtes à l'emploi.
Localisation du prompt : `databases/tables/MedFan/Prompt Aide Création de Table.txt`.
**Méthode** : Copiez ce prompt dans ChatGPT/Gemini, puis donnez-lui une image de table de manuel. Il vous renverra le JSON exact à copier-coller.

---

## 🔗 Intégration avec Session-OS (Journal & Log)
Chaque tirage peut être envoyé directement dans le log de votre session actuelle :
- **Log Session** : envoie le texte (titre, jet, description, effet) dans le Journal de la
  session, formaté en Markdown.
- **Verser au butin** : envoie ce que l'entrée **déclare** vers le pool de Loot-OS, quantités
  résolues. Vous distribuez ensuite depuis Loot-OS, comme n'importe quel butin.
- **Proposer des objets** : s'affiche à la place du précédent quand l'entrée ne déclare rien.
  L'IA lit son texte et propose des objets, que vous relisez dans le pool avant qu'ils ne
  comptent. *On ne devine jamais des objets à partir de la prose sans vous le montrer.*

> ⭐ **Table-OS ne donne plus rien directement à un personnage** (2026-09-04). Le bouton
> « Donner à un PJ » écrivait une ligne de texte dans un champ de la fiche que **l'onglet
> Inventaire de la tablette ne regarde même pas** : l'objet donné n'apparaissait nulle part où
> le joueur cherche ses affaires. Les deux modules ne font pas le même geste — celui-ci
> *consulte*, Loot-OS *compose et distribue* — et leur point de rencontre est le **pool**.

---

## 💰 Déclarer ce qu'une entrée donne : le champ `butin`

Une entrée peut annoncer, en plus de sa prose, ce qu'on emporte. Le champ est **facultatif** :
sans lui, la table reste un pur oracle et le bouton « Verser au butin » ne s'affiche pas.

```json
{
    "min": 6, "max": 12,
    "title": "Quelques Eddies",
    "description": "Une puce de crédit non sécurisée au fond de sa poche.",
    "effect": "Gagnez +1d100 Eurodollars et 1d4 munitions pour pistolet.",
    "butin": [
        { "name": "Eurodollars", "type": "currency", "quantite": "1d100" },
        { "name": "Munitions de pistolet", "type": "item", "quantite": "1d4" }
    ]
}
```

| Clé | Rôle |
| :--- | :--- |
| `name` | Le nom de l'objet. Seule clé obligatoire. |
| `type` | `item` (défaut) ou `currency`. |
| `quantite` | Un nombre, ou une formule de dés — `1d100`, `2d6+2`. Défaut : 1. |
| `rarity`, `value`, `weight`, `description` | Facultatifs, comme sur une entrée de table du pilote. |

> ⛔ **GM-OS ne lit pas `effect` pour en tirer des objets.** Une lecture automatique de la
> prose se tromperait, et *un contrôle qui se trompe est pire qu'un contrôle absent*. Ce qui
> n'est pas déclaré n'est pas versé — sauf si vous demandez explicitement la proposition par
> l'IA, que vous relisez.

`databases/tables/cyberpunk/fouille_ganger.json` est déclarée en exemple : ouvrez-la pour voir
la forme complète.

---

> [!TIP]
> **Modificateur de Jet** : N'oubliez pas le champ "Modificateur". Si vous avez un bonus de +2 à la chance, entrez "2" pour décaler tout le tirage vers les résultats les plus élevés de la table !

---

*Guide révisé le 2026-09-04, code à l'appui. Ajouté : le **jet manuel**, qui laisse lancer un vrai
dé et n'était documenté nulle part ; la règle exacte des dés juxtaposés (un chiffre répété, et
seulement 4, 6 ou 8) ; et le fait que l'historique **montre dix tirages** là où il en garde
cinquante.*
