# 🎤 Guide Utilisateur : Voice-OS

**Voice-OS** est le module de traitement audio en temps réel de GM-OS v5. Il permet au Maître de Jeu de transformer sa voix pour incarner des créatures, des entités numériques ou des divinités tout en conservant une immersion totale.

---

## 🖥️ Le Dashboard Voice-OS
L'interface est conçue comme une console de mixage professionnelle simplifiée :
1. **Statut Mic (Haut)** : Visualisation de l'état (Active/Standby), de la latence et de la charge processeur.
2. **Templates Vocaux (Gauche)** : Bibliothèque de presets prêts à l'emploi.
3. **Visualiseur Central** : Un indicateur visuel pulsant qui réagit à votre voix.
4. **Vocal Shapers (Droite)** : Contrôles granulaires pour sculpter votre timbre.
5. **VU-Meter (Bas)** : Barre de niveau d'entrée pour éviter la saturation.

---

## 🎭 Templates Vocaux (Presets)
Plutôt que de régler chaque curseur manuellement, utilisez les presets intégrés :
- **Clean** : Voix naturelle avec égalisation optimisée.
- **Spectre** : Voix éthérée et résonante (idéal pour les fantômes ou les apparitions).
- **Ogre** : Voix grave, massive et caverneuse (parfait pour les géants ou monstres).
- **Androïde** : Effet métallique et distorsion numérique (pour les IAs ou cyborgs).
- **Dragon** : Grogne profond avec sub-harmoniques et distorsion agressive.

---

## 🎚️ Vocal Shapers (Paramètres Avancés)
Pour les MJs souhaitant un contrôle total, ajustez les réglages suivants :
- **Pitch Shift** : Modifie la hauteur de la voix (en demi-tons).
- **Formant (Timbre)** : Modifie la structure de la voix pour simuler une gorge plus large ou plus étroite sans changer la note.
- **Room Reverb** : Ajoute de l'écho pour simuler une pièce, une cathédrale ou une grotte.
- **Distortion / Bitcrush** : Ajoute du grain ou une texture "basse résolution" pour les effets technologiques.

---

## 🔄 Sync NPC : Automatisation & Immersion
L'une des fonctions les plus puissantes de GM-OS v5 pour donner vie à vos PNJ :

1.  **Animation du Portrait** : Votre volume vocal est envoyé au **Player Hub**. Le portrait du PNJ actif s'anime (vibrations, aura) au rythme de vos paroles.
2.  **Automatisation Vocale** : Si activée, Voice-OS analyse la description et les notes du PNJ pour ajuster votre voix :
    -   **Mots-clés de Pitch** : "Géant", "Ogre", "Grave" baissent le ton. "Enfant", "Petit", "Fée" l'augmentent.
    -   **Presets Automatiques** : Si le PNJ est décrit comme un "Spectre", "Robot", "Androïde" ou "Dragon", le preset correspondant est appliqué instantanément.
3.  **Déclenchement** : La synchronisation se fait dès que vous ouvrez une fiche PNJ ou quand le tour d'un PNJ commence en combat.


---

## ⚡ Modes de Diffusion
- **Monitor** : Retour casque personnel. Indispensable pour entendre votre propre transformation vocale.
- **Go Live** : Diffusion vers la sortie audio principale (vos enceintes ou le stream).
- **Audio Output** : Permet de choisir précisément sur quel périphérique envoyer la voix transformée (ex: Câble Audio Virtuel pour redirection vers Discord).

---

## 🛡️ Sécurité & Hardware
- **Anti-Larsen** : Algorithme d'annulation d'écho pour éviter les sifflements lors de l'utilisation d'enceintes.
- **Noise Gate** : Coupe automatiquement le son sous un certain seuil de volume pour éliminer les bruits de fond (clavier, ventilateur).
- **Output Gain** : Permet d'ajuster le volume final après traitement.

---

> [!IMPORTANT]
> **Latence** : Voice-OS utilise des technologies Web Audio de pointe pour minimiser la latence. Cependant, pour un résultat optimal, utilisez un casque plutôt que des enceintes pour éviter les boucles de feedback.
