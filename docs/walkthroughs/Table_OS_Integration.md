# Walkthrough : Table-OS & Moteur Aléatoire

Table-OS est le pivot de la génération procédurale dans GM-OS v5.

## ⚙️ Architecture Technique
Le module repose sur trois piliers :
- **TableEngine** : Un parser de dés robuste capable de gérer les jets standards via Regex et les jets de concaténation (d66, d666) hérités de la v3.
- **JSON File Bridge** : Une communication IPC synchrone avec le système de fichiers pour lister les "Univers" (dossiers) et charger les tables (fichiers JSON).
- **Zustand Persistence** : L'historique des tirages et la sélection actuelle sont persistés pour retrouver l'état après un redémarrage.

## 📊 Structure des Données
La force du module réside dans sa structure `TableData` qui sépare strictement :
1. **La Narrative** (`description`) : Destinée à être lue aux joueurs.
2. **La Mécanique** (`effect`) : Destinée au MJ pour l'application des règles.
3. **Le Mapping de Plage** (`min`/`max`) : Assure une résolution mathématique parfaite sans "trous" dans la table.

## 🤖 Workflow IA
Table-OS est conçu pour être "alimenté" par IA. Le fichier `Prompt Aide Création de Table.txt` sert de guide externe pour transformer n'importe quelle ressource brute de JdR en un module compatible GM-OS sans aucune ligne de code manuelle.

## ✅ Vérification
- Validation du moteur de dés avec des formules hybrides (ex: `d66`).
- Test de l'envoi de résultats vers `SessionOS` via l'injection dans les `gmSecrets`.
- Vérification du chargement dynamique des Univers depuis `databases/tables/`.
