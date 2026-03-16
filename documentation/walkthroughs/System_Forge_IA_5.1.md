# ⚒️ Walkthrough: System Forge IA (v5.1 Evolution)

Cette mise à jour majeure (v5.1.0-alpha) transforme la Forge en un véritable ingénieur système capable de générer un jeu complet à partir de votre base de connaissances.

## 🍱 Context Bin (Knowledge Base)
Fini le fichier unique. Vous pouvez maintenant "stager" plusieurs documents pour former le contexte de votre système :
- **Multi-format** : Mixez des PDF de règles, des fichiers Markdown d'univers, des fichiers CSV de tables de stats et des fichiers JSON de templates.
- **Gestion Flexible** : Ajoutez ou retirez des "Scrolls" du Bin avant de lancer la forge.

## 🧠 System Forge Engine
Le nouveau mode **System Engineer** de l'IA ne se contente plus d'extraire des données :
- **Context Bin (Aetheric Bucket)** : Glissez-déposez vos fichiers (PDF, MD, JSON, TXT, CSV) pour les analyser simultanément.
- **NotebookLM Integration** : Connectez vos carnets NotebookLM pour importer directement des extraits de règles analysés par Google.
- **Unified Generation** : Génère à la fois la logique de dés (Driver) et l'interface (Template) en une opération.
- **Auto-Sync** : Lie automatiquement le Driver au Template lors de la sauvegarde.
- **Génération Cohérente** : L'IA génère simultanément le **Driver** (Logique) et le **Template** (Corps).
- **Auto-Liaison** : Les statistiques de combat détectées dans les règles sont automatiquement mappées aux champs créés dans la fiche de personnage.
- **Vérification de Formule** : Les formules d'initiative et de dés utilisent les IDs réels générés dans le même passage.

## 💾 Quench & Sync
D'un seul clic sur **"Quench & Sync System"** :
1. Le **Game Driver** est sauvegardé dans votre librairie.
2. Le **Character Sheet Template** est créé.
3. Le Driver est automatiquement lié au Template (Mapping `templateId`).

## 🛠️ Améliorations Techniques
- **Multimodalité** : Envoi groupé des PDFs et textes à Gemini 1.5 pour une analyse holistique.
- **Cinématique de Forge** : Nouveaux logs et effets visuels pour suivre la progression de la construction.
- **Versioning** : Passage officiel à la branche **5.1.0-alpha (System Forge Edition)**.

---
*Note technique : Le `ForgeService.ts` a été refondu pour utiliser une architecture de prompt unifiée garantissant la synchronisation entre le Brain et le Body.*
