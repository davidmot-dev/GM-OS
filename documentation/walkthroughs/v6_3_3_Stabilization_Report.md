# GM-OS v6.3.3 : Final Stabilization & Bridge Resilience

Cette mise à jour marque la fin de la vague de stabilisation intensive de GM-OS v6. Elle apporte des correctifs critiques sur la persistance sécurisée et boucle l'audit de santé de l'ensemble des modules.

## 🛠️ Audit de Santé Final (Sanity Check)

Les derniers modules du backlog ont été mis aux normes v6 :

### 1. Forms/Forge (IA Narrative)
- **Découplage MCP** : Toute la logique d'appel aux serveurs NotebookLM a été extraite de l'UI vers `ForgeService.ts`.
- **Robustesse** : Implémentation de `callMcpTool` avec gestion automatique du `refresh_auth` et stratégie de retry.
- **Tests** : Couverture unitaire validée via `ForgeService.test.ts`.

### 2. Debug & Logs
- **Persistance** : Correction de la conservation des filtres de log dans le `localStorage`.
- **Performance** : Optimisation de l'interception de la console pour éviter les ralentissements lors des phases de combat intenses.

## 💡 Light-OS : Résolution de l'Appairage Persistant

Un problème majeur causait la perte de l'appairage avec le pont Philips Hue au redémarrage.

### Analyse & Correction
- **Race Condition** : Le hook d'auto-connexion s'exécutait avant que le jeton sécurisé n'ait fini d'être récupéré depuis le trousseau système (Keychain).
- **Solution Appliquée** : 
    - Le hook `useHueAutoConnect` est désormais réactif au changement du token.
    - Ajout d'une gestion d'erreur `UNAUTHORIZED` : si le pont révoque le jeton, GM-OS nettoie proprement l'état au lieu de boucler dans le vide.
    - Intégration de logs de diagnostic clairs (`🔐 Syncing with keychain...`) pour le support technique.

## 📊 Résumé de la Version 6.3.3
- **Version** : `6.3.3` (Stable).
- **Statut Sanity Check** : 100% des modules validés (✅ Corrigé).
- **Nouveaux Tests** : Ajout de la suite de tests `ForgeService`.
- **Infrastructure** : Standardisation complète du protocole `appBridge`.

---
> [!TIP]
> Si vous perdez à nouveau la connexion Hue, vérifiez la console pour le message `Token is invalid`. Cela signifie que le bouton de liaison physique du pont doit être pressé à nouveau.

*Signé : GM-OS Core Development Team - 16 Avril 2026*
