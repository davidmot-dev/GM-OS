# ⚔️ Analyse : Encounter & Loot Generator (v5.5)

Ce document détaille la vision technique pour l'intégration d'un générateur de butin dynamique piloté par le Rule-Engine de GM-OS.

## 1. Philosophie & Objectifs
Le but est de transformer la distribution de butin, aujourd'hui manuelle, en un processus **réactif** et **narratif** qui s'adapte au système de jeu (D&D, Cyberpunk, etc.) et au contexte de la rencontre.

## 2. Architecture Proposée

### A. Intégration au Rule-Engine (`GameDriver`)
Ajouter une section `lootConfig` au profil du système :
```typescript
interface LootConfig {
    defaultTablePath: string; // ex: "public/data/loot/generic.json"
    scalingType: 'level' | 'cr' | 'xp'; // Comment le butin s'adapte
    rollFormula: string; // ex: "1d100 + @partyLevel"
    rarityTables: Record<string, string>; // mapping niveau -> table .json
}
```

### B. Moteur Post-Combat (`Combat-OS`)
Une fois le combat terminé, un bouton "Générer Butin" permet de :
1.  **Scanner les ennemis** : Récupérer le niveau/CR total des ennemis vaincus.
2.  **Sélectionner la Table** : Piocher automatiquement dans le bon fichier `.json` basé sur la configuration du système.
3.  **Lancer le Jet** : Exécuter la formule définie dans le Rule-Engine.

### C. Narration IA via les "Gems"
Utiliser les instructions des Personas existants pour aromatiser la découverte :
*   **Cartographe** : "Sous les décombres de la chapelle, vous apercevez un reflet..."
*   **Alchimiste** : "La fiole dégage une odeur de soufre et de menthe..."
*   **Forgeron** : "L'acier de cette lame porte la facture typique des nains d'Ironhelm."

## 3. Structure des Données (.json)
Utilisation de dossiers structurés dans `public/data/loot/` :
```json
[
  {
    "id": "magic_sword_01",
    "title": "Épée du Soleil Couchant",
    "description": "Une garde en or sertie d'un rubis.",
    "effect": "+1 aux dégâts de feu",
    "rarity": "rare",
    "minRoll": 90
  }
]
```

## 4. Bénéfices
*   **Gain de temps MJ** : Plus besoin de chercher dans des livres ou des PDFs en pleine partie.
*   **Immersion** : Chaque objet devient une micro-histoire racontée par l'IA.
*   **Customisation facile** : L'utilisateur peut simplement glisser ses propres fichiers JSON dans le dossier data pour importer des milliers d'objets.

