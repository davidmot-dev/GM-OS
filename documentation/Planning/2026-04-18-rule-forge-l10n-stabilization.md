# Jalon : Stabilisation de la Localisation - Forge de Règles
**Date :** 18 Avril 2026
**Statut :** ✅ **CLOS le 2026-08-31**
> ### 🗃️ Vérifié dans le code le 2026-08-31
>
> Ce document est un **jalon daté d'avril 2026**, pas une liste vivante. Ses cases restées vides ont
> été rouvertes une à une : ce qui était fait est coché avec son ancre, ce qui reste a rejoint la
> **section ⭐** de `2026-08-23-chantiers-gares.md`, seule liste qui fasse foi.


## Objectifs
- Résoudre les erreurs de "label not found" dans l'éditeur de moteur de règles.
- Harmoniser les clés entre `fr/modules.json` et `en/modules.json`.
- Supprimer les chaînes codées en dur dans `useRuleEngine.ts`.

## Progrès
- [x] Audit des clés i18n dans `RuleEngineEditor.tsx`.
- [x] Identification de la structure `session` racine dans les JSON.
- [x] Migration des chaînes de `useRuleEngine.ts`. ✅ **Fait** — le fichier fait 94 lignes, appelle `t()`
      six fois et ne contient **aucune** chaîne en dur.
- [x] Correction du mismatch `ai_placeholder`. ✅ **Fait** — la clé existe dans `fr/modules.json` **et**
      `en/modules.json`, aux mêmes deux chemins (`campaign_form.intelligence`, `npc_gallery`), et ses
      trois appelants visent bien ces chemins.
- [ ] Validation finale multi-langue. → **transformée en reste chiffré, section ⭐ du registre** :
      **32 clés `fr` sans équivalent `en`** et 3 clés `en` orphelines, mesurées le 31/08. *Une « validation
      finale » ne se coche jamais ; un compte, si.*

## Notes Techniques
L'application utilise une structure imbriquée `modules:session.rule_engine_editor`. Toute nouvelle clé doit être insérée sous cet objet pour être résolue correctement par `i18next`.
