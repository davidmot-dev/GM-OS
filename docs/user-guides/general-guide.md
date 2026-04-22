# 📖 Guide de l'Utilisateur GM-OS v5

Ce guide vous aide à tirer le meilleur parti des fonctionnalités avancées de GM-OS pour vos sessions de JdR.

---

## 🎙️ Voice-OS & Profilage IA
Voice-OS vous permet de transformer votre voix en temps réel pour incarner vos PNJ.

- **Profilage Intelligent** : Dans la fiche d'un PNJ, cliquez sur "Générer Profil Vocal". L'IA (Ollama ou Gemini) analysera les caractéristiques du personnage pour suggérer des réglages optimaux (Pitch, Reverb, Distortion).
- **Synchronisaton (Sync NPC)** : Activez cette option pour que le portrait du PNJ sur le **Player Hub** réagisse visuellement à votre intensité vocale.

## 📱 Tablet Hub (Second Écran)
Le Tablet Hub permet de déporter les informations critiques sur une tablette ou un smartphone.

1. Cliquez sur l'icône **QR Code** dans la barre latérale.
2. Scannez le code avec votre appareil mobile.
3. Suivez l'Horloge, les Chronos et les Jauges de Tension en temps réel sans encombrer votre écran principal.

## 🧠 AI Oracle (Cortex & NotebookLM)
L'IA vous assiste dans la narration et les règles.

Le **Cortex** est votre cerveau tactique. Il se manifeste de deux manières :
1.  **Widget Cortex (Interface)** : Affiche en temps réel les distances entre les pions et les modificateurs de portée (v1.0).
2.  **Assistant Tactique NPC (Combat)** : Sur chaque carte de PNJ dans Combat-OS, cliquez sur l'icône **Brain (Cerveau)**. L'IA analysera les PV, la cible et le positionnement du PNJ pour vous suggérer la meilleure action narrative ou tactique.

> [!TIP]
> Si vous utilisez Ollama en local, le Cortex v1.0 utilisera vos modèles locaux pour générer ces suggestions sans coût d'API.

#### 🧠 NotebookLM Sync
L'Oracle peut également être lié à un Notebook spécifique. Importez vos PDF de règles ou vos notes de campagne. Posez vos questions directement dans le chat AI pour obtenir des réponses sourcées sur votre propre univers.

## 🛠️ Maintenance du Système

### Nettoyage des Médias (Media Cleanup)
GM-OS stocke les médias localement dans IndexedDB.

- **Automatique** : Le système se nettoie 5 secondes après chaque démarrage.
- **Manuel** : Allez dans **Paramètres > Système > Nettoyer** pour forcer une purge des fichiers orphelins (images de PNJ supprimés, etc.).

### 🛡️ Sécurité & Synchronisation
Vos données sont précieuses. GM-OS v5 intègre une **sauvegarde automatique vers GitHub** sur une branche isolée (`data-sync`). Cela garantit que votre travail est protégé et synchronisé entre tous vos terminaux MJ. Consultez le mode **Paramètres** pour vérifier le statut de la synchronisation.

---

*Dernière mise à jour : Mars 2026 (v5.1.1-STABLE)*
