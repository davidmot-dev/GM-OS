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
>
> ⛔ **Et rien devant.** `1d66` est une formule valide, mais c'est un dé **ordinaire à 66 faces** :
> les deux tiers des jets tombent alors sur des valeurs qu'aucune entrée ne couvre. C'est le défaut
> qui a coûté deux tables jusqu'au 2026-09-15. L'Atelier propose ces dés dans une liste, ce qui rend
> la faute impossible à écrire.

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

### 0. L'Atelier des tables (le plus court chemin)

Bouton **Atelier des tables**, en haut de la colonne de gauche. Il écrit le fichier JSON pour vous.

- **Choisissez un univers**, ou tapez-en un nouveau : *un univers naît avec sa première table.*
- **Le dé se choisit dans une liste.** Un champ libre reste à côté pour les formules rares.
- **La bande colorée, sous le titre, est la raison d'être de cet écran.** Une case par valeur que le
  dé peut sortir : **verte** si une entrée la couvre, **rouge** si aucune, **ambre** si deux s'en
  disputent. Survolez une entrée : sa part s'éclaire.
- **Découper** répartit la portée du dé sur les entrées existantes, sans trou ni recouvrement.
- **Ranger** trie les entrées par borne basse.
- **Essayer** tire sur la table sans quitter l'atelier.
- **Enregistrer** écrit le `.json` au bon endroit. Si la table a des trous, on vous le demande une
  fois — *vous travaillez peut-être par étapes.*

> ⛔ **Pourquoi cette bande compte plus que le reste de l'écran.** Un trou de couverture est
> **invisible** quand on relit un fichier : les bornes se suivent, chaque entrée est plausible. Et à
> la table, il ne produit **aucune erreur** — il produit un résultat plausible et faux, parce que le
> moteur rend l'entrée la plus proche sans le dire.
>
> Deux tables livrées avec GM-OS étaient dans ce cas jusqu'au 2026-09-15. `blessures_critiques`
> déclarait `1d66` au lieu de `d66` : **45 % de ses jets ne tombaient sur aucune entrée**, et un 17
> rendait l'entrée 66 — la pire blessure du jeu. Les deux sont corrigées, et un contrôle refuse
> désormais qu'une table trouée soit livrée.

### 0 bis. Importer une table de manuel

Bouton **Importer**, en bas de l'atelier. Vous pouvez soit **coller du texte**, soit **ouvrir un
fichier** — JSON, Markdown, texte, CSV, PDF ou image.

| Ce que vous avez | Ce qui se passe |
| :--- | :--- |
| Une **table JSON** (celle que ChatGPT vous rend avec le prompt livré) | Reconnue toute seule, **avec son nom et son dé** |
| Un fichier `.md`, `.txt`, `.csv` | Son contenu arrive dans la zone de collage |
| Un **PDF** | Son texte est extrait et arrive dans la zone |
| Une **image** de page de manuel | Elle s'annonce à côté — **seule l'IA peut la lire** |

> 🔎 **Le texte d'un fichier arrive dans la zone plutôt que d'être rangé directement.** C'est voulu :
> vous voyez ce qui a été lu avant de le ranger, et un PDF mal extrait se corrige à la main.

Ensuite, deux boutons s'offrent :

- **Ranger tel quel** : lecture déterministe, hors ligne. Chaque ligne devient un **titre**, entier.
  Une ligne sans numéro qui en suit une numérotée devient sa **description** — c'est la forme des
  manuels, un résultat puis son paragraphe.
- **Ranger par l'IA** : le modèle répartit titre, ambiance et effet. Il **propose** ; la bande de
  couverture relit derrière lui avant que vous n'enregistriez.

L'aperçu **compte avant d'appliquer** : « 20 entrées lues · 1 ligne non rattachée », et il vous
montre les lignes qu'il n'a pas su placer plutôt que de les avaler.

Si votre texte ne porte aucun numéro — une simple liste de résultats —, les bornes sont **calculées
sur le dé** de la table. Une liste de six lignes sur un `1d6` donne 1, 2, 3, 4, 5, 6 ; sur un `d66`,
elle donne des bornes que le dé peut réellement sortir.

> ⚠️ **L'import remplace les entrées de la table**, on vous le demande une fois. Un JSON importé pose
> aussi **le dé** ; il ne remplace pas le **nom** si vous en avez déjà tapé un.

> ⭐ **L'image marche en local, avec Ollama** — depuis le 2026-09-15. Il faut un modèle qui déclare
> savoir voir : `gemma4:12b` et `gemma4:26b` le déclarent, `phi3` et `llama3.2:3b` non. Gemini
> fonctionne aussi. **Rien d'autre** : Claude et les moteurs personnalisés reçoivent le texte seul.
>
> Le bandeau de l'image vous dit lequel des trois cas vous êtes, **avant** d'envoyer :
> *« gemma4:12b voit »*, *« ce modèle ne voit pas »*, ou *« vision incertaine »*. Dans le deuxième
> cas GM-OS refuse — un modèle qui ne voit pas répondrait quand même, en **inventant** la table.
>
> ⚠️ **Ce chemin n'a jamais été essayé en vrai**, ni ici ni ailleurs dans GM-OS : aucune image n'a
> encore été envoyée à un modèle. C'est la première chose à vérifier si vous vous en servez.

> 🔎 **Et le PDF, lui, n'appelle aucun modèle.** Son texte est extrait sur votre machine, et
> « Ranger tel quel » est entièrement local. Un modèle n'intervient que si vous choisissez « Ranger
> par l'IA ».

> 🔎 **Si vous collez une table de `1d20` dans une table réglée sur `1d6`**, la bande ne montrera
> aucun trou — les six valeurs sont couvertes par les premières entrées. Ce qu'elle dira, c'est que
> *quatorze entrées sur vingt ne sont atteignables qu'avec un modificateur*. C'est le signe qu'il
> faut changer le dé, pas la table.

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
