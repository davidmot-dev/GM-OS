# Walkthrough : Personnalités Contextuelles (Gems) de l'Oracle 🎭

L'IA Oracle de GM-OS v5 est désormais dotée de 6 personnalités distinctes qui adaptent leur ton, leurs connaissances et leur style narratif en fonction de vos besoins et du système de jeu.

## 🌟 Les 6 Personnalités Implémentées

| Gemme | Rôle | Icône | Ton / Style |
| :--- | :--- | :--- | :--- |
| **Le Sage** | Expert en Règles | `BookOpen` | Technique, précis, cite les systèmes. |
| **Le Scribe** | Chroniqueur | `PenTool` | Consigne l'histoire, résume les sessions. |
| **L'Oracle** | Narrateur | `Sparkles` | Immersif, sensoriel, descriptions d'ambiance. |
| **Le Barde** | Lore & Poésie | `Music` | Épique, ballades, détails d'univers profonds. |
| **L'Alchimiste** | Générateur Technique | `Beaker` | Création d'objets, potions, stats de PNJ. |
| **L'Acteur** | Incarnation PNJ | `User` | Dialogues types, accents, motivations. |

## 🛠️ Améliorations Techniques

### 1. Injection d'Instructions (Hook useNotebookLM)
Chaque requête envoyée à NotebookLM est désormais enveloppée dans un "manteau" de consignes :
1.  **Consignes de Persona** : Récupérées depuis le `useGemStore`.
2.  **Overrides Systèmes** : Si vous jouez à *Alien RPG*, le Sage parlera comme un ordinateur de Weyland-Yutani.
3.  **Forçage de Langue** : La réponse est systématiquement demandée en français.

### 2. Interface Dynamique (OraclePanel)
L'interface utilisateur s'adapte visuellement :
- **En-tête** : Affiche l'icône et le nom de la Gemme sélectionnée.
- **Messages** : Chaque réponse de l'IA est maintenant étiquetée avec le nom du Persona (ex: "Le Sage : [...]" au lieu de "L'Oracle : [...]").
- **États à vide** : L'écran d'accueil du chat affiche la description de la personnalité pour vous guider.

## ✅ Vérification Effectuée
- **Changement de Gemme** : Le titre et l'icône changent instantanément dans le panneau Oracle.
- **Requêtes Contextuelles** : Vérification que les instructions sont bien transmises via le pont MCP.
- **Système Alien** : Test du comportement "technique" du Sage sur le driver Alien.

---
*L'Oracle est prêt à vous assister sous n'importe quelle forme, Maître du Jeu.* 🌌
