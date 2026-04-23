# Documentation Ambient : Streaming Multi-Pistes & Anti-Phase (GM-OS v5)

Ce document détaille l'implémentation du mixeur d'ambiance à 8 pistes de **Ambient OS**, optimisé pour le streaming et la fidélité sonore.

---

## 1. Architecture Multi-Streaming (8 Voies)

Contrairement à Music OS (2 decks), Ambient OS gère jusqu'à 8 flux simultanés.

### Le Multi-Moteur

Pour chaque piste, un élément `<audio>` dédié est nécessaire afin de gérer les réglages (`src`, `loop`, `play/pause`) de manière totalement indépendante.

```javascript
// Création d'un pool de 8 lecteurs
this.audioElements = Array.from({ length: 8 }, () => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";
    audio.style.display = "none";
    document.body.appendChild(audio); // CRITIQUE pour la priorité CPU
    return audio;
});
```

---

## 2. Branchement & Routage Anti-Phase

Ambient OS possède un routage spécifique pour corriger les problèmes de phase sur certains types de haut-parleurs. Ce routage doit être maintenu même en streaming.

### Graphe Audio par Piste

```javascript
// 1. Source Streaming
const node = ctx.createMediaElementSource(audioElement);

// 2. Traitement Anti-Phase (Isolation canal Gauche)
const splitter = ctx.createChannelSplitter(2);
const merger = ctx.createChannelMerger(2);

node.connect(splitter);
splitter.connect(merger, 0, 0); // L -> L
splitter.connect(merger, 0, 1); // L -> R (Écrase le R original potentiellement inversé)

// 3. Connecter au Gain de piste puis au Master Compressor
merger.connect(track.gainNode);
track.gainNode.connect(this.masterCompressor);
```

---

## 3. Logique de Lecture & Fades

Chaque piste peut être lancée ou arrêtée indépendamment avec un fondu de 1.5s.

### START

1. Assigner `audio.src = path`.
2. Lancer `audio.load()`.
3. Effectuer une rampe `linearRampToValueAtTime(volume, ctx.currentTime + 1.5)` sur le `GainNode`.
4. Lancer `audio.play()`.

### STOP

1. Ramper `gain` vers 0.
2. Attendre la fin du fondu (~1050ms).
3. Lancer `audio.pause()` et surtout `audio.src = ""` pour libérer les ressources système.

---

## 4. Recommandations pour GM-OS v5

* **Priorité des Lecteurs** : Dans un environnement multi-fenêtres (comme v5), assurez-vous que les éléments `<audio>` sont attachés à la fenêtre principale pour éviter que Chrome n'arrête le son si l'onglet est masqué.
* **AudioContext natif** : Utilisez `new AudioContext()` sans paramètres de latence forcés pour laisser v5 s'adapter dynamiquement au matériel audio de l'utilisateur (casques USB vs Sorties HDMI).
* **Format JSON** : Stockez uniquement les chemins (`paths`) et les volumes. Le streaming rend les backups de buffers inutiles.
