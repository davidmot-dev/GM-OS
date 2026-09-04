# Walkthrough : Éditeur de Taxonomy Tactique

J'ai implémenté un éditeur complet pour gérer la taxonomie du Cortex Tactique directement dans les paramètres de l'OS.

## Changements Majeurs

### 1. **Moteur de Taxonomy Persistant**
- Création de `useTaxonomyStore.ts` : La taxonomie n'est plus un simple fichier JSON statique. Elle est maintenant gérée par un store Zustand avec persistance automatique dans le `localStorage`.
- Vos modifications survivent aux rafraîchissements de page et aux mises à jour.

### 2. **Interface de Navigation dans les Paramètres**
- Refonte de `GlobalSettingsModal.tsx` : Ajout d'une barre latérale pour naviguer entre les paramètres **Système** et **Tactique**.
- Design cohérent avec le reste de l'OS (effets de flou, dégradés, typographie premium).

### 3. **Éditeur de Règles Tactiques**
- **Sélecteur de Couleur** : Interface native pour choisir la couleur des alertes Hue.
- **Contrôle d'Intensité & Priorité** : Curseurs et boutons pour ajuster finement l'impact de chaque règle.
- **Gestion Audio** : Menus déroulants pour lier des effets sonores (target lock, alarmes) et des ambiances contextuelles.
- **Mots-clés Dynamiques** : Système de tags pour ajouter ou supprimer des déclencheurs textuels.

## Galerie de l'Implémentation

L'écran est décrit par [TacticalTaxonomyEditor.tsx](../../src/modules/tactical-ai/components/TacticalTaxonomyEditor.tsx).
> *Note : L'éditeur permet une prévisualisation immédiate des couleurs et des tags.*

## Vérification de la Persistance
1. Allez dans les paramètres OS.
2. Onglet **Tactique**.
3. Modifiez la couleur d'une règle (ex: Feu en Jaune).
4. Rafraîchissez l'OS.
5. La règle est conservée.

---
**Félicitations** : Vous avez maintenant le contrôle total sur la manière dont le Cortex réagit à votre narration !
