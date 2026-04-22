# Walkthrough : Voice-OS & Traitement Audio

Voice-OS implémente une chaîne de traitement audio en temps réel ultra-performante basée sur la Web Audio API.

## ⚙️ La Chaîne de Signal (Signal Chain)
Le flux audio suit une architecture série/parallèle complexe :
1. **Input Stage** : Capture MediaStream avec option `echoCancellation` logicielle.
2. **Gain Stage** : Normalisation de l'entrée via un compresseur `DynamicsCompressorNode`.
3. **Spectral Shaping** : Filtre `BiquadFilterNode` (HighPass) pour le Low-Cut et égalisation peaking pour le Formant.
4. **DSP Worklet** : Un `AudioWorkletNode` personnalisé (fichiers dans `/public/audio/`) gérant le Pitch, la Distortion et le Bitcrush avec une latence quasi-nulle.
5. **Spatialization** : `ConvolverNode` pour une réverbération basée sur des réponses impulsionnelles générées mathématiquement.
6. **Master Stage** : Limiteur de sécurité (Brickwall) pour éviter tout écrêtage (clipping) numérique.

## 📡 Synchronisation NPC-View
L'intégration entre la voix et le visuel est gérée par un pont réactif :
- L'analyseur (AnalyserNode) extrait le niveau RMS de l'audio.
- Ce niveau est envoyé via l'objet global `window.appBridge` (IPC) vers toutes les fenêtres ouvertes (Hub, Projecteur).
- Les composants React du Hub écoutent cet event pour piloter des animations CSS transformant les portraits.

## 🔌 Gestion Hardware
Voice-OS supporte la sélection dynamique du périphérique de sortie via `setSinkId` (sur les navigateurs compatibles), permettant au MJ de séparer sa voix transformée (vers Discord) de la musique d'ambiance (vers les enceintes physiques).

## ✅ Vérification
- Validation du chargement de l'AudioWorklet.
- Test de la latence de traitement (mesurée via `performance.now()` dans le Worklet).
- Vérification du routage des sorties (Monitor vs Live).
