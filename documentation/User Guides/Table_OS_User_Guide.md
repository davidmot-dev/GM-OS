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

## 🔗 Intégration avec Session-OS
Chaque tirage peut être envoyé directement dans le log de votre session actuelle :
- Cliquez sur **"Envoyer au Log Session"** sous un résultat.
- Le texte (Titre, Roll, Description, Effet) sera ajouté aux "GM Secrets" de la session active pour référence future.

---

> [!TIP]
> **Modificateur de Jet** : N'oubliez pas le champ "Modificateur". Si vous avez un bonus de +2 à la chance, entrez "2" pour décaler tout le tirage vers les résultats les plus élevés de la table !
