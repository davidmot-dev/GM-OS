# 🎤 Voice-OS

**Voice-OS** est le module de traitement audio en temps réel de GM-OS. Il permet au Maître de Jeu de transformer sa voix pour incarner des créatures, des entités numériques ou des divinités tout en conservant une immersion totale.

> [!TIP]
> **Volume Master** : La voix est pilotée par le [Master Soundscape Controller](./70-Tour-de-controle-audio.md). Contrairement à la musique, la voix n'est **jamais atténuée** par le mode Focus Chat, car elle en est la priorité.

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

## 🎭 Donner une voix à un PNJ, et la lui garder

> ⚠️ **Ce n'est pas une synthèse vocale.** GM-OS ne parle pas à votre place : un « profil
> vocal » est un jeu de réglages du rack appliqué à **votre** voix — hauteur, formants,
> réverbération, distorsion.

Sur la fiche d'un PNJ — dans la **galerie de campagne** comme dans NPC-OS — deux boutons :

- **« Sa voix »** : l'IA lit son nom, ses notes de roleplay, sa description, son type, son
  rôle et sa faction, et propose des réglages. **Ce qui est enregistré est l'état réel du rack
  après application** — donc vos retouches aux curseurs si vous en faites, et non la
  suggestion brute du modèle. *Ce qu'on rappelle doit être ce qu'on a entendu.*
- **« Reposer »** : n'apparaît que si un profil existe, et le remet sur le rack.

Le profil est rangé **sur la fiche du PNJ** et voyage dans les sauvegardes.

> ⭐ **Depuis le 2026-09-04, cela vaut pour les PNJ de votre campagne.** Le profilage
> n'existait que dans NPC-OS — un module à part, où vous aviez une fiche, quand la galerie en
> portait cent vingt-trois. Ces cent vingt-trois n'avaient aucun endroit pour ranger une voix.

**Vos secrets ne partent pas au modèle.** `gmSecretInfo` est exclu de ce qu'on lui envoie : ses
notes de roleplay disent comment il parle — c'est la question posée ; ses secrets ne servent
pas à régler une hauteur de voix, et ce qui part au modèle part chez le fournisseur actif, qui
peut être distant.

---

## 🔄 Sync NPC : Automatisation & Immersion
La voix suit le PNJ dont vous vous occupez :

1.  **Identification du PNJ** : Votre volume vocal est envoyé au **Player Hub**. Le portrait du PNJ actif est mis en avant (vibrations, aura) au rythme de vos paroles.
2.  **Ce qui est posé sur le rack**, dans cet ordre :
    -   **Son profil enregistré**, s'il en a un — *ce que vous avez réglé passe avant ce que
        GM-OS devine.*
    -   **Sinon, les mots-clés** : « Spectre », « Ogre », « Robot », « Androïde », « Dragon »
        appellent le preset correspondant ; « grave », « profond » baissent le ton, « enfant »,
        « petit » l'augmentent. Cherchés dans le nom, les notes et les traits.
3.  **Déclenchement** : dès que vous ouvrez une fiche PNJ, ou quand son tour commence en combat.

> ⭐ **La priorité est le point important.** Sans elle, l'automatisme aurait effacé la voix que
> vous veniez de régler au premier reclic sur la fiche — *le défaut aurait été pire qu'avant,
> puisqu'il y aurait désormais quelque chose à perdre.* Un PNJ sans profil se comporte
> exactement comme avant.


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
- **Débruitage** *(trois positions)* : un seul réglage, parce que deux débruiteurs qui se suivent ne valent pas mieux qu'un — le premier rabote ce que le second aurait su garder.
    - **Aucun** : le micro arrive brut. Le bon choix avec un micro-casque dans une pièce calme.
    - **Navigateur** : le débruiteur de WebRTC. Efficace, mais c'est une boîte noire qui décide seule de ce qui est de la voix, **en amont de tout ce que Voice-OS peut régler** — c'est lui qui rabote les fins de phrase. *C'était le réglage par défaut jusqu'au 2026-09-04, c'est-à-dire que le premier suspect du dépannage était aussi ce que vous aviez sans rien régler.*
    - **Neuronal** *(le réglage par défaut depuis le 2026-09-04)* : **RNNoise**, dans la chaîne de GM-OS. Il efface le bruit stationnaire — ventilateur, souffle, climatisation — et il sait **dire quand vous parlez** : cette information tient la porte ouverte sur vos fins de phrase, là où un seuil de niveau les couperait. Il ajoute **10 ms** de latence et demande une carte son à 48 kHz.
- **Noise Gate** : coupe le son sous un certain seuil pour éliminer les bruits de fond (clavier, ventilateur).
- **Output Gain** : ajuste le volume final après traitement. **Il n'influence plus la porte ni le ducking** : la détection se fait maintenant sur votre voix, avant traitement.

### 🩺 Si le son se coupe, ou sature

Dans cet ordre — du plus fréquent au plus rare :

| Symptôme | À essayer |
| :--- | :--- |
| Des mots ou des fins de phrase disparaissent | Passer le **Débruitage** sur *Aucun* ou *Neuronal* — le mode *Navigateur* est le premier suspect. Puis, si ça persiste, baisser le seuil du **Noise Gate** (il ferme désormais avec 6 dB de marge et un maintien de 250 ms, mais un seuil trop haut coupe toujours). |
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

## 📇 Retrouver une voix depuis Voice-OS

Le panneau de gauche du module porte une liste **Voix des PNJ** : un clic repose le profil sur le
rack, sans passer par la fiche.

> ✅ **Elle montre les deux sources depuis le 2026-09-04** : les PNJ enregistrés dans NPC-OS, et
> ceux de votre **galerie de campagne** à qui vous avez déjà donné une voix. Elle ne montrait
> auparavant que le mémo de NPC-OS — le module qui porte *un* PNJ à la fois — alors que la galerie
> en porte plus de cent.
>
> Deux limites voulues : **seuls les PNJ qui ont déjà un profil** y entrent (la liste ne grossit que
> du travail déjà fait), et **la campagne active fait le tri** — rappeler la voix d'un PNJ d'une
> autre partie n'aurait pas de sens. Le bouton **« Reposer »** de la fiche reste là pour tous.

> ⛔ **Il n'existe aucun bouton « Générer Profil IA » dans Voice-OS.** Cette page en annonçait un ;
> la génération se fait depuis la fiche du PNJ, par **« Sa voix »**. Voice-OS rappelle, il ne
> génère pas.

---

## 🦆 Ducking Narratif (Auto-Ducking)

Une fonctionnalité révolutionnaire pour le confort d'écoute de vos joueurs :
- **Principe** : GM-OS réduit automatiquement le volume de la musique et de l'ambiance dès que vous parlez dans votre micro.
- **Réglages Configurables** :
    - **Sensibilité (Seuil)** : Ajustez la détection pour éviter les déclenchements par bruits de fond.
    - **Attaque (Vitesse)** : Temps de transition (en ms) pour baisser le son (souple ou instantané).
    - **Réduction (Range)** : Niveau cible du son ambiant (ex: 0.1 pour un silence presque total, 0.5 pour un fond sonore léger).
    - **Relâchement (Delay)** : Temps d'attente avant que la musique ne remonte après votre dernière parole.

> ⛔ **Corrigé le 2026-09-05 : le ducking pouvait ne jamais se brancher, sans rien dire.**
> Music-OS et Ambient-OS s'abonnent à Voice-OS au démarrage. Selon l'ordre dans lequel
> l'application chargeait ses modules, cet abonnement pouvait échouer — et la musique
> **ne baissait alors jamais** quand vous parliez, sans message ni indice. Deux réparations :
> le chemin fautif est coupé, et un échec de branchement s'écrit désormais dans le journal
> en nommant le module et la conséquence. *Une panne muette est plus coûteuse qu'une panne
> bruyante : on la découvre en séance.*
>
> Si le ducking vous paraît inactif, le journal (`main.log`) le dira.

> 🔎 **Il agit aussi sur les vidéos projetées** depuis le 2026-09-05 — voir
> [Image-OS](./24-Image-OS-la-regie-visuelle.md). Une vidéo YouTube fait exception : son son
> échappe entièrement au mixage.

---

### 🧠 Le débruitage neuronal, en détail

- **Une pastille verte** s'allume à côté du réglage quand le modèle vous entend parler. Elle ne s'affiche qu'en mode *Neuronal* : une pastille éteinte dirait « il ne parle pas », alors qu'elle voudrait dire « personne n'écoute ».
- **Le modèle ne peut que TENIR la porte ouverte, jamais l'ouvrir.** S'il se trompait sur un bruit de fond, il ouvrirait votre micro tout seul et vous n'auriez plus moyen de vous taire.
- **En cas de problème, la voix passe quand même** : si le modèle ne se charge pas, GM-OS le dit et branche le fil direct. Une amélioration qui casse la fonction de base n'en est pas une.
- ⚠️ **RNNoise est entraîné sur de la parole humaine.** Il est très efficace sur le bruit régulier ; il n'a pas été conçu pour préserver ce qui n'est pas une voix. Si vous chantez, sifflez ou faites une imitation très inhabituelle, écoutez le résultat avant de compter dessus en séance.

---

> [!IMPORTANT]
> **Latence** : Voice-OS utilise des technologies Web Audio de pointe pour minimiser la latence. Cependant, pour un résultat optimal, utilisez un casque plutôt que des enceintes pour éviter les boucles de feedback.

---

*Guide révisé le 2026-09-04. Retiré : un bouton « Générer Profil IA » dans Voice-OS, qui n'existe
pas — et dont la section répétait, en la contredisant, celle sur les voix de PNJ. Ajouté : la liste
**Voix des PNJ** du module.*

*Deux des défauts que cette révision a trouvés ont été corrigés le soir même. **Le débruitage par
défaut est passé à Neuronal** — le premier suspect des fins de phrase coupées ne pouvait pas rester
ce que l'on a sans rien régler — et l'explication des trois modes, qui vivait en infobulle, s'écrit
maintenant sous le sélecteur : une infobulle ne se lit que par quelqu'un qui soupçonne déjà. **Et la
liste « Voix des PNJ » voit désormais la galerie de campagne**, pour les fiches à qui vous avez déjà
donné une voix.*
