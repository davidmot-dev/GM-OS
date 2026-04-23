# Architecture IA Hybride (GM-OS v5)

## Vue d'Ensemble

GM-OS v5 utilise une architecture hybride permettant de basculer dynamiquement entre une IA locale (**Ollama**) et des services Cloud (**Gemini**, **Anthropic**, **OpenAI**). Cette approche garantit la confidentialité des données et permet un fonctionnement offline tout en conservant la puissance des modèles massifs pour les tâches complexes.

## Composants Clés

### 1. `OllamaService` (Main Process)
Gère la communication directe avec le serveur local Ollama (généralement sur `http://localhost:11434`).
- **Parsing Robuste** : Nettoyage des sorties Markdown/JSON et gestion des erreurs de flux.
- **Support Base64** : Capacité à traiter des images pour les modèles multimodaux locaux.

### 2. `AIService` (Renderer Process)
Interface unifiée pour le reste de l'application.
- **Routage Dynamique** : Selon les réglages utilisateur, les requêtes sont envoyées soit vers le bridge Ollama, soit vers les APIs Cloud via les clés API stockées de manière sécurisée.
- **Gestionnaire de Modèles** : Filtre les modèles disponibles selon le fournisseur choisi.

## Flux de Données : Voice Profiling

1. `useVoiceStore` demande un profil (ex: "Orc Barman").
2. `AIService` envoie le prompt enrichi.
3. Si **Ollama** est actif :
    - Le prompt est traité localement (ex: par `phi3`).
    - Le JSON retourné est parsé et validé par le service.
4. Les paramètres (Pitch, Reverb, etc.) sont appliqués à `VoiceEngine`.

## Sécurité & Performance

- **Protocole gmos://** : Toutes les ressources générées par l'IA (avatars) sont servies via un protocole personnalisé pour éviter les restrictions de sécurité locales de Chromium.
- **Timeout Management** : Les appels Ollama disposent de timeouts spécifiques pour éviter de bloquer l'UI en cas de surcharge du GPU local.

---

*Dernière mise à jour : Mars 2026*
