# Correction des Traductions dans Campaign Editor

J'ai résolu les problèmes de labels et de placeholders non traduits dans l'interface de configuration de campagne.

## Changements effectués

### [Locales]

#### [modules.json](../../src/locales/fr/modules.json) & [en/modules.json](../../src/locales/en/modules.json)
- Renommé `gem_prompt_placeholder` en `ai_placeholder` pour correspondre à l'appel fait dans le code React.

### [Store]

#### [useGemStore.ts](../../src/stores/useGemStore.ts)
- Amélioré la fonction `syncGemsWithDefaults` pour qu'elle force la normalisation des clés de traduction (`settings:ai.gems...`) même si des données corrompues (majusocules, absence de namespace) sont présentes dans le stockage local de l'utilisateur.

### [UI]

#### [CampaignForm.tsx](../../src/modules/session/components/CampaignForm.tsx)
- Ajout d'une protection sur l'affichage des noms de Gems pour utiliser l'ID en fallback si la traduction échoue.

## Validation
- Les placeholders des champs de directives IA devraient maintenant afficher "Consignes personnalisées pour [Nom]...".
- Les noms des assistants (Le Sage, Le Scribe, etc.) devraient apparaître correctement traduits au lieu d'afficher la clé brute en majuscules.
