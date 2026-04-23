# Spécifications Techniques : Système de Fiches (Character-Sheet-OS)

Le système de fiches de personnages de GM-OS est conçu pour être à la fois modulaire (personnalisable par jeu) et persistant.

## 1. Modèle de Données

### Character (Store Client)
L'objet `Character` stocke les informations de base et un objet `sheetData` pour les champs spécifiques au jeu.
- `id`: Unique ID.
- `templateId`: Référence au template de fiche (ex: `br-v1`, `alien-v2`).
- `sheetData`: Dictionnaire de type `Record<string, any>` stockant les valeurs des champs.

### SheetTemplate (Configuration)
Défini dans `defaultSheetTemplates.ts`, il pilote le rendu de l'interface.
- `sections`: Groupes logiques de champs (Stats, Skills, etc.).
- `fields`: Définition individuelle des champs (`gauge`, `number`, `text`, `select`, `checkbox`, `rating`).

## 2. Rendu Dynamique (CharacterSheetEditor.tsx)

L'éditeur utilise une approche dirigée par les données (Data-Driven Rendering) :
1.  **Résolution du Template** : Sélection du template basé sur le `templateId` du personnage.
2.  **Mapping des Composants** : Pour chaque champ, un sous-composant React dédié est instancié (`FieldGauge`, `FieldSelect`, etc.).
3.  **Gestion de l'État Local** : `CharacterSheetEditor` utilise un état local React pour les modifications en cours avant la synchronisation avec le store global.

## 3. Évolutions Récentes (v5.2)

- **Polymorphisme des Options** : Support des options `select` sous forme d'objets `{label, value}` via l'interface `SheetFieldOption`.
- **Réduction des Plantages** : Sécurisation du rendu pour ignorer les types de données non-React (objets bruts) et garantir la stabilité de l'affichage.
- **Liaison de Documents** : Intégration du `MediaHub` pour lier des fichiers PDFs ou images directement à la fiche via `linkedDocumentIds`.

## 4. Points de Vigilance

- **Unicité des IDs** : Les `fieldId` doivent être uniques au sein d'un même template pour éviter les collisions de données dans `sheetData`.
- **Typage** : Toujours utiliser les types `SheetSection` et `SheetField` lors de la manipulation des templates pour bénéficier de l'autocomplétion et de la sécurité TypeScript.
