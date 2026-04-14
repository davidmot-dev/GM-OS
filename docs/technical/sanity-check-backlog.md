# Sanity Check Backlog : GM-OS v6 Stabilization

Ce document suit l'audit et la stabilisation chirurgicale des modules v5 pour garantir leur robustesse dans la v6.

## 🔴 Priorités Immédiates (Audit en cours)

### 1. Intelligence Artificielle (Cortex)
- **Criterions** : [TYPE], [BRDG], [DECP], [TEST], [SECU]
- **Statut** : ✅ **Corrigé**
- **Actions effectuées** :
    - [x] **Gestionnaire d'État (useAIStore)** : Fix bug saisie clé API.
    - [x] **RAG Engine (Cortex)** : Stabilisation lecture PDF, alignement Obsidian Vault et indexation ciblée (Système/Campagne).
    - [x] **Refacto Backend** : Centralisation des handlers IA/Ollama hors du `main.ts`.

### 2. Sécurité & Bridge
- **Criterion** : [SECU]
- **Statut** : 🟡 Audit Partiel
- **Prochaine Action** : Vérifier les permissions d'accès aux fichiers via le bridge (SecurityManager).

## 🟢 ÉVALUÉS & STABLES (v6-Ready)

| Module | Statut | Commentaire |
| :--- | :--- | :--- |
| **Tactical-AI** | 🟢 OK | Découplage v6 effectué. |
| **Cortex (RAG)** | 🟢 OK | Stabilisation et liaison Obsidian OK. |

## 🏃 Flux de Travail
1.  **Analyse** : Ouvrir le module, vérifier les 5 critères de base.
2.  **Plan de Correction** : Si des défauts sont trouvés.
3.  **Correction** : Application des changements.
4.  **Validation** : Mise à jour du statut dans ce fichier.
