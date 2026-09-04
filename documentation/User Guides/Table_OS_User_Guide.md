# 🎲 Guide Utilisateur : Table-OS

**Table-OS** est le moteur de génération de contenu aléatoire de GM-OS v5. Il permet de gérer des milliers d'entrées (Butins, Rencontres, Météo, Oracles) et de les intégrer instantanément dans votre narration.

---

## 🖥️ Le Dashboard Table-OS
L'interface est optimisée pour la rapidité en cours de partie :
1. **Sélecteur d'Univers (Config)** : Choisissez le système ou l'univers (ex: Alien, MedFan, Cyberpunk).
2. **Sélecteur de Table** : Affiche toutes les tables JSON disponibles dans l'univers choisi.
3. **Lanceur de Dés** : Zone centrale pour déclencher le tirage, avec gestion des modificateurs.
4. **Visualisation de Résultat** : Une carte détaillée affichant le titre, la description et l'effet mécanique du tirage.
5. **Historique** : Un journal des 50 derniers tirages pour ne rien oublier.

---

## 🎲 Moteur de Dés : Standard & Legacy
Table-OS supporte une syntaxe de dés étendue :
- **Standard** : `1d20`, `2d6+5`, `1d100`...
- **Legacy (v3/Concatenation)** : Très utile pour certains systèmes (comme *Alien* ou *Cthulhu Hack*). Exemples :
    - `d66` : Lance deux d6 et les juxtapose (résultat de 11 à 66).
    - `d666` : Juxtapose trois d6.
    - `d44`, `d88`...

---

## 📦 Sous-Modules thématiques
Bien que Table-OS soit un module unique, il se décline en plusieurs "sous-modules" via ses fichiers de données :
- **Butin & Objets** : Tables de trésors avec effets mécaniques (dégâts, bonus).
- **Rencontres** : Générateurs d'ennemis ou de situations de voyage.
- **Oracles** : Prompts narratifs pour relancer l'intrigue (inspirés d'Ironsworn).
- **Météo** : Gestion des conditions climatiques et de leurs impacts.
- **PNJ & Lieux** : Listes de noms, métiers et secrets (en lien avec NPC-OS).

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
