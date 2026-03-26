# 📔 Lessons Learned : GM-OS v5

## 🛠️ Technique : Gestion des Médias dans IndexedDB

### Le défi des Orphelins
**Problème :** L'utilisation de `m-xxx` IDs rendait difficile la détection des fichiers inutilisés car ils sont dispersés dans plusieurs stores Zustand et bases de données locales.
**Solution :** L'implémentation d'un service centralisé (`MediaCleanupService`) collectant récursivement les IDs depuis tous les états globaux avant de comparer avec l'index physique. 
**Apprentissage :** Pour des systèmes avec de nombreuses références croisées, il est plus sûr de construire une "whitelist" (Set) exhaustive au runtime plutôt que d'essayer de suivre chaque suppression.

## 🎨 UI/UX : Performance & Animations Vocales

### Styles Inline vs Variables CSS
**Problème :** Le linter rejette les styles inline, mais les animations basées sur des niveaux sonores (`voiceLevel`) nécessitent des mises à jour à 60fps.
**Solution :** Utiliser des variables CSS (`--voice-scale`) injectées via le prop `style` de React. Les calculs sont faits côté JS, mais le rendu est géré par le moteur CSS via des classes utilitaires dans `index.css`.
**Apprentissage :** C'est le meilleur compromis entre "Zéro style inline" (standard de code) et performance (éviter les re-renders massifs de classes Tailwind).

## 📚 Documentation Continue

### Règle du "Dernier Pas"
**Problème :** La documentation est souvent oubliée après l'implémentation.
**Solution :** Nouvel ajout aux `instructions.md` imposant la mise à jour systématique du README, des guides techniques et de l'historique avant de clore une tâche.
**Apprentissage :** L'archivage systématique des walkthroughs dans `docs/history/` permet de garder une trace claire de l'évolution du projet sans polluer l'espace de travail actif.

## 🧠 Store & Reactivity : Édition de Drivers Système

### Fork-on-Edit pour Drivers Immuables
**Problème :** Les drivers intégrés (`blade-runner-v2`, `alien-yze`, etc.) sont immuables. Tenter de les modifier dans `RuleEngineEditor` ne produisait aucun effet car le store ne mettait à jour que les `customGameDrivers`.
**Solution :** Implémentation d'une logique "Fork-on-Edit" dans le `useSessionOSStore`. Si une mise à jour cible un ID inexistant dans les drivers personnalisés, le store crée automatiquement une copie (fork) du driver par défaut et y applique les changements.
**Apprentissage :** Toujours prévoir un mécanisme de "Shadow Copy" ou "Fork" lors de l'édition de templates globaux pour garantir la persistance sans corrompre les fichiers source.

### Réactivité des Sélecteurs Zustand
**Problème :** L'usage de `useMemo` avec une fonction stable du store (`getGameDriver`) empêchait le re-render. Le composant voyait toujours le même ID et la même fonction, ignorant que les données à l'intérieur du store avaient changé.
**Solution :** Utiliser un sélecteur Zustand explicite qui déstructure les dépendances directes (`customGameDrivers`) pour "forcer" l'abonnement du composant aux changements de données, et non juste à l'action.
**Apprentissage :** Dans Zustand, si une action de lecture (`getXXX`) utilise `get()` en interne, elle n'est pas réactive par nature. Le sélecteur du composant doit explicitement toucher aux propriétés de données (Data Props) pour déclencher une mise à jour de l'UI.

---
*Dernière entrée : 2026-03-26*
