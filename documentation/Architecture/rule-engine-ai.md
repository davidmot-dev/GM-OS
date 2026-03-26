# 🧠 Guide Technique : Moteur de Règles & Résonance IA

Ce document détaille l'architecture du système de jeu et de l'intégration AI dans GM-OS v5.

## 1. Philosophie "Brain vs Body"

L'architecture sépare strictement le visuel de la logique métier :

* **Le Corps (SheetTemplate)** : Définit l'interface utilisateur (champs, jauges, sections, icônes). Il est purement visuel.
* **Le Cerveau (GameDriver)** : Définit l'intelligence du système (dés, calculs) et la personnalité de l'IA (Personas, instructions, NotebookLM).

### Pourquoi cette séparation ?

Cela permet à un même moteur de règles (ex: D&D 5e) de piloter plusieurs fiches différentes (PJ, PNJ, Montures) tout en conservant la même compréhension des règles.

## 2. Structure des Données

### GameDriver (`src/types/drivers.ts`)

```typescript
interface GameDriver {
    id: string;
    name: string;
    templateId: string; // Lien vers le visuel par défaut
    
    // Logique de jeu
    dice: { defaultDice: string; logic: DiceRollLogic };
    
    // Intelligence Artificielle (Hybrid Stack)
    aiInstructions: string;    // Prompt global MJ/Oracle
    aiPersonas: Record<string, string>; // Surcharges par rôle (Sage, Scribe...)
    defaultNotebookUrl?: string; // Lien vers le savoir externe (NotebookLM)
    aiProvider: 'ollama' | 'gemini' | 'openai'; // Choix du moteur
    aiVoiceProfile?: string;   // Profilage vocal spécifique
}
```

## 3. Système de Surcharges (Shadow Drivers)

GM-OS protège les systèmes officiels (lecture seule). Lorsqu'un utilisateur modifie l'IA d'un système natif :

1. **Détection** : Le système vérifie si le Driver est `builtin`.
2. **Clonage** : Si oui, un "Shadow Driver" (Driver Custom) est créé à la volée.
3. **Persistance** : Les modifications sont enregistrées dans le store local de l'utilisateur.
4. **Priorité** : Au lancement d'une session, GM-OS privilégie toujours le Driver Custom sur le Driver Natif.

## 4. Points d'Accès Éditeurs

L'architecture propose deux points d'entrée pour maintenir la cohérence :

* **Éditeur de Système (Library > Drivers)** : Configuration globale et technique du moteur.
* **Éditeur de Résonance (Library > UI > Résonance)** : Configuration contextuelle de l'IA. Bien qu'affiché dans la partie UI, cet éditeur modifie en réalité le Driver lié pour assurer que "l'IA suit la règle".

## 5. Flux de Synchronisation (Forge)

Lorsque le **System Forge** analyse un document :

1. Il génère un `SheetTemplate` (la fiche).
2. Il génère un `GameDriver` initial (les dés et le prompt MJ).
3. Il lie les deux via `templateId`.
4. L'utilisateur peut ensuite enrichir ce Driver via les interfaces d'édition pour affiner la voix de l'IA ou les liens NotebookLM.

## 6. Gemini CLI & Assistant Terminal

Le module **Gemini CLI** (`@google/gemini-cli`) est intégré en tant qu'outil de développement de bas niveau :

- **Contexte Projet** : Le CLI a accès aux dossiers `documentation/` et `src/modules/` via le script `scripts/gemini-bridge.js`.
- **Automatisation** : Utilisé pour générer des fichiers de structure (ex: `WeatherLayer.tsx`) ou analyser la cohérence entre les Drivers et l'UI.
- **Vision de l'Oracle** : Extension narrative utilisant l'IA pour synthétiser l'état spatial (Map) et tactique (Combat).
- **Accessibilité** : Commandes disponibles via `npm run gemini` et `npm run gemini:doc`.

## 7. Gestion des Factions (Smart Mapping)

L'architecture v5 introduit un mapping intelligent des allégeances entre les modules :
- **NPC Gallery (Role)** -> **Combat OS (Faction)** : Conversion automatique des types de PNJ en allégeances tactiques (Allié, Hostile, Neutre).
- **Combat OS** -> **Map OS (Oracle)** : Transmission de l'état de santé et de la faction pour une narration contextuelle et des conseils tactiques.

## Contact Technique

Dernière mise à jour : Mars 2026
