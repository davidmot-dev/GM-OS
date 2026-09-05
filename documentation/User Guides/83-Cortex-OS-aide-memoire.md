# ⚔️ Cortex — manuel détaillé

Une page à garder sous la main pendant qu'on joue. Le détail complet est dans le
[guide du Cortex](./82-Cortex-OS.md), qui fait référence : **tout ce qui est commun aux
deux pages n'est écrit que là-bas.**

> 🔎 **Pourquoi cette règle.** Ces deux pages décrivaient toutes deux le bouton **Sensors**, et
> **elles n'en disaient pas la même chose** — l'une prétendait qu'il coupe les suggestions, l'autre
> qu'il coupe le son. Ni l'une ni l'autre n'avait raison. *Deux guides qui décrivent la même chose
> finissent toujours par diverger* : celui-ci a donc cessé de décrire, et renvoie.

---

## 🚦 En trois secondes

| Je veux… | Je fais |
| :--- | :--- |
| **Voir la situation** | Le bandeau du bas est déjà là. L'analyse se relance à chaque changement de tour. |
| **Du silence, sans perdre les conseils** | **Sensors** → *Muted*. Sons et lumières se taisent, les conseils continuent. |
| **Tout arrêter** | Paramètres → Cortex tactique. |
| **Un éclair maintenant** | **Flash**. |
| **Vérifier que le son marche** | **Test**. |

---

## 👁️ Lire les conseils

Trois rangs, et un seul mérite qu'on interrompe la table :

- 🔴 **Urgence** — une menace immédiate ou une occasion de conclure. C'est celui-là qu'on lit.
- 🟡 **Opportunité** — un mouvement à jouer si le tour s'y prête.
- ⚪ **Conseil** — un rappel. À garder pour le round suivant.

La **narration de situation** arrive à côté : un paragraphe à lire ou à paraphraser pour ouvrir le
round. Les deux sont demandées en même temps, elles arrivent presque ensemble.

---

## 🩺 Quand un conseil paraît absurde

Dans cet ordre — c'est presque toujours le premier :

1. **La grille de Map-OS est-elle calibrée ?** Sans taille de case réglée, le Cortex mesure sur une
   grille supposée, et **un conseil de placement fondé sur une unité arbitraire est faux sans
   jamais se plaindre**.
2. **Les pions sont-ils à leur vraie place ?** Le Cortex lit des coordonnées, pas des intentions.
3. **Le journal du bas** dit ce qu'il a vu : combien de pions, qui est entré en portée, quel statut
   il a nettoyé. Le plus souvent, il a mesuré autre chose que ce qu'on croyait.
4. **Le pilote de jeu déclare-t-il ses portées ?** Sinon le Cortex applique une table par défaut,
   qui n'est pas celle de votre système.

---

## 🎲 Ce qu'il faut savoir sur ce qu'il sait

- Il lit **Combat-OS** (qui, dans quel état, quelle faction) et **Map-OS** (où, à quelle distance).
- **Sans carte, il voit quand même les combattants** — il perd les distances, pas les gens.
- Il nomme les **neutres** à part plutôt que de les compter comme ennemis : c'est ce qui l'empêche
  de vous proposer d'attaquer le tavernier.
- **Rien de tout cela ne part chez vos joueurs.** Le Cortex parle au meneur.

---

*Page refaite le 2026-09-04. Elle décrivait le Cortex comme « un module intégré à Map-OS » qu'on
ouvre par une icône Brain de sa barre d'outils — ni l'un ni l'autre n'existe. Ses trois seuils de
priorité étaient faux, et sa description du bouton Sensors contredisait l'autre guide. Elle a cessé
de dupliquer : elle renvoie.*
