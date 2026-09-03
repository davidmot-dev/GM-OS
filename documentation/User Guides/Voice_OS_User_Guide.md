# 🎤 Guide Utilisateur : Voice-OS

**Voice-OS** est le module de traitement audio en temps réel de GM-OS v5. Il permet au Maître de Jeu de transformer sa voix pour incarner des créatures, des entités numériques ou des divinités tout en conservant une immersion totale.

> [!TIP]
> **Volume Master** : La voix est pilotée par le [Master Soundscape Controller](./Audio_Master_Guide.md). Contrairement à la musique, la voix n'est **jamais atténuée** par le mode Focus Chat, car elle en est la priorité.

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
- **Compression** *(nouveau, 0 à 100 %)* : à quel point la voix est ramenée à un niveau constant. **Bas**, votre jeu respire — un murmure reste un murmure, et *Voice-to-Light* a de quoi suivre. **Haut**, tout sort au même niveau, façon radio. Le réglage par défaut est 40 % ; **100 % reproduit exactement le réglage figé d'avant le 03/09/2026**, si vous préférez celui-là.
- **Pitch Shift** : Modifie la hauteur de la voix (en demi-tons).
- **Formant (Timbre)** : Modifie la structure de la voix pour simuler une gorge plus large ou plus étroite sans changer la note.
- **Room Reverb** : Ajoute de l'écho pour simuler une pièce, une cathédrale ou une grotte.
- **Distortion / Bitcrush** : Ajoute du grain ou une texture "basse résolution" pour les effets technologiques.

---

## 🔄 Sync NPC : Automatisation & Immersion
L'une des fonctions les plus puissantes de GM-OS v5 pour donner vie à vos PNJ :

1.  **Identification du PNJ** : Votre volume vocal est envoyé au **Player Hub**. Le portrait du PNJ actif est mis en avant (vibrations, aura) au rythme de vos paroles.
2.  **Automatisation Vocale** : Si activée, Voice-OS analyse la description et les notes du PNJ pour ajuster votre voix :
    -   **Mots-clés de Pitch** : "Géant", "Ogre", "Grave" baissent le ton. "Enfant", "Petit", "Fée" l'augmentent.
    -   **Presets Automatiques** : Si le PNJ est décrit comme un "Spectre", "Robot", "Androïde" ou "Dragon", le preset correspondant est appliqué instantanément.
3.  **Déclenchement** : La synchronisation se fait dès que vous ouvrez une fiche PNJ ou quand le tour d'un PNJ commence en combat.


---

## 🎙️ Choisir son micro (v6.5)

En haut du panneau de droite, **Micro** liste les entrées audio de la machine.

- **Micro Système par Défaut** garde le comportement d'avant : Voice-OS prend celui que Windows a choisi.
- Choisir explicitement un micro **le retient d'une soirée à l'autre**, même après un redémarrage.
- Si le micro choisi n'est plus branché, Voice-OS **vous le dit** et retombe sur celui du système au lieu d'écouter une webcam en silence.

> [!TIP]
> Les entrées n'affichent leur vrai nom qu'**une fois le micro activé** : avant l'autorisation, le navigateur ne donne aucun libellé. Activez le micro, puis rouvrez la liste.

---

## ⚡ Modes de Diffusion
- **Monitor** : Retour casque personnel. Indispensable pour entendre votre propre transformation vocale.
- **Go Live** : Diffusion vers la sortie audio principale (vos enceintes ou le stream).
- **Audio Output** : Permet de choisir précisément sur quel périphérique envoyer la voix transformée (ex: Câble Audio Virtuel pour redirection vers Discord).

> [!NOTE]
> **Monitor et Go Live sortent sur le même périphérique** — `Audio Output` se règle pour tout le module, pas par voie. Les deux interrupteurs ouvrent donc la même sortie ; les activer ensemble ne double plus le volume (c'était le cas avant le 03/09/2026, et cela suffisait à faire saturer la voix).

---

## 🛡️ Sécurité & Hardware
- **Anti-Larsen** : correction automatique du niveau d'entrée (AGC), pour éviter les sifflements avec des enceintes. En le coupant, vous rendez à votre voix sa dynamique — utile avec un micro-casque, et c'est elle que suit *Voice-to-Light*.
- **Suppression de bruit** *(nouveau)* : le débruiteur du navigateur. Ce n'est pas un filtre mais un algorithme qui décide lui-même de ce qui est de la voix — **il rabote les fins de phrase et les chuchotements**. À couper en premier si votre voix « se coupe » ; à garder avec un micro posé au milieu de la table.
- **Noise Gate** : coupe le son sous un certain seuil pour éliminer les bruits de fond (clavier, ventilateur).
- **Output Gain** : ajuste le volume final après traitement. **Il n'influence plus la porte ni le ducking** : la détection se fait maintenant sur votre voix, avant traitement.

### 🩺 Si le son se coupe, ou sature

Dans cet ordre — du plus fréquent au plus rare :

| Symptôme | À essayer |
| :--- | :--- |
| Des mots ou des fins de phrase disparaissent | Couper **Suppression de bruit**. Puis, si ça persiste, baisser le seuil du **Noise Gate** (il ferme désormais avec 6 dB de marge et un maintien de 250 ms, mais un seuil trop haut coupe toujours). |
| Ça sature dès qu'on parle fort | Vérifier le **Formant** : à fond, il posait jusqu'à +16 dB — il est maintenant borné et respecte son signe. Puis baisser **Output Gain**. |
| Ça sature quand on ajoute de la réverbération | Corrigé le 03/09/2026 : les deux voies (sèche et réverbérée) se mélangent à puissance constante au lieu de s'additionner. |
| La voix est en retard dans le casque | Corrigé : à **Pitch = 0**, la voix passe sans aucun retard — la ligne de transposition ajoutait 85 ms *même sans transposition*. En transposant, le retard est de 43 ms (contre 85 ms avant). |
| Tout sort au même niveau, le jeu est écrasé | Baisser **Compression**. Elle était figée à 8:1, ce qui est un limiteur et non un compresseur. |
| Le ducking reste baissé après la dernière phrase | Corrigé : le relâchement se recalcule à chaque mesure, et la fenêtre du meneur n'est plus ralentie quand elle passe en arrière-plan. |

### 🎛️ La transposition, refaite le 03/09/2026

Les voix de PNJ transposées chuintaient, et ce n'était pas une impression : l'ancien algorithme faisait **onduler le niveau de 39 à 57 %** sur une voix tenue, et lui prenait **1,7 dB** au passage.

Il est remplacé par **WSOLA** — la technique des changeurs de voix : au lieu de recoller la lecture n'importe où, GM-OS cherche l'endroit dont la forme d'onde ressemble le plus à celle qu'il est en train de lire, c'est-à-dire qu'il retombe en phase avec la voix. Mesuré sur le même signal : **1,5 à 25 % d'ondulation**, et le niveau est rendu à l'identique.

> [!NOTE]
> Ce qui subsiste, et qu'aucune méthode temporelle n'évite : un recollage peut répéter ou escamoter une attaque de consonne. C'est audible sur les transpositions extrêmes (±12 demi-tons), beaucoup moins entre −8 et +7. L'alternative — un vocodeur de phase — supprime ce défaut mais ajoute un halo métallique sur les voyelles tenues, ce qui est **pire sur de la voix**.

---

## 🤖 Profilage Vocal par IA (Ollama)

Voice-OS peut désormais générer un profil vocal complet en analysant la fiche d'un PNJ :
- **Analyse de Contexte** : L'IA étudie les traits, le métier et les notes du PNJ.
- **Réglages Automatiques** : Le système applique le meilleur preset (Dragon, Spectre, etc.) et ajuste finement le *Pitch*, le *Formant* et la *Reverb* pour correspondre au personnage.
- **Activation** : Utilisez le bouton **Générer Profil IA** dans l'interface de Voice-OS ou via une fiche PNJ synchronisée.

---

## 🦆 Ducking Narratif (Auto-Ducking)

Une fonctionnalité révolutionnaire pour le confort d'écoute de vos joueurs :
- **Principe** : GM-OS réduit automatiquement le volume de la musique et de l'ambiance dès que vous parlez dans votre micro.
- **Réglages Configurables** :
    - **Sensibilité (Seuil)** : Ajustez la détection pour éviter les déclenchements par bruits de fond.
    - **Attaque (Vitesse)** : Temps de transition (en ms) pour baisser le son (souple ou instantané).
    - **Réduction (Range)** : Niveau cible du son ambiant (ex: 0.1 pour un silence presque total, 0.5 pour un fond sonore léger).
    - **Relâchement (Delay)** : Temps d'attente avant que la musique ne remonte après votre dernière parole.

---

> [!IMPORTANT]
> **Latence** : Voice-OS utilise des technologies Web Audio de pointe pour minimiser la latence. Cependant, pour un résultat optimal, utilisez un casque plutôt que des enceintes pour éviter les boucles de feedback.
