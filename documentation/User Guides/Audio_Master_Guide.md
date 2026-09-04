# 🎚️ Guide : la tour de contrôle audio

En haut de l'écran, dans la barre de titre, trois commandes règnent sur **tout** ce qui sort de
GM-OS : le volume général, le **Focus Chat**, et le **Stop All**.

Elles pilotent les quatre moteurs sonores à la fois —
[Music-OS](./Music_OS_User_Guide.md), [Ambient-OS](./Ambient_OS_User_Guide.md),
[Sound-OS](./Sound_OS_User_Guide.md) et [Voice-OS](./Voice_OS_User_Guide.md).

---

## 🔊 Le volume général

Le curseur va de **0 à 100 %**, et le pourcentage s'affiche à droite.

> ⛔ **Correction.** Cette page annonçait un « Boost jusqu'à 150 % ». **Il n'existe pas** : le
> curseur est borné à 100 %. Les 150 % existent bien, mais ailleurs — sur le **volume d'un pad**
> de Sound-OS, réglable individuellement.

L'icône de haut-parleur coupe le son d'un clic.

> ✅ **La coupure rend votre niveau, depuis le 2026-09-04.** Si vous jouiez à 40 %, un
> aller-retour vous ramène à 40 %. Le bouton basculait auparavant entre 0 et **1** : le retour d'un
> aparté se prenait à plein volume, exactement au moment où l'on venait de demander le silence.
>
> *Le seul cas où il remonte à fond : vous aviez déjà mis le curseur à zéro avant de cliquer. Sans
> cela, la coupure ne se déferait jamais.*

---

## ⚡ Focus Chat — tamiser sans couper

Le bouton **Focus Chat** est fait pour les moments de dialogue : un clic, et tout ce qui pourrait
couvrir la voix recule.

| Ce qui joue | Ce qu'il devient |
| :--- | :--- |
| **La musique** | **10 %** de son niveau |
| **Les ambiances** | **10 %** de son niveau |
| **Les bruitages** | **50 %** — ils reculent, mais restent audibles |

> 🔎 **Les bruitages ne sont pas tamisés comme le reste, et c'est voulu.** Un coup d'épée ou un
> hurlement joué *pendant* la narration doit garder son impact : Sound-OS applique un plancher à
> la moitié du volume, là où la musique et les ambiances descendent au dixième. Cette page ne le
> disait pas.

Le retour se fait en douceur — le gain remonte progressivement, il ne saute pas.

> ⚠️ **À ne pas confondre avec le ducking de [Voice-OS](./Voice_OS_User_Guide.md)**, qui baisse la
> musique **automatiquement quand vous parlez dans le micro**. Focus Chat est un interrupteur que
> vous actionnez ; le ducking est un réflexe déclenché par votre voix. Les deux se cumulent.

---

> ✅ **Le tamisage se règle depuis le 2026-09-05.** Quand le Focus est allumé, un curseur apparaît
> à côté du bouton et dit **à quel niveau** le reste descend. Il valait 10 % et rien ne permettait
> d'y toucher — très bas pour un aparté, beaucoup trop haut pour une révélation. Réglable de 5 % à
> 60 % : au-delà, le Focus ne se distingue plus de son absence.
>
> *`setFocusDuckingRatio` existait depuis toujours et les trois moteurs lisaient déjà la valeur.
> Comme la couleur de grille de Map-OS : toute la chaîne était là sauf le bouton au bout.*

---

## 🚨 Stop All — l'arrêt d'urgence

Un clic, et la table redevient silencieuse et noire.

| Ce qui s'arrête | Comment |
| :--- | :--- |
| **La musique** | Les deux platines, arrêt immédiat |
| **Les ambiances** | Fondu de **1 seconde** |
| **Les bruitages** | Fondu de **3 secondes** |
| **Les projections d'images** | Écran noir sur les moniteurs et le Hub |
| **Les fiches projetées** | Toutes les projections du Hub sont retirées |
| **Les lumières Philips Hue** | Extinction |

> ⛔ **Deux corrections.** Cette page annonçait une « coupure **instantanée** des bruitages » :
> c'est un **fondu de trois secondes**, le plus long des trois. Et elle omettait que **les fiches
> et favoris projetés sont retirés du Hub** — ce n'est pas qu'un bouton audio, c'est un rideau.

Un message de confirmation s'affiche quand tout est éteint. Si l'un des modules refuse, un message
d'erreur le dit plutôt que de laisser croire au silence.

---

## 💡 Lequel employer, et quand

> [!TIP]
> **Focus Chat** pour les dialogues et les révélations : l'ambiance reste, votre voix passe devant.
> **Stop All** pour les fins de scène, les pauses, et le silence brutal après un coup de théâtre —
> mais souvenez-vous qu'il éteint aussi vos images et vos lumières. Ce n'est pas un bouton de pause,
> c'est un rideau qui tombe.

---

*Guide refait le 2026-09-04, code à l'appui. Deux affirmations fausses retirées (le boost à 150 %,
la coupure instantanée des bruitages), deux comportements ajoutés (le tamisage à 50 % des
bruitages, le retrait des projections du Hub), et un piège nommé — la coupure rapide remontait à
100 % — **réparé le soir même**.*
