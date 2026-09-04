# GM-OS v5 : Walkthrough Général & État de la Refonte

## 🌟 Nouveautés V5.2 (Mars 2026)

La version 5.2 marque une étape majeure dans l'intégration de l'Intelligence Artificielle et de l'ergonomie MJ.

- **IA Hybride & Locale** : GM-OS peut désormais fonctionner sans connexion internet grâce au support d'**Ollama**. L'IA locale gère parfaitement le profilage vocal des PNJ.
- **Voice-OS Advanced** : Transition vers un système de profilage psychologique. Le MJ discute avec l'IA pour définir la voix de ses personnages, au-delà des simples curseurs.
- **Refonte UI Cortex** : Le cerveau tactique a été transformé en un widget horizontal discret mais puissant, libérant l'espace visuel pour la cartographie.
- **Sécurité Windows (gmos://)** : Migration réussie vers un protocole sécurisé pour le chargement massif de médias locaux.
- **AI Persona Forge (V5.4)** : Génération séquentielle de 7 assistants IA (GEMS) avec support optimisé pour **Ollama** et isolation intelligente du contexte (Système vs Campagne).
- **Social Nexus v2 (V5.5)** : Refonte du graphe de relations avec résolution d'avatars haute performance (`useAvatarResolver`), filtrage par faction et navigation directe.
- **Universal Search - Spotlight (V5.6)** : Recherche globale ultra-rapide (`CMD+K`) à travers tous les modules (Entités, Maps, Audio, Règles).
- **Danger Zone Editor (V5.6)** : Refonte premium en mode **Obsidian Nexus** avec support des auras mobiles et terrains complexes.
- **Audio & Media Hub Stability (V5.7)** : Correction critique des moteurs audio ( Music, Sound, Ambient) pour le contrôle à distance et protection du Media Hub contre le nettoyage automatique abusif. Détails techniques *(document non conservé)*

## 🧱 Architecture Fondamentale
This walkthrough demonstrates the latest improvements to the GM-OS tactical ecosystem, focusing on seamless combat management from Map-OS and overall system robustness.

## 🗺️ Map-OS: Integrated Combat Shortcut

GMs can now advance combat rounds and turns directly from the Map-OS sidebar without switching interface modules.

- **Real-time Navigation**: "Suivant" and "Précédent" buttons allow quick turn cycling.
- **Visual Feedback**: Displays the current Round and Turn index directly in the map controls.
- **Auto-Focus**: Advancing the turn automatically triggers the `highlightMapToken` bridge call, centering the map on the active combatant's linked token.

## 🧠 Tactical Taxonomy: Visibility & Order

The Tactical Taxonomy Editor has been reorganized to make finding and editing rules (like "Contact" ranges) much easier.

- **Grouped Categorization**: Rules are now grouped by tags: **Portées (Système)**, **Statuts & Effets**, **Éléments**, and **Autres**.
- **Self-Healing State**: Missing default range rules are automatically restored if they are absent from local storage.
- **Visual Cues**: Each rule group features distinct icons and labels for rapid scanning.

## 🔊 Audio Stability: Robust Decoding

The tactical audio engine is now hardened against corrupted or missing assets.

- **Decoding Protection**: `AudioCurationService` now uses try-catch blocks to catch `EncodingError`.
- **Automatic Fallback**: If a specific sound (like `proximity_alarm.mp3`) fails to decode, the system seamlessly falls back to a stable sound (`target_lock.mp3`).
- **Clean Registry**: Turn-based audio triggers now properly reset when conditions are cleared, allowing for reliable re-triggering of proximity alarms.
- **Remote Activation**: AudioContext is now forcefully resumed upon remote pad trigger, ensuring sound plays even if the PC has had no direct keyboard/mouse interaction.
- **Media Hub Safety**: The automatic cleanup service has been hardened to respect Music and Ambient playlists, preventing the accidental deletion of active audio files. Consulter le rapport de stabilité *(document non conservé)*

## 🎨 Lighting & Color Fixes

- **Red Override Resolved**: Prioritized custom taxonomy rules over defaults and removed hardcoded color fallbacks.
- **Sorted Priorities**: Hardware effects now follow strict priority scoring instead of color bias.

## 🎲 Dice-OS: Auto-Sync avec le Système

Le plateau de dés se synchronise désormais intelligemment avec le système de jeu actif de votre campagne.

- **Mode Système par Défaut** : À l'ouverture d'une campagne, le "Mode Système" s'active automatiquement.
- **Moteurs Spécialisés** : Dice-OS détecte et active le bon moteur (ex: Year Zero Engine pour Alien, Rolemaster/d100 pour les autres) sans intervention manuelle.
- **Configuration Dynamique** : Le nombre de dés et les seuils de succès sont pré-chargés selon les réglages du Driver.

## ⚙️ Configuration du Moteur Étendue

L'éditeur de système (Rule Engine Editor) permet désormais de choisir parmi TOUS les modes de dés disponibles dans l'OS.

- **Menu Déroulant Complet** : Ajout de 12 modes (Somme Explosive, Pool, Threshold, FATE, Advantage, etc.).
- **Typage Strict** : Les drivers utilisent maintenant des types TypeScript explicites pour chaque moteur, évitant les erreurs de configuration.
- **Support Natif** : Chaque moteur sélectionné dans l'éditeur est immédiatement reconnu et appliqué par Dice-OS.

## 🗑️ Gestion du Roster Épurée

Il est désormais possible de supprimer des joueurs ou des personnages directement depuis l'interface de gestion.

- **Suppression de Personnage** : Un bouton "corbeille" apparaît au survol d'une carte de personnage.
- **Suppression de Joueur** : Un bouton de suppression est présent sur chaque carte de joueur dans la barre latérale.
- **Sécurité et Confirmation** : Chaque suppression déclenche une demande de confirmation pour éviter les erreurs accidentelles.
- **Nettoyage Automatique** : La suppression d'un joueur ou d'un personnage sélectionné réinitialise automatiquement la sélection du store pour éviter les erreurs d'affichage.

## 🧠 Master Switch : Cortex Tactique

Vous avez désormais un contrôle total sur l'activation du Cerveau Tactique.

- **Interrupteur Global** : Un nouveau bouton "Master Switch" dans l'onglet Tactique des paramètres OS permet d'activer ou de désactiver complètement l'analyse tactique.
- **Mode Discret** : Une fois désactivé, le Cortex ne consomme plus de ressources d'analyse, le HUD flottant est masqué et les indicateurs système reflètent cet état.
- **Status Hub** : L'en-tête de GM-OS affiche désormais "CORTEX DISABLED" pour confirmer que l'IA est en veille.

## 🧠 Sélection Tactique Interactive

Cette mise à jour rend le Cerveau Tactique interactif en permettant au MJ de sélectionner manuellement le pion source pour les calculs de portée.

- **Sélection Interactive sur la Carte** : Cliquez sur n'importe quel pion pour en faire l'acteur "actif" (Halo bleu ciel).
- **Priorité Intelligente** : La sélection manuelle prime sur le tour actuel dans l'initiative.
- **Mesures Hors-Combat** : Permet de mesurer les distances vers n'importe quel objet ou PNJ sur la carte, même s'ils ne sont pas dans le Combat Tracker.

## 💡 Synchronisation Matérielle & Priorités

L'incohérence des couleurs lors de l'analyse multi-cibles a été résolue par une refonte du Pont Matériel.

- **Hiérarchie de Priorité Absolue** : 
    - **CONTACT** : Priorité 10 (Rouge).
    - **COURTE** : Priorité 11 (Vert).
    - **MOYENNE** : Priorité 12 (Bleu).
- **Tie-Breaking par Intensité** : En cas de distance égale, l'effet le plus intense (danger marqué) prend le contrôle des lumières.
- **Diagnostic Verbeux** : Ajout de logs détaillés dans la console (`[HardwareBridge] Candidates`) pour suivre les décisions du système.

## ✅ Stabilité & Tests Finalisés

Toutes les modifications ont été vérifiées pour garantir la stabilité du système :
- **Correction de Réactivité** : Le switch et l'en-tête réagissent instantanément.
- **Résolution des Erreurs** : Les erreurs de type `ReferenceError` et les erreurs de typage TypeScript ont été corrigées.
- **Tests au Vert** : Validation complète des calculs de portée et de l'alignement des moteurs de dés.

## 🎲 Alignement Dice OS (Mécaniques Systèmes)

J'ai corrigé l'intégration du moteur de dés pour qu'il respecte scrupuleusement les règles du système actif (ex: Alien RPG) :
- **Réactivité Totale** : Même quand le "Mode Système" est actif, Dice OS prend désormais en compte le nombre de dés (Base/Equip) et les modificateurs ajustés manuellement ou via le Conseil Tactique.
- **Logique Year Zero Engine** :
    - Les modificateurs (ex: +2) ajoutent maintenant directement des dés de base au pool au lieu de modifier le score final, respectant la règle officielle.
    - Correction des identifiants (`year-zero` vs `yze`) pour assurer une synchronisation parfaite.
- **Défaut Intelligent** : À l'entrée dans Dice-OS, le système active désormais automatiquement le mode correspondant au Driver du système actif (ex: Alien -> YZE, Rolemaster -> d100) et pré-configure le nombre de dés.
- **Éditeur de Règles Complet** : Dans l'éditeur de moteur de règles (Brain), la liste des moteurs supportés a été complétée pour inclure "Year Zero Engine", "2d20", "Fate", etc.
- **Validation** : Création du test [DiceEngineAlignment.test.ts](../../src/modules/dice/DiceEngineAlignment.test.ts) qui confirme mathématiquement le bon fonctionnement de ces règles.

## 🔮 AI Oracle : Intégration Native NotebookLM (MCP)

La consultation de vos règles et notes d'univers passe par un assistant conversationnel natif.

- **Conversationnel Pur** : Chat intégré sans passer par le navigateur (RAG Temps Réel).
- **Stabilité MCP** : Communication directe via le protocole standard Model Context Protocol.
- **Auto-Auth** : Reconnexion facilitée via les paramètres IA.
- **AI Oracle (MCP Native)** : Intégration directe de NotebookLM via MCP.
    - Guide d'Installation & Usage MCP *(document non conservé)*
    - Personnalités Contextuelles (Gems) *(document non conservé)*
- [Obsidian Bridge Integration](Obsidian_Bridge_Integration.md)
- [System Forge IA 5.1 (Multimodal Logic)](System_Forge_IA_5.1.md)
- [Rule Engine & Forge Integration](Rule_Engine_Forge_Integration.md)
- [Clock-OS Integration](Clock_OS_Integration.md)
- [Table-OS Integration](Table_OS_Integration.md)
- [Voice-OS Integration](Voice_OS_Integration.md)
- [Favorite-OS Integration](Favorite_OS_Integration.md)
- [Whiteboard-OS Integration](Whiteboard_OS_Integration.md)
- [Web-OS Integration](Web_OS_Integration.md)
- [Settings-OS Integration](Settings_OS_Integration.md)
- [Storyboard Architecture](Storyboard_Architecture.md)

## 🎬 Master Storyboard : Orchestration d'Immersion v2

L'orchestrateur de moments a été profondément amélioré pour devenir le centre névralgique de la narration.

- **Triggers Multi-Modules** : Un seul clic déclenche désormais simultanément la musique, les lumières, la carte, l'image et l'ambiance sonore.
- **Capture Intelligente** : La fonction "Capture Active" permet de sauvegarder l'état actuel de TOUS les modules OS dans un nouveau moment sans saisie manuelle.
- **Interface Contextuelle** : Les champs de saisie manuelle d'IDs ont été remplacés par des menus déroulants intelligents (Music Pads, Light Scenes, Media List).
- **Intégration Ambient-OS** : Support natif du rappel des scènes de mixage complexes pré-enregistrées.
- **Stabilité Renforcée** : Correction des erreurs de rendu et optimisation de la réactivité Zustand sur les sélecteurs.

## 🔍 Spotlight : Votre Assistant de Navigation

Le **Universal Search** est devenu le centre de commande rapide de GM-OS :

- **Raccourci Omniprésent** : `CMD+K` ouvre la recherche quel que soit le module actif.
- **Inter-Stores** : Résultats fédérés depuis Session, Music, Ambient et Sound stores.
- **Zéro Souris** : Navigation 100% clavier pour une fluidité maximale en session.

## ☢️ Map-OS : Zones de Danger v2

L'édition tactique passe au niveau supérieur avec le design **Obsidian Nexus** :

- **Modularité Colonne** : Une interface claire et sans défilement pour configurer les effets complexes.
- **Auras Dynamiques** : Les zones (sorts, lumière) suivent désormais les pions dans leurs déplacements.
- **Calcul Tactique** : Affichage dynamique du coût de mouvement pour les terrains difficiles.
