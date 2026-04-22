# Analyse : Sound OS (Soundboard / SFX)

Ce document recense exhaustivement les fonctionnalités natives du module **Sound OS** de GM-OS v3, en vue de leur refonte dans l'architecture v5. Ce module est particulièrement complexe puisqu'il interagit avec du matériel (MIDI) et l'API système (Web Audio API).

## 1. Description Générale

Sound OS est une "Soundboard" (boîte à effets sonores) de 16 pads. Elle permet de déclencher des fichiers audio courts (bruitages, petites musiques) avec gestion du volume par pad. Elle offre un contrôle avancé via des raccourcis clavier assignables ou un contrôleur MIDI externe (ex: un pad Akai).

## 2. Interface Utilisateur (UI)

* **Barre Latérale (Aside - Contrôles Matériels) :**
  * Bouton "+ Charger Audios" : Ouvre l'explorateur de fichiers local système. Assigne automatiquement les fichiers sélectionnés aux premiers pads vides.
  * Bouton "🔴 MIDI Learn" : Active/Désactive l'écoute globale d'un signal MIDI M-Audio/Akai etc. pour le lier à un pad.
  * Bouton "⌨️ Key Learn" : Idem, mais écoute une frappe de clavier standard (ex: Touche 'A').
  * Sélecteur "Sortie Audio" : Liste les périphériques audio du PC (ex: Enceinte, Casque Virtuel) détectés via `navigator.mediaDevices.enumerateDevices()`.
  * Bouton "■ TOUT COUPER" : Fade-out instantané et arrêt total de toutes les sources sonores en cours.
  * Bloc "Sauvegarde / Chargement" et "Reset Grille".
* **Affichage Principal (Main - La Grille) :**
  * Une grille de 16 pads (`sound-pad`).
  * **Contrôles d'un Pad :**
    * Couleur (palette globale), Renommage, Lien "💡 Light OS", Suppression.
    * Touche Clavier affichée en haut à gauche.
    * Indicateur de signal MIDI et Icône 💡 (si lié).
    * Slider de Volume (de 0 à 1.5x) intégré en bas du pad.
    * Barre de progression animée indiquant l'avancement temporel du fichier audio pendant la lecture.
  * **Console de log (`sound-console`) :** Affichage textuel local sous la grille très utilisé pour remonter les signaux bruts MIDI lors du mapping (Debug).

## 3. Logique Métier & Comportements

* **Web Audio API (`AudioContext`) :**
  * Lit l'audio depuis `fs.readFile` (Chemin brut local), mais permet aussi le décodage `Base64` lors d'un chargement de preset (très gourmand, à surveiller en V5).
  * Chaque pad génère sa propre `BufferSourceNode` liée à un `GainNode` individuel (géré par le mini slider).
  * Toutes les sources convergent vers un `MasterGain` global pour gérer le FadeOut total ("■ TOUT COUPER" déclenche une pente linéaire de 3 secondes).
* **Lectures simultanées / Interruptions :**
  * Cliquer sur un pad vide : Ne fait rien.
  * Cliquer sur un pad inactif : Démarre l'audio.
  * Cliquer sur un pad "en cours de lecture" : **Stoppe immédiatement** sa lecture (Stop/Toggle natif). Pas de superposition (polyphonie) *entre le même pad*, mais polyphonie *entre plusieurs pads*.
* **Drag & Drop :**
  * Permet le swap (échange) visuel et logique de deux pads entre eux avec la souris.
  * Supporte le drop de fichiers (`.mp3`, `.wav`) venant directement de l'explorateur OS Windows sur la fenêtre Electron.
* **Contrôle MIDI (`navigator.requestMIDIAccess`) :**
  * Mode Normal : Écoute les signaux NoteOn (`0x90`). Si le Data1 correspond au `pad.midi`, déclenche `play()`.
  * Mode "Learn" : Le clic sur un pad bloque l'interface. Le premier bouton physique enfoncé sur le contrôleur midi externe lie son identifiant (`d1`) au pad.
* **Contrôle Clavier :**
  * Idem que MIDI mais utilise `e.code` (ex: "KeyA", "Numpad1"). Bloqué si on écrit dans un `<input>`.

## 4. Écosystème & Interconnectivité

* **Lien Optionnel avec *Light OS* :**
  * Un pad de son peut être lié à 1 ambiance lumineuse spécifique de Light OS (système Philips Hue local).
  * Au déclenchement du son, Sound OS envoie un signal pour **allumer les ampoules** de la scène correspondante.
  * À l'arrêt du son (ou à sa fin naturelle), Sound OS envoie un signal `restoreActivePad()` à Light OS pour remettre l'éclairage de salle par défaut.
* **Pas de Player Hub :** Sound OS joue l'audio **strictement en local** sur la machine du MJ (via le choix de "Sortie Audio" locale). Le son n'est pas streamé vers le navigateur web des joueurs.
