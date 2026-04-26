# Jalon : Stabilisation de la Localisation - Forge de Règles
**Date :** 18 Avril 2026
**Statut :** 🟡 En cours

## Objectifs
- Résoudre les erreurs de "label not found" dans l'éditeur de moteur de règles.
- Harmoniser les clés entre `fr/modules.json` et `en/modules.json`.
- Supprimer les chaînes codées en dur dans `useRuleEngine.ts`.

## Progrès
- [x] Audit des clés i18n dans `RuleEngineEditor.tsx`.
- [x] Identification de la structure `session` racine dans les JSON.
- [ ] Migration des chaînes de `useRuleEngine.ts`.
- [ ] Correction du mismatch `ai_placeholder`.
- [ ] Validation finale multi-langue.

## Notes Techniques
L'application utilise une structure imbriquée `modules:session.rule_engine_editor`. Toute nouvelle clé doit être insérée sous cet objet pour être résolue correctement par `i18next`.
