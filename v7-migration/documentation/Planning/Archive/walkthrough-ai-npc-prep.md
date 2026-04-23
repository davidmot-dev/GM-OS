# Walkthrough : AI NPC Dialogue Prep

Ce walkthrough documente la stabilisation et la promotion de la fonctionnalité **AI NPC Dialogue Prep**, un système d'interprétation assistée par IA permettant au MJ de générer des répliques et des motivations pour ses PNJs favoris en temps réel.

## 🌟 Concept Clé

La fonctionnalité repose sur la synergie de deux systèmes existants dans GM-OS v6 :
1.  **Neural Liaison (Dynamic Context)** : L'IA Oracle reçoit automatiquement les descriptions et les notes d'interprétation de tous les PNJs "épinglés" dans la session actuelle.
2.  **Persona "L'Acteur"** : Un assistant IA spécialisé dans l'incarnation de personnages, doté d'instructions système dédiées à la fluidité du dialogue et à la cohérence psychologique.

## 🛠️ Changements Apportés (Documentation)

### 🗺️ Roadmap & Architecture
- **[roadmap-v6.md](file:///c:/Projet_David/GM-OS-v5/doc./architecture/roadmap-v6.md)** : Marqué comme "Terminé" (v6.1.2-dev).
- **[session-os-modular-architecture.md](file:///c:/Projet_David/GM-OS-v5/docs/technical/session-os-modular-architecture.md)** : Ajout d'une section sur l'extension du "Neural Liaison" pour l'injection automatisée des profiles PNJ.

### 📖 Guides Utilisateurs
- **[AI_Oracle_User_Guide.md](file:///c:/Projet_David/GM-OS-v5/doc./user-guides/AI_Oracle_User_Guide.md)** : Ajout d'une section pratique expliquant comment solliciter l'IA pour des répliques "à la volée".
- **[Session_OS_User_Guide.md](file:///c:/Projet_David/GM-OS-v5/doc./user-guides/Session_OS_User_Guide.md)** : Mise en avant de la fonctionnalité dans le panneau du Master Cockpit.

### 📔 Retours d'Expérience
- **[docs/dev/Lessons_Learned_Archive.md](file:///c:/Projet_David/GM-OS-v5/docs/dev/Lessons_Learned_Archive.md)** : Formalisation de la leçon sur l'"Émergence Fonctionnelle" (comment des briques de base bien conçues créent de nouvelles fonctions sans code additionnel).

## 🚀 Comment l'utiliser ?

1.  **Épinglez un PNJ** : Dans la **NPC Gallery**, marquez un PNJ comme favori (il apparaît alors dans votre Cockpit).
2.  **Ouvrez l'Oracle** : Basculez sur le persona **"L'Acteur"**.
3.  **Posez votre question** : *"Jean Mi est devant les joueurs, que leur dit-il pour les intimider ?"*.
4.  **Résultat** : L'IA utilise les notes de Jean Mi (invisibles pour le MJ à ce moment-là mais présentes dans son contexte) pour générer une réplique parfaite.

---
*Dernière mise à jour : 9 Avril 2026 - GM-OS v6.1.2-dev.*
