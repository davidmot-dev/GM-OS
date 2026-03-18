# Walkthrough: AI & Obsidian Synergy

Ce guide présente la nouvelle architecture de préparation de partie dans GM-OS, centrée sur le lien entre vos notes **Obsidian** et la puissance de l'**Oracle AI**.

## 🚀 Le Workflow de Préparation

GM-OS v5 transforme la manière dont vous interagissez avec vos données de jeu.

````carousel
```mermaid
graph LR
    A[Obsidian Notes] -->|Sync| B(AI Oracle)
    B -->|Conseils| C[Maître de Jeu]
    C -->|Décisions| D[Joueurs]
    style A fill:#7e22ce,stroke:#a855f7,color:#fff
    style B fill:#0369a1,stroke:#0ea5e9,color:#fff
    style C fill:#15803d,stroke:#22c55e,color:#fff
```
<!-- slide -->
### 1. Parcourez votre Savoir
Utilisez le nouveau module **Obsidian** (✨) pour explorer vos fichiers Markdown.
- **Rendu Clair** : Lecture directe de vos scénarios.
- **Accès Instantané** : Ouvrez vos fichiers dans Obsidian pour édition en un clic.

<!-- slide -->
### 2. Nourrissez l'Oracle
Ne perdez plus de temps à rappeler le contexte à l'IA.
- **Sync One-Click** : Le bouton "Sync Oracle" injecte votre note active comme source dans NotebookLM.
- **Mémoire Vive** : L'IA répond en tenant compte de VOTRE monde et de VOS règles.

<!-- slide -->
### 3. Personnalité Adaptative
L'Oracle n'est pas qu'une base de données, c'est un assistant.
- **Switch de Persona** : Changez d'expert (Combat, Lore, Narration) via le bouton **SWITCH**.
- **Intelligence Systémique** : L'IA utilise les règles de votre Driver actif (Alien, Cthulhu, etc.) pour des conseils précis.
````

## 🛠️ Configuration Technique

### Emplacement du Vault

Par défaut, GM-OS scanne le répertoire suivant :
`C:\Users\david\OneDrive\Obsidian Vault`

### Sécurité

- **Lecture seule** : GM-OS ne modifie jamais vos fichiers Obsidian.
- **Bridge Privé** : Toutes les communications passent par le `appBridge` d'Electron.

---
> [!IMPORTANT]
> Pour que l'Oracle puisse lire vos notes synchronisées, assurez-vous que la `notebook_query` est active. Si NotebookLM redemande une authentification, utilisez le bouton **RECONNECT** dans le panneau Oracle.
