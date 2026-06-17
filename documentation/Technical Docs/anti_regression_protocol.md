# Protocole Anti-Régression Systématique

Ce document définit le standard de validation obligatoire de **GM-OS v6** pour tout développeur ou agent d'IA contribuant à la base de code.

---

## 📋 Le Cycle de Validation Locale

Toute modification apportée au code de production doit passer l'intégralité du cycle de validation local suivant avant d'être soumise ou validée :

```
             [Modification Locale] 
                       │
                       ▼
   [Étape 1 : Vérification du Typage (npx tsc -b)] 
                       │
                       ▼
    [Étape 2 : Analyse Statique (npm run lint)]
                       │
                       ▼
[Étape 3 : Tests Unitaires et d'Intégration (npx vitest run)]
                       │
                       ▼
   [Étape 4 : Build de Production (npm run build)]
```

---

## 🛠️ Automatisation : `npm run validate`

Pour simplifier et forcer ce cycle de validation, un script PowerShell automatisé est mis à disposition dans le projet : [validate.ps1](file:///c:/Projet_David/GM-OS-v5/scripts/validate.ps1).

### Exécution
Pour valider votre code localement, lancez simplement la commande suivante dans votre terminal :
```powershell
npm run validate
```

### Comportement du Script
- Le script exécute séquentiellement les 4 étapes.
- **Interruption immédiate** : Dès qu'une étape échoue (erreur de typage, de linteur, test en échec, ou échec du build), le script s'arrête immédiatement et retourne un code de sortie d'erreur (`Exit Code 1`).
- **Succès** : Si toutes les étapes réussissent, le script affiche un rapport global vert et retourne un code de sortie de succès (`Exit Code 0`).

---

## ⚡ Automatisation avec Git Hooks

Afin d'éviter les oublis de validation manuelle avant d'envoyer du code sur la branche commune du dépôt, un **hook de pré-push Git** est activé localement.

### Fonctionnement du Hook
Le fichier `.git/hooks/pre-push` intercepte automatiquement toute commande `git push` lancée sur votre machine. 
- Il exécute la commande `npm run validate`.
- **Succès** : Le code est valide, Git poursuit l'envoi de vos commits vers le serveur distant.
- **Échec** : Le push est immédiatement annulé, vous forçant à corriger l'erreur de typage ou le test en échec localement.

> [!TIP]
> **Contournement exceptionnel** : Si vous devez pousser vos modifications urgentes sans exécuter la validation (par exemple pour sauvegarder une branche de travail non compilée), vous pouvez bypasser le hook en ajoutant l'argument `--no-verify` :
> ```bash
> git push origin nom-de-ma-branche --no-verify
> ```

---

## 🛡️ Les Règles d'Or de l'Anti-Régression

### 1. Isolation de la Logique Métier
- **Principe** : Ne jamais intégrer de calculs de règles complexes, de gestion d'API matérielle (Web Audio, MIDI) ou d'état asynchrone complexe directement au sein des composants graphiques React.
- **Action** : Déporter systématiquement cette logique dans des classes autonomes (ex: `SoundEngine.ts`), des services ou des Custom Hooks (ex: `useHubSync.ts`). Cela permet de tester la logique de manière 100% isolée sans avoir à monter l'interface utilisateur.

### 2. Typage Strict (Zéro-Any)
- **Principe** : L'utilisation du type `any` masque les avertissements du compilateur et est la source première de régressions lors des refactorings.
- **Action** :
  - **Zéro `any`** : L'usage de `any` est strictement interdit dans toute l'application (fichiers de production et fichiers de test).
  - Utilisez des interfaces TypeScript explicites et complètes pour chaque entité, store ou paramètre.
  - En cas de donnée dynamique ou inconnue, préférez `unknown` associé à un rétrécissement de type (*type narrowing* ou *type guard*).
  - Évitez également les styles inline dans le code JSX (utilisez Tailwind ou `index.css`).

### 3. Couverture de Test Systématique
- **Principe** : Tout bug corrigé ou toute nouvelle fonctionnalité logique doit posséder sa couverture de test associée pour éviter les régressions futures.
- **Action** :
  - Chaque fichier logique (ex: `MyService.ts`) doit avoir son pendant `MyService.test.ts`.
  - Simulez systématiquement le matériel (AudioContext, WebSocket, MIDI, etc.) et le pont d'événements `appBridge` dans les configurations de test pour préserver l'isolation.
