# 🎭 Générateur de portraits (IA)

Le **NPC Live Generator** est une extension majeure de NPC-OS. Il permet de générer instantanément des portraits et des décors immersifs pour vos entités (PNJ, Lieux, Objets) en générant l'image à la demande.

## 🌟 Pourquoi utiliser le Live Generator ?

- **Improvisation Totale** : Ne soyez plus jamais bloqué par le manque d'illustrations pour un PNJ improvisé.
- **Cohérence Visuelle** : L'IA adapte le style artistique à l'univers sélectionné (Fantasy, Cyberpunk, etc.).
- **Immersion Immédiate** : Projetez des visuels uniques sur le Hub Joueur en quelques secondes.

## 🖼️ Générer un Portrait (Avatar)

Pour donner un visage à votre entité :

1. **Faites un tirage** dans le Générateur PNJ, ou rouvrez une entité de vos **Mémos**.
2. **Deux portes ouvrent la même demande** : survolez le **portrait**, en tête du résultat, et
   cliquez sur les **étincelles** — ou cliquez sur **Illustration** dans la barre d'actions.
3. La demande s'ouvre **préremplie** avec le prompt que l'IA a proposé d'après la fiche ; vous
   pouvez l'ajuster avant de lancer.
4. Patientez quelques secondes : le portrait prend la place de la silhouette.

> [!TIP]
> Si le résultat ne vous convient pas, relancez : chaque génération en donne une différente.

Le second bouton du portrait, **Importer un portrait**, prend une image de vos fichiers à la place.

> ⚠️ **La génération d'un décor de fiche n'est plus proposée** dans le générateur (relevé le
> 2026-10-03, après la refonte de l'écran) : seul le portrait se génère. Pour une illustration de
> scène, passez par Image-OS.

## 💾 Gestion et Sauvegarde

Toutes les images générées sont gérées de manière intelligente :

- **Media Hub** : Chaque visuel est enregistré dans votre bibliothèque locale (`Media Hub`).
- **Persistance** : Si vous enregistrez l'entité en **Mémo**, le portrait est conservé pour vos prochaines sessions.
- **Modification Manuelle** : Vous pouvez à tout moment remplacer une image IA par une image locale par **Importer un portrait**, au survol du portrait.

## ⚙️ Qui fabrique l'image

> ⛔ **Correction.** Cette page annonçait « l'IA Gemini (Imagen-3) » et demandait une **clé API
> Gemini**. Ni l'une ni l'autre : **Gemini ne génère aucune image dans GM-OS.** Relevé le
> 2026-09-04.

GM-OS essaie trois chemins, dans cet ordre :

| Ordre | Moteur | Quand |
| :---: | :--- | :--- |
| 1 | **FLUX en local**, par Ollama | Seulement **hors séance**. Voir l'encadré ci-dessous. |
| 2 | **Cloudflare Workers AI** (`flux-1-schnell`) | Le chemin normal, quelques secondes |
| 3 | **Z-Image**, via HuggingFace | Dernier recours |

**Ce qu'il faut configurer** : dans *Paramètres → IA → Image*, un **identifiant de compte
Cloudflare** et un **jeton** portant la permission `Workers AI — Edit`. Le forfait gratuit couvre
largement une campagne. Un bouton **Tester** emprunte exactement le même chemin que la génération
réelle — *un test qui refait l'appel à sa façon ne teste pas ce qui tourne en séance.*

> ⚠️ **En pleine partie, la diffusion locale est court-circuitée.** Un modèle local met jusqu'à
> quatre-vingt-dix secondes, et pendant ce temps il occupe **l'unique créneau de calcul** — donc
> l'Oracle et le Cortex avec lui. Séance ouverte, GM-OS va droit au service distant ; **mettre la
> séance en pause rouvre le local.**

Les messages d'erreur sont ceux que le service a rendus, jamais un « échec » générique : un quota
épuisé, un jeton sans la bonne permission et un identifiant de compte erroné sont trois problèmes
différents, et les confondre ferait chercher au mauvais endroit.

---

*Guide révisé le 2026-09-04, code à l'appui. Le moteur d'images n'est pas Gemini/Imagen-3 mais
**Cloudflare Workers AI**, avec FLUX en local hors séance et Z-Image en dernier recours — et la clé
à configurer n'est pas une clé Gemini. Ajouté : pourquoi le local est écarté pendant une séance.*

*Relu le 2026-10-03 contre le générateur refondu : les deux portes de la génération, et le décor
qui n'existe plus.*
